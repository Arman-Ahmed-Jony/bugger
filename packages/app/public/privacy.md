# Privacy Policy for Bugger

**Last updated:** September 11, 2026

This Privacy Policy describes how the Bugger Chrome extension and the Bugger web player (“Bugger,” “we,” “us”) handle information when you use the software.

Bugger is a session recorder for bug reproduction. It captures tab video, network traffic, console logs, and click events on a shared timeline, and lets you export and replay that session locally.

## Summary

- Bugger does **not** require an account.
- Bugger does **not** upload your recordings or browsing data to our servers.
- Session data stays on **your device** unless **you** export a file and share it yourself.
- We do **not** sell personal data or use it for advertising.

## What Bugger collects

### Extension (Chrome)

When **you** start a recording on a tab you choose, Bugger may capture:

| Data | Purpose |
|------|---------|
| Tab video (WebM) | Visual replay of the session |
| Network requests and responses (including headers and bodies when available) | Debug API and loading issues |
| Console logs and exceptions | Debug client-side errors |
| Click events and timestamps | Correlate user actions with other signals |
| Recording metadata (duration, viewport size, counts) | Show status in the popup and build the export |

Recording uses Chrome APIs (`debugger`, `tabCapture`, and related permissions) **only while a recording is active** on the tab you selected. Bugger does not monitor your browsing when idle.

Session data is held in memory during and after a recording until you export or clear it. The current build does not persist sessions to `chrome.storage` or remote databases.

### Web player (hosted site)

The replay app runs in your browser. When you open a `.bugger` file, it is read **locally** in the browser. Files are not uploaded to Bugger servers as part of normal playback.

### Website analytics

The Bugger marketing/replay site may be served via GitHub Pages. We do not embed third-party analytics SDKs in the Bugger app for tracking users. Your browser and GitHub (as host) may process standard web server logs (such as IP address and user agent) according to their own policies.

## How data is used

Captured session data is used solely to:

1. Show recording status in the extension popup
2. Package a `.bugger` export file at your request
3. Replay that file in the local web player

We do not use session content for advertising, profiling, or resale.

## Data sharing

We do not transmit recorded session content to third parties.

If you export a `.bugger` file and send it to someone else (for example, a teammate or bug tracker), that sharing is under your control. Recipients will be able to see whatever was captured in that recording, which may include personal or sensitive information from the recorded page (URLs, cookies in headers, form bodies, on-screen content, etc.).

## Data retention

- **On your device:** Until you clear the session in the extension, close the browser in a way that discards in-memory state, or delete exported files you saved.
- **On our servers:** Bugger does not store your recordings on our servers.

## Permissions (Chrome)

Bugger requests permissions only to fulfill recording and export:

- **debugger** — capture network and console events via the DevTools Protocol during recording
- **tabCapture** — record the tab’s video
- **activeTab** — identify the tab you choose to record from the popup
- **offscreen** — encode tab video under Manifest V3 constraints
- **downloads** — save the `.bugger` file when you click Export
- **Host access** — allow recording on the sites you choose (any tab you explicitly record)

These capabilities are not used to modify unrelated sites or to collect data in the background when you are not recording.

## Children’s privacy

Bugger is not directed at children under 13. We do not knowingly collect personal information from children.

## Your choices

- Do not start a recording if you do not want a tab’s content captured.
- Avoid recording pages that display secrets you do not want in an export (passwords, tokens, personal dashboards).
- Clear or discard a session instead of exporting if you no longer need it.
- Delete any `.bugger` files you no longer want retained.

## Changes to this policy

We may update this Privacy Policy from time to time. The “Last updated” date at the top will change when we do. Continued use of Bugger after an update means you accept the revised policy.

## Contact

Questions about this Privacy Policy or Bugger’s data practices:

- GitHub issues: [https://github.com/Arman-Ahmed-Jony/bugger/issues](https://github.com/Arman-Ahmed-Jony/bugger/issues)
- Repository: [https://github.com/Arman-Ahmed-Jony/bugger](https://github.com/Arman-Ahmed-Jony/bugger)

## Chrome Web Store disclosure

For Chrome Web Store listing purposes: Bugger handles user data only as described above—locally, for the purpose of session recording and replay that you initiate. It does not sell or transfer user data to third parties for purposes unrelated to the extension’s single purpose, does not use or transfer user data for creditworthiness or lending purposes, and does not use remote code other than what is packaged with the extension and the publicly documented APIs of the browser.
