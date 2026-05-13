# 💧 AquaNet IoT — Smart Water Quality Monitoring System

> **An enterprise-grade, real-time IoT water quality monitoring and control system built with ESP32, MQTT, Node.js, and React Native.**

<p align="center">
  <strong>AquaNet</strong> = <em>Aqua</em> (Water) + <em>Net</em> (Network)<br/>
  A network of smart water sensors for intelligent monitoring and automated response.
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Hardware Components](#-hardware-components)
- [Wiring Diagram](#-wiring-diagram)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Running the System](#-running-the-system)
- [Mobile App Screens](#-mobile-app-screens)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Testing Without Hardware](#-testing-without-hardware)
- [Troubleshooting](#-troubleshooting)

---

## 🌊 Overview

Traditional water quality testing is **slow, manual, and reactive**. By the time lab results arrive, contamination may have already caused damage.

**AquaNet** solves this by deploying smart sensor nodes into water bodies that continuously monitor water quality 24/7. The system:

- 📡 **Collects** real-time sensor data (EC, Gas, Temperature, Humidity)
- 🧮 **Calculates** a standardized Water Quality Index (WQI) score (0–100)
- 🚨 **Alerts** operators instantly when quality degrades
- ⚡ **Controls** water pumps automatically to respond to contamination
- 📱 **Displays** everything on a premium mobile dashboard

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        AquaNet Architecture                       │
│                                                                    │
│   ┌─────────────┐    MQTT     ┌──────────────┐   WebSocket       │
│   │  ESP32 Node  │───────────▶│  Mosquitto   │◀──────────┐       │
│   │  (Slave)     │            │  MQTT Broker  │           │       │
│   │              │            └──────┬───────┘           │       │
│   │ • TDS/EC     │                   │                    │       │
│   │ • MQ-135 Gas │                   ▼                    │       │
│   │ • DHT11      │            ┌──────────────┐    ┌──────┴─────┐ │
│   │ • Relay      │            │  Node.js     │    │  React     │ │
│   └─────────────┘            │  Backend     │    │  Native    │ │
│                               │              │    │  Mobile    │ │
│   ┌─────────────┐            │ • WQI Engine │    │  App       │ │
│   │  ESP32 Node  │───MQTT───▶│ • SQLite DB  │───▶│            │ │
│   │  (Slave N)   │            │ • Alert Sys  │    │ • Dashboard│ │
│   └─────────────┘            │ • Motor Ctrl │    │ • History  │ │
│                               └──────────────┘    │ • Alerts   │ │
│                                                    │ • Settings │ │
│                                                    └────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **ESP32 Slave Nodes** read sensors every 2 seconds
2. Data is published via **MQTT** to the Mosquitto broker
3. **Node.js Backend** subscribes to MQTT, processes data, calculates WQI
4. Results are saved to **SQLite** database
5. Real-time updates are pushed via **WebSocket** to the mobile app
6. **Motor commands** flow in reverse: App → Backend → MQTT → ESP32 → Relay

---

## ✨ Features

### 🔬 Sensor Monitoring
- **TDS/EC Sensor** — Measures Electrical Conductivity (dissolved solids in water)
- **MQ-135 Gas Sensor** — Detects harmful gases (CO₂, NH₃, H₂S)
- **DHT11 Sensor** — Measures air temperature and humidity
- **Placeholder support** for pH and waterproof temperature sensors

### 📊 Water Quality Index (WQI)
- Weighted algorithm combining all sensor inputs
- Score range: 0 (Critical) to 100 (Excellent)
- Color-coded levels: Excellent → Good → Fair → Warning → Critical

### ⚡ Motor Control (Two-Way IoT)
- **AUTO Mode** — Motor turns ON automatically when water quality degrades
- **Manual ON/OFF** — Remote control from mobile app
- Demonstrates **full-duplex IoT communication**

### 🔌 Plug-and-Play Auto-Discovery
- New ESP32 nodes are automatically detected when powered on
- No app restart or code changes needed
- Dynamically scalable to 50+ nodes

### 📱 Premium Mobile Dashboard
- Dark mode glassmorphism UI
- Real-time sensor cards with live updates
- Historical line charts with min/max/avg statistics
- Alert system with critical/warning notifications
- Remote motor control panel

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Hardware** | ESP32 DevKit V1 | Microcontroller with WiFi |
| **Firmware** | Arduino C++ | Sensor reading + MQTT publishing |
| **Protocol** | MQTT (Mosquitto) | Lightweight IoT messaging |
| **Backend** | Node.js + Express | Data processing + API server |
| **Database** | SQLite (sql.js) | Persistent sensor data storage |
| **Real-time** | Socket.IO (WebSocket) | Live data push to mobile app |
| **Mobile App** | React Native (Expo) | Cross-platform mobile dashboard |
| **WQI Engine** | Custom JavaScript | Water Quality Index calculation |

---

## 🔧 Hardware Components

### Per Slave Node

| Component | GPIO Pin | Purpose | Voltage |
|-----------|----------|---------|---------|
| ESP32 DevKit V1 | — | Main controller | 5V USB |
| TDS/EC Sensor | GPIO 34 | Water conductivity | 3.3V |
| MQ-135 Gas Sensor | GPIO 35 | Gas detection | 5V |
| DHT11 | GPIO 4 | Air temp + humidity | 3.3V |
| 4-Channel Relay | GPIO 23 | Motor control | 5V |

### Master Server
- Any laptop/PC running Linux, macOS, or Windows
- Alternative: Raspberry Pi 4

---

## 🔌 Wiring Diagram

```
                         ┌──────────────────────────┐
                         │      ESP32 DevKit V1      │
                         │                          │
   TDS/EC Sensor         │   3.3V ●────┐            │
   ┌─────────┐           │             ├── TDS VCC  │
   │ VCC ────────────────┤             ├── DHT VCC  │
   │ GND ────────────────┤   GND  ●────┤            │
   │ AOUT───────────────→┤  GPIO 34    │  (shared)  │
   └─────────┘           │             │            │
                         │   5V   ●────┐            │
   MQ-135 Gas            │             ├── MQ VCC   │
   ┌─────────┐           │             ├── Relay VCC│
   │ VCC ────────────────┤             │            │
   │ GND ────────────────┤   GND  ●    │  (shared)  │
   │ A0 ────────────────→┤  GPIO 35    │            │
   └─────────┘           │             │            │
                         │             │            │
   DHT11                 │             │            │
   ┌─────────┐           │             │            │
   │ VCC ────────────────┤   3.3V      │            │
   │ GND ────────────────┤   GND       │            │
   │ DATA───────────────→┤  GPIO 4     │            │
   └─────────┘           │             │            │
                         │             │            │
   4-Channel Relay       │             │            │
   ┌─────────┐           │             │            │
   │ VCC ────────────────┤   5V (VIN)  │            │
   │ GND ────────────────┤   GND       │            │
   │ IN1 ←──────────────┤  GPIO 23    │            │
   └────┬────┘           └──────────────────────────┘
        │
        │  ┌─────────────────┐
        └──┤  Water Pump     │
           │  (Motor)        │
           └─────────────────┘
```

> ⚠️ **Important**: TDS and DHT11 use **3.3V**. MQ-135 and Relay use **5V (VIN)**. Do not mix them!

---

## 📁 Project Structure

```
AquaNet-IoT/
│
├── IOT-Groups-for-assignment-main/
│   ├── backend/                    # Node.js Master Server
│   │   ├── src/
│   │   │   ├── server.js          # Express + Socket.IO + MQTT
│   │   │   ├── db/database.js     # SQLite database layer
│   │   │   ├── engine/wqi.js      # WQI calculation algorithm
│   │   │   └── alerts/telegram.js # Telegram notification (optional)
│   │   ├── mosquitto.conf         # MQTT broker configuration
│   │   ├── dummy-data.js          # Simulate Node 1 sensor data
│   │   ├── dummy-data-2.js        # Simulate Node 2 sensor data
│   │   └── package.json
│   │
│   ├── firmware/                   # ESP32 Arduino Code
│   │   └── src/
│   │       ├── main_minimal.cpp   # ★ Simplified firmware (use this)
│   │       ├── main_simple.cpp    # Full firmware (all sensors)
│   │       └── main.cpp           # Advanced modular firmware
│   │
│   └── dashboard/                  # Web dashboard (optional)
│
├── aquanet-mobile/                 # React Native Mobile App
│   ├── App.js                     # Main navigation + state
│   ├── src/
│   │   ├── screens/
│   │   │   ├── DashboardScreen.js # WQI gauge + sensor cards
│   │   │   ├── HistoryScreen.js   # Line charts + statistics
│   │   │   ├── AlertsScreen.js    # Warning/critical alerts
│   │   │   └── SettingsScreen.js  # Server URL + node info
│   │   ├── components/
│   │   │   ├── WQIGauge.js        # Circular WQI score gauge
│   │   │   ├── SensorCard.js      # Individual sensor display
│   │   │   ├── MotorControl.js    # ON/OFF/AUTO buttons
│   │   │   ├── NodePicker.js      # Node tab selector
│   │   │   └── AlertItem.js       # Alert list item
│   │   ├── hooks/
│   │   │   └── useWebSocket.js    # Real-time data connection
│   │   ├── theme/index.js         # Dark mode color system
│   │   └── utils/formatters.js    # WQI colors, time formatting
│   └── package.json
│
└── README.md                       # ← You are here
```

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org))
- **Mosquitto** MQTT Broker ([Download](https://mosquitto.org/download/))
- **Arduino IDE** 2.x ([Download](https://www.arduino.cc/en/software))
- **Expo Go** app on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

### 1. Clone the Repository

```bash
git clone https://github.com/Danial5425/AquaNet-IoT.git
cd AquaNet-IoT
```

### 2. Install Backend Dependencies

```bash
cd IOT-Groups-for-assignment-main/backend
npm install
```

### 3. Install Mobile App Dependencies

```bash
cd ../../aquanet-mobile
npm install
```

### 4. Flash the ESP32 Firmware

1. Open **Arduino IDE**
2. Install board: **ESP32 by Espressif Systems** (via Board Manager)
3. Install libraries: `PubSubClient`, `ArduinoJson`, `DHT sensor library`, `Adafruit Unified Sensor`
4. Open `firmware/src/main_minimal.cpp`
5. Edit WiFi and broker settings:
   ```cpp
   #define WIFI_SSID       "YOUR_WIFI_NAME"
   #define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"
   #define MQTT_BROKER     "YOUR_LAPTOP_IP"    // Run: hostname -I
   ```
6. Select board: **DOIT ESP32 DEVKIT V1**
7. Click **Upload**

---

## ▶️ Running the System

Open **3 terminal windows**:

### Terminal 1 — MQTT Broker
```bash
mosquitto -c "IOT-Groups-for-assignment-main/backend/mosquitto.conf" -v
```

### Terminal 2 — Backend Server
```bash
cd IOT-Groups-for-assignment-main/backend
npm run dev
```
You should see:
```
[MQTT] Connected to broker ✓
[DB] Database initialized (sql.js / pure JS)

╔══════════════════════════════════════╗
║     AquaNet Master Server v1.0.0     ║
╚══════════════════════════════════════╝
  API Server:  http://localhost:3001
```

### Terminal 3 — Mobile App
```bash
cd aquanet-mobile
npx expo start --tunnel
```
Scan the **QR code** with Expo Go on your phone.

### 4. Power On ESP32
Connect the ESP32 via USB → it auto-connects to WiFi → sends data → appears on your phone!

---

## 📱 Mobile App Screens

| Screen | Features |
|--------|----------|
| **Dashboard** | WQI gauge (0–100), sensor cards (EC, Gas, Temp, Humidity), motor control (ON/OFF/AUTO), node selector |
| **History** | Line charts for all metrics, min/max/avg statistics, metric selector tabs |
| **Alerts** | Critical and warning notifications, dismissible alerts, clear all button |
| **Settings** | Server URL configuration, connection status, registered node list |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nodes` | List all registered nodes |
| GET | `/api/nodes/:id` | Get specific node details |

---

## 🗃️ Database Schema

### `nodes` Table
| Column | Type | Description |
|--------|------|-------------|
| node_id | TEXT | Unique node identifier |
| mac | TEXT | MAC address |
| ip | TEXT | IP address |
| firmware_version | TEXT | Firmware version |
| status | TEXT | online / offline |
| last_seen | INTEGER | Unix timestamp |
| registered_at | INTEGER | Registration timestamp |

### `sensor_readings` Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Auto-increment primary key |
| node_id | TEXT | Source node |
| timestamp | INTEGER | Unix timestamp |
| ph | REAL | pH value |
| ec | REAL | Electrical conductivity (mS/cm) |
| gas | REAL | Gas concentration (ppm) |
| air_temp | REAL | Air temperature (°C) |
| humidity | REAL | Relative humidity (%) |
| water_temp | REAL | Water temperature (°C) |
| wqi | REAL | Calculated WQI score |
| wqi_level | TEXT | excellent/good/fair/warning/critical |
| motor_status | TEXT | ON / OFF |

### `alerts` Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Auto-increment primary key |
| node_id | TEXT | Source node |
| timestamp | INTEGER | Unix timestamp |
| level | TEXT | warning / critical |
| message | TEXT | Alert description |
| wqi | REAL | WQI at time of alert |
| acknowledged | INTEGER | 0 or 1 |

### Useful SQL Queries

```sql
-- View latest 10 readings
SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 10;

-- Count total readings
SELECT COUNT(*) FROM sensor_readings;

-- Average WQI per node
SELECT node_id, AVG(wqi) as avg_wqi FROM sensor_readings GROUP BY node_id;

-- All unacknowledged alerts
SELECT * FROM alerts WHERE acknowledged = 0 ORDER BY id DESC;
```

---

## 🧪 Testing Without Hardware

You can demo the full system without any ESP32 hardware using the dummy data scripts:

```bash
cd IOT-Groups-for-assignment-main/backend

# Simulate Node 1 (good water quality)
node dummy-data.js

# Simulate Node 2 (poor water quality)
node dummy-data-2.js
```

This pushes simulated sensor data through MQTT → Backend → Mobile App, making the dashboard fully interactive for presentations.

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| ESP32 won't connect to WiFi | Check SSID & password. WiFi must be **2.4GHz** (ESP32 doesn't support 5GHz) |
| MQTT connection failed | Ensure Mosquitto is running. Verify laptop IP matches `MQTT_BROKER` in firmware |
| App shows "Offline" | Start the backend. Go to Settings → Edit → enter `http://LAPTOP_IP:3001` → Save |
| Port already in use | Run `lsof -i :3001 -t \| xargs kill -9` to free the port |
| MQ-135 reads very high | Normal on first power-up. Needs 24–48 hour warm-up for accurate readings |
| Sensor reads 0 or NaN | Check wiring and GPIO pin assignments |
| Relay doesn't click | Relay VCC must be connected to **5V (VIN)**, not 3.3V |

---

## 📜 License

This project is developed as part of the **Semester 8 IoT Assignment** at **Assam Don Bosco University (ADBU)**.

---

<p align="center">
  <strong>💧 AquaNet — Intelligent Water, Smarter Future 💧</strong>
</p>
