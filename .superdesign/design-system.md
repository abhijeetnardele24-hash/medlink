# MedLink Design System

MedLink is an offline-first telemedicine platform for rural and low-connectivity workflows. Product screens should feel clinical, operational, and trustworthy. Prioritize dense information, quick scanning, and clear status hierarchy over landing-page styling.

## Visual Direction

- Use dark clinical surfaces with high-contrast text and restrained colored accents.
- Use green for healthy/verified states, amber for waiting/manual attention, red for urgent failures, and blue/cyan for network or consultation mode.
- Avoid marketing hero layouts in dashboards.
- Cards should be used for repeated records and workflow panels, not nested decorative containers.
- Keep radii modest: 6px to 10px for operational UI.

## Typography

- Font family: `Outfit`, sans-serif.
- Dashboard headings should be compact, not oversized.
- Labels and metadata should be clear and scan-friendly.

## Components

- Top bar with product identity, environment, and operator identity.
- Left navigation for queue sections.
- Status cards for operational metrics.
- Tables/lists for patient requests and doctor matching.
- Call reminder controls should use icons and direct action labels.

## Interaction Principles

- Coordinator workflows need visible statuses: pending verification, matched, waiting doctor confirmation, ready for call, network degraded.
- Appointment rows should expose the next best action.
- Network mode should be visible at the appointment level: video, audio, async message, offline follow-up.
