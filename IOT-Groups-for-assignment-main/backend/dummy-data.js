const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
    console.log('Connected to MQTT broker. Pushing dummy data...');
    
    // 1. Register node
    client.publish('aquanet/system/discovery', JSON.stringify({
        node_id: 'node-01',
        ip: '192.168.1.50',
        mac: 'AA:BB:CC:DD:EE:FF',
        firmware_version: '1.0.0',
        sensors: ['ph', 'ec', 'gas', 'dht', 'ds18b20']
    }));

    // 2. Send some data points with a delay to build history
    let count = 0;
    const interval = setInterval(() => {
        count++;
        const payload = {
            sensors: {
                ph: { value: 7.0 + (Math.random() * 0.4) }, // 7.0 - 7.4
                ec: { value: 0.8 + (Math.random() * 0.2) }, // 0.8 - 1.0
                gas: { value: 150 + Math.floor(Math.random() * 20) }, // 150 - 170
                temperature: { value: 28 + (Math.random() * 2) },
                humidity: { value: 55 + (Math.random() * 5) },
                water_temp: { value: 24 + (Math.random() * 1) }
            },
            motor_status: count % 3 === 0 ? 'OFF' : 'ON',
            motor_mode: 'AUTO'
        };

        client.publish('aquanet/nodes/node-01/sensors', JSON.stringify(payload));
        console.log(`Pushed data point ${count}...`);

        if (count >= 5) {
            clearInterval(interval);
            console.log('Dummy data push complete!');
            process.exit(0);
        }
    }, 1000); // 1 second apart
});
