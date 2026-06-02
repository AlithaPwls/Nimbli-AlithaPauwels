# Acceptatietest — multi-kind gezinnen

1. **Regressie:** Kine maakt nieuw gezin → ouder registreert via `/register` → één kind werkt (dashboard + kind-view).
2. **Kine sibling:** Patiëntdetail → “Kind toevoegen” of add-flow “Kind bij bestaande ouder” → nieuwe code.
3. **Activatie via code:** Ouder gebruikt `/register` met code van kind 2 → `/register/kind` → login + wachtwoord.
4. **Activatie via dashboard:** Ingelogde ouder ziet banner → `/dashboard/ouder/kind-activeren`.
5. **Ouderdashboard:** Wissel kind in sidebar → KPI’s/oefeningen verschillen per `?child=`.
6. **Kind-dashboard (ouder):** `/dashboard/kind?child=` → oefeningen/sessies van juiste kind; switcher bij 2+ kinderen.
7. **RLS:** Ouder A ziet geen data van kinderen van ouder B (na migratie `parent_can_access_child`).
8. **Kine:** Siblings zichtbaar op patiëntdetail; navigatie naar broer/zus profiel.

**Database:** Voer migratie `20260602150000_multi_child_rls.sql` uit op Supabase vóór productietest.
