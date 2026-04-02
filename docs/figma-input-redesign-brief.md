# Figma Input-First Mac UI Redesign Brief

## Goal

Redesign the current `GlassMacOS` direction into a cleaner macOS desktop chat workspace where the input area becomes a natural part of the composition instead of a heavy floating tray.

The new design should still feel like a real mac desktop app, but it should be more refined, more native, and less like a web page with a panel dropped at the bottom.

## Design Direction

- Stay within the current `GlassMacOS` family instead of changing to a different visual theme
- Keep the same product type: a Claude-style desktop chat workspace
- Prioritize an input-first composition: the message composer should feel intentional, elegant, and fully integrated with the chat layout
- Make it look like a premium mac productivity app, not a SaaS dashboard

## Problems To Fix In The Current Version

- The bottom composer feels too detached from the page
- The composer shell is too large, too low, and too heavy
- The internal white input field does not feel proportionate to the rest of the window
- The model bar and utility row under the input feel visually separate instead of integrated
- The chat area still feels sparse and slightly awkward in relation to the composer

## Layout Requirements

- Desktop app only, not mobile-first
- Keep these primary zones:
  - left conversation sidebar
  - top title / window chrome
  - chat transcript area
  - bottom composer
- The composer must be redesigned as a more elegant mac input surface
- The transcript and composer should feel compositionally linked, not far apart
- Avoid excessive empty space between last message and composer

## Composer Requirements

- Redesign the input area as a lighter, more native-feeling glass control group
- The outer shell should be subtle and restrained
- The actual text-entry area should feel like the primary focus surface
- The plus action, send action, and model selector should look like parts of the same product system
- The whole composer should feel believable for a shipped mac app
- It should support multiline input visually, but still look compact when empty

## Visual Language

- Real macOS traffic lights and native-feeling top chrome
- Soft translucent materials, but more controlled than the current version
- Cleaner proportions and more disciplined spacing
- Thin borders, soft inner highlights, restrained shadows
- Calm blue-lilac atmosphere, no bright marketing gradient look
- Refined typography hierarchy
- More polished desktop utility feel

## States To Show

Please generate screens for at least these states:

1. Populated chat state with several messages visible
2. Empty or near-empty state
3. Focused input state

## Constraints

- Use Chinese UI copy
- Keep the product believable as a real Tauri + React desktop client
- Do not turn it into a landing page or marketing site
- Do not overdo glassmorphism
- Do not make the composer oversized

## Output Request

- Generate 3 clearly different redesign options within the same GlassMacOS family
- Each option should focus on a different composer strategy
- For each option, make the differences in input placement, shell weight, and integration with chat visibly obvious
- The output should be high-fidelity enough to implement directly
