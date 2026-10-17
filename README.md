# CapCutWannabe

A private, local-first desktop video editor for Windows. CapCutWannabe is designed for fast everyday editing without accounts, subscriptions, watermarks, or uploading your footage to a third party.

## Download

Download the latest Windows installer from [GitHub Releases](https://github.com/AbhayShah06/CapCutWannabe/releases/latest).

Windows may show a SmartScreen warning because the installer is not code-signed yet. The app runs a private editor server bound to `127.0.0.1` and opens it in its own desktop window. Your projects stay on your computer.

## Included in v0.2

- Video, image, and audio import with drag and drop
- Multi-track timeline with trim, split, reorder, snapping, zoom, undo, and redo
- Text, stickers, effects, captions, masks, keyframes, and animation curves
- Seven editable starter templates for landscape, vertical, square, social hooks, product promos, tutorials, and podcast clips
- One-click entrance and exit motion presets, including fades, slides, zooms, and pop-ins
- Editable color looks for clean, vivid, cinematic, soft, monochrome, and muted footage
- Quick Review, Social, and Master export presets
- Portable `.ccwproject` files that include the timeline and source media for moving projects between computers
- Built-in editing guides for pacing, captions, motion, performance, sharing, and keyboard shortcuts
- Preview canvas and export controls
- Persistent local projects that survive app updates and uninstall/reinstall unless app data is manually removed
- Fully dark desktop interface with practical first-run guidance
- No remote font or analytics dependency in the desktop app

## Current limitations

- Windows x64 only
- The installer is unsigned
- Motion presets animate individual clips; true overlapping cross-clip transitions are still being built
- Portable projects are optimized for typical edits and currently load the bundle in memory, so extremely large projects should be exported as video instead
- Optional online sound libraries are disabled in the offline desktop build
- Large and complex exports still need broader hardware testing

## Development

Requirements: Bun and a current Windows development environment.

```powershell
bun install
bun run build:desktop-web
bun run dist:win
```

The installer is written to `release-final/`.

## Open-source foundation

CapCutWannabe is based on OpenCut Classic and remains licensed under the MIT License. OpenCut's original copyright and license are preserved in [LICENSE](LICENSE). This project is not affiliated with CapCut or ByteDance.
