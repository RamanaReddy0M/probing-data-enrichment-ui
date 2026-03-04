import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

// Shape returned by the backend probing API
type BackendProbingEvent = {
  deviceId: number | string;
  vehicleId?: string;
  sourceId: "GEOTAB" | "UPS" | string;
  pid: string[];
  pidValue: number[];
  qualityLane?: string;
  transmissionDelayMs?: number;
  wasInOrder?: boolean;
  eventTimestamp: string;
  ingestedAt?: string;
  classifiedAt?: string;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId");
  const lane = searchParams.get("lane") ?? "GOOD";

  if (!deviceId?.trim()) {
    return NextResponse.json(
      { error: "deviceId is required" },
      { status: 400 }
    );
  }

  const url = `${BACKEND_URL}/api/v1/probing/events?deviceId=${encodeURIComponent(
    deviceId
  )}&lane=${encodeURIComponent(lane)}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || `Backend returned ${res.status}` },
        { status: res.status }
      );
    }

    const raw = await res.json();
    const data = Array.isArray(raw) ? raw : [];

    // Normalize backend events into the shape expected by the UI
    const normalized = data.map((e: BackendProbingEvent) => ({
      deviceId: String(e.deviceId),
      timestamp: e.eventTimestamp,
      sourceId: e.sourceId,
      pid: Array.isArray(e.pid) ? e.pid : [],
      pidValue: Array.isArray(e.pidValue) ? e.pidValue : [],
    }));

    return NextResponse.json(normalized);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch probing events";
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
