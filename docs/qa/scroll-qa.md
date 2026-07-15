# Scroll QA

Run this checklist for sticky, scroll-triggered, parallax, smooth-scroll, canvas, or header behavior.

## Paths

1. Scroll slowly and rapidly from top to bottom, then back to top. Repeat after resizing.
2. Stop before, at, within, and after every sticky or trigger boundary. Confirm no jump, blank gap, overlap, or stale pinned state.
3. Refresh at top, several intermediate positions, and near the bottom. Test restored browser scroll position and direct anchor navigation.
4. Navigate away/back and use browser history. Confirm listeners, triggers, RAF loops, and document classes clean up.
5. Repeat with mouse wheel, trackpad, Page Up/Down, Space/Shift+Space, Home/End, arrow keys, and touch. Essential interaction must not require pointer movement.
6. Repeat with `prefers-reduced-motion: reduce`; meaningful content should appear in a stable static state.

## Evidence

- Capture sequential screenshots at representative progress points in both directions, including trigger boundaries.
- Use Playwright trace or short video when timing or input sequence matters.
- Measure `scrollY`, document `scrollHeight`, sticky bounding boxes, trigger/container rectangles, `overflow-*`, `position`, `transform`, and opacity from DOM/computed styles.
- For canvas or 3D, check nonblank pixels, correct dimensions/DPR, framing, and pause/cleanup behavior.
- Check console errors, long tasks, visible frame drops, cumulative layout shift, and header/anchor offsets.

Document the exact input device/emulation, viewport, reduced-motion setting, intermediate position, and reproduction steps. A final-frame screenshot alone is not sufficient evidence for a scroll interaction.
