/** Raw event from backend API */
export interface DeviceEvent {
  deviceId: string;
  timestamp: string;
  sourceId: "GEOTAB" | "UPS";
  pid: string[];
  pidValue: number[];
}

/** Flattened data point for charting (one per pid/pidValue pair) */
export interface ParsedDataPoint {
  timestamp: string;
  pid: string;
  value: number;
  sourceId: "GEOTAB" | "UPS";
}

/** Known OBD-II PID labels */
export const PID_LABELS: Record<string, string> = {
  "010D": "Vehicle Speed (km/h)",
  "010C": "Engine RPM",
  "0105": "Coolant Temp (°C)",
  "012F": "Fuel Level (%)",
  "0142": "Control Module Voltage (V)",
};

export function getPidLabel(pid: string): string {
  return PID_LABELS[pid] ?? pid;
}

/** Expand events into flat { timestamp, pid, value, sourceId } */
export function parseEvents(events: DeviceEvent[]): ParsedDataPoint[] {
  const points: ParsedDataPoint[] = [];
  for (const e of events) {
    const pids = e.pid ?? [];
    const values = e.pidValue ?? [];
    for (let i = 0; i < Math.min(pids.length, values.length); i++) {
      points.push({
        timestamp: e.timestamp,
        pid: pids[i],
        value: values[i],
        sourceId: e.sourceId,
      });
    }
  }
  return points;
}
