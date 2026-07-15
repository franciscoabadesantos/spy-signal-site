# Viewport Matrix

These are representative QA sizes, not new CSS breakpoints. Test the exact target plus intermediate widths where layout modes change.

| Class | Viewport | Primary checks |
| --- | --- | --- |
| Small mobile | 320 x 568 | Long words, controls, fixed chrome, horizontal overflow |
| Modern mobile | 390 x 844 | Touch, mobile menu, sticky elements, virtual-keyboard-sensitive inputs |
| Tablet portrait | 768 x 1024 | Grid collapse, navigation, chart/canvas framing |
| Laptop | 1366 x 768 | Short-height behavior, sticky/scroll narratives, content density |
| Desktop | 1440 x 900 | Main composition, alignment, readable line lengths |
| Wide desktop | 1920 x 1080 | Max-width behavior, excessive empty space, full-bleed framing |

Also spot-check 480, 820, and 1024 px widths because current CSS and homepage behavior change around them. For a visual change, capture at least one mobile, laptop, and wide result; add all six when navigation, sticky behavior, canvas, charts, or page-level layout changes.

Use device scale factor 1 for layout measurements unless testing high-density canvas explicitly. Repeat critical touch flows with a real mobile emulation profile and repeat desktop flows at 200% zoom where practical.
