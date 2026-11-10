# Empty Bottle 💧

> A community-driven campus water-point discovery and reporting platform for university students, initially designed for Lovely Professional University (LPU), Punjab, India.

Students can quickly locate drinking water points across campus blocks and floors, check operational and verification statuses, report dispenser issues, and confirm working points—**without logging in, registering, or scanning QR codes**.

---

## 1. Architecture Overview

Empty Bottle is structured with a clean separation of concerns, designed for independent deployment:

```
empty-bottle/
├── server.ts              # Express backend API & static server (with building REST API)
├── public/assets/aistudio/ # Real LPU campus map image asset
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Navbar.tsx     # Apple Maps / Linear-styled top navigation
│   │   ├── BottomNav.tsx  # Mobile thumb-zone bottom tab bar
│   │   └── CampusMapCanvas.tsx # Interactive pan/zoom canvas with normalized coordinates
│   ├── views/             # Core application views
│   │   ├── HomeView.tsx   # Prioritizes 3 primary actions + quick campus search
│   │   ├── FindWaterView.tsx    # Building & floor dispenser finder
│   │   ├── CampusMapView.tsx    # Interactive student campus map with floor explorer
│   │   ├── AdminMapEditorView.tsx # Admin map editor at /admin/map for marker placement
│   │   ├── ReportProblemView.tsx # Anonymous 30-second issue reporting
│   │   └── AskAiView.tsx  # Natural language campus assistant destination
│   ├── services/
│   │   └── api.ts         # Network client separating UI from backend calls
│   ├── types/
│   │   └── index.ts       # Domain TypeScript models with Coordinates schema
│   ├── App.tsx            # Root student application with centralized building state
│   ├── main.tsx           # React DOM entry point
│   └── index.css          # Tailwind CSS global styles
├── index.html             # HTML entry point with Plus Jakarta Sans typography
├── vite.config.ts         # Vite bundler configuration
├── tsconfig.json          # TypeScript compiler configuration
├── .env.example           # Reference environment variables
└── README.md              # Project documentation & deployment guide
```

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide React icons
- **Backend**: Node.js with Express
- **Map System**: Custom responsive pan/zoom canvas using actual LPU campus map asset with 0-100% normalized coordinates
- **Database (Upcoming Phase)**: Supabase PostgreSQL (single source of truth)
- **AI Integration (Upcoming Phase)**: Gemini API with Grounded RAG
- **Typography**: Plus Jakarta Sans / Inter aesthetic

---

## 3. Running the Project Locally

### Prerequisites
- Node.js (v18+ or v20+)
- npm or pnpm

### Setup
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd empty-bottle
   ```

2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Option A: Run Full-Stack (Unified Development)
Runs the Express backend on port `3000` with the Vite dev server mounted in middleware mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Running and Deploying Frontend & Backend Independently

The application is engineered so that the frontend and backend can be hosted on different platforms without coupling.

### Deploying the Frontend Independently (e.g. Vercel)

1. **Build command**: `npm run build`
2. **Output directory**: `dist`
3. **Environment Variables**:
   In your Vercel project settings, set:
   ```env
   VITE_API_BASE_URL=https://your-express-backend.onrender.com
   ```
4. **Vercel rewrite (Single Page App)**:
   Add a `vercel.json` if required:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

### Deploying the Express Backend Independently (e.g. Render)

1. **Environment**: Node
2. **Build command**: `npm install`
3. **Start command**: `npm run start` (or `node server.ts` / `npx tsx server.ts`)
4. **Environment Variables on Render**:
   ```env
   PORT=10000
   NODE_ENV=production
   CORS_ORIGIN=https://your-empty-bottle-frontend.vercel.app
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   GEMINI_API_KEY=your-gemini-key
   ```
5. **Health check URL**: `https://your-express-backend.onrender.com/api/health`

---

## 5. Primary Application Features (Step 2)

| Feature | Description | Destination |
| :--- | :--- | :--- |
| **Interactive Campus Map** | Zoomable, pannable LPU campus map with building markers, search filtering, floor explorer, and water point transitions. | `/map` (`CampusMapView`) |
| **Admin Map Editor** | Dedicated administrator map editor: add buildings, click/drag markers to pinpoint coordinates, update details, or remove markers. | `/admin/map` (`AdminMapEditorView`) |
| **Find Water** | Select campus building and floor; filter by chilled / RO purifier; view last verified timestamp and operational status. | `/find` (`FindWaterView`) |
| **Report a Problem** | 100% anonymous 30-second issue reporting (dry tank, leak, warm water, broken tap) with ticket confirmation. | `/report` (`ReportProblemView`) |
| **Ask AI** | Conversational water assistant foundation for querying dispenser status via natural language. | `/ask_ai` (`AskAiView`) |

---

## 6. Intelligent Campus Discovery Architecture (Step 3)

- **Two Independent Positioning Systems**:
  - `CampusMapCoordinates` (`map_x`, `map_y`): 0.0 to 100.0% normalized percentages for map image overlay. Non-metric; not used for physical walking distances.
  - `GeoCoordinates` (`latitude`, `longitude`): Real-world WGS84 GPS coordinates. Only calculated via Haversine great-circle formula when valid GPS exists on both user and building.
- **Deterministic Backend Engine (`POST /api/recommendations`)**:
  - Scores water dispensers using documented numerical weights: Spatial Proximity (Same building: +100, Verified neighbour: +60, Same zone: +30), Floor convenience (Same floor: +40, Adjacent floor: +25), Operational state (Operational: +30, Low pressure: +10, Maintenance: -100, Offline: -200), Freshness (Recent: +20, Today: +10), Defect penalties (-30 to -70).
  - Explicit three-case location resolution: Building specified, browser geolocation shared (explicit permission only), or missing location prompt.
  - Contextual multi-turn refinement: allows narrowing previous candidate sets (e.g. "Which one has chilled water?").

### Running Automated Recommendation Engine Tests
```bash
npx tsx tests/recommendationEngine.test.ts
```

---

## 7. Incremental Roadmap (Next Phases)

- **Phase 4**: Connect Gemini conversational assistant with function calling directly to `POST /api/recommendations`.
- **Phase 5**: Provision Supabase PostgreSQL schema (`buildings`, `floors`, `water_points`, `reports`, `water_point_votes`).
- **Phase 6**: Full administrative dashboard authentication.

---

## 7. License
Apache-2.0
