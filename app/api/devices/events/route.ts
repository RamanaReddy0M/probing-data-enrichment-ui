import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId");
  const limit = searchParams.get("limit") ?? "100";

  if (!deviceId?.trim()) {
    return NextResponse.json(
      { error: "deviceId is required" },
      { status: 400 }
    );
  }

  const url = `${BACKEND_URL}/api/v1/devices/events?deviceId=${encodeURIComponent(deviceId)}&limit=${encodeURIComponent(limit)}`;

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

    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch events";
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
