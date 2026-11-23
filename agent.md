# Agent Design Spec

## Overview

Design Daniel Lozada’s Adazol portfolio as a mobile-first web app with the calm, tactical feel of a premium fintech interface. Use compact groupings, soft surface depth, and precise typography to make the site feel slightly futuristic. Put Daniel’s work and the evidence behind it at the center of the experience.

## Visual style

- Use a lifted charcoal canvas with a faint green undertone. Keep the page, cards, and controls close in tone. Use stronger contrast for text, focus, and control states.
- Give raised cards a soft outer shadow and a faint inner highlight from the same light direction. Use inset shading for input wells, segmented-control tracks, and pressed states. Reserve thin outlines for focus and boundaries that need extra definition.
- Use a shared radius scale. Start around 24–32 px for cards and 16–20 px for inset fields. Use fully rounded ends on short controls and the mobile navigation. Let long cards keep straight inner content edges so headings and data line up.
- Group labels and values tightly, then leave clearer space between sections. Keep artwork and the interactive portrait inside their own frames so the surrounding UI stays quiet.

## Color system

Use the existing neutral, forest-green, and accent tokens in [`src/app/globals.css`](src/app/globals.css). Define their portfolio roles under `.portfolio-site` in [`src/app/portfolio.css`](src/app/portfolio.css) and reuse those roles in component styles.

| Role | Direction |
| --- | --- |
| Page canvas | Start with `--color-neutral-900` for a soft charcoal base. |
| Raised cards and controls | Mix `--color-neutral-900` toward `--color-neutral-800` just enough to lift cards. Use the same mix for the selected segment. |
| Inset wells and tracks | Mix the canvas toward `--color-neutral-950` for a subtle finger-press effect. |
| Primary and secondary text | Use `--portfolio-paper` as the light foreground and `--color-neutral-300` for supporting text. Check contrast against each surface. |
| Success accent | Lighten the existing green `--accent` with a small amount of `--color-forest-green-50` to get a vivid pale green. Reserve it for successful states, verified positive metrics, and fills on real progress bars. Pair it with a readable label or value. |
| Charts | Use tonal steps for activity intensity, with dates and counts available in text. If category colors are needed, confine them to small legend swatches and identify each category by name. |

## Typography

Keep the existing font roles from `src/app/portfolio.css`. Use locally hosted Tektur through `--portfolio-sans` for body copy, navigation, controls, and data. Use Georgia through `--portfolio-display` for the hero name, page titles, and editorial headings. Keep body copy at roughly 16 px with generous line height. Use tabular figures where supported for column or chart comparisons, and reserve tracked uppercase for short labels.

## Layout and interaction

- **Home.** Lead with Daniel’s name, current work, and a clear path to selected projects. Give the existing interactive portrait and Dan AI adjacent space on wider screens so visitors can move from introduction to question naturally. Stack them on mobile with the work link available in the introduction. Keep the portrait’s static fallback and Dan AI’s suggested questions, source links, and public index fallback.
- **Selected work.** Give the lead case study more room for its image, role, and one concrete outcome. Follow with a compact list of supporting projects. Show the problem, Daniel’s contribution, and the outcome on each detail page. Use a short factual summary when the source material has no measured outcome. Let each project open from a clearly labeled link.
- **Activity.** Make the GitHub contribution calendar the data-focused view. If visitors can switch periods, use an inset segmented control and update the date range, totals, and chart together. Make dates and counts available by touch and keyboard, with a readable summary and visible timestamp for saved snapshots.
- **Navigation.** Put Work, Activity, About, Notes, and Resume in a rounded bottom tab bar on compact screens, with text labels and a visible current-page state. Keep contact accessible from the header. Account for the device safe area and give content enough bottom padding to scroll clear of the bar. On wider screens, put the same destinations in the header and pair a flexible grid with a narrow reading column on detail pages.

## Interaction and acceptance

- Provide clear default, hover, focus, pressed, and selected states with neutral tonal changes, text, or icon cues. Give primary touch controls at least 44 × 44 px of usable area and keep focus visible around inset components.
- Keep motion brief and tied to a user action, such as a segment selection or card press. Respect reduced-motion preferences and make the portrait, charts, and navigation useful with static presentation.
- Check the home, work detail, and activity views at 320 px, 390 px, 768 px, and 1440 px. Verify text wrapping, touch targets, keyboard order and focus, navigation clearance, and chart readability. Exercise the portrait fallback, Dan AI’s loading and fallback states, and contact form feedback.


## Tone

- Premium
- Quiet
- Technical
- Trustworthy
- Minimal
- Tactile
- Mobile-native

## Avoid

- Bright gradients
- Glassmorphism
- Overly colorful cards
- Hard borders
- White backgrounds
- Large illustrations
- Marketing-style hero copy
- Excessive chart clutter
- Generic SaaS dashboard spacing