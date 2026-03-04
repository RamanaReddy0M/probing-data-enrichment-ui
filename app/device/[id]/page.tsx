"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  TooltipProps,
} from "recharts";
import { parseEvents, getPidLabel, type DeviceEvent, type ParsedDataPoint } from "@/lib/types";
import DeviceInfo from "@/components/DeviceInfo";

const REFRESH_MS = 10_000;
const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

type ChartRow = Record<string, string | number> & { timestamp: string; sourceId: string };

function buildChartData(points: ParsedDataPoint[]): ChartRow[] {
  const byKey = new Map<string, ChartRow>();
  for (const p of points) {
    const key = `${p.timestamp}\t${p.sourceId}`;
    let row = byKey.get(key);
    if (!row) {
      row = { timestamp: p.timestamp, sourceId: p.sourceId };
      byKey.set(key, row);
    }
    (row as Record<string, number>)[p.pid] = p.value;
  }
  return Array.from(byKey.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

function getPidColor(pid: string, uniquePids: string[]): string {
  const i = uniquePids.indexOf(pid);
  return CHART_COLORS[i % CHART_COLORS.length];
}

function PidStatsCards({
  points,
  uniquePids,
  visiblePids,
  onTogglePid,
}: {
  points: ParsedDataPoint[];
  uniquePids: string[];
  visiblePids: Set<string>;
  onTogglePid: (pid: string) => void;
}) {
  const byPid = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const p of points) {
      const list = map.get(p.pid) ?? [];
      list.push(p.value);
      map.set(p.pid, list);
    }
    return map;
  }, [points]);

  const pids = Array.from(byPid.keys()).sort();
  if (pids.length === 0) return null;

  return (
    <div className="flex gap-3 mb-3 overflow-x-auto pb-1 flex-nowrap scrollbar-thin">
      {pids.map((pid) => {
        const values = byPid.get(pid)!;
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const color = getPidColor(pid, uniquePids);
        const isVisible = visiblePids.has(pid);
        return (
          <button
            key={pid}
            type="button"
            onClick={() => onTogglePid(pid)}
            className="flex-shrink-0 text-left p-2.5 rounded-lg border border-[rgba(255,255,255,0.07)] transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#06080f] border-t-[3px]"
            style={{
              borderTopColor: color,
              backgroundColor: isVisible ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)",
              opacity: isVisible ? 1 : 0.5,
            }}
          >
            <div className="text-xs font-medium mb-0.5" style={{ color }}>
              {pid}
            </div>
            <div className="text-sm text-gray-300">{getPidLabel(pid)}</div>
            <div className="text-[#555] text-xs mt-0.5">
              max {max.toFixed(1)} · avg {avg.toFixed(1)} · n={values.length}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string> & { label?: string }) {
  if (!active || !payload?.length || !label) return null;
  const row = payload[0]?.payload as ChartRow;
  const sourceId = row?.sourceId ?? "";
  return (
    <div className="rounded-lg border bg-[#0d1016] px-3 py-2 shadow-xl border-[rgba(255,255,255,0.07)]">
      <div className="text-[#555] text-xs mb-1.5">
        {new Date(label).toLocaleString()}
      </div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="text-sm text-gray-200">
          {getPidLabel(entry.dataKey as string)}:{" "}
          <span className="font-medium">{Number(entry.value).toFixed(2)}</span>
        </div>
      ))}
      <div className="text-[#555] text-xs mt-1">Source: {sourceId}</div>
    </div>
  );
}

function CustomDot(props: {
  payload?: ChartRow;
  dataKey?: string;
  cx?: number;
  cy?: number;
  fill?: string;
}) {
  const { payload, dataKey, cx, cy, fill } = props;
  if (cx == null || cy == null || !payload || !dataKey) return null;
  const value = payload[dataKey];
  if (value == null || value === "") return null;
  const sourceId = payload.sourceId as string;
  const isGeotab = sourceId === "GEOTAB";
  return (
    <g>
      {isGeotab ? (
        <circle cx={cx} cy={cy} r={4} fill={fill} />
      ) : (
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill="transparent"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={1.5}
        />
      )}
    </g>
  );
}

export default function DevicePage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = typeof params.id === "string" ? params.id : "";
  const [deviceIdInput, setDeviceIdInput] = useState(deviceId);
  const [events, setEvents] = useState<DeviceEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visiblePids, setVisiblePids] = useState<Set<string>>(new Set());

  // Keep input in sync with route
  useEffect(() => {
    setDeviceIdInput(deviceId);
  }, [deviceId]);

  const fetchEvents = useCallback(async () => {
    if (!deviceId) return;
    setError(null);
    try {
      const res = await fetch(
        `/api/devices/events?deviceId=${encodeURIComponent(deviceId)}&limit=100`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (!deviceId) return;
    const t = setInterval(fetchEvents, REFRESH_MS);
    return () => clearInterval(t);
  }, [deviceId, fetchEvents]);

  const points = useMemo(() => (events ? parseEvents(events) : []), [events]);
  const chartData = useMemo(() => buildChartData(points), [points]);
  const uniquePids = useMemo(() => {
    const set = new Set(points.map((p) => p.pid));
    return Array.from(set).sort();
  }, [points]);

  // Default: show only the first PID; new PIDs stay hidden until user toggles
  useEffect(() => {
    if (uniquePids.length === 0) return;
    setVisiblePids((prev) => {
      if (prev.size === 0) return new Set([uniquePids[0]]);
      const next = new Set<string>();
      for (const p of prev) if (uniquePids.includes(p)) next.add(p);
      return next.size ? next : new Set([uniquePids[0]]);
    });
  }, [uniquePids.join(",")]);

  const togglePid = useCallback((pid: string) => {
    setVisiblePids((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  }, []);

  const handleDeviceIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = deviceIdInput.trim();
    if (!id) return;
    router.push(`/device/${encodeURIComponent(id)}`);
  };

  const sourcesSeen = useMemo(() => {
    if (!events?.length) return [];
    const set = new Set(events.map((e) => e.sourceId));
    return Array.from(set).sort();
  }, [events]);

  const headerDate = useMemo(() => {
    if (!chartData.length) return null;
    const first = new Date(chartData[0].timestamp);
    const last = new Date(chartData[chartData.length - 1].timestamp);
    return { first, last };
  }, [chartData]);

  if (!deviceId) {
    return (
      <main className="min-h-screen p-4 flex flex-col items-center justify-center max-w-[1600px] mx-auto w-full">
        <h1 className="text-xl font-semibold text-gray-100 tracking-tight mb-1">
          OBD-II Device Telemetry Monitor
        </h1>
        <p className="text-[#555] text-sm mb-6">
          Enter a device ID to view live telemetry
        </p>
        <form
          onSubmit={handleDeviceIdSubmit}
          className="flex items-center w-full max-w-md rounded-full bg-[#0d1016] border border-[rgba(255,255,255,0.08)] shadow-lg shadow-black/20 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all"
        >
          <span className="pl-4 pr-1 text-[#555] rounded-l-full" aria-hidden>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={deviceIdInput}
            onChange={(e) => setDeviceIdInput(e.target.value)}
            placeholder="Search by device ID"
            className="flex-1 min-w-0 py-3 px-2 bg-transparent text-gray-100 placeholder-[#555] text-sm focus:outline-none"
            aria-label="Device ID"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-r-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium whitespace-nowrap transition-colors"
          >
            Go
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 pb-6 w-full max-w-[1600px] mx-auto">
      {/* Landing header: title + centered device search */}
      <header className="mb-4">
        <div className="text-center mb-4">
          <h1 className="text-xl font-semibold text-gray-100 tracking-tight">
            OBD-II Device Telemetry Monitor
          </h1>
          <p className="text-[#555] text-sm mt-0.5">
            Live telemetry by device — select a device to view PID time series
          </p>
        </div>
        <div className="flex justify-center">
          <form
            onSubmit={handleDeviceIdSubmit}
            className="flex items-center w-full max-w-md rounded-full bg-[#0d1016] border border-[rgba(255,255,255,0.08)] shadow-lg shadow-black/20 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all"
          >
            <label htmlFor="device-search" className="sr-only">
              Device ID
            </label>
            <span className="pl-4 pr-1 text-[#555] rounded-l-full" aria-hidden>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              id="device-search"
              type="text"
              value={deviceIdInput}
              onChange={(e) => setDeviceIdInput(e.target.value)}
              placeholder="Search by device ID"
              className="flex-1 min-w-0 py-3 px-2 bg-transparent text-gray-100 placeholder-[#555] text-sm focus:outline-none"
              aria-label="Search device by ID"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-r-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium whitespace-nowrap transition-colors"
            >
              Go
            </button>
          </form>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-0.5 mt-2 text-sm text-[#555]">
          <span className="font-medium text-gray-400">Device: {deviceId}</span>
          <span>·</span>
          <span>Auto-refresh 10s</span>
        </div>
      </header>

      {loading && events === null && (
        <div className="rounded-lg bg-[#0d1016] border border-[rgba(255,255,255,0.07)] p-12 text-center text-[#555]">
          Loading events…
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-200 mb-3">
          <p>{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchEvents();
            }}
            className="mt-2 px-3 py-1.5 rounded bg-red-800/50 hover:bg-red-800 text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && events && events.length === 0 && !error && (
        <div className="rounded-lg bg-[#0d1016] border border-[rgba(255,255,255,0.07)] p-12 text-center text-[#555]">
          No events for this device.
        </div>
      )}

      {!loading && points.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-0.5 mb-2 text-sm text-[#555]">
            <span>Events: {events?.length ?? 0}</span>
            {sourcesSeen.length > 0 && (
              <span>Sources: {sourcesSeen.join(", ")}</span>
            )}
            {headerDate && (
              <span>
                {headerDate.first.toLocaleDateString()}
                {headerDate.first.getTime() !== headerDate.last.getTime() &&
                  ` – ${headerDate.last.toLocaleDateString()}`}
              </span>
            )}
          </div>

          <PidStatsCards
            points={points}
            uniquePids={uniquePids}
            visiblePids={visiblePids}
            onTogglePid={togglePid}
          />

          <div className="overflow-x-auto">
            <div className="h-[500px] min-w-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={true}
                    horizontal={true}
                  />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#555"
                    tick={{ fill: "#555", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
                    tickLine={{ stroke: "rgba(255,255,255,0.05)" }}
                    tickFormatter={(v) => new Date(v).toLocaleTimeString()}
                  />
                  <YAxis
                    stroke="#555"
                    tick={{ fill: "#555", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
                    tickLine={{ stroke: "rgba(255,255,255,0.05)" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ border: "none" }}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-gray-400 text-sm">{value}</span>
                    )}
                  />
                  {uniquePids.map(
                    (pid, i) =>
                      visiblePids.has(pid) && (
                        <Line
                          key={pid}
                          type="monotone"
                          dataKey={pid}
                          name={getPidLabel(pid)}
                          stroke={CHART_COLORS[i % CHART_COLORS.length]}
                          dot={<CustomDot />}
                          connectNulls
                        />
                      )
                  )}
                  <Brush
                    dataKey="timestamp"
                    height={28}
                    stroke="rgba(255,255,255,0.1)"
                    fill="rgba(255,255,255,0.03)"
                    tickFormatter={(v) => new Date(v).toLocaleTimeString()}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[#555] text-xs mt-1">
              ● GEOTAB (filled) &nbsp; ○ UPS (outlined)
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {uniquePids.map((pid, i) => {
              const color = CHART_COLORS[i % CHART_COLORS.length];
              const isVisible = visiblePids.has(pid);
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => togglePid(pid)}
                  className="rounded-md px-3 py-1.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#06080f]"
                  style={
                    isVisible
                      ? {
                          backgroundColor: color,
                          color: "#fff",
                          border: `1px solid ${color}`,
                          boxShadow: `0 0 12px ${color}40`,
                        }
                      : {
                          backgroundColor: "rgba(255,255,255,0.06)",
                          color: "#555",
                          border: "1px solid rgba(255,255,255,0.07)",
                        }
                  }
                >
                  {getPidLabel(pid)}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <DeviceInfo />
          </div>
        </>
      )}
    </main>
  );
}
