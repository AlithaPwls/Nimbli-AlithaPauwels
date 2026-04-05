# Backend pre-implementation: GO / NO-GO checklist

Use this **before** you implement Supabase login end-to-end. You are not being graded — you’re making sure you don’t build on missing pieces.

---

## How to fill this in (start here)

### The two columns

| Column | What you do |
|--------|-------------|
| **Pass?** | When you’ve **actually checked** the item, change `[ ]` to `[x]`. If you’re **skipping on purpose**, leave `[ ]` and explain in **Notes** (that counts as a documented exception). |
| **Notes** | Short reminder: *what you saw*, *where*, or *what you decided*. Examples: `Checked in Dashboard → API`, `We use dev project only`, `Deferred until after thesis demo`. |

### Where the answers come from

- **Supabase Dashboard** (browser): [https://supabase.com/dashboard](https://supabase.com/dashboard) → your project.
- **Your laptop**: project folder → `.env`, `.gitignore`, code under `src/`.
- **Your head**: product decisions (e.g. “forgot password goes to email reset later”).

You don’t need to paste secrets into this file — never put keys here.

---

## Step-by-step: Critical items (C1–C7)

Do these in order once; then tick the table below.

### C1 — Env vars load in the app

1. In your project root, open **`.env`** (create it from `.env.example` if you have one).
2. Confirm you have **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** (names must match what `src/lib/supabaseClient.js` uses).
3. In Supabase Dashboard → **Project Settings** → **API**: compare **URL** and **anon public** key — they should match `.env` (first/last few characters are enough to verify).
4. Run `npm run dev`, open the app — if login page loads without console errors about missing env, you’re good.

**Notes example:** `Keys match Dashboard → Settings → API (anon).`

---

### C2 — Email sign-in is turned on

1. Dashboard → **Authentication** → **Providers**.
2. Find **Email** — it should be **enabled**.
3. Same area: check **“Confirm email”** (wording may vary). Note whether new users **must click a link in email** before they can log in.

**Notes example:** `Email on. Confirm email = required` or `Confirm email = off for dev`.

---

### C3 — `profiles` table matches the app

1. Dashboard → **Table Editor** → open **`profiles`**.
2. Confirm there is a column **`id`** (usually UUID, same as user id).
3. Confirm there is **`role`** (text or enum). Values your app uses are in `Login.jsx`: `child`, `parent`, `kine` — they must match what you store in the database.

**Notes example:** `role is text; values parent/kine/child used in Table Editor`.

---

### C4 — Every login user has a profile row

Answer **one** of these honestly:

- **A)** When someone signs up (or you create them), a **row in `profiles`** is always created (e.g. trigger, or you always insert manually).  
- **B)** Not yet — then you **must** handle “logged in but no profile” in the app (see C7).

**Notes example:** `Trigger on auth.users creates profiles` or `No trigger yet — will show error in UI`.

---

### C5 — Service role never in the frontend

1. Open **`src/lib/supabaseClient.js`** — it should only use **anon** key from env (already the case in your repo).
2. Search the repo for `service_role` — should be **no matches** in client code.
3. Confirm `.env` is in **`.gitignore`** and you never committed a file containing the service role key.

**Notes example:** `Only anon in supabaseClient; .env gitignored`.

---

### C6 — Session updates after login (plan)

Right now **`AuthContext`** loads the session **once** on startup. After you implement login, you need **`onAuthStateChange`** so when someone signs in, **`user` / `role` in context update** without refreshing the page.

**Notes example:** `Will add listener in AuthContext in same PR as login hardening`.

---

### C7 — Missing profile or unknown role

Decide what the user **sees** if password login works but:

- there is **no** `profiles` row, or  
- `role` is **empty** or not one of `child` / `parent` / `kine`.

Examples: show Dutch error *“Account niet volledig ingesteld”*, log out, link to support, etc.

**Notes example:** `Show error + signOut + message to contact kinesist`.

---

## Critical — required for GO

| # | Check | Pass? | Notes |
|---|--------|:-----:|-------|
| C1 | **Supabase URL + anon key** in `.env`; match Dashboard → Settings → API; app runs. | [x] | |
| C2 | **Email** provider enabled; you know if **email confirmation** is required. | [ ] | |
| C3 | **`profiles`** has **`id`** + **`role`**; values match app (`child` / `parent` / `kine`). | [x] | |
| C4 | Plan for **profile row** for every email user (or explicit “no row yet” handling). | [x] | |
| C5 | **Service role** not in client / Git; only **anon** in frontend. | [x] | |
| C6 | Plan to add **`onAuthStateChange`** (or equivalent) when implementing login. | [x] | |
| C7 | **Product decision** for missing / invalid `role` after successful auth. | [x] | |

**GO rule:** All **C1–C7** have `[x]` **or** a **Notes** exception you accept (with date).

---

## Important — before production (OK to defer for dev MVP)

| # | Check | Pass? | Notes |
|---|--------|:-----:|-------|
| I1 | **RLS** on `profiles`: users can read **own** row; writes locked down. | [x] | |
| I2 | **Auth** URL + redirect URLs in Supabase match your app URLs (local + prod). | [x] | |
| I3 | **ProtectedRoute:** only `user` vs also check **`role`** per dashboard — decided. | [x] | |
| I4 | **Onthoud mij:** real behavior or “cosmetic for now” written in Notes. | [ ] | |
| I5 | **Forgot password:** email reset vs code flow — decided; UI matches. | [ ] | |
| I6 | **Sign-up path** creates **Auth user + profile** (no orphans). | [ ] | |

**How to verify I1:** Dashboard → **Authentication** → **Policies** or Table Editor → **profiles** → RLS enabled + list policies.  
**How to verify I2:** Dashboard → **Authentication** → **URL Configuration** — Site URL and Redirect URLs include e.g. `http://localhost:5173` and your production domain.

---

## Environment & repo

| # | Check | Pass? | Notes |
|---|--------|:-----:|-------|
| E1 | `.env` gitignored; `.env.example` has **placeholder** names (no real keys). | [ ] | |
| E2 | Using a **dev** Supabase project for experiments (recommended). | [ ] | |

---

## Final decision

**Date:** _______________  
**Reviewer:** _______________

- [ ] **GO** — Critical items done or explicitly excepted; safe to implement.
- [ ] **NO-GO** — Fix blockers first.

**Blockers (if NO-GO):**

1. _________________________________  
2. _________________________________  

**Deferred (GO with debt):**

1. _________________________________  
2. _________________________________  
