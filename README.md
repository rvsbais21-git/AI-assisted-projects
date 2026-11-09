# PURGATORY

A manga-inspired, local-first personal development dashboard for tracking health, academics, DSA practice, and long-term trends.

> Current status: early prototype (v0.2). Built as a learning project with AI assistance.

## Features in this prototype

- Dark manga-inspired interface with crimson accents
- Health logging: workouts, exercise repetitions, nutrition, hydration, sleep, body measurements, screen time, and daily habits
- Academic tracker with subjects, modules, subtopics, completion checklists, exam dates, and daily tasks
- DSA problem-solving and contest ledger
- Basic charts for workout activity, sleep, weight, syllabus completion, and exercise progression
- JSON export/import for manual backups
- First-semester syllabus preloaded for Maths, Physics, Computer, Electrical, and Professional Communication (PC)

## Run locally

This version is a standalone HTML prototype. No build step is required.

1. Download or clone this repository.
2. Open a terminal in the project folder.
3. Start a local development server:

   ```bash
   python -m http.server 8000
   ```

4. Visit <http://localhost:8000>.

You can also open `index.html` directly in a browser, although using a local server is preferable.

## Data storage and privacy

This prototype stores records in the browser's `localStorage` on the current browser profile and device.

- Data is not synchronized across devices.
- Data is not encrypted in this prototype.
- Clearing browser storage can delete records.
- Use the built-in JSON export feature to make backups.
- Do not enter sensitive personal information on a shared or public device.

The planned architecture is local-first with IndexedDB and optional private cross-device synchronization. Those capabilities are not implemented yet.

## Current limitations

- Weekly and monthly workout aggregation is not yet fully implemented.
- The weekly workout split is not yet configurable as a reusable template.
- The current storage layer is `localStorage`, not IndexedDB.
- There is no authentication, encrypted sync, or cloud backend.
- The interface and data model are still evolving.

## Roadmap

- [ ] Configurable weekly training split and reusable exercise templates
- [ ] Correct weekly totals and monthly best-session aggregation
- [ ] Expanded nutrition and body-measurement analytics
- [ ] Academic completion velocity and exam countdown improvements
- [ ] IndexedDB persistence and schema migrations
- [ ] Automated tests and validation
- [ ] Optional encrypted synchronization between personal devices
- [ ] React + TypeScript application architecture

## Tech note

The current prototype is a single-page HTML/CSS/JavaScript application. The longer-term target stack is React, TypeScript, Tailwind CSS, Dexie/IndexedDB, and Recharts.

## License

No license has been added yet. All rights are reserved by the author unless a license is added in a future commit.
