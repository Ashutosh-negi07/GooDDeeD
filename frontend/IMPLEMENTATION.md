# GooDDeeD Frontend — Implementation Guide

## Why This Document Exists

This file explains **what** was built, **in what order**, and **why** — so anyone picking up the project understands the reasoning behind every decision.

---

## How Is the Frontend Already Working Without Full Setup?

**Great question.** The original 4 pages (Landing, Login, Register, Dashboard) were built with **plain CSS + CSS custom properties** — no Tailwind, no component library. The design system lives entirely in `index.css` (colors, fonts, shadows, spacing) and per-page `.css` files.

That means the frontend already works with just `react`, `react-dom`, `react-router-dom`, and `axios`. No extra setup was needed for those pages.

The implementation plan mentioned installing Tailwind v4, but since all existing pages use handcrafted CSS and the user explicitly wants to **keep what's already done**, we're continuing with the same CSS custom-properties approach. This avoids:
- Tailwind's preflight reset overwriting existing styles
- Mixing two different styling paradigms in one project
- Breaking the already-polished Landing, Login, Register, and Dashboard pages

**What we DO install:** `react-hot-toast` (toast notifications) and `lucide-react` (consistent icon library).

---

## What Already Existed (Untouched)

| File | Description |
|------|-------------|
| `src/pages/LandingPage.jsx` + CSS | Full landing page — hero, causes, how-it-works, CTA, footer |
| `src/pages/LoginPage.jsx` + CSS | Split-screen login with beach-cleanup image |
| `src/pages/RegisterPage.jsx` | Registration form (shares AuthPages.css) |
| `src/pages/DashboardPage.jsx` + CSS | Dashboard with stats, my causes, profile card |
| `src/api/axios.js` | Axios instance with JWT interceptors |
| `src/api/auth.js` | Auth API (register, login, getMe) |
| `src/contexts/AuthContext.jsx` | Auth state management |
| `src/hooks/useAuth.js` | Convenience hook |
| `src/components/auth/ProtectedRoute.jsx` | Route guard |
| `src/index.css` | Design system tokens + global reset |

---

## Implementation Phases

### Phase 1 — Dependencies & Setup

**What:** Install `react-hot-toast` and `lucide-react`. Add `<Toaster>` to `main.jsx`.

**Why:**
- `react-hot-toast` — Every user action (join cause, create task, approve member) needs feedback. Toast notifications are the standard UX pattern for this.
- `lucide-react` — The existing pages use inline SVGs for icons. That works, but for 7 new pages with dozens of UI elements, a consistent icon library saves time and ensures visual cohesion.

**Why NOT Tailwind?** The existing 4 pages use ~900 lines of handcrafted CSS with CSS variables. Adding Tailwind's CSS reset would break them. Consistency > novelty.

---

### Phase 2 — API Layer

**What:** Create `api/causes.js`, `api/goals.js`, `api/tasks.js`, `api/memberships.js`.

**Why this comes first:** Every page needs data. Building the API layer upfront means pages can be built independently without worrying about HTTP calls. Each file is a thin wrapper around the Axios instance — matching the backend's REST endpoints exactly.

**Pattern:**
```js
import api from './axios'

export const causesAPI = {
  getAll: (page = 0, size = 10) => api.get('/causes', { params: { page, size } }),
  getById: (id) => api.get(`/causes/${id}`),
  // ...
}
```

This mirrors the backend's controller structure 1:1.

---

### Phase 3 — Shared Layout Components

**What:** Create `Navbar.jsx`, `Footer.jsx`, `DashboardLayout.jsx` (with sidebar navigation).

**Why:**
- The Landing page has its own navbar+footer baked in (stays untouched).
- New **public pages** (Explore, Cause Detail, 404) need the same navbar/footer style.
- New **dashboard pages** (My Tasks, My Causes, Profile, Manage Cause) need a sidebar for navigation between sub-pages.

**Why not extract from LandingPage?** The user said "don't change what's done." So LandingPage keeps its inline navbar/footer. New pages use shared components that replicate the same visual design.

**DashboardLayout structure:**
```
┌─────────────────────────────────────────┐
│  Top Navbar (logo, user avatar, logout) │
├────────┬────────────────────────────────┤
│        │                                │
│  Side  │     Page Content (children)    │
│  bar   │                                │
│        │                                │
├────────┴────────────────────────────────┤
│  (no footer on dashboard pages)         │
└─────────────────────────────────────────┘
```

---

### Phase 4 — App Routing

**What:** Update `App.jsx` with all routes, update `main.jsx` with Toaster.

**Routes added:**
| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| `/explore` | ExploreCausesPage | ✗ | Browse/search all causes |
| `/causes/:id` | CauseDetailPage | ✗ | Cause overview (public parts) |
| `/dashboard` | DashboardPage | ✓ | Main dashboard |
| `/dashboard/tasks` | MyTasksPage | ✓ | Filterable task list |
| `/dashboard/causes` | MyCausesPage | ✓ | User's causes with roles |
| `/cause/:id/manage` | ManageCausePage | ✓ | Admin panel for a cause |
| `/profile` | ProfilePage | ✓ | View/edit profile |
| `*` | NotFoundPage | ✗ | 404 |

---

### Phase 5 — Pages (one by one)

Each page follows this pattern:
1. **Create the JSX** — Component with state, useEffect for data fetching, event handlers
2. **Create the CSS** — Following existing design tokens (colors, radii, shadows, transitions)
3. **Verify** — Visual check in browser

#### Page-by-page breakdown:

**ExploreCausesPage** — Public browse/search. Paginated cause cards with a search bar. Uses debounced input → `/api/causes/search`. Unauthenticated users see cards; authenticated users see a "Join" button. Theme: shows all causes including cleaning, teaching, tree planting, food drives.

**CauseDetailPage** — Deep dive into one cause. Shows cause info, goals list, tasks (grouped by status), member list. Has Join/Leave button. Admin users see "Manage" link. This is the "detail" counterpart to the cause cards.

**MyTasksPage** — Filterable task list for the logged-in user. Filters: status (Coming Up / Ongoing / Completed), cause, goal. Paginated. Uses badge colors for task status. Shows task titles, due dates, cause names.

**MyCausesPage** — Grid of causes the user belongs to, showing their role (ADMIN / SUPPORTER) and approval status. Links to cause detail or manage page.

**ManageCausePage** — The admin power page. Tabs/sections for: Edit Cause, Goals (CRUD), Tasks (CRUD), Members (approve/reject). Only visible if user is ADMIN for that cause.

**ProfilePage** — Simple: show user info, allow editing name/email. Uses the existing dashboard card style.

**NotFoundPage** — Friendly 404 with illustration and link home. Keeps the green theme.

---

### Phase 6 — DashboardPage Update (minimal)

**What:** Add sidebar navigation to the existing DashboardPage so users can navigate to My Tasks, My Causes, Profile.

**Why this is necessary:** Without this, users on `/dashboard` have no way to reach `/dashboard/tasks` or `/dashboard/causes`. The existing page stays the same — we just wrap it in the DashboardLayout.

---

## Design Decisions

### Color Palette (unchanged)
- Primary: `#2D6A4F` (forest green)
- Primary Dark: `#1B4332`
- Primary Light: `#52B788`
- Backgrounds: `#F0FFF4`, `#F9FAFB`, `#FFFFFF`
- Text: `#1B1B1B`, `#6B7280`, `#9CA3AF`

### Component Patterns
- **Cards** — White background, 1px border, rounded corners, hover lift
- **Buttons** — Pill-shaped (border-radius: 9999px), primary green or outline
- **Forms** — Stacked labels + inputs, green focus ring
- **Badges** — Small pill badges for status/role (green, blue, amber)
- **Empty states** — Dashed border, centered icon + text + CTA

### Theme Content
All placeholder content follows the social-impact theme:
- 🧹 Beach cleanup & neighborhood cleaning
- 📚 Teaching children & mentoring
- 🌳 Tree planting & reforestation
- 🍲 Food drives & community kitchens
- 🐾 Animal shelter volunteering
- 🏡 Community garden projects
- 👵 Elder care & companionship
- 💰 Donation drives & fundraising

---

## File Structure (after implementation)

```
src/
├── api/
│   ├── axios.js            ← existing
│   ├── auth.js             ← existing
│   ├── causes.js           ← NEW
│   ├── goals.js            ← NEW
│   ├── tasks.js            ← NEW
│   └── memberships.js      ← NEW
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.jsx  ← existing
│   └── layout/
│       ├── Navbar.jsx           ← NEW
│       ├── Navbar.css           ← NEW
│       ├── Footer.jsx           ← NEW
│       ├── Footer.css           ← NEW
│       ├── DashboardLayout.jsx  ← NEW
│       └── DashboardLayout.css  ← NEW
├── contexts/
│   └── AuthContext.jsx     ← existing
├── hooks/
│   └── useAuth.js          ← existing
├── pages/
│   ├── LandingPage.jsx     ← existing (untouched)
│   ├── LandingPage.css     ← existing (untouched)
│   ├── LoginPage.jsx       ← existing (untouched)
│   ├── RegisterPage.jsx    ← existing (untouched)
│   ├── AuthPages.css       ← existing (untouched)
│   ├── DashboardPage.jsx   ← existing (minimal nav update)
│   ├── DashboardPage.css   ← existing (untouched)
│   ├── ExploreCausesPage.jsx    ← NEW
│   ├── ExploreCausesPage.css    ← NEW
│   ├── CauseDetailPage.jsx     ← NEW
│   ├── CauseDetailPage.css     ← NEW
│   ├── MyTasksPage.jsx         ← NEW
│   ├── MyTasksPage.css         ← NEW
│   ├── MyCausesPage.jsx        ← NEW
│   ├── MyCausesPage.css        ← NEW
│   ├── ManageCausePage.jsx      ← NEW
│   ├── ManageCausePage.css      ← NEW
│   ├── ProfilePage.jsx         ← NEW
│   ├── ProfilePage.css         ← NEW
│   ├── NotFoundPage.jsx        ← NEW
│   └── NotFoundPage.css        ← NEW
├── App.jsx                 ← existing (routes added)
├── main.jsx                ← existing (Toaster added)
└── index.css               ← existing (untouched)
```

---

## Verification

1. `npm run build` — No compile errors
2. `npm run lint` — No lint warnings
3. Browser check — Each page renders correctly
4. Auth flow — Login → Dashboard → Navigate sub-pages
5. API integration — Explore causes loads data from backend

---

## Current Status — Done vs To‑Do

### ✅ Completed

- Kept all existing pages/styles intact (Landing, Login, Register, Dashboard, Auth CSS, design tokens).
- Added `react-hot-toast` and `lucide-react` and wired `<Toaster />` in `main.jsx`.
- Implemented API wrappers for causes, goals, tasks, and memberships under `src/api/`.
- Built shared layout components: `Navbar`, `Footer`, and `DashboardLayout`.
- Wired full routing in `App.jsx` for public and protected pages.
- Implemented new pages and styles:
  - ExploreCausesPage (with turtle/ocean hero banner and search)
  - CauseDetailPage
  - MyTasksPage
  - MyCausesPage
  - ManageCausePage
  - ProfilePage
  - NotFoundPage
- Verified production build with `npx vite build`.

### 🔜 Still To‑Do / Optional

- Start the Spring Boot backend (`./mvnw spring-boot:run` in `backend/`) when you want real data instead of empty states.
- Light UX polish if you want: copy tweaks, icon swaps, or additional illustrations.
- Add automated tests (unit/integration) for React components if the project requires test coverage.
- Hook up any extra backend endpoints that get added in the future by extending the `api/*.js` wrappers and the relevant pages.
