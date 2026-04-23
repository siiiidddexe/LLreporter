# LLReporter — Chrome Extension

Manifest V3. No build step — load `extension/src` directly.

## Shortcuts

| OS       | Key          | Action |
| -------- | ------------ | ------ |
| macOS    | **⌘K**       | Open the reporter modal on the current page |
| Windows / Linux | **Ctrl+K** | Open the reporter modal on the current page |

Inside the modal:

* **⌘V / Ctrl+V** — paste a screenshot (copied from Finder, Snipping Tool, Shift-Cmd-Ctrl-4, etc.)
* **"Take screenshot"** button — capture the visible tab automatically.
* **Enter** — submit. **Esc** — close.
* **URL** — captured from the active tab automatically; editable if needed.
* **Description** — multi-line, scrollable, any length.

## Install

1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → pick `extension/src/`
3. Pin it. Click the icon once to set your dashboard URL (defaults to `https://webaudit.logiclaunch.in`) and sign in.

If you're already signed into `webaudit.logiclaunch.in` in the browser, the extension picks up your session automatically — no second login needed.

## How login is linked to the web app

The extension stores a bearer token in `chrome.storage.local` under the key `llr_token`. That token is the same JWT issued by `/api/auth/login` and is also stored as the `llr_session` cookie on the dashboard. Either surface can populate it:

* Log in from the **web app** → the extension reads the token on next click via the shared origin cookie bridge (`/api/auth/me`).
* Log in from the **extension popup** → the token is sent as a cookie back to the dashboard automatically (since the login request is made from the dashboard origin), so refreshing the dashboard lands you already signed in.

To sign out everywhere, hit **"Sign out everywhere"** in either place — it bumps your user's `tokenVersion` on the server, invalidating every device.
