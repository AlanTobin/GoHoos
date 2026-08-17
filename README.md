# GoHoos

Real-time UVA transit app with live bus tracking, route exploration, and trip planning for UTS riders on Grounds and in Charlottesville.

Built to fix the gap between UTS's official app and what students actually need to navigate Grounds.

![GoHoos routes map with live UTS buses, route lines, and stops around UVA Grounds](frontend/public/about/routes-map.png)

## Status

**Live today**

- **Trip planner (home)** — pick a destination on the map or from campus shortcuts, get ranked route options (walk + ride, at most one transfer), and step through the itinerary on the map
- **Routes** — Mapbox map with UTS route lines and stops (GTFS), live vehicle positions, search/toggle by route, and bus detail popups (speed, route, passenger count when available)
- **About** — product overview, feature walkthrough, and roadmap

**Under active development**

- **More accurate ETAs** — traffic-, dwell-, and speed-aware arrival estimates
- **Break / stop notifications** — alerts when a bus is on break or reaches a stop you care about

GoHoos is an independent student project and is not affiliated with the University of Virginia, UVA Transportation Services, or TransLoc.

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | [Next.js](https://nextjs.org/) 16, [React](https://react.dev/) 19, [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/) |
| Maps | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) |
| Transit data | [GTFS](https://gtfs.org/) (static routes, shapes, stops) + UVA TransLoc vehicle feed (via Next.js `/api/vehicles`) |
| Trip planning | Client-side routing in the Next.js app (ranked by estimated travel time) |
| Backend | [Express](https://expressjs.com/) — WIP; reserved for future ETA prediction, tracking, and notifications |

## Project structure

```
frontend/   Next.js app — UI, Mapbox map, GTFS JSON, trip planner, `/api/vehicles` TransLoc proxy
backend/    Express API — scaffold only for now (planned ETA / notification work)
```

## Setup

### Prerequisites

- Node.js 20+
- A [Mapbox access token](https://account.mapbox.com/access-tokens/)

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

Start the dev server:

```bash
npm run dev
```

Live vehicle positions and capacity are fetched server-side from TransLoc through `GET /api/vehicles` (polled about every 5 seconds on the home planner and routes map). The Express `backend/` package is not required for local development.

Open [http://localhost:3000](http://localhost:3000) for the trip planner, [http://localhost:3000/routes](http://localhost:3000/routes) for the live route map, or [http://localhost:3000/about](http://localhost:3000/about) for the product overview.

### GTFS data (optional)

Static route data lives in `frontend/src/data/json/`. To regenerate from raw GTFS files in `frontend/src/data/raw/`:

```bash
cd frontend
npm run convert:gtfs
```

## Contact

Built by [Alan Tobin](https://github.com/AlanTobin) — feedback and issues welcome on [GitHub Issues](https://github.com/AlanTobin/GoHoos/issues).
