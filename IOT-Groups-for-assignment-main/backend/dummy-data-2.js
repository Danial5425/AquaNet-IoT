const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
    console.log('Connected to MQTT broker. Pushing dummy data for Node 02...');
    
    // Register node-02
    client.publish('aquanet/system/discovery', JSON.stringify({
        node_id: 'node-02',
        ip: '192.168.1.51',
        mac: 'AA:BB:CC:DD:EE:F2',
        firmware_version: '1.0.0',
        sensors: ['ph', 'ec', 'gas', 'dht', 'ds18b20']
    }));

    // Send worse data to show yellow/red colors
    let count = 0;
    const interval = setInterval(() => {
        count++;
        const payload = {
            sensors: {
                ph: { value: 5.5 + (Math.random() * 0.2) }, // Acidic (worse WQI)
                ec: { value: 1.5 + (Math.random() * 0.2) }, // High conductivity
                gas: { value: 400 + Math.floor(Math.random() * 50) }, // High gas
                temperature: { value: 32 + (Math.random() * 2) },
                humidity: { value: 80 + (Math.random() * 5) },
                water_temp: { value: 29 + (Math.random() * 1) }
            },
            motor_status: 'OFF',
            motor_mode: 'MANUAL'
        };

        client.publish('aquanet/nodes/node-02/sensors', JSON.stringify(payload));
        console.log(`Pushed node-02 data point ${count}...`);

        if (count >= 5) {
            clearInterval(interval);
            console.log('Dummy data push for Node 2 complete!');
            process.exit(0);
        }
    }, 1000);
});
