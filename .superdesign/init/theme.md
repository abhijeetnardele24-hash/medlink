# Theme

## Compact Token Summary

Coordinator web uses vanilla CSS with CSS variables in `apps/coordinator-web/src/index.css`.

- Font: `Outfit`, sans-serif
- Background: `#0f172a`
- Surface: `#1e293b`
- Elevated surface: `#334155`
- Primary: `#8b5cf6`
- Primary hover: `#7c3aed`
- Secondary: `#3b82f6`
- Text main: `#f8fafc`
- Text muted: `#94a3b8`
- Border: `rgba(255, 255, 255, 0.1)`
- Focus border: `rgba(139, 92, 246, 0.5)`
- Radius: `8px` controls, `16px` existing panels

For the coordinator dashboard, keep an operational healthcare UI: dense, scan-friendly, clear status colors, restrained panels, no marketing hero.

## Raw Source

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

:root {
  --bg-base: #0f172a;
  --bg-surface: #1e293b;
  --bg-surface-elevated: #334155;
  --primary: #8b5cf6;
  --primary-hover: #7c3aed;
  --secondary: #3b82f6;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --border: rgba(255, 255, 255, 0.1);
  --border-focus: rgba(139, 92, 246, 0.5);
}
```
