# GlassMacOS UI Implementation Notes

## Selected Direction

- Figma Make concept selected by user: `GlassMacOS` (`Glassmorphism`)
- Goal: push the app away from a generic web dashboard and closer to a translucent macOS desktop utility

## Implemented Translation

- Reworked the window shell into a stronger desktop frame with traffic lights, a centered title stack, and a detached toolbar feel
- Added layered aurora highlights around the app frame so the shell reads as floating glass instead of a flat panel
- Shifted core surfaces to semi-transparent materials with higher blur, softer inner highlights, and cooler blue-violet accents
- Tightened sidebar, header, message, composer, and settings panel styling so all major regions share one material system
- Updated small copy points to align the selected direction with the visible UI language

## Design Mapping

- `window-chrome`: maps the concept's floating macOS title bar and toolbar blend
- `desktop-sidebar`: maps the translucent left rail with soft separation from the content pane
- `chat-header`: maps the thin glass toolbar inside the content area
- `message-bubble-*`: maps layered conversation cards with assistant/user separation but restrained contrast
- `chat-compose-panel`: maps the rounded frosted input tray
- `settings-surface`: maps the modal glass sheet used for preference editing

## Intentional Deviations

- The implementation preserves the existing React + Tauri component structure rather than rebuilding the app from generated Figma Make code
- The palette stays slightly more contrast-safe than the raw concept direction to protect readability in long chat sessions
- Existing functional patterns such as session export, file upload, settings persistence, and keyboard shortcuts were kept intact

## Remaining Opportunities

- Introduce a more explicit segmented-control treatment for the header pills if we want an even closer desktop-app feel
- Revisit chunk splitting later; current bundle size warning is unrelated to the GlassMacOS restyle
- A future pass could tune motion curves and stagger timings to better match macOS window polish
