/* LLReporter content script — injects a modal into the page. */
(() => {
  if (window.__LLR_INJECTED__) return;
  window.__LLR_INJECTED__ = true;

  const ROOT_ID = "__llr_root__";

  function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") el.className = v;
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (v !== undefined && v !== null) el.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null) continue;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return el;
  }

  async function send(type, extra = {}) {
    return new Promise((res) => chrome.runtime.sendMessage({ type, ...extra }, res));
  }

  let state = { open: false, screenshotDataUrl: null, projects: [], projectId: null, me: null, submitting: false };

  function close() {
    const root = document.getElementById(ROOT_ID);
    if (root) root.remove();
    state.open = false;
  }

  async function open() {
    if (state.open) return;
    state.open = true;

    // Preload session
    const me = await send("LLR_ME");
    if (!me?.ok) {
      state.me = null;
      renderLogin();
      return;
    }
    state.me = me.data.user;
    state.projects = me.data.projects || [];
    state.projectId = state.projectId || state.projects[0]?.id || null;
    state.screenshotDataUrl = null;
    render();
  }

  function mount(node) {
    const old = document.getElementById(ROOT_ID);
    if (old) old.remove();
    const root = h("div", { id: ROOT_ID, class: "llr-backdrop" }, node);
    root.addEventListener("click", (e) => { if (e.target === root) close(); });
    document.documentElement.appendChild(root);
    document.addEventListener("keydown", onKey, { once: false });
  }

  function onKey(e) {
    if (!state.open) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
  }

  function renderLogin() {
    let email = "", password = "", base = "https://webaudit.logiclaunch.in", err = "";

    const card = h("div", { class: "llr-card" },
      h("div", { class: "llr-head" },
        h("div", { class: "llr-kicker" }, "logiclaunch"),
        h("div", { class: "llr-title" }, "Sign in to LLReporter"),
        h("div", { class: "llr-sub" }, "Your session will also sign you into the web dashboard."),
      ),
      h("div", { class: "llr-body" },
        h("label", { class: "llr-label" }, "Dashboard URL"),
        (() => { const i = h("input", { class: "llr-input", value: base }); i.addEventListener("input", (e) => base = e.target.value); return i; })(),
        h("label", { class: "llr-label" }, "Email"),
        (() => { const i = h("input", { class: "llr-input", type: "email", autofocus: "true" }); i.addEventListener("input", (e) => email = e.target.value); return i; })(),
        h("label", { class: "llr-label" }, "Password"),
        (() => {
          const i = h("input", { class: "llr-input", type: "password" });
          i.addEventListener("input", (e) => password = e.target.value);
          i.addEventListener("keydown", async (e) => { if (e.key === "Enter") submit(); });
          return i;
        })(),
        (() => { const d = h("div", { class: "llr-err" }); d.id = "llr-err"; return d; })(),
      ),
      h("div", { class: "llr-foot" },
        h("button", { class: "llr-btn", onClick: close }, "Cancel"),
        h("button", { class: "llr-btn llr-btn-primary", onClick: submit }, "Sign in"),
      ),
    );
    mount(card);

    async function submit() {
      const errEl = document.getElementById("llr-err");
      errEl.textContent = "";
      const res = await send("LLR_LOGIN", { email, password, base });
      if (!res?.ok) { errEl.textContent = res?.data?.error || "Login failed"; return; }
      open();
    }
  }

  function render() {
    let url = location.href;
    let description = "";
    let projectId = state.projectId;

    const card = h("div", { class: "llr-card llr-card-lg" },
      h("div", { class: "llr-head" },
        h("div", { class: "llr-kicker" }, `logged in as ${state.me?.email}`),
        h("div", { class: "llr-title" }, "Report a bug"),
        h("div", { class: "llr-sub" }, "⌘V / Ctrl+V to paste a screenshot · Enter to submit · Esc to close"),
      ),
      h("div", { class: "llr-body" },
        h("label", { class: "llr-label" }, "Project"),
        (() => {
          const sel = h("select", { class: "llr-input" });
          if (state.projects.length === 0) {
            sel.appendChild(h("option", { value: "" }, "— no projects assigned —"));
          }
          for (const p of state.projects) {
            const opt = h("option", { value: p.id }, p.name);
            if (p.id === projectId) opt.setAttribute("selected", "true");
            sel.appendChild(opt);
          }
          sel.addEventListener("change", (e) => projectId = e.target.value);
          return sel;
        })(),

        h("label", { class: "llr-label" }, "Page URL"),
        (() => { const i = h("input", { class: "llr-input", value: url }); i.addEventListener("input", (e) => url = e.target.value); return i; })(),

        h("label", { class: "llr-label" }, "Screenshot"),
        h("div", { class: "llr-shot", id: "llr-shot" },
          h("div", { class: "llr-shot-hint" }, "Paste an image (⌘V/Ctrl+V) or click Capture"),
        ),
        h("div", { class: "llr-row" },
          h("button", { class: "llr-btn", onClick: capture }, "Capture visible tab"),
          h("button", { class: "llr-btn", onClick: clearShot }, "Clear"),
        ),

        h("label", { class: "llr-label" }, "What went wrong? (logs, steps, expected vs actual)"),
        (() => {
          const t = h("textarea", { class: "llr-input llr-textarea", placeholder: "Describe the error in detail…" });
          t.addEventListener("input", (e) => description = e.target.value);
          t.addEventListener("keydown", (e) => {
            // Enter submits, Shift+Enter inserts newline
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          });
          return t;
        })(),
        (() => { const d = h("div", { class: "llr-err", id: "llr-err" }); return d; })(),
      ),
      h("div", { class: "llr-foot" },
        h("button", { class: "llr-btn", onClick: async () => { await send("LLR_LOGOUT"); close(); } }, "Sign out"),
        h("div", { class: "llr-spacer" }),
        h("button", { class: "llr-btn", onClick: close }, "Cancel"),
        h("button", { class: "llr-btn llr-btn-primary", id: "llr-submit", onClick: submit }, "Submit (Enter)"),
      ),
    );
    mount(card);

    // paste screenshot anywhere in modal
    card.addEventListener("paste", onPaste);

    async function onPaste(e) {
      const items = e.clipboardData?.items || [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          const dataUrl = await new Promise((res) => {
            const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file);
          });
          setShot(dataUrl);
          e.preventDefault();
          return;
        }
      }
    }

    async function capture() {
      const res = await send("LLR_CAPTURE");
      if (res?.ok) setShot(res.dataUrl);
    }
    function clearShot() { setShot(null); }
    function setShot(dataUrl) {
      state.screenshotDataUrl = dataUrl;
      const box = document.getElementById("llr-shot");
      box.innerHTML = "";
      if (dataUrl) {
        const img = new Image(); img.src = dataUrl; img.className = "llr-shot-img";
        box.appendChild(img);
      } else {
        box.appendChild(h("div", { class: "llr-shot-hint" }, "Paste an image (⌘V/Ctrl+V) or click Capture"));
      }
    }

    async function submit() {
      const errEl = document.getElementById("llr-err");
      errEl.textContent = "";
      if (state.submitting) return;
      if (!projectId) { errEl.textContent = "Select a project"; return; }
      if (!description.trim()) { errEl.textContent = "Describe the bug"; return; }
      state.submitting = true;
      document.getElementById("llr-submit").textContent = "Submitting…";
      const res = await send("LLR_SUBMIT", {
        payload: {
          projectId,
          url,
          description,
          screenshot: state.screenshotDataUrl || undefined,
          userAgent: navigator.userAgent,
        },
      });
      state.submitting = false;
      if (!res?.ok) {
        errEl.textContent = res?.data?.error || "Failed to submit";
        document.getElementById("llr-submit").textContent = "Submit (Enter)";
        return;
      }
      // success micro-animation
      const box = document.querySelector(".llr-card");
      box.classList.add("llr-success");
      setTimeout(close, 500);
    }
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "LLR_OPEN") open();
  });
})();
