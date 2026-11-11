<!-- PURGATORY — repository landing page -->

<div align="center">

# PURGATORY

### YOUR LIFE. YOUR SYSTEM. YOUR RECORD.

A manga-inspired personal dashboard for bringing training, academics, problem-solving, and personal data into one place.

[**Open the live dashboard ↗**](https://rvsbais21-git.github.io/AI-assisted-projects/)

<br/>

![Status](https://img.shields.io/badge/status-active%20prototype-c52e48?style=flat-square)
![Built with](https://img.shields.io/badge/built%20with-HTML%20%2F%20CSS%20%2F%20JavaScript-171717?style=flat-square)
![Storage](https://img.shields.io/badge/storage-browser%20localStorage-171717?style=flat-square)
![Hosting](https://img.shields.io/badge/hosted%20on-GitHub%20Pages-171717?style=flat-square)

</div>

---

## Overview

PURGATORY is a personal tracking workspace built around a simple idea: **make progress visible, keep records under your control, and reduce the friction between intention and action.**

It brings several parts of a personal routine into one interface. The visual direction takes cues from manga panels, using a restrained black, white, and crimson palette.

> This repository currently contains a working, single-page prototype. It is a personal learning project—not a production-ready health, academic, or data-management platform.

## The workspace

| Area | What it does |
| --- | --- |
| **Overview** | A central dashboard for the main sections of the workspace. |
| **Health** | Record training sessions, exercises, habits, and health-related daily metrics. |
| **Academics** | Organise subjects, modules, subtopics, exam schedules, and tasks. |
| **DSA** | Maintain a problem-solving and contest practice ledger. |
| **Analytics** | Review available progress summaries and trends. |
| **Data** | Manage the browser-held records and use JSON export/import for manual backups. |

## Interface direction

The interface is intentionally built around:

- A dark, high-contrast canvas with crimson accents.
- Manga-inspired artwork across the main section headers.
- Condensed display typography paired with readable body text and monospaced labels.
- Rectangular panels and a consistent dashboard grid.
- Responsive layouts for desktop and smaller screens.

Artwork is stored in `assets/` and referenced by the application.

## Run it locally

There is no build step or dependency installation required.

```bash
git clone https://github.com/rvsbais21-git/AI-assisted-projects.git
cd AI-assisted-projects
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

You can also open `index.html` directly, but a local server is the more reliable option.

## Project structure

```text
AI-assisted-projects/
├── assets/       # Manga artwork and interface backgrounds
├── index.html    # Application markup, styles, and client-side logic
├── README.md     # Project overview and setup guide
└── .gitignore    # Editor files, build output, and local data exclusions
```

The current application is intentionally lightweight: HTML, CSS, and vanilla JavaScript in a single page. The repository does not currently use a package manager, framework, bundler, or backend.

## Data, storage, and privacy

PURGATORY currently stores records in the browser's `localStorage`.

- Records belong to the browser profile and device where they were entered.
- There is no account system, cloud database, or cross-device synchronisation.
- Data is not encrypted by the application.
- Clearing browser storage may permanently remove locally stored records.
- Use the JSON export function to keep your own backups.
- Avoid entering sensitive information, especially on shared devices.

**Local-first does not mean automatically backed up.** Keep an independent copy of your exported data.

## Current scope

The live prototype is functional, but it is not feature-complete. In particular:

- Analytics are limited to the summaries currently implemented in the interface.
- There is no automated test suite or data-schema migration system.
- There is no authentication, encrypted sync, or remote persistence.
- The current persistence layer is `localStorage`; IndexedDB is not implemented.
- The interface and data model may change as the project evolves.

## Development direction

The next meaningful improvements are:

- [ ] Strengthen input validation and failure feedback.
- [ ] Add automated tests for critical data and navigation flows.
- [ ] Improve analytics and time-based summaries.
- [ ] Introduce a versioned data model and safe migrations.
- [ ] Evaluate IndexedDB for larger local datasets.
- [ ] Consider optional, privacy-conscious synchronisation only after the local data layer is reliable.

These are plans, not claims about existing functionality.

## Contributing

This is currently a personal project. If you spot a reproducible issue, open a GitHub issue with:

1. The section where it occurred.
2. The steps needed to reproduce it.
3. What you expected to happen.
4. What happened instead.

Please do not include personal records or private exported data in an issue.

## License

No open-source license has been added. Unless a license is introduced, the source remains subject to the author's default copyright; reuse and redistribution are not granted by this README.

---

<div align="center">

**PURGATORY** · Built to make consistency observable.

<sub>Designed and developed as an ongoing personal project.</sub>

</div>
