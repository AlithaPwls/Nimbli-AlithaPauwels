# Backend vóór implementatie: GO / NO-GO-checklist

Gebruik dit **voordat** je Supabase-login end-to-end implementeert. Je wordt hier niet op beoordeeld — je controleert of je niet bouwt op ontbrekende onderdelen.

---

## Zo vul je dit in (start hier)

### De twee kolommen

| Kolom | Wat je doet |
|--------|-------------|
| **OK?** | Als je het item **echt gecontroleerd** hebt, wijzig `[ ]` in `[x]`. Als je **bewust overslaat**, laat `[ ]` staan en leg uit in **Opmerkingen** (dat telt als gedocumenteerde uitzondering). |
| **Opmerkingen** | Korte notitie: *wat je zag*, *waar*, of *wat je besliste*. Voorbeelden: `Gecontroleerd in Dashboard → API`, `We gebruiken alleen dev-project`, `Uitgesteld tot na thesisdemo`. |

### Waar de antwoorden vandaan komen

- **Supabase Dashboard** (browser): [https://supabase.com/dashboard](https://supabase.com/dashboard) → jouw project.
- **Je laptop**: projectmap → `.env`, `.gitignore`, code onder `src/`.
- **Je hoofd**: productbeslissingen (bv. “wachtwoord vergeten gaat later via e-mailreset”).

Je hoeft geen secrets in dit bestand te plakken — zet hier nooit keys in.

---

## Stap voor stap: kritieke items (C1–C7)

Doe deze één keer in volgorde; vink daarna de tabel hieronder af.

### C1 — Omgevingsvariabelen laden in de app

1. Open in de projectroot **`.env`** (maak aan vanuit `.env.example` als je die hebt).
2. Controleer of je **`VITE_SUPABASE_URL`** en **`VITE_SUPABASE_ANON_KEY`** hebt (namen moeten overeenkomen met wat `src/lib/supabaseClient.js` gebruikt).
3. In Supabase Dashboard → **Project Settings** → **API**: vergelijk **URL** en **anon public** key — die moeten overeenkomen met `.env` (eerste/laatste paar tekens volstaan om te verifiëren).
4. Run `npm run dev`, open de app — als de loginpagina laadt zonder consolefouten over ontbrekende env, ben je goed.

**Voorbeeld opmerking:** `Keys komen overeen met Dashboard → Settings → API (anon).`

---

### C2 — E-mail inloggen staat aan

1. Dashboard → **Authentication** → **Providers**.
2. Zoek **Email** — die moet **ingeschakeld** zijn.
3. Zelfde scherm: controleer **“Confirm email”** (formulering kan variëren). Noteer of nieuwe gebruikers **op een link in de e-mail moeten klikken** voordat ze kunnen inloggen.

**Voorbeeld opmerking:** `Email aan. Confirm email = verplicht` of `Confirm email = uit voor dev`.

---

### C3 — Tabel `profiles` komt overeen met de app

1. Dashboard → **Table Editor** → open **`profiles`**.
2. Controleer of er een kolom **`id`** is (meestal UUID, zelfde als user id).
3. Controleer of er **`role`** is (text of enum). Waarden die de app gebruikt staan in `Login.jsx`: `child`, `parent`, `kine` — die moeten overeenkomen met wat je in de database opslaat.

**Voorbeeld opmerking:** `role is text; waarden parent/kine/child gebruikt in Table Editor`.

---

### C4 — Elke ingelogde gebruiker heeft een profielrij

Beantwoord **één** van deze opties eerlijk:

- **A)** Bij aanmelding (of wanneer je iemand aanmaakt) wordt **altijd een rij in `profiles`** aangemaakt (bv. trigger, of je insert altijd handmatig).  
- **B)** Nog niet — dan **moet** je in de app omgaan met “ingelogd maar geen profiel” (zie C7).

**Voorbeeld opmerking:** `Trigger op auth.users maakt profiles aan` of `Nog geen trigger — foutmelding in UI`.

---

### C5 — Service role nooit in de frontend

1. Open **`src/lib/supabaseClient.js`** — die mag alleen de **anon** key uit env gebruiken (in deze repo al zo).
2. Zoek in de repo naar `service_role` — in clientcode mag dat **geen** treffers geven.
3. Controleer of `.env` in **`.gitignore`** staat en je nooit een bestand met de service role key hebt gecommit.

**Voorbeeld opmerking:** `Alleen anon in supabaseClient; .env gitignored`.

---

### C6 — Sessie werkt bij na login (plan)

Nu laadt **`AuthContext`** de sessie **één keer** bij opstarten. Na implementatie van login heb je **`onAuthStateChange`** nodig zodat bij inloggen **`user` / `role` in context** bijwerken zonder de pagina te verversen.

**Voorbeeld opmerking:** `Listener toevoegen in AuthContext in dezelfde PR als login-hardening`.

---

### C7 — Ontbrekend profiel of onbekende rol

Bepaal wat de gebruiker **ziet** als wachtwoordlogin werkt maar:

- er **geen** `profiles`-rij is, of  
- `role` **leeg** is of niet één van `child` / `parent` / `kine`.

Voorbeelden: Nederlandse fout *“Account niet volledig ingesteld”*, uitloggen, link naar support, enz.

**Voorbeeld opmerking:** `Fout tonen + signOut + bericht om kinesist te contacteren`.

---

## Kritiek — vereist voor GO

| # | Controle | OK? | Opmerkingen |
|---|--------|:-----:|-------|
| C1 | **Supabase URL + anon key** in `.env`; komt overeen met Dashboard → Settings → API; app draait. | [x] | |
| C2 | **Email**-provider ingeschakeld; je weet of **e-mailbevestiging** verplicht is. | [ ] | |
| C3 | **`profiles`** heeft **`id`** + **`role`**; waarden komen overeen met app (`child` / `parent` / `kine`). | [x] | |
| C4 | Plan voor **profielrij** voor elke e-mailgebruiker (of expliciete afhandeling “nog geen rij”). | [x] | |
| C5 | **Service role** niet in client / Git; alleen **anon** in frontend. | [x] | |
| C6 | Plan om **`onAuthStateChange`** (of equivalent) toe te voegen bij implementatie login. | [x] | |
| C7 | **Productbeslissing** voor ontbrekende / ongeldige `role` na geslaagde auth. | [x] | |

**GO-regel:** Alle **C1–C7** hebben `[x]` **of** een **Opmerkingen**-uitzondering die je accepteert (met datum).

---

## Belangrijk — vóór productie (OK om uit te stellen voor dev-MVP)

| # | Controle | OK? | Opmerkingen |
|---|--------|:-----:|-------|
| I1 | **RLS** op `profiles`: gebruikers kunnen **eigen** rij lezen; schrijven afgeschermd. | [x] | |
| I2 | **Auth**-URL + redirect-URL’s in Supabase komen overeen met je app-URL’s (lokaal + prod). | [x] | |
| I3 | **ProtectedRoute:** alleen `user` vs ook **`role`** per dashboard — beslist. | [x] | |
| I4 | **Onthoud mij:** echt gedrag of “voorlopig cosmetisch” genoteerd in Opmerkingen. | [ ] | |
| I5 | **Wachtwoord vergeten:** e-mailreset vs codeflow — beslist; UI sluit aan. | [ ] | |
| I6 | **Aanmeldpad** maakt **Auth-user + profiel** aan (geen wezen). | [ ] | |

**I1 controleren:** Dashboard → **Authentication** → **Policies** of Table Editor → **profiles** → RLS aan + policies bekijken.  
**I2 controleren:** Dashboard → **Authentication** → **URL Configuration** — Site URL en Redirect URLs bevatten bv. `http://localhost:5173` en je productiedomein.

---

## Omgeving & repository

| # | Controle | OK? | Opmerkingen |
|---|--------|:-----:|-------|
| E1 | `.env` gitignored; `.env.example` heeft **placeholder**-namen (geen echte keys). | [ ] | |
| E2 | Je gebruikt een **dev**-Supabase-project voor experimenten (aanbevolen). | [ ] | |

---

## Eindbeslissing

**Datum:** _______________  
**Reviewer:** _______________

- [ ] **GO** — Kritieke items af of expliciet uitgezonderd; veilig om te implementeren.
- [ ] **NO-GO** — Eerst blockers oplossen.

**Blockers (bij NO-GO):**

1. _________________________________  
2. _________________________________  

**Uitgesteld (GO met technische schuld):**

1. _________________________________  
2. _________________________________  
