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

- Frontend: HTML, CSS, JavaScript
- Backend: Firebase (Firestore, Storage, Authentication)

## Installation

1. Repository klonen
2. Webserver im `public`-Verzeichnis starten:
   ```
   cd public
   python -m http.server 8080
   ```
3. Im Browser aufrufen: `http://localhost:8080`

## Hinweise

Dieses Projekt verwendet Firebase-Dienste. Die Firebase-Konfiguration muss in der `public/js/firebase-config.js` Datei angepasst werden. 