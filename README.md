# Nimbli

> [!IMPORTANT]
> **INLOGCREDENTIALS**

## Login credentials kinesist


|                |                              |
| -------------- | ---------------------------- |
| **E-mail**     | `evelyne.janssens@nimbli.be` |
| **Wachtwoord** | `test1234`                   |


### Inloggen als kinesist

1. Open de app (start-URL gaat naar `/login`).
2. Vul **e-mail** en **wachtwoord** in (zie tabel hierboven).
3. Optioneel: vink **Onthoud mij** aan.
4. Klik op **Inloggen**.
5. Bij geldige gegevens en rol `kine` kom je op `/dashboard/kine` (patiëntenoverzicht).

**Niet gebruiken voor kinesist-login:** *Aanmelden met code* en *Registreer je praktijk* — die zijn voor ouders/kinderen respectievelijk een nieuwe praktijk.

**Eerste keer / nieuwe praktijk?** Klik op **Registreer je praktijk** (`/register/kine`) en doorloop de registratie; daarna log je in met het account dat je daar aanmaakt.

## Testgegevens ouder & kind (registratie)


|                            |                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------- |
| **Ouder**                  | Astrid De Groof                                                                 |
| **Kind**                   | Noah Coppens                                                                    |
| **Activatiecode**          | `467366`                                                                        |
| **E-mail ouder (profiel)** | `astrid.degroof@gmail.com`                                                      |
| **Wachtwoord**             | Zelf kiezen bij registratie (zelfde wachtwoord geldt ook voor het kind-account) |


### Eerste aanmelding ouder (activatiecode)

Voor een **nieuwe familie** (ouder + eerste kind nog niet geactiveerd), zoals Astrid & Noah:

1. Open de app (`/login`).
2. Klik op **Aanmelden met code** (of ga direct naar `/register`).
3. Voer de **6-cijferige activatiecode** in (`467366`) — of scan de **QR-code** van de kinesist.
4. Klik op **Doorgaan** → `/register/ouder`.
5. Controleer het **e-mailadres** (vastgezet door de kinesist).
6. Kies een **wachtwoord**, herhaal en vink **voorwaarden** aan.
7. Bevestig → je landt op `/dashboard/ouder`.

**Daarna inloggen (ouder):** `/login` → `astrid.degroof@gmail.com` + gekozen wachtwoord.

**Kind-login:** `kind.467366@nimbli.be` + **hetzelfde wachtwoord** → `/dashboard/kind`.

---

> [!NOTE]
> **ACTIES**

## Kinesist-portaal — acties

Kernacties op `/dashboard/kine`:

- **Patiënt toevoegen** — gegevens invullen, oefeningen + weekschema kiezen, activatiecode/QR voor de ouder
- **Patiënt opvolgen** — weekgrafiek, voltooide sessies, oefeningen toewijzen of verwijderen, logboeknotities
- **Eigen oefening** — video uploaden of opnemen, rust- en doelpose vastleggen, pose-config genereren en opslaan
- **Standaard oefeningen** — bibliotheek raadplegen (alleen lezen)
- **Instellingen** — eigen profiel; teamleden beheren

**Kan niet:** patiënt/ouderprofiel achteraf bewerken; oefeningen uitvoeren; standaard-oefeningen wijzigen.

## Ouder-portaal — acties

Kernacties op `/dashboard/ouder` (na registratie of login met ouder-e-mail):

- **Kind kiezen** — actief kind wisselen (meerdere kinderen)
- **Dashboard** — voortgang per kind: weekfrequentie, aankomende oefeningen, voortgangsindicatoren, recente sessies
- **Oefenplanning** — weekoverzicht, geplande oefeningen per dag bekijken (incl. detail)
- **Kindweergave** — kind-dashboard openen (ouder blijft ingelogd)
- **Extra kind activeren** — pending kind met ouderwachtwoord
- **Profielen** — ouderprofiel bewerken; profielfoto kind(eren)
- **Eerste aanmelding** — activatiecode (zie inloggegevens hierboven)

**Kan niet:** oefeningen toewijzen of schema wijzigen; behandeldoel bewerken; oefeningen afronden zonder kindweergave.

## Kind-portaal — acties

Kernacties op `/dashboard/kind` (login als kind, of ouder via **Kindweergave**):

- **Oefeningen** — dagelijkse oefeningen via progressiepad; oefening starten
- **Oefening doen** — instructie/video, optioneel voorlezen; pose-detectie met camera
- **Afronden** — sessie opslaan; beloningsscherm (XP/score)
- **Overzicht** — dagmissies, streak, badges, weekgrafiek
- **Terug naar ouder** — ouderdashboard (ouderwachtwoord bij kind-login)

**Inloggen als kind:** `/login` → `kind.{activatiecode}@nimbli.be` + wachtwoord.

---

> [!TIP]
> **TESTOPDRACHTEN**

### Testopdrachten: kinesist (docenten)

Log in met de kinesist-credentials hierboven. Noteer per opdracht wat werkt of niet.

#### 1. Nieuwe patiënt aanmaken

1. **Dashboard** → **Patiënt toevoegen** → nieuw gezin of extra kind.
2. Gegevens invullen (stap 1), oefeningen + weekschema (stap 2), bevestigen (stap 3–4).
3. Noteer **activatiecode** / QR voor ouder-test.

#### 2. Voortgang bekijken (grafieken + sessies)

1. Open een patiënt (bv. Lukas, Kyana — testdata op staging).
2. Tab **Overzicht:** weekgrafiek.
3. Tab **Sessies:** voltooide oefeningen.

#### 3. Eigen oefening toevoegen (video + `pose_config`)

1. **Oefeningen** → **Eigen video’s** → **Nieuwe oefening**.
2. Upload testvideo of neem zelf op (max. 60 s, volledig lichaam in beeld, rust → doelpose).
3. Rust- en doelpose vastleggen → **Genereer oefening-logica** → opslaan.
4. Optioneel: toewijzen aan patiënt en testen als kind.

### Testopdrachten: ouder (docenten)

Gebruik **Astrid / Noah** (`467366`) of bestaand account (bv. Patrick — Lukas).

#### 1. Eerste registratie met activatiecode

1. Volg **Eerste aanmelding ouder** met code `467366`.
2. Rond registratie af → `/dashboard/ouder`, Noah zichtbaar.

#### 2. Voortgang van je kind volgen

1. Login als ouder.
2. **Dashboard:** frequentie, aankomende oefeningen, recente sessies.
3. **Oefenplanning:** week/dag en oefeningdetail.

#### 3. Kindweergave en oefening mee doen

1. **Kindweergave** in sidebar.
2. Start geplande oefening via progressiepad.
3. Pose-detectie afronden; controleer sessie in ouderdashboard.

### Testopdrachten: kind (docenten)

**Noah:** `kind.467366@nimbli.be` na ouder-registratie. **Lukas:** `kind.314038@nimbli.be`.

#### 1. Inloggen als kind

1. `/login` met kind-e-mail + wachtwoord.
2. Controleer `/dashboard/kind` en progressiepad.

#### 2. Een oefening voltooien

1. Start vandaag geplande oefening.
2. Instructie/video (+ optioneel voorlezen).
3. Pose-detectie (camera, volledig in beeld) → beloningsscherm.

#### 3. Overzicht en voortgang

1. **Overzicht:** dagmissies, streak, badges, weekgrafiek.
2. Optioneel: sessie zichtbaar in ouderdashboard.

