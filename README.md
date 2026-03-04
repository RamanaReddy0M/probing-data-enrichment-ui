# Device Telemetry Monitor

Next.js 14 (App Router) + TypeScript + Tailwind CSS dashboard for OBD-II device telemetry.

## Setup

- **Node:** 18.17+ (or 20+)
- **Backend:** REST API at `http://localhost:8080` (see API below)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Enter a device ID and click **Monitor** to open `/device/[id]`.

### Docker

```bash
make docker-build    # build image
make docker-run     # run on port 3000; backend at host.docker.internal:8080
```

For a backend on another host: `make docker-run-backend BACKEND_URL=http://your-backend:8080`

## API

The app proxies the backend via a Next.js API route:

- **Backend:** `GET http://localhost:8080/api/v1/devices/events?deviceId={id}&limit=100`
- **Frontend:** `GET /api/devices/events?deviceId={id}&limit=100`

Response: array of events with `deviceId`, `timestamp`, `sourceId` (GEOTAB/UPS), `pid[]`, `pidValue[]`.

## Features

- **Home:** Device ID input → navigate to `/device/[id]`
- **Device page:** Time series chart (Recharts), one line per PID; stats bar (min/max/avg per PID); GEOTAB (●) vs UPS (■) dots; auto-refresh every 10s
- **Device Info:** Sidebar placeholder (Phase 2 TODO)

## PID labels

| Code  | Label                        |
|-------|------------------------------|
| 010D  | Vehicle Speed (km/h)         |
| 010C  | Engine RPM                   |
| 0105  | Coolant Temp (°C)            |
| 012F  | Fuel Level (%)               |
| 0142  | Control Module Voltage (V)   |
