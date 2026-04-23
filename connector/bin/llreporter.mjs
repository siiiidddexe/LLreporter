#!/usr/bin/env node
/**
 * LLReporter connector CLI.
 * Drop this repo (or just this file + package.json) into your project and run:
 *
 *   npx llreporter next          # fetch the next bug to fix
 *   npx llreporter list          # list open bugs
 *   npx llreporter show <bugId>  # full bug detail
 *   npx llreporter patch <bugId> --status NEEDS_TESTING --note "fixed X, ..."
 *   npx llreporter comment <bugId> "some message to the tester"
 *
 * Configuration via env (or a .llreporterrc JSON in cwd):
 *   LLREPORTER_BASE=https://webaudit.logiclaunch.in
 *   LLREPORTER_API_KEY=llr_live_xxxxxx
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { argv, env, exit } from "node:process";

function loadConfig() {
  let cfg = {
    base: env.LLREPORTER_BASE || "https://webaudit.logiclaunch.in",
    apiKey: env.LLREPORTER_API_KEY || "",
  };
  const rc = resolve(process.cwd(), ".llreporterrc");
  if (existsSync(rc)) {
    try {
      const j = JSON.parse(readFileSync(rc, "utf8"));
      cfg = { ...cfg, ...j };
    } catch {}
  }
  if (!cfg.apiKey) {
    console.error("✖ Missing LLREPORTER_API_KEY (set env or .llreporterrc)");
    exit(2);
  }
  return cfg;
}

async function api(path, { method = "GET", body, cfg }) {
  const res = await fetch(`${cfg.base}${path}`, {
    method,
    headers: {
      "X-API-Key": cfg.apiKey,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`✖ ${method} ${path} → ${res.status}`, data);
    exit(1);
  }
  return data;
}

function parseArgs(args) {
  const flags = {};
  const pos = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--")) flags[a.slice(2)] = args[++i] ?? true;
    else pos.push(a);
  }
  return { flags, pos };
}

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "NEEDS_TESTING", "RESOLVED", "UNRESOLVED", "CLOSED"];

function help() {
  console.log(`llreporter — Claude/VS Code connector for LLReporter

Usage:
  llreporter next                              Fetch the next bug to work on.
  llreporter list [--status OPEN]              List bugs (optional status filter).
  llreporter show <bugId>                      Show a bug's full detail.
  llreporter patch <bugId> --status <S> [--note "..."]
                                               Update status (required) and attach a patch note.
  llreporter comment <bugId> "<message>"       Post a Claude comment to the tester.

Statuses: ${VALID_STATUSES.join(", ")}`);
}

async function main() {
  const [, , cmd, ...rest] = argv;
  const { flags, pos } = parseArgs(rest);
  if (!cmd || cmd === "help" || cmd === "-h" || cmd === "--help") return help();

  const cfg = loadConfig();

  if (cmd === "next") {
    const { bug, project } = await api("/api/v1/next", { cfg });
    if (!bug) { console.log(`No open bugs for ${project?.name}. 🎉`); return; }
    console.log(JSON.stringify(bug, null, 2));
    return;
  }

  if (cmd === "list") {
    const qs = flags.status ? `?status=${encodeURIComponent(flags.status)}` : "";
    const { bugs } = await api(`/api/v1/bugs${qs}`, { cfg });
    console.log(JSON.stringify(bugs, null, 2));
    return;
  }

  if (cmd === "show") {
    const id = pos[0];
    if (!id) return help();
    const { bug } = await api(`/api/v1/bugs/${id}`, { cfg });
    console.log(JSON.stringify(bug, null, 2));
    return;
  }

  if (cmd === "patch") {
    const id = pos[0];
    if (!id) return help();
    if (!flags.status || !VALID_STATUSES.includes(flags.status)) {
      console.error(`✖ --status is required and must be one of: ${VALID_STATUSES.join(", ")}`);
      exit(2);
    }
    const body = { status: flags.status };
    if (flags.note) body.note = flags.note;
    const { bug } = await api(`/api/v1/bugs/${id}`, { method: "PATCH", body, cfg });
    console.log(`✓ Bug ${id} → ${bug.status}`);
    return;
  }

  if (cmd === "comment") {
    const id = pos[0];
    const body = pos.slice(1).join(" ");
    if (!id || !body) return help();
    await api(`/api/v1/bugs/${id}/comments`, { method: "POST", body: { body }, cfg });
    console.log(`✓ Comment posted on ${id}`);
    return;
  }

  help();
  exit(1);
}

main().catch((e) => { console.error(e); exit(1); });
