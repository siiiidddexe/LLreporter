// Background service worker for LLReporter.
// Handles the ⌘K/Ctrl+K command, screenshot capture, and API calls.

const DEFAULT_BASE = "https://webaudit.logiclaunch.in";

async function getConfig() {
  const { llr_base, llr_token, llr_project_id } = await chrome.storage.local.get([
    "llr_base",
    "llr_token",
    "llr_project_id",
  ]);
  return {
    base: llr_base || DEFAULT_BASE,
    token: llr_token || null,
    projectId: llr_project_id || null,
  };
}

async function setConfig(patch) {
  await chrome.storage.local.set(patch);
}

async function api(path, { method = "GET", body, token, base } = {}) {
  const cfg = await getConfig();
  const res = await fetch(`${base || cfg.base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token || cfg.token ? { Authorization: `Bearer ${token || cfg.token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// Open the modal on the active tab when the shortcut fires.
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "open-reporter") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "LLR_OPEN" });
  } catch {
    // content script may not be injected on chrome:// pages — fallback
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    await chrome.tabs.sendMessage(tab.id, { type: "LLR_OPEN" });
  }
});

// Message router for the content script / popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === "LLR_GET_CONFIG") {
        sendResponse(await getConfig());
      } else if (msg.type === "LLR_SET_CONFIG") {
        await setConfig(msg.patch);
        sendResponse({ ok: true });
      } else if (msg.type === "LLR_LOGIN") {
        const { email, password, base } = msg;
        const { ok, data, status } = await api("/api/auth/login", {
          method: "POST",
          body: { email, password },
          base,
        });
        if (ok) await setConfig({ llr_token: data.token, llr_base: base || DEFAULT_BASE });
        sendResponse({ ok, status, data });
      } else if (msg.type === "LLR_ME") {
        sendResponse(await api("/api/auth/me"));
      } else if (msg.type === "LLR_PROJECTS") {
        sendResponse(await api("/api/projects"));
      } else if (msg.type === "LLR_CAPTURE") {
        const dataUrl = await chrome.tabs.captureVisibleTab(undefined, { format: "png" });
        sendResponse({ ok: true, dataUrl });
      } else if (msg.type === "LLR_SUBMIT") {
        sendResponse(await api("/api/bugs", { method: "POST", body: msg.payload }));
      } else if (msg.type === "LLR_LOGOUT") {
        await api("/api/auth/logout", { method: "POST" });
        await setConfig({ llr_token: null });
        sendResponse({ ok: true });
      } else if (msg.type === "LLR_FORCE_LOGOUT") {
        await api("/api/auth/force-signout", { method: "POST" });
        await setConfig({ llr_token: null });
        sendResponse({ ok: true });
      }
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
  })();
  return true; // async
});
