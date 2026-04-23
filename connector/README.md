# @llreporter/connector

Node CLI + docs so Claude in VS Code can pull LLReporter bugs and fix them one by one.

👉 **Read [`DOCUMENTATION.md`](./DOCUMENTATION.md) — full walkthrough including the Claude system prompt.**

## 30-second install

```bash
npm i --save-dev github:siiidddexe/LLreporter#main:connector
echo '{"base":"https://webaudit.logiclaunch.in","apiKey":"llr_live_…"}' > .llreporterrc
npx llreporter next
```

## Commands

```
llreporter next                              # next bug to fix
llreporter list [--status OPEN]              # list bugs
llreporter show <bugId>                      # full detail
llreporter patch <bugId> --status NEEDS_TESTING --note "fixed X"
llreporter comment <bugId> "message to tester"
```
