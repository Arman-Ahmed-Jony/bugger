# Changelog

## 1.0.0 — 2026-09-02

First stable release of Bugger.

### Extension
- Record tab video, network traffic, console logs, and click events with a shared session clock
- Export sessions as `.bugger` ZIP files

### Replay app
- Synced video playback with network and console panels
- Timeline scrubber with click and network-error markers
- Click ripple overlay during playback
- Playback speed control (0.25×–4×)
- Network panel with filtering, sorting, and request/response detail drawer
- Resizable side panel layout

### Session format
- `.bugger` ZIP containing `manifest.json` + `video.webm`
