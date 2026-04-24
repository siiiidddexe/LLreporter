/* LLReporter content script.
   Renders a fully Shadow-DOM-isolated bug-report modal so host page CSS
   can never leak in. Triggered by chrome.runtime LLR_OPEN. */
(() => {
  if (window.__LLR_INJECTED__) return;
  window.__LLR_INJECTED__ = true;

  const HOST_ID = "__llr_host__";

  // -------------------------------------------------------------------
  // Inlined styles — live inside the shadow root so host CSS can't reach them.
  // -------------------------------------------------------------------
  const STYLES = `
    :host { all: initial; }
    *, *::before, *::after { box-sizing: border-box; }

    .backdrop {
      position: fixed; inset: 0; z-index: 2147483647;
      background: rgba(0,0,0,.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      color: #f5f7fa;
      animation: fade .15s ease-out;
    }
    @keyframes fade { from { opacity: 0 } to { opacity: 1 } }

    .card {
      width: min(520px, 92vw);
      max-height: 86vh;
      background: #0d1016;
      border: 1px solid #1a1f2b;
      border-radius: 14px;
      box-shadow: 0 20px 60px -20px rgba(47,125,255,.35),
                  0 0 0 1px rgba(47,125,255,.2);
      display: flex; flex-direction: column;
      overflow: hidden;
      transform: translateY(6px) scale(.98); opacity: 0;
      animation: pop .22s cubic-bezier(.2,.9,.3,1.2) forwards;
    }
    .card.success {
      box-shadow: 0 0 0 2px #22c55e, 0 0 50px rgba(34,197,94,.4);
    }
    @keyframes pop { to { transform: none; opacity: 1 } }

    .head { padding: 18px 20px 12px; border-bottom: 1px solid #1a1f2b; }
    .kicker { font-size: 10px; letter-spacing: .25em; text-transform: uppercase; color: #2f7dff; font-weight: 500; }
    .title { font-size: 17px; font-weight: 600; margin-top: 4px; line-height: 1.3; }
    .sub   { font-size: 12px; color: rgba(255,255,255,.5); margin-top: 4px; }

    .body  { padding: 16px 20px; overflow: auto; display: flex; flex-direction: column; gap: 12px; }

    label.lbl { display: block; font-size: 10px; font-weight: 500;
      letter-spacing: .04em; text-transform: uppercase;
      color: rgba(255,255,255,.55); margin-bottom: 4px; }

    .input, .textarea, select.input {
      display: block; width: 100%; appearance: none;
      background: rgba(13,16,22,.6); color: #f5f7fa;
      border: 1px solid #1a1f2b; border-radius: 8px;
      padding: 8px 10px; font-size: 13px; font-family: inherit;
      outline: none; transition: border-color .15s, box-shadow .15s;
    }
    .input:focus, .textarea:focus, select.input:focus {
      border-color: rgba(47,125,255,.6);
      box-shadow: 0 0 0 3px rgba(47,125,255,.18);
    }
    .textarea { min-height: 110px; max-height: 260px; resize: vertical;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12.5px; line-height: 1.5; }
    select.input {
      background-image:
        linear-gradient(45deg, transparent 50%, #4b93ff 50%),
        linear-gradient(135deg, #4b93ff 50%, transparent 50%);
      background-position: calc(100% - 18px) 50%, calc(100% - 13px) 50%;
      background-size: 5px 5px, 5px 5px; background-repeat: no-repeat;
      padding-right: 28px;
    }

    .shot {
      position: relative;
      border: 1px dashed #2a3040; border-radius: 10px;
      min-height: 140px;
      background: rgba(47,125,255,.04);
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .shot.has-img { border-style: solid; border-color: #1a1f2b; }
    .shot-hint { color: rgba(255,255,255,.45); font-size: 12px; padding: 16px; text-align: center; }
    .shot-img  { display: block; max-width: 100%; max-height: 280px; object-fit: contain; }
    .shot-overlay {
      position: absolute; inset: 0; display: none;
      align-items: center; justify-content: center;
      background: rgba(13,16,22,.7); color: rgba(255,255,255,.7); font-size: 12px;
    }
    .shot.loading .shot-overlay { display: flex; }

    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    .row > .btn { flex: 1; min-width: 110px; }

    .err { color: #fca5a5; font-size: 12px; min-height: 16px; }

    .foot {
      padding: 12px 20px 16px; border-top: 1px solid #1a1f2b;
      display: flex; gap: 8px; align-items: center;
    }
    .spacer { flex: 1; }

    .btn {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 6px;
      border: 1px solid #1a1f2b;
      background: rgba(255,255,255,.03);
      color: #f5f7fa;
      font: 500 13px/1 inherit;
      padding: 8px 14px; border-radius: 8px;
      cursor: pointer;
      transition: transform .08s, background .15s, border-color .15s, opacity .15s;
    }
    .btn:hover { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.2); }
    .btn:active { transform: translateY(1px); }
    .btn[disabled] { opacity: .55; cursor: not-allowed; }
    .btn-primary {
      background: #2f7dff; border-color: rgba(47,125,255,.6); color: #fff; font-weight: 500;
    }
    .btn-primary:hover { background: #4b93ff; box-shadow: 0 0 0 3px rgba(47,125,255,.18); }

    .ctx {
      display: flex; align-items: center; gap: 8px;
      font-size: 11px; color: rgba(255,255,255,.5);
      background: rgba(255,255,255,.03);
      border: 1px solid #1a1f2b; border-radius: 8px;
      padding: 6px 10px;
    }
    .ctx code { font: 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
      color: rgba(255,255,255,.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ctx .lbl-inline { font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.35); }
  `;

  function send(type, extra = {}) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type, ...extra }, (resp) => {
          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(resp);
          }
        });
      } catch (err) {
        resolve({ ok: false, error: String(err) });
      }
    });
  }

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k.startsWith("on") && typeof v === "function") {
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (v === true) node.setAttribute(k, "");
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  // -------------------------------------------------------------------
  // Singleton state — replaced every open() call.
  // -------------------------------------------------------------------
  const state = {
    open: false,
    submitting: false,
    me: null,
    projects: [],
    projectId: null,
    screenshotDataUrl: null,
  };

  // Single global ESC handler.
  document.addEventListener(
    "keydown",
    (e) => {
      if (state.open && e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    },
    true
  );

  function getRoot() {
    const host = document.getElementById(HOST_ID);
    return host ? host.shadowRoot : null;
  }

  function close() {
    const host = document.getElementById(HOST_ID);
    if (host) host.remove();
    state.open = false;
    state.submitting = false;
  }

  function mountShadow() {
    // Always rebuild — clean slate.
    const old = document.getElementById(HOST_ID);
    if (old) old.remove();
    const host = document.createElement("div");
    host.id = HOST_ID;
    // Reset host element so page styles don't size/position it.
    host.style.cssText = "all: initial; position: fixed; inset: 0; z-index: 2147483647;";
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = STYLES;
    shadow.appendChild(style);
    document.documentElement.appendChild(host);
    return shadow;
  }

  // -------------------------------------------------------------------
  // open(): unified entry point.
  // Flow: capture screenshot in background → fetch session → render.
  // -------------------------------------------------------------------
  async function open() {
    // Drop any stale modal first.
    const existing = document.getElementById(HOST_ID);
    if (existing) existing.remove();
    state.open = true;
    state.screenshotDataUrl = null;

    // Kick off auto-capture in parallel with session fetch.
    // Capture is requested BEFORE the modal renders so the modal isn't in the shot.
    const capturePromise = send("LLR_CAPTURE");

    const me = await send("LLR_ME");
    if (!me?.ok) {
      // Still wait for capture so we don't leak it; we just won't use it on the login screen.
      await capturePromise;
      state.me = null;
      renderLogin();
      return;
    }
    state.me = me.data.user;
    state.projects = me.data.projects || [];
    if (!state.projectId || !state.projects.find((p) => p.id === state.projectId)) {
      state.projectId = state.projects[0]?.id || null;
    }

    // Render report view (with placeholder) immediately so the user sees the modal.
    renderReport({ capturing: true });

    // Drop the captured screenshot in once it lands.
    const cap = await capturePromise;
    if (cap?.ok && cap.dataUrl) {
      state.screenshotDataUrl = cap.dataUrl;
    }
    // Re-render to swap placeholder → image.
    renderReport({ capturing: false });
  }

  // -------------------------------------------------------------------
  // Login view
  // -------------------------------------------------------------------
  function renderLogin() {
    const shadow = mountShadow();
    const fields = { email: "", password: "", base: "https://webaudit.logiclaunch.in" };

    const baseInput = el("input", { class: "input", value: fields.base, placeholder: "https://webaudit.logiclaunch.in" });
    baseInput.addEventListener("input", (e) => (fields.base = e.target.value));

    const emailInput = el("input", { class: "input", type: "email", placeholder: "you@example.com", autofocus: true });
    emailInput.addEventListener("input", (e) => (fields.email = e.target.value));

    const pwInput = el("input", { class: "input", type: "password", placeholder: "••••••••" });
    pwInput.addEventListener("input", (e) => (fields.password = e.target.value));
    pwInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });

    const errEl = el("div", { class: "err" });

    async function submit() {
      errEl.textContent = "";
      if (!fields.email || !fields.password) {
        errEl.textContent = "Email and password are required.";
        return;
      }
      const res = await send("LLR_LOGIN", fields);
      if (!res?.ok) {
        errEl.textContent = res?.data?.error || res?.error || "Login failed";
        return;
      }
      state.open = false;
      open();
    }

    const card = el("div", { class: "card" },
      el("div", { class: "head" },
        el("div", { class: "kicker" }, "logiclaunch"),
        el("div", { class: "title" }, "Sign in to LLReporter"),
        el("div", { class: "sub" }, "Same credentials as the web dashboard.")
      ),
      el("div", { class: "body" },
        el("label", { class: "lbl" }, "Dashboard URL"), baseInput,
        el("label", { class: "lbl" }, "Email"), emailInput,
        el("label", { class: "lbl" }, "Password"), pwInput,
        errEl
      ),
      el("div", { class: "foot" },
        el("button", { class: "btn", onClick: close }, "Cancel"),
        el("div", { class: "spacer" }),
        el("button", { class: "btn btn-primary", onClick: submit }, "Sign in")
      )
    );
    const backdrop = el("div", { class: "backdrop" }, card);
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
    shadow.appendChild(backdrop);
    setTimeout(() => emailInput.focus(), 30);
  }

  // -------------------------------------------------------------------
  // Bug-report view (simplified: project + screenshot + description)
  // -------------------------------------------------------------------
  function renderReport({ capturing }) {
    const shadow = mountShadow();
    const fields = {
      description: "",
      projectId: state.projectId,
    };

    const errEl = el("div", { class: "err" });

    // -- Project select (auto-pick when single) --
    let projectControl;
    if (state.projects.length === 0) {
      projectControl = el("div", { class: "ctx" },
        el("span", { class: "lbl-inline" }, "project"),
        el("code", {}, "no projects assigned to you")
      );
    } else if (state.projects.length === 1) {
      // Single project → no need to pick, just show it.
      projectControl = el("div", { class: "ctx" },
        el("span", { class: "lbl-inline" }, "project"),
        el("code", {}, state.projects[0].name)
      );
      fields.projectId = state.projects[0].id;
    } else {
      projectControl = el("select", { class: "input" });
      for (const p of state.projects) {
        const opt = el("option", { value: p.id }, p.name);
        if (p.id === fields.projectId) opt.setAttribute("selected", "");
        projectControl.appendChild(opt);
      }
      projectControl.addEventListener("change", (e) => {
        fields.projectId = e.target.value;
        state.projectId = e.target.value;
      });
    }

    // -- URL preview (read-only, shown for context, posted with the bug) --
    const pageUrl = location.href;
    const urlPreview = el("div", { class: "ctx" },
      el("span", { class: "lbl-inline" }, "page"),
      el("code", { title: pageUrl }, pageUrl)
    );

    // -- Screenshot box --
    const shotBox = el("div", { class: "shot" + (capturing ? " loading" : (state.screenshotDataUrl ? " has-img" : "")) });

    function paintShot() {
      shotBox.innerHTML = "";
      shotBox.classList.remove("loading", "has-img");
      if (state.screenshotDataUrl) {
        shotBox.classList.add("has-img");
        const img = new Image();
        img.src = state.screenshotDataUrl;
        img.className = "shot-img";
        shotBox.appendChild(img);
      } else {
        shotBox.appendChild(el("div", { class: "shot-hint" },
          "No screenshot — paste an image (⌘V / Ctrl+V) or click Recapture"
        ));
      }
    }
    if (capturing) {
      shotBox.appendChild(el("div", { class: "shot-overlay" }, "Capturing…"));
      shotBox.appendChild(el("div", { class: "shot-hint" }, "Capturing visible tab…"));
    } else {
      paintShot();
    }

    async function recapture() {
      shotBox.classList.add("loading");
      shotBox.appendChild(el("div", { class: "shot-overlay" }, "Capturing…"));
      // Hide the modal during capture so it doesn't appear in the shot.
      const host = document.getElementById(HOST_ID);
      if (host) host.style.visibility = "hidden";
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const res = await send("LLR_CAPTURE");
      if (host) host.style.visibility = "";
      if (res?.ok) state.screenshotDataUrl = res.dataUrl;
      paintShot();
    }
    function clearShot() { state.screenshotDataUrl = null; paintShot(); }

    const recaptureBtn = el("button", { class: "btn", onClick: recapture }, "Recapture");
    const clearBtn     = el("button", { class: "btn", onClick: clearShot }, "Clear");

    // -- Description --
    const descTa = el("textarea", { class: "textarea", placeholder: "Describe the bug — what you expected, what happened, any logs." });
    descTa.addEventListener("input", (e) => (fields.description = e.target.value));
    descTa.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        submit();
      }
    });

    const submitBtn = el("button", { class: "btn btn-primary", onClick: submit }, "Submit (⌘↵)");

    async function submit() {
      errEl.textContent = "";
      if (state.submitting) return;
      if (!fields.projectId) { errEl.textContent = "No project selected."; return; }
      if (!fields.description.trim()) { errEl.textContent = "Please describe the bug."; return; }
      state.submitting = true;
      submitBtn.setAttribute("disabled", "");
      submitBtn.textContent = "Submitting…";

      const res = await send("LLR_SUBMIT", {
        payload: {
          projectId: fields.projectId,
          url: pageUrl,
          description: fields.description,
          screenshot: state.screenshotDataUrl || undefined,
          userAgent: navigator.userAgent,
        },
      });
      state.submitting = false;
      submitBtn.removeAttribute("disabled");

      if (!res?.ok) {
        errEl.textContent = res?.data?.error || res?.error || "Failed to submit";
        submitBtn.textContent = "Submit (⌘↵)";
        return;
      }
      const card = shadow.querySelector(".card");
      if (card) card.classList.add("success");
      submitBtn.textContent = "Sent ✓";
      setTimeout(close, 600);
    }

    const card = el("div", { class: "card" },
      el("div", { class: "head" },
        el("div", { class: "kicker" }, `signed in · ${state.me?.email || ""}`),
        el("div", { class: "title" }, "Report a bug"),
        el("div", { class: "sub" }, "Screenshot is captured automatically · ⌘↵ to submit · Esc to close")
      ),
      el("div", { class: "body" },
        projectControl,
        urlPreview,
        shotBox,
        el("div", { class: "row" }, recaptureBtn, clearBtn),
        descTa,
        errEl
      ),
      el("div", { class: "foot" },
        el("button", {
          class: "btn",
          onClick: async () => { await send("LLR_LOGOUT"); close(); },
        }, "Sign out"),
        el("div", { class: "spacer" }),
        el("button", { class: "btn", onClick: close }, "Cancel"),
        submitBtn
      )
    );
    const backdrop = el("div", { class: "backdrop" }, card);
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
    shadow.appendChild(backdrop);

    // Paste anywhere in the modal binds a screenshot.
    card.addEventListener("paste", async (e) => {
      const items = e.clipboardData?.items || [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          const dataUrl = await new Promise((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.readAsDataURL(file);
          });
          state.screenshotDataUrl = dataUrl;
          paintShot();
          e.preventDefault();
          return;
        }
      }
    });

    // Focus the textarea so the user can start typing immediately.
    setTimeout(() => descTa.focus(), 30);
  }

  // -------------------------------------------------------------------
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "LLR_OPEN") {
      open();
      sendResponse({ ok: true });
    } else if (msg?.type === "LLR_PING") {
      sendResponse({ ok: true });
    }
    return true;
  });
})();
