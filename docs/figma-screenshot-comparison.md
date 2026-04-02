# Figma Screenshot Comparison

## Reference

- Figma Make file: `macOS Claude Desktop Prototype`
- Selected direction: `Glassmorphism`
- Current implementation screenshot:
  - `D:\AI\ClaudeDesktop\.playwright-cli\page-2026-04-01T16-36-24-545Z.png`

## Areas that are closer now

- Window shell, traffic lights, title treatment, and frosted top bar are aligned more closely with the Figma direction
- Sidebar material, search field, and blue primary action are much closer to the target desktop utility feel
- The lower floating composer now reads more like a glass tray than a generic footer input
- The duplicated in-flight assistant placeholder has been removed, so the chat area no longer renders the extra floating white box during streaming
- Stored assistant messages that were left in a stale `streaming` state are now normalized on startup, which makes the desktop app much more likely to reopen directly into a readable chat state

## Remaining gaps

- The browser-only preview still falls back to an empty-state composition because it cannot call Tauri session APIs, while the Figma reference is primarily a staged chat-state screen
- Sidebar conversation rows are still slightly heavier and more card-like than the flatter Figma list treatment
- The real desktop app now has better odds of opening into a populated conversation, but we still need one fresh desktop screenshot after restart to judge the final message rhythm against the reference
- The main content spacing is materially closer, but there is still room to tighten the message column and header density once the final desktop screenshot is captured

## Current conclusion

- Visual language is materially closer than before
- Screenshot-level fidelity is not complete yet because the final comparison still depends on one updated desktop screenshot, not the browser fallback preview
- The next correction should focus on re-opening the Tauri window, confirming the normalized chat state is visible, and then repeating the screenshot comparison
