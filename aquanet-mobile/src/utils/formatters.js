export function formatUptime(seconds) {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function wqiColor(level) {
  if (level === 'good')     return '#00E676';
  if (level === 'warning')  return '#FFB300';
  if (level === 'critical') return '#FF1744';
  return '#8A9BC4';
}

export function wqiLabel(level) {
  if (level === 'good')     return 'Excellent Quality';
  if (level === 'warning')  return 'Degraded Quality';
  if (level === 'critical') return 'Critical — Action Required';
  return 'No Data';
}

export const SENSOR_META = {
  ph:        { label: 'pH Level',         unit: 'pH',   icon: '🧪', min: 0,   max: 14,   ideal: '6.5–8.5' },
  ec:        { label: 'Conductivity',     unit: 'mS/cm',icon: '⚡', min: 0,   max: 5,    ideal: '< 1.5' },
  gas:       { label: 'Gas/Smoke',        unit: 'ppm',  icon: '💨', min: 0,   max: 1000, ideal: '< 200' },
  waterTemp: { label: 'Water Temp',       unit: '°C',   icon: '🌡️', min: 0,   max: 50,   ideal: '20–30°C' },
  airTemp:   { label: 'Air Temp',         unit: '°C',   icon: '🌤️', min: 0,   max: 50,   ideal: '—' },
  humidity:  { label: 'Humidity',         unit: '%',    icon: '💧', min: 0,   max: 100,  ideal: '30–70%' },
};

export function sensorStatus(type, value) {
  if (value == null) return 'muted';
  if (type === 'ph')        return value >= 6.5 && value <= 8.5 ? 'good' : value >= 5 && value <= 9 ? 'warning' : 'critical';
  if (type === 'ec')        return value < 1.5 ? 'good' : value < 3 ? 'warning' : 'critical';
  if (type === 'gas')       return value < 200 ? 'good' : value < 500 ? 'warning' : 'critical';
  if (type === 'waterTemp') return value >= 20 && value <= 30 ? 'good' : value >= 15 && value <= 35 ? 'warning' : 'critical';
  return 'good';
}
