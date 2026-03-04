# Device Telemetry Monitor

Next.js 14 (App Router) + TypeScript + Tailwind CSS dashboard for OBD-II device telemetry (OBD-II PIDs, multiple data sources, lane quality).

## Prerequisites

- **Node.js**: 18.17+ (or 20+ recommended)
- **npm**: 9+
- **Backend API** running at `http://localhost:8080`

## Backend API

The UI talks only to the Next.js proxy:

- **Frontend**:  
  `GET /api/devices/events?deviceId={id}&lane={lane}`

The proxy calls your probing service:

- **Backend**:  
  `GET {BACKEND_URL}/api/v1/probing/events?deviceId={id}&lane={lane}`

### Event shape (normalized for the UI)

Each event returned to the frontend has:

- `deviceId`: string  
- `timestamp`: ISO string (from backend `eventTimestamp`)  
- `sourceId`: `"GEOTAB"` or `"UPS"`  
- `pid`: string[] — OBD-II PID codes (e.g. `010C`, `010D`, `0105`)  
- `pidValue`: number[] — values aligned 1:1 with `pid`

Known PID labels:

- `010D`: Vehicle Speed (km/h)  
- `010C`: Engine RPM  
- `0105`: Coolant Temp (°C)  
- `012F`: Fuel Level (%)  
- `0142`: Control Module Voltage (V)

## Configuration

Set the backend base URL via env (optional, defaults to `http://localhost:8080`):

```bash
# .env.local
BACKEND_URL=http://localhost:8080
```

## Getting started

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
# App: http://localhost:3000
```

Build and run production:

```bash
npm run build
npm run start
```

> If you see a Node.js version error, upgrade to Node 18.17+ or 20+.

## UI Overview

### Landing / Device page

Route: `/device/{deviceId}`

- Centered header:
  - Title: **OBD-II Device Telemetry Monitor**
  - Subtitle: “Live telemetry by device — select a device to view PID time series”
  - **Device search pill** (rounded, search icon + input + Go button)
- Auto-refresh every **10 seconds** for the selected device.

### Lanes and charts

For each device the page loads three quality “lanes” from the probing API:

- `REALTIME`
- `GOOD`
- `BAD`

For each lane:

- Separate section with:
  - Lane label (e.g. “REALTIME lane”) and point count.
  - Time-series chart (Recharts `LineChart`), X = timestamp, Y = value.
  - **One line per PID**, color-coded.
  - **Dots:** GEOTAB = filled circle, UPS = outlined circle.
  - Brush/zoom slider below the chart.

Global behavior:

- **PID stat cards** above the charts:
  - One card per PID: code, label, max, avg, count.
  - Colored accent per PID.
  - Clicking a card toggles that PID across all three charts.
- **PID toggle buttons** below the charts mirror the same visibility.
- By default, **only the first PID** (by code) is visible; other PIDs can be enabled via toggles.

## Docker & Makefile

Build Docker image:

```bash
make docker-build
```

Run container (backend on host `localhost:8080`):

```bash
make docker-run
# App: http://localhost:3000
```

Run with a custom backend URL:

```bash
make docker-run-backend BACKEND_URL=http://your-backend:8080
```

Local convenience targets:

```bash
make run      # npm run dev
make build    # npm run build
make start    # npm run start
```
