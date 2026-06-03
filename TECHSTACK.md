# Nimbli — Tech stack

Overzicht van technologieën, architectuur en tooling voor dit project. Voor inloggegevens, testflows en portaal-acties: zie [README.md](./README.md).

---

## Product

**Nimbli** is een webapp voor thuisrevalidatie bij kinderen: kinesisten beheren patiënten en oefeningen; ouders volgen voortgang; kinderen voeren oefeningen uit met optionele **pose-detectie** (camera + MediaPipe) en beloningen (XP, streaks, badges).

Drie rollen: `kine`, `parent`, `child`.

---

## Architectuur (kort)

```text
Browser (React SPA)
    │
    ├── Supabase Auth (sessies, JWT)
    ├── Supabase Postgres + RLS (data)
    ├── Supabase Storage (video’s, avatars)
    └── Supabase Edge Functions (Deno)
            └── OpenRouter (pose-config generatie)
```

Hosting frontend: **Vercel** (SPA rewrite naar `index.html`). Backend: **Supabase** (Postgres, Auth, Storage, Functions).

---

## Frontend

| Onderdeel | Technologie | Opmerking |
|-----------|-------------|-----------|
| Runtime | **React 19** | Function components, hooks |
| Taal | **JavaScript** (`.jsx`) + beperkt **TypeScript** (`.tsx` / `.ts`) | UI-primitives en enkele hooks in TS; meeste app-logica in JS |
| Build | **Vite 8** | `@vitejs/plugin-react`, path alias `@/` → `src/` |
| Routing | **React Router 7** | `BrowserRouter`, role-based dashboards |
| Styling | **Tailwind CSS 4** | `@tailwindcss/vite`, design tokens in `src/index.css` |
| UI-kit | **shadcn/ui** (Radix Nova) | `radix-ui`, `class-variance-authority`, `tailwind-merge` |
| Iconen | **Lucide React** | |
| Lettertypes | **Geist Variable** (`@fontsource-variable/geist`) + custom **Nunito** / **Cabinet Grotesk** (Nimbli branding) |
| Datum | **date-fns**, **react-day-picker** | o.a. planning, weekweergave |
| QR | **qrcode** | activatiecodes voor ouders |
| UX | **canvas-confetti** | beloningsscherm kind |
| Lint | **ESLint 9** | flat config (`eslint.config.js`) |

**Primaire kleur:** `#2bbf9d` (token `--color-nimbli`).

**Responsive:** desktop-first; mobiel/tablet via aparte navigatie (hamburger + drawer), zonder desktop-layout te wijzigen.

---

## Client-side domeinfeatures

| Feature | Technologie |
|---------|-------------|
| Pose-detectie (kind + kine frame capture) | **@mediapipe/tasks-vision** |
| Pose-regels (scoring, hold) | Eigen engine: `src/lib/kind/poseRulesEngine.js` (gedeeld concept met Edge `_shared/pose`) |
| Video preview / thumbnail | `<video>` + canvas (`src/lib/kine/exerciseVideoThumbnail.js`) |
| Spraakbegeleiding kind | **Web Speech API** (`useSpeechGuide.js`) |
| Auth state | **React Context** (`AuthContext`) + Supabase session |
| Actief kind (ouder) | Query `?child=`, `localStorage` (`nimbli.activeChildId`) |

---

## Backend — Supabase

| Onderdeel | Gebruik |
|-----------|---------|
| **PostgreSQL** | Schema via SQL-migraties in `supabase/migrations/` |
| **Row Level Security (RLS)** | Per rol (`kine`, `parent`, `child`); o.a. `parent_can_access_child()` |
| **Supabase Auth** | E-mail/wachtwoord; technische kind-accounts `kind.{code}@nimbli.be` |
| **Storage** | Buckets o.a. `exercise-videos` (max. 50 MB), `profile-avatars` (max. 5 MB) |
| **RPC** | o.a. `complete_pending_family_registration`, `complete_pending_child_registration` |
| **Edge Functions** | Deno/TypeScript in `supabase/functions/` |

### Edge Functions

| Function | Doel |
|----------|------|
| `generate-pose-config` | LLM via **OpenRouter** (`gpt-4o-mini` default) → `pose_config` JSON |
| `register-kine-practice` | Nieuwe praktijk + kine (JWT uit) |
| `invite-kine-team-member` | Team uitnodigen |
| `update-kine-team-member` / `delete-kine-team-member` | Teambeheer |
| `delete-kine-patient` | Patiënt verwijderen (server-side checks) |

Secrets (o.a. `OPENROUTER_API_KEY`) via Supabase project secrets, niet in de frontend.

### Belangrijke tabellen (indicatief)

`profiles`, `practices`, `child_parent_relations`, `exercises`, `exercise_assignments`, `exercise_sessions`, `patient_notes`, … — zie `20260407120000_initial_schema.sql` en latere migraties.

---

## Authenticatie & families (custom flow)

Geen “sign-up” in de klassieke zin voor patiënten: kine maakt **pending profiles** aan; ouder activeert met **6-cijferige invite code** / QR.

- Eerste kind: gedeelde code ouder + kind → dubbele Auth-accounts + RPC.
- Extra kind: eigen `invite_code` op kind; relatie via `child_parent_relations`.
- Bron van waarheid voor ouder ↔ kind: **`child_parent_relations`**, niet `invite_code` op alle profielen.

Zie ook `.cursor/rules/auth-flow.mdc` in de repo.

---

## Opslag & media

| Bucket | Inhoud | Limiet (migratie) |
|--------|--------|-------------------|
| `exercise-videos` | Kine-oefenvideo’s `{practice_id}/{exercise_id}/…` | 50 MB |
| `profile-avatars` | Profielfoto’s kind/ouder | 5 MB |

**Toegestane video-upload (kine):** MP4, MOV, AVI (client-validatie in `AddExerciseDialog`).

---

## Deployment & omgevingen

| Laag | Platform |
|------|----------|
| Frontend | **Vercel** (`vercel.json`: SPA fallback) |
| Backend | **Supabase** (staging + production projecten) |

### Frontend environment variables

| Variabele | Gebruik |
|-----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL (staging/prod) |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key |
| `VITE_SUPABASE_LOCAL_URL` | Optioneel bij `npm run dev` |
| `VITE_SUPABASE_ANON_LOCAL_KEY` | Optioneel lokaal |
| `VITE_APP_BUILD_ID` | Versielabel in UI (anders git short SHA bij build) |

Client: `src/lib/supabaseClient.js` — in development mag `LOCAL_*` de standaard keys overschrijven; op Vercel alleen `VITE_SUPABASE_*`.

---

## Projectstructuur

```text
src/
  pages/          # Routes per feature (loginflow/, kine/, ouder/, kind/)
  components/     # UI (kine/, kind/, ouder/, ui/)
  hooks/          # Data & side effects (Supabase)
  context/        # Auth e.d.
  lib/            # Helpers, pose, Supabase utilities
supabase/
  migrations/     # Postgres schema + RLS + storage policies
  functions/      # Edge Functions (Deno)
```

---

## Scripts (npm)

| Script | Commando |
|--------|----------|
| Development | `npm run dev` |
| Production build | `npm run build` |
| Preview build | `npm run preview` |
| Lint | `npm run lint` |

---

## Externe diensten

| Dienst | Rol |
|--------|-----|
| **Supabase** | Database, auth, storage, edge compute |
| **Vercel** | Static hosting + CI deploy |
| **OpenRouter** | LLM voor automatische `pose_config` uit rust/doelpose-snapshots |
| **Browser APIs** | Camera (`getUserMedia`), Web Speech, Canvas |

---

## Versies (package.json — indicatief)

Raadpleeg `package.json` / lockfile voor exacte versies. Kern:

- React `^19.2.4`
- Vite `^8.0.1`
- `@supabase/supabase-js` `^2.101.1`
- Tailwind `^4.2.2`
- `@mediapipe/tasks-vision` `^0.10.35`

---

## Gerelateerde documentatie in de repo

| Bestand | Inhoud |
|---------|--------|
| [README.md](./README.md) | Credentials, testopdrachten, portaal-acties |
| [docs/backend-go-no-go.md](./docs/backend-go-no-go.md) | Backend release-checklist |
| `.cursor/rules/` | UI, auth, responsive richtlijnen voor development |

---

*Laatste stack-inventarisatie: juni 2026 — stem af op `package.json` bij upgrades.*
