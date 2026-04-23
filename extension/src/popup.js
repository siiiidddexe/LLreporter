const view = document.getElementById("view");

function send(type, extra = {}) {
  return new Promise((res) => chrome.runtime.sendMessage({ type, ...extra }, res));
}

async function render() {
  view.innerHTML = "";
  const cfg = await send("LLR_GET_CONFIG");
  const me = await send("LLR_ME");

  if (me?.ok) {
    view.insertAdjacentHTML("beforeend", `
      <hr/>
      <div class="me">Signed in as <b>${me.data.user.name}</b><br/><span style="opacity:.6">${me.data.user.email}</span></div>
      <div class="sub" style="margin-top:8px">${(me.data.projects || []).length} project(s) accessible</div>
      <button class="secondary" id="openDash">Open dashboard</button>
      <button class="secondary" id="signout">Sign out (this device)</button>
      <button class="secondary" id="signoutAll">Sign out everywhere</button>
    `);
    document.getElementById("openDash").onclick = () =>
      chrome.tabs.create({ url: cfg.base });
    document.getElementById("signout").onclick = async () => { await send("LLR_LOGOUT"); render(); };
    document.getElementById("signoutAll").onclick = async () => { await send("LLR_FORCE_LOGOUT"); render(); };
    return;
  }

  view.insertAdjacentHTML("beforeend", `
    <hr/>
    <label>Dashboard URL</label>
    <input id="base" value="${cfg.base}" />
    <label>Email</label>
    <input id="email" type="email" />
    <label>Password</label>
    <input id="pw" type="password" />
    <div class="err" id="err"></div>
    <button id="login">Sign in</button>
  `);
  document.getElementById("login").onclick = async () => {
    const err = document.getElementById("err");
    err.textContent = "";
    const res = await send("LLR_LOGIN", {
      base: document.getElementById("base").value,
      email: document.getElementById("email").value,
      password: document.getElementById("pw").value,
    });
    if (!res?.ok) { err.textContent = res?.data?.error || "Login failed"; return; }
    render();
  };
}

render();
