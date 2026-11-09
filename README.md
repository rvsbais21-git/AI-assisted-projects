# PURGATORY

A manga-inspired, local-first personal development dashboard for tracking health, academics, DSA practice, and long-term trends.

> Current status: early prototype (v0.2). Built as a learning project with AI assistance.

## Features

- Dark manga-inspired interface with crimson accents
- Health logging: workouts, exercises, repetitions, hydration, protein, sleep, body measurements, screen time, and daily habits
- Academic tracker with subjects, exam dates, modules, subtopics, completion checklists, and daily tasks
- DSA problem-solving and contest ledger
- Basic trend summaries for training, sleep, weight, and academic progress
- JSON export/import for manual backups
- Responsive layout for desktop and mobile screens

The app starts with an empty academic tracker. Add your subjects, modules, and subtopics in the Academics section.

## Run locally

This is a standalone HTML/CSS/JavaScript prototype. No build step is required.

1. Clone or download this repository.
2. Open a terminal in the project folder.
3. Start a local server:

   ```bash
   python -m http.server 8000
   ```

4. Open <http://localhost:8000>.

You can also open `index.html` directly in a browser, although using a local server is preferable.

## Data storage and privacy

Records are stored in the browser's `localStorage` for the current browser profile and device.

- Data is not synchronized across devices.
- Data is not encrypted in this prototype.
- Clearing browser storage can delete records.
- Use the built-in JSON export feature to create backups.
- Do not enter sensitive personal information on a shared or public device.

## Current limitations

- This is an early prototype, not a production-ready personal data system.
- The weekly training split is not yet configurable as a reusable template.
- Analytics are basic summaries; advanced weekly/monthly aggregation and progression analysis remain future work.
- The current storage layer is `localStorage`, not IndexedDB.
- There is no authentication, encrypted sync, or cloud backend.
- Automated tests and schema migrations are not yet implemented.

## Roadmap

- [ ] Configurable weekly training split and reusable exercise templates
- [ ] More complete weekly and monthly analytics
- [ ] Expanded nutrition and body-measurement tracking
- [ ] Academic completion velocity and exam countdown improvements
- [ ] IndexedDB persistence and schema migrations
- [ ] Automated tests and validation
- [ ] Optional encrypted synchronization between personal devices
- [ ] React + TypeScript application architecture

## Tech note

The current prototype is a single-page HTML/CSS/JavaScript application. The longer-term target stack is React, TypeScript, Tailwind CSS, Dexie/IndexedDB, and Recharts.

## License

No license has been added yet. All rights reserved by the author unless a license is added in a future commit.
