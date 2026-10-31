# Karta — Design System & Branding Guide

---

## Brand

**Product name:** Karta
**Tagline:** *Visual thinking for developers*
**Personality:** Clean, confident, different. Not another purple AI tool.

---

## Logo

- A 32×32 rounded square in Primary Green `#16a34a`
- Icon inside: grid of 4 squares with a plus on bottom-right — hints at schema tables + flowchart nodes
- Wordmark: `Karta` in 22px / 600 weight, color `#166534`, letter-spacing `-0.5px`

---

## Color Palette

### Brand Green
| Token | Hex | Usage |
|---|---|---|
| Forest 900 | `#14532d` | Dark text on green backgrounds |
| Forest 800 | `#166534` | Wordmark, dark headings |
| Forest 700 | `#15803d` | Hover state on primary button |
| Primary | `#16a34a` | Table headers, primary buttons, active nav, links |
| Mint | `#4ade80` | Highlight, selection ring |
| Frost | `#bbf7d0` | Hover backgrounds, badges, secondary button border |
| Surface | `#f0fdf4` | Sidebar, panels, input backgrounds |
| Canvas | `#fafafa` | Diagram canvas background |

### Neutrals
| Token | Hex | Usage |
|---|---|---|
| Ink | `#09090b` | Headings, table names |
| Body | `#374151` | Body text, column names |
| Muted | `#6b7280` | Captions, data types, placeholders |
| Border | `#e5e7eb` | Default borders, dividers |
| BG | `#f9fafb` | Page background |

### Semantic
| Token | Hex | Usage |
|---|---|---|
| Warning BG | `#fef9c3` | Warning banners |
| Warning Text | `#854d0e` | Warning text |
| Danger BG | `#fee2e2` | Error states, delete confirm |
| Danger Text | `#991b1b` | Error text |
| Info BG | `#dbeafe` | Info banners |
| Info Text | `#1e40af` | Info text |

---

## Typography

Single font: system sans-serif stack (`Inter` preferred, fallback to `ui-sans-serif, system-ui`).

| Role | Size | Weight | Color |
|---|---|---|---|
| Display | 28px | 600 | `#09090b` |
| Heading | 20px | 600 | `#09090b` |
| Subheading | 15px | 500 | `#09090b` |
| Body | 14px | 400 | `#374151` |
| Caption | 12px | 400 | `#6b7280` |
| Label | 11px | 500 uppercase | `#6b7280` |

Letter spacing: `-0.5px` on Display and Heading. `0.08em` on Labels.
Line height: `1.6` on Body, `1.4` on Headings.

---

## Buttons

| Variant | Background | Text | Border | Hover BG |
|---|---|---|---|---|
| Primary | `#16a34a` | `#ffffff` | none | `#15803d` |
| Secondary | `#f0fdf4` | `#15803d` | `#bbf7d0` | `#bbf7d0` |
| Ghost | transparent | `#374151` | `#e5e7eb` | `#f9fafb` |
| Danger | `#fee2e2` | `#991b1b` | none | `#fecaca` |
| Disabled | `#f3f4f6` | `#9ca3af` | none | — |

Border radius: `8px` on all buttons.
Padding: `8px 18px` default · `6px 14px` small · `10px 22px` large.

---

## Canvas & Diagram Nodes

### Schema Table Node
```
┌─────────────────────────┐
│  users          ← #16a34a header, white text, 600 weight
├─────────────────────────┤
│  id        PK · uuid    ← PK in #16a34a, type in #6b7280
│  email     varchar      ← name in #09090b
│  created_at timestamptz
└─────────────────────────┘
```
- Header: `background #16a34a`, `color #fff`, `font-weight 600`, `font-size 12px`
- Body: `background #fff`, `border 1px solid #e5e7eb`, `border-radius 8px`
- Row divider: `1px solid #f0fdf4`
- Selected state: `box-shadow 0 0 0 2px #16a34a`

### Flowchart Node
- Default: `background #fff`, `border 1.5px solid #e5e7eb`, `border-radius 8px`
- Active/selected: `border-color #16a34a`, `box-shadow 0 0 0 2px #bbf7d0`
- Decision diamond: same colors, rotated square

### Edges / Relations
- Default stroke: `#9ca3af`, width `1.5px`
- Selected stroke: `#16a34a`, width `2px`
- Arrow head: open chevron, same color as stroke

### Canvas Background
- Color: `#fafafa`
- Dot grid: `#e5e7eb` dots, `24px` spacing

---

## Style Overrides (User Customization)

Users can override per object. System defaults fill any unset field.

```ts
interface StyleOverride {
  bg?          : string   // background color
  header_bg?   : string   // table header background
  border?      : string   // border color
  text?        : string   // text color
  stroke?      : string   // edge/relation stroke color
  stroke_width?: number   // edge stroke width
}
```

Stored in `layout` JSONB under `nodes.<id>.style` and `edges.<id>.style`.

---

## Spacing Scale

| Token | Value | Usage |
|---|---|---|
| xs | 4px | Icon gap, tight inline |
| sm | 8px | Button padding vertical, small gaps |
| md | 12px | Card padding, list item gap |
| lg | 16px | Section gap, panel padding |
| xl | 24px | Page section spacing |
| 2xl | 40px | Hero spacing |

---

## Border Radius

| Usage | Value |
|---|---|
| Buttons, inputs, badges | 8px |
| Cards, panels, modals | 12px |
| Avatar | 50% |
| Table node | 8px |
| Logo mark | 8px |

---

## Shadows

| Token | Value | Usage |
|---|---|---|
| Card | `0 1px 3px rgba(0,0,0,.06)` | Panels, dropdowns |
| Raised | `0 4px 16px rgba(0,0,0,.08)` | Modals, floating toolbars |
| Selected | `0 0 0 2px #16a34a` | Selected canvas objects |
| Focus | `0 0 0 3px #bbf7d0` | Input focus ring |

---

## Tailwind Config (Key Tokens)

```js
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        karta: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#4ade80',
          400: '#22c55e',
          500: '#16a34a',   // primary
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#052e16',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        card:     '0 1px 3px rgba(0,0,0,.06)',
        raised:   '0 4px 16px rgba(0,0,0,.08)',
        selected: '0 0 0 2px #16a34a',
        focus:    '0 0 0 3px #bbf7d0',
      },
      borderRadius: {
        DEFAULT: '8px',
        card:    '12px',
      }
    }
  }
}
```

---

## CSS Variables (Root)

```css
:root {
  /* Brand */
  --color-primary:       #16a34a;
  --color-primary-hover: #15803d;
  --color-primary-light: #f0fdf4;
  --color-primary-frost: #bbf7d0;
  --color-primary-dark:  #14532d;

  /* Neutrals */
  --color-ink:           #09090b;
  --color-body:          #374151;
  --color-muted:         #6b7280;
  --color-border:        #e5e7eb;
  --color-bg:            #f9fafb;
  --color-canvas:        #fafafa;
  --color-surface:       #f0fdf4;

  /* Semantic */
  --color-danger:        #991b1b;
  --color-danger-bg:     #fee2e2;
  --color-warning:       #854d0e;
  --color-warning-bg:    #fef9c3;
  --color-info:          #1e40af;
  --color-info-bg:       #dbeafe;

  /* Typography */
  --font-sans: 'Inter', ui-sans-serif, system-ui;

  /* Spacing */
  --sp-xs:  4px;
  --sp-sm:  8px;
  --sp-md:  12px;
  --sp-lg:  16px;
  --sp-xl:  24px;
  --sp-2xl: 40px;

  /* Radius */
  --radius:      8px;
  --radius-card: 12px;

  /* Shadow */
  --shadow-card:     0 1px 3px rgba(0,0,0,.06);
  --shadow-raised:   0 4px 16px rgba(0,0,0,.08);
  --shadow-selected: 0 0 0 2px #16a34a;
  --shadow-focus:    0 0 0 3px #bbf7d0;
}
```
