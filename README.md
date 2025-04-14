# Baumarkt-Kalender

Ein Kalender-Tool für Baumarkt-Filialen zur Verwaltung von Abteilungs-Themen und Bildern.

## Funktionen

- Monatskalender-Ansicht mit Themen für jeden Tag
- Filterung nach Abteilungen und Teamleitern
- Teamleiter-Zuordnung zu Abteilungen
- Themen-Verwaltung (erstellen, bearbeiten, löschen)
- Bildupload für Themen
- Benutzer-Authentifizierung mit verschiedenen Rollen

## Technologien

- Frontend: Next.js (React)
- Backend: Supabase (Auth, Database, Storage)
- Hosting: Vercel

## Installation und Entwicklung

1. Repository klonen:
   ```
   git clone https://github.com/keepsmile1337/Baumarkt-Planer.git
   cd Baumarkt-Planer
   ```

2. Abhängigkeiten installieren:
   ```
   npm install
   ```

3. Supabase-Projekt erstellen:
   - Besuche [supabase.com](https://supabase.com) und erstelle ein neues Projekt
   - Kopiere deine Projekt-URL und den anonymen Schlüssel
   - Erstelle eine `.env.local` Datei im Projektverzeichnis:
     ```
     SUPABASE_URL=https://deine-projekt-id.supabase.co
     SUPABASE_ANON_KEY=dein-supabase-anon-key
     ```
   - Führe das SQL-Schema aus `supabase/schema.sql` in der Supabase SQL-Konsole aus

4. Entwicklungsserver starten:
   ```
   npm run dev
   ```

5. Im Browser aufrufen: `http://localhost:3000`

## Deployment

Das Projekt ist für Vercel-Deployment konfiguriert:

1. Vercel CLI installieren:
   ```
   npm install -g vercel
   ```

2. Deployment starten:
   ```
   vercel
   ```

3. Folge den Anweisungen, um das Projekt zu konfigurieren.

4. Nach dem Deployment, setze die Umgebungsvariablen in den Vercel-Projekteinstellungen:
   - `SUPABASE_URL`: Deine Supabase-Projekt-URL
   - `SUPABASE_ANON_KEY`: Dein Supabase anonymer Schlüssel

## Struktur des Projekts

- `/pages`: Next.js-Seiten
- `/public`: Statische Assets (CSS, JS, Bilder)
- `/supabase`: Supabase-spezifische Dateien (Schema, Funktionen)

## Migration von Firebase zu Supabase

Dieses Projekt wurde von Firebase zu Supabase migriert. Die wichtigsten Änderungen:

- Firebase Authentication → Supabase Auth
- Firestore → Supabase Database
- Firebase Storage → Supabase Storage
- Firebase Hosting → Vercel

## Hinweis zur Benutzerverwaltung

Für die Migration von Firebase zu Supabase wurde ein einfacher Migrationspfad implementiert, der bisherige Benutzer (mit Niederlassungsnummer) zu Supabase-Benutzern konvertiert. Neue Benutzer werden direkt in Supabase erstellt. 