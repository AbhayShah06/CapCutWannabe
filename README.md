# CapCutWannabe

A private, local-first desktop video editor for Windows. CapCutWannabe is designed for fast everyday editing without accounts, subscriptions, watermarks, or uploading your footage to a third party.

## Download

Download the latest Windows installer from [GitHub Releases](https://github.com/AbhayShah06/CapCutWannabe/releases/latest).

Windows may show a SmartScreen warning because the installer is not code-signed yet. The app runs a private editor server bound to `127.0.0.1` and opens it in its own desktop window. Your projects stay on your computer.

## Included in v0.1

- Video, image, and audio import with drag and drop
- Multi-track timeline with trim, split, reorder, snapping, zoom, undo, and redo
- Text, stickers, transitions, effects, captions, and visual adjustments
- Landscape, vertical, and square quick-start projects
- Preview canvas and export controls
- Persistent local projects that survive app updates and uninstall/reinstall unless app data is manually removed
- Fully dark desktop interface with practical first-run guidance

## Current limitations

- Windows x64 only
- The installer is unsigned
- This first release provides project presets, not a full downloadable motion-template marketplace
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
