# Bugger

Timestamp-synced session recorder for Chrome/Chromium/Edge. Record tab video, network traffic, and console logs together, then replay them in a standalone web app with a synchronized timeline.

## What it does

1. **Extension** — Click Record on any tab. Bugger captures:
   - Tab video (WebM)
   - Network requests/responses (via Chrome DevTools Protocol)
   - Console logs and exceptions (via CDP)

   All events share a single session clock (`t` = milliseconds from start).

2. **Replay app** — Open a exported `.bugger` file. Watch the recording while network and console panels update in sync with the video timeline. Click any event to seek to that moment.

## Project structure

```
bugger/
├── packages/
│   ├── shared/      # Session types + .bugger zip pack/unpack
│   ├── extension/   # Chrome MV3 extension
│   └── app/         # Replay web app
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Chrome, Chromium, or Edge

## Setup

```bash
pnpm install
pnpm build
```

## Load the extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `packages/extension/dist`

## Record a session

1. Navigate to the page you want to record
2. Click the Bugger extension icon
3. Click **Record Tab**
4. Reproduce the bug or flow
5. Click **Stop**
6. Click **Export .bugger** to download the session file

> Note: Recording attaches the Chrome debugger, which shows the "Chrome is being controlled by automated test software" banner. This is expected.

## Replay a session

```bash
pnpm dev:app
```

Open http://localhost:5173, then drag-and-drop or choose your `.bugger` file.

### Replay controls

- **Play / Pause** — drive the timeline
- **Playback speed** — 0.25× to 4× with step buttons or dropdown
- **Scrubber** — seek to any timestamp; click/error markers on the timeline
- **Network / Console tabs** — events visible up to the current time
- **Click an event** — seek video to that event's timestamp
- **Details** — inspect request/response headers and bodies on network events

## Development

| Command | Description |
|---------|-------------|
| `pnpm dev:extension` | Watch-build extension |
| `pnpm dev:app` | Run replay app dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | Type-check all packages |

## Session format

A `.bugger` file is a ZIP containing:

| File | Description |
|------|-------------|
| `manifest.json` | Session metadata, network events, console events |
| `video.webm` | Tab recording |

## Known limitations (v1)

- Chrome/Chromium/Edge only
- Debugger banner visible during recording
- Single tab per session
- Video replay (not live DOM re-render)
- Unpacked extension install only (not published to Chrome Web Store)

## License

Private — personal workspace project.
