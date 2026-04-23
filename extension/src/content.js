/* LLReporter content script — injects a bug-report modal into any page.
   Triggered by chrome.runtime message LLR_OPEN (sent on ⌘K / Ctrl+K). */
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
      else if (v !== undefined && v !== null && v !== false) el.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return el;
  }

  function send(type, extra = {}) {
    return new Promise((res) => {
      try {
        chrome.runtime.sendMessage({ type, ...extra }, (resp) => {
          // Swallow "Receiving end does not exist" if SW restarted mid-call.
          if (chrome.runtime.lastError) {
            res({ ok: false, error: chrome.runtime.lastError.message });
          } else {
            res(resp);
          }
        });
      } catch (err) {
        res({ ok: false, error: String(err) });
      }
    });
  }

  const state = {
    open: false,
    screenshotDataUrl: null,
    projects: [],
    projectId: null,
    me: null,
    submitting: false,
  };

  // Single, registered-once ESC handler — previous version added one per open
  // which caused multiple close() calls and modal flicker.
  function onKey(e) {
    if (!state.open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  }
  document.addEventListener("keydown", onKey, true);

  function close() {
    const root = document.getElementById(ROOT_ID);
    if (root) root.remove();
    state.open = false;
    state.submitting = false;
  }

  async function open() {
    // Always start fresh — if a stale modal is still attached, drop it first.
    const existing = document.getElementById(ROOT_ID);
    if (existing) existing.remove();
    state.open = true;

    const me = await send("LLR_ME");
    if (!me?.ok) {
      state.me = null;
      renderLogin();
      return;
    }
    state.me = me.data.user;
    state.projects = me.data.projects || [];
    // Preserve previous selection if still valid, else default to first.
    if (!state.projectId || !state.projects.find((p) => p.id === state.projectId)) {
      state.projectId = state.projects[0]?.id || null;
    }
    state.screenshotDataUrl = null;
    render();
  }

  function mount(node) {
    const old = document.getElementById(ROOT_ID);
    if (old) old.remove();
    const root = h("div", { id: ROOT_ID, class: "llr-backdrop" }, node);
    root.addEventListener("click", (e) => {
      if (e.target === root) close();
    });
    document.documentElement.appendChild(root);
  }

  // -----------------------------------------------------------------
  // Login view
  // -----------------------------------------------------------------
  function renderLogin() {
    const fields = { email: "", password: "", base: "https://webaudit.logiclaunch.in" };

    const baseInput = h("input", { class: "llr-input", value: fields.base, placeholder: "https://webaudit.logiclaunch.in" });
    baseInput.addEventListener("input", (e) => (fields.base = e.target.value));

    const emailInput = h("input", { class: "llr-input", type: "email", autofocus: "true", placeholder: "you@example.com" });
    emailInput.addEventListener("input", (e) => (fields.email = e.target.value));

    const pwInput = h("input", { class: "llr-input", type: "password", placeholder: "••••••••" });
    pwInput.addEventListener("input", (e) => (fields.password = e.target.value));
    pwInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });

    const errEl = h("div", { class: "llr-err" });

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
      // CRITICAL: state.open is still true from the original open() call,
      // so re-running open() would short-circuit. Reset & call directly.
      state.open = false;
      open();
    }

    const card = h(
      "div",
      { class: "llr-card" },
      h(
        "div",
        { class: "llr-head" },
        h("div", { class: "llr-kicker" }, "logiclaunch"),
        h("div", { class: "llr-title" }, "Sign in to LLReporter"),
        h("div", { class: "llr-sub" }, "Same credentials as the web dashboard.")
      ),
      h(
        "div",
        { class: "llr-body" },
        h("label", { class: "llr-label" }, "Dashboard URL"),
        baseInput,
        h("label", { class: "llr-label" }, "Email"),
        emailInput,
        h("label", { class: "llr-label" }, "Password"),
        pwInput,
        errEl
      ),
      h(
        "div",
        { class: "llr-foot" },
        h("button", { class: "llr-btn", onClick: close }, "Cancel"),
        h("div", { class: "llr-spacer" }),
        h("button", { class: "llr-btn llr-btn-primary", onClick: submit }, "Sign in")
      )
    );
    mount(card);
    setTimeout(() => emailInput.focus(), 30);
  }

  // -----------------------------------------------------------------
  // Bug-report view
  // -----------------------------------------------------------------
  function render() {
    const fields = {
      url: location.href,
      description: "",
      title: "",
      projectId: state.projectId,
    };

    // Project selector
    const sel = h("select", { class: "llr-input" });
    if (state.projects.length === 0) {
      sel.appendChild(h("option", { value: "" }, "— no projects accessible —"));
    } else {
      for (const p of state.projects) {
        const opt = h("option", { value: p.id }, p.name);
        if (p.id === fields.projectId) opt.setAttribute("selected", "true");
        sel.appendChild(opt);
      }
    }
    sel.addEventListener("change", (e) => {
      fields.projectId = e.target.value;
      state.projectId = e.target.value;
    });

    // URL input
    const urlInput = h("input", { class: "llr-input", value: fields.url });
    urlInput.addEventListener("input", (e) => (fields.url = e.target.value));

    // Title input (optional)
    const titleInput = h("input", { class: "llr-input", placeholder: "Short title (optional)" });
    titleInput.addEventListener("input", (e) => (fields.title = e.target.value));

    // Screenshot box
    const shotBox = h("div", { class: "llr-shot" },
      h("div", { class: "llr-shot-hint" }, "Paste an image (⌘V / Ctrl+V) or click Capture")
    );

    function setShot(dataUrl) {
      state.screenshotDataUrl = dataUrl;
      shotBox.innerHTML = "";
      if (dataUrl) {
        const img = new Image();
        img.src = dataUrl;
        img.className = "llr-shot-img";
        shotBox.appendChild(img);
      } else {
        shotBox.appendChild(h("div", { class: "llr-shot-hint" }, "Paste an image (⌘V / Ctrl+V) or click Capture"));
      }
    }

    async function capture() {
      // Hide the modal momentarily so it doesn't appear in the screenshot.
      const root = document.getElementById(ROOT_ID);
      if (root) root.style.visibility = "hidden";
      // Allow paint frame.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const res = await send("LLR_CAPTURE");
      if (root) root.style.visibility = "";
      if (res?.ok) setShot(res.dataUrl);
      else {
        errEl.textContent = res?.error || "Could not capture tab";
      }
    }

    const captureBtn = h("button", { class: "llr-btn", onClick: capture }, "Capture visible tab");
    const clearBtn = h("button", { class: "llr-btn", onClick: () => setShot(null) }, "Clear");

    // Description
    const descTa = h("textarea", { class: "llr-input llr-textarea", placeholder: "Describe what went wrong — what you expected vs what happened…" });
    descTa.addEventListener("input", (e) => (fields.description = e.target.value));
    descTa.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        submit();
      }
    });

    const errEl = h("div", { class: "llr-err" });
    const submitBtn = h("button", { class: "llr-btn llr-btn-primary", onClick: submit }, "Submit (⌘↵)");

    async function submit() {
      errEl.textContent = "";
      if (state.submitting) return;
      if (!fields.projectId) {
        errEl.textContent = "Select a project first.";
        return;
      }
      if (!fields.description.trim()) {
        errEl.textContent = "Please describe the bug.";
        return;
      }
      state.submitting = true;
      submitBtn.textContent = "Submitting…";
      submitBtn.setAttribute("disabled", "true");

      const res = await send("LLR_SUBMIT", {
        payload: {
          projectId: fields.projectId,
          url: fields.url,
          title: fields.title || undefined,
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
      const box = document.querySelector(".llr-card");
      if (box) box.classList.add("llr-success");
      submitBtn.textContent = "Sent ✓";
      setTimeout(close, 600);
    }

    const card = h(
      "div",
      { class: "llr-card llr-card-lg" },
      h(
        "div",
        { class: "llr-head" },
        h("div", { class: "llr-kicker" }, `signed in · ${state.me?.email || ""}`),
        h("div", { class: "llr-title" }, "Report a bug"),
        h("div", { class: "llr-sub" }, "Paste a screenshot · ⌘↵ to submit · Esc to close")
      ),
      h(
        "div",
        { class: "llr-body" },
        h("label", { class: "llr-label" }, "Project"),
        sel,
        h("label", { class: "llr-label" }, "Page URL"),
        urlInput,
        h("label", { class: "llr-label" }, "Title"),
        titleInput,
        h("label", { class: "llr-label" }, "Screenshot"),
        shotBox,
        h("div", { class: "llr-row" }, captureBtn, clearBtn),
        h("label", { class: "llr-label" }, "Details"),
        descTa,
        errEl
      ),
      h(
        "div",
        { class: "llr-foot" },
        h(
          "button",
          {
            class: "llr-btn",
            onClick: async () => {
              await send("LLR_LOGOUT");
              close();
            },
          },
          "Sign out"
        ),
        h("div", { class: "llr-spacer" }),
        h("button", { class: "llr-btn", onClick: close }, "Cancel"),
        submitBtn
      )
    );
    mount(card);

    // Paste anywhere inside the card binds a screenshot.
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
          setShot(dataUrl);
          e.preventDefault();
          return;
        }
      }
    });

    setTimeout(() => descTa.focus(), 30);
  }

  // Listen for LLR_OPEN from the background service worker.
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
