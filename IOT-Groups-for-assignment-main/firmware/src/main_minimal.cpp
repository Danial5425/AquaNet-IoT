/*
 * ============================================================
 *  AquaNet — ESP32 Minimal Firmware
 * ============================================================
 *  Simplified version for available hardware:
 *    - TDS/EC Sensor Module   → GPIO 34 (analog)
 *    - MQ-135 Gas Sensor      → GPIO 32 (analog)
 *    - DHT11 Sensor           → GPIO 4  (digital, temp + humidity)
 *    - 4-Channel Relay Module → GPIO 23 (Channel 1)
 *
 *  REQUIRED LIBRARIES (install in Arduino IDE Library Manager):
 *    - PubSubClient         (by Nick O'Leary)
 *    - ArduinoJson          (by Benoit Blanchon)
 *    - DHT sensor library   (by Adafruit)
 *    - Adafruit Unified Sensor
 *
 *  BOARD: ESP32 Dev Module (select in Tools → Board)
 * ============================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ============================================================
//  ★ CONFIGURE THESE FOR YOUR SETUP ★
// ============================================================
#define WIFI_SSID       "IQOO-15"              // ← Your WiFi name
#define WIFI_PASSWORD   "Danial24"              // ← Your WiFi password
#define MQTT_BROKER     "10.223.82.232"        // ← IP of laptop running backend
#define MQTT_PORT       1883
#define NODE_ID         "node-01"              // Unique name for this node
#define FIRMWARE_VER    "1.0.0"

// ============================================================
//  PIN DEFINITIONS
// ============================================================
#define TDS_PIN         34   // TDS/EC sensor analog output
#define MQ_PIN          35   // MQ-135 gas sensor analog output
#define DHT_PIN         4    // DHT11 data pin
#define RELAY_PIN       23   // Relay Channel 1 (motor control)

// ============================================================
//  CALIBRATION
// ============================================================
// EC: TDS raw ADC → mS/cm conversion
#define EC_K_VALUE      0.5    // Cell constant (calibrate with known solution)
#define EC_TEMP_REF     25.0   // Reference temperature for EC compensation

// MQ-135: sensor characteristics
#define MQ135_RL        10.0   // Load resistor in kΩ
#define MQ135_RO        9.83   // Sensor resistance in clean air

// ============================================================
//  MOTOR CONTROL THRESHOLDS (AUTO mode)
// ============================================================
#define EC_MAX          1.5    // Motor ON if EC > 1.5 mS/cm
#define GAS_MAX         500.0  // Motor ON if gas > 500 ppm

// ============================================================
//  TIMING
// ============================================================
#define SENSOR_INTERVAL     2000   // ms between sensor reads
#define PUBLISH_INTERVAL    2000   // ms between MQTT publishes
#define HEARTBEAT_INTERVAL  5000   // ms between heartbeats

// ============================================================
//  MQTT TOPICS (auto-generated from NODE_ID)
// ============================================================
#define TOPIC_SENSORS    "aquanet/nodes/" NODE_ID "/sensors"
#define TOPIC_HEARTBEAT  "aquanet/nodes/" NODE_ID "/status/heartbeat"
#define TOPIC_LWT        "aquanet/nodes/" NODE_ID "/status/lwt"
#define TOPIC_MOTOR_CMD  "aquanet/nodes/" NODE_ID "/motor/command"
#define TOPIC_MOTOR_STAT "aquanet/nodes/" NODE_ID "/motor/status"
#define TOPIC_DISCOVERY  "aquanet/system/discovery"

// ============================================================
//  OBJECTS
// ============================================================
WiFiClient    wifiClient;
PubSubClient  mqtt(wifiClient);
DHT           dht(DHT_PIN, DHT11);

// ============================================================
//  STATE
// ============================================================
struct SensorData {
    float ec       = 0.5;    // mS/cm
    float gasPPM   = 100.0;  // ppm
    float airTemp  = 25.0;   // °C
    float humidity = 50.0;   // %
};

SensorData data;
bool motorOn     = false;
bool motorAuto   = true;     // Dashboard can switch to MANUAL
unsigned long lastSensor    = 0;
unsigned long lastPublish   = 0;
unsigned long lastHeartbeat = 0;
unsigned long bootTime      = 0;

// ============================================================
//  SENSOR READING HELPERS
// ============================================================

// Average 10 ADC readings to reduce noise
int stableADC(int pin) {
    long sum = 0;
    for (int i = 0; i < 10; i++) {
        sum += analogRead(pin);
        delay(5);
    }
    return sum / 10;
}

// Convert raw ADC → EC in mS/cm
float readEC() {
    int raw = stableADC(TDS_PIN);
    float voltage = (raw / 4095.0) * 3.3;

    if (voltage <= 0.01) return 0.0;
    float resistance = EC_K_VALUE * (3.3 - voltage) / voltage;
    float ec = (resistance > 0) ? (1.0 / resistance) : 0;

    // Temperature compensation (assume 25°C without temp sensor)
    float tempComp = 1.0 + 0.02 * (EC_TEMP_REF - 25.0);
    ec = ec / tempComp;

    return constrain(ec, 0.0, 20.0);
}

// Convert raw ADC → gas ppm using MQ-135 characteristics
float readGasPPM() {
    int raw = stableADC(MQ_PIN);
    float voltage = (raw / 4095.0) * 3.3;
    if (voltage <= 0.01) return 0.0;

    // Rs = RL * (VCC - Vout) / Vout
    float rs = MQ135_RL * (3.3 - voltage) / voltage;
    float ratio = rs / MQ135_RO;

    // MQ-135 CO2/NH3 curve approximation: ppm = a * ratio^b
    float ppm = 116.602 * pow(ratio, -2.769);
    return constrain(ppm, 0.0, 10000.0);
}

// ============================================================
//  MOTOR LOGIC
// ============================================================
void updateMotor() {
    if (!motorAuto) return;   // Manual mode — dashboard controls motor

    bool shouldBeOn = false;
    if (data.ec > EC_MAX)         shouldBeOn = true;
    if (data.gasPPM > GAS_MAX)    shouldBeOn = true;

    motorOn = shouldBeOn;
    // Relay: LOW = motor ON (active-low relay module)
    digitalWrite(RELAY_PIN, motorOn ? LOW : HIGH);
}

// ============================================================
//  SERIAL DEBUG
// ============================================================
void printSerial() {
    Serial.println("───── Sensor Readings ─────────────────");
    Serial.printf("  EC:        %.3f mS/cm\n", data.ec);
    Serial.printf("  Gas (MQ135): %.1f ppm\n", data.gasPPM);
    Serial.printf("  Air Temp:  %.1f °C\n", data.airTemp);
    Serial.printf("  Humidity:  %.1f %%\n", data.humidity);
    Serial.printf("  Motor:     %s (%s)\n", motorOn ? "ON" : "OFF", motorAuto ? "AUTO" : "MANUAL");
    Serial.println("───────────────────────────────────────");
}

// ============================================================
//  MQTT PUBLISH — Sensor Data
// ============================================================
void publishSensors() {
    JsonDocument doc;
    doc["node_id"]   = NODE_ID;
    doc["timestamp"] = (millis() - bootTime) / 1000;

    JsonObject sensors = doc["sensors"].to<JsonObject>();

    // EC / TDS
    JsonObject ec = sensors["ec"].to<JsonObject>();
    ec["value"]  = round(data.ec * 100) / 100.0;
    ec["unit"]   = "mS/cm";
    ec["status"] = (data.ec <= EC_MAX) ? "normal" : "alert";

    // Gas
    JsonObject gas = sensors["gas"].to<JsonObject>();
    gas["value"]  = round(data.gasPPM * 10) / 10.0;
    gas["unit"]   = "ppm";
    gas["status"] = (data.gasPPM <= GAS_MAX) ? "normal" : "alert";

    // Placeholder for pH (sensor not available)
    JsonObject ph = sensors["ph"].to<JsonObject>();
    ph["value"]  = 7.0;
    ph["unit"]   = "pH";
    ph["status"] = "normal";

    // DHT11 — real readings
    JsonObject temp = sensors["temperature"].to<JsonObject>();
    temp["value"]  = round(data.airTemp * 10) / 10.0;
    temp["unit"]   = "°C";
    temp["status"] = "normal";

    JsonObject hum = sensors["humidity"].to<JsonObject>();
    hum["value"]  = round(data.humidity * 10) / 10.0;
    hum["unit"]   = "%";
    hum["status"] = "normal";

    JsonObject wt = sensors["water_temp"].to<JsonObject>();
    wt["value"]  = 25.0;  // Default placeholder
    wt["unit"]   = "°C";
    wt["status"] = "normal";

    doc["motor_status"] = motorOn ? "ON" : "OFF";
    doc["motor_mode"]   = motorAuto ? "AUTO" : "MANUAL";

    char buf[768];
    serializeJson(doc, buf);
    mqtt.publish(TOPIC_SENSORS, buf);
}

// ============================================================
//  MQTT PUBLISH — Heartbeat
// ============================================================
void publishHeartbeat() {
    JsonDocument doc;
    doc["node_id"]   = NODE_ID;
    doc["uptime"]    = (millis() - bootTime) / 1000;
    doc["wifi_rssi"] = WiFi.RSSI();
    doc["free_heap"] = ESP.getFreeHeap();
    doc["motor"]     = motorOn ? "ON" : "OFF";

    char buf[256];
    serializeJson(doc, buf);
    mqtt.publish(TOPIC_HEARTBEAT, buf);
}

// ============================================================
//  MQTT PUBLISH — Motor Status
// ============================================================
void publishMotorStatus() {
    JsonDocument doc;
    doc["node_id"] = NODE_ID;
    doc["motor"]   = motorOn ? "ON" : "OFF";
    doc["mode"]    = motorAuto ? "AUTO" : "MANUAL";

    char buf[128];
    serializeJson(doc, buf);
    mqtt.publish(TOPIC_MOTOR_STAT, buf, true);  // retained
}

// ============================================================
//  MQTT PUBLISH — Discovery (auto-registers with master)
// ============================================================
void publishDiscovery() {
    JsonDocument doc;
    doc["node_id"]          = NODE_ID;
    doc["mac"]              = WiFi.macAddress();
    doc["ip"]               = WiFi.localIP().toString();
    doc["firmware_version"] = FIRMWARE_VER;
    doc["status"]           = "online";

    JsonArray sens = doc["sensors"].to<JsonArray>();
    sens.add("ec");
    sens.add("gas");
    sens.add("dht");

    JsonArray caps = doc["capabilities"].to<JsonArray>();
    caps.add("motor_control");

    char buf[512];
    serializeJson(doc, buf);
    mqtt.publish(TOPIC_DISCOVERY, buf, true);  // retained
    Serial.println("[MQTT] Discovery published — node registered with master.");
}

// ============================================================
//  MQTT CALLBACK — Receives commands from mobile app
// ============================================================
void mqttCallback(char* topic, byte* payload, unsigned int len) {
    char msg[len + 1];
    memcpy(msg, payload, len);
    msg[len] = '\0';

    String t = String(topic);
    Serial.println("[MQTT] Received: " + t + " → " + String(msg));

    // Motor command: ON / OFF / AUTO
    if (t == TOPIC_MOTOR_CMD) {
        JsonDocument doc;
        if (deserializeJson(doc, msg)) return;

        const char* action = doc["action"];
        if (strcmp(action, "ON") == 0) {
            motorAuto = false;
            motorOn   = true;
            digitalWrite(RELAY_PIN, LOW);
        } else if (strcmp(action, "OFF") == 0) {
            motorAuto = false;
            motorOn   = false;
            digitalWrite(RELAY_PIN, HIGH);
        } else if (strcmp(action, "AUTO") == 0) {
            motorAuto = true;
            updateMotor();
        }
        publishMotorStatus();
        Serial.printf("[Motor] Command received: %s (%s)\n", action, motorAuto ? "AUTO" : "MANUAL");
    }
}

// ============================================================
//  WiFi CONNECT
// ============================================================
void connectWiFi() {
    Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int retries = 0;
    while (WiFi.status() != WL_CONNECTED && retries < 30) {
        delay(500);
        Serial.print(".");
        retries++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WiFi] Connected! IP: %s | RSSI: %d dBm\n",
                      WiFi.localIP().toString().c_str(), WiFi.RSSI());
    } else {
        Serial.println("\n[WiFi] FAILED. Will retry in loop.");
    }
}

// ============================================================
//  MQTT CONNECT
// ============================================================
void connectMQTT() {
    mqtt.setServer(MQTT_BROKER, MQTT_PORT);
    mqtt.setCallback(mqttCallback);
    mqtt.setBufferSize(1024);

    String lwt = "{\"node_id\":\"" NODE_ID "\",\"status\":\"offline\",\"reason\":\"unexpected_disconnect\"}";

    Serial.print("[MQTT] Connecting to broker...");
    bool ok = mqtt.connect(NODE_ID, NULL, NULL, TOPIC_LWT, 1, true, lwt.c_str());

    if (ok) {
        Serial.println(" Connected!");
        mqtt.subscribe(TOPIC_MOTOR_CMD, 1);
        Serial.println("[MQTT] Subscribed to motor commands.");
        publishDiscovery();
    } else {
        Serial.printf(" Failed (rc=%d). Will retry.\n", mqtt.state());
    }
}

// ============================================================
//  SETUP
// ============================================================
void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("\n╔══════════════════════════════════════╗");
    Serial.println("║   AquaNet Node — " NODE_ID "            ║");
    Serial.println("╚══════════════════════════════════════╝");

    bootTime = millis();

    // Relay (motor OFF on boot)
    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, HIGH);  // HIGH = OFF for active-low relay

    // DHT11 sensor
    dht.begin();

    // Network
    connectWiFi();
    if (WiFi.status() == WL_CONNECTED) {
        connectMQTT();
    }

    Serial.println("[System] Boot complete. Entering main loop.\n");
}

// ============================================================
//  MAIN LOOP
// ============================================================
void loop() {

    // ── WiFi watchdog ─────────────────────────────────────
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WiFi] Lost connection. Reconnecting...");
        connectWiFi();
        return;
    }

    // ── MQTT watchdog ─────────────────────────────────────
    if (!mqtt.connected()) {
        connectMQTT();
    }
    mqtt.loop();

    unsigned long now = millis();

    // ── Read sensors every SENSOR_INTERVAL ───────────────
    if (now - lastSensor >= SENSOR_INTERVAL) {
        lastSensor = now;

        // Read DHT11 (air temp + humidity)
        float t = dht.readTemperature();
        float h = dht.readHumidity();
        if (!isnan(t) && t > 0 && t < 60) data.airTemp  = t;
        if (!isnan(h) && h >= 0 && h <= 100) data.humidity = h;

        // Read analog sensors
        data.ec      = readEC();
        data.gasPPM  = readGasPPM();

        // Motor auto-logic
        updateMotor();

        // Serial debug
        printSerial();
    }

    // ── Publish sensor data every PUBLISH_INTERVAL ────────
    if (now - lastPublish >= PUBLISH_INTERVAL) {
        lastPublish = now;
        if (mqtt.connected()) {
            publishSensors();
        }
    }

    // ── Heartbeat every HEARTBEAT_INTERVAL ────────────────
    if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
        lastHeartbeat = now;
        if (mqtt.connected()) {
            publishHeartbeat();
        }
    }
}
