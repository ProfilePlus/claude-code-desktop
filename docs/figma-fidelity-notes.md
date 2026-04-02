# Figma Fidelity Notes

## Target

- Figma Make file: `macOS Claude Desktop Prototype`
- Selected direction: `Glassmorphism`
- Goal for this iteration: reduce layout and state drift until the running app reads like the selected Figma concept rather than a generic glass-themed dashboard

## Key Corrections Applied

- Split window styling between floating-window state and maximized-window state so the shell does not break when the app fills the viewport
- Reduced the visual weight of the empty state and moved it upward to match the Figma composition more closely
- Lifted the composer tray so it behaves like a floating lower dock instead of sinking to the page edge
- Restyled the sidebar from heavy cards toward a lighter list treatment with a more Figma-like primary action button
- Shifted message presentation toward the target conversation layout: assistant on light glass surfaces, user on blue rounded pills
- Added local persistence for message history and the active session so the app can stay in a chat state across reloads instead of constantly falling back to an empty state

## Remaining Gaps

- The current app still depends on real local session data, so it may show empty-state screens when no conversation history exists
- The Figma concept uses curated sample content and a perfectly staged conversation state; our implementation must still honor actual runtime data
- Final screenshot comparison is still needed to judge remaining spacing and density drift in the header, sidebar, and message column
