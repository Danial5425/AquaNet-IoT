import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_SERVER = 'http://10.223.82.232:3001';
const STORAGE_KEY = 'aquanet_server_url';

export function useWebSocket(serverUrl) {
  const [connected, setConnected] = useState(false);
  const [nodes, setNodes] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [sensorHistory, setSensorHistory] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    const url = serverUrl || DEFAULT_SERVER;
    if (!url) return;

    // Disconnect previous
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WS] Connected to AquaNet master');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[WS] Disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.log('[WS] Connection error:', err.message);
      setConnected(false);
    });

    // Initial full state from server
    socket.on('init:state', (data) => {
      const nodeMap = {};
      (data.nodes || []).forEach((n) => {
        nodeMap[n.nodeId] = n;
      });
      setNodes(nodeMap);
    });

    // New node discovered
    socket.on('node:discovered', (data) => {
      setNodes((prev) => ({
        ...prev,
        [data.nodeId]: { ...prev[data.nodeId], ...data, status: 'online' },
      }));
    });

    // Live sensor data
    socket.on('sensor:data', (data) => {
      setNodes((prev) => ({
        ...prev,
        [data.nodeId]: {
          ...prev[data.nodeId],
          lastData: data.sensors,
          wqi: data.wqi,
          motorStatus: data.motorStatus,
          motorMode: data.motorMode,
          status: 'online',
        },
      }));

      setSensorHistory((prev) => {
        const nodeHist = prev[data.nodeId] || [];
        const newPoint = {
          time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ph: data.sensors.ph ?? 0,
          ec: data.sensors.ec ?? 0,
          gas: data.sensors.gas ?? 0,
          waterTemp: data.sensors.waterTemp ?? 0,
          humidity: data.sensors.humidity ?? 0,
          airTemp: data.sensors.airTemp ?? 0,
          wqi: data.wqi?.score ?? 0,
          timestamp: data.timestamp,
        };
        const updated = [...nodeHist, newPoint].slice(-60);
        return { ...prev, [data.nodeId]: updated };
      });
    });

    // Heartbeat
    socket.on('node:heartbeat', (data) => {
      setNodes((prev) => ({
        ...prev,
        [data.nodeId]: {
          ...prev[data.nodeId],
          uptime: data.uptime,
          rssi: data.wifi_rssi,
          freeHeap: data.free_heap,
          status: 'online',
        },
      }));
    });

    // Node offline
    socket.on('node:offline', (data) => {
      setNodes((prev) => ({
        ...prev,
        [data.nodeId]: { ...prev[data.nodeId], status: 'offline' },
      }));
      setAlerts((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          nodeId: data.nodeId,
          level: 'critical',
          message: `Node ${data.nodeId} went offline`,
          timestamp: data.timestamp,
        },
        ...prev,
      ].slice(0, 50));
    });

    // Alert
    socket.on('alert:new', (data) => {
      setAlerts((prev) => [
        { id: `${Date.now()}-${Math.random()}`, ...data },
        ...prev,
      ].slice(0, 50));
    });

    // Motor status update
    socket.on('motor:status', (data) => {
      setNodes((prev) => ({
        ...prev,
        [data.nodeId]: {
          ...prev[data.nodeId],
          motorStatus: data.status,
          motorMode: data.mode,
        },
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl]);

  const sendMotorCommand = useCallback((nodeId, action) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('motor:command', { nodeId, action });
    }
  }, []);

  const dismissAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    connected,
    nodes,
    alerts,
    sensorHistory,
    sendMotorCommand,
    dismissAlert,
  };
}
