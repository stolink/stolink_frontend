# StoLink CLI Task Delegation Guide

This directory contains discrete, well-defined tasks for the **Claude Code CLI**.
The **Agent (Antigravity)** acts as the Architect, defining these tasks, while the **CLI** acts as the Builder/Implementer.

> **Note**: These tasks are designed for a high-performance model (Claude 3.5 Sonnet/Opus). They require full implementation logic, not just boilerplate.

## How to Run

Execute the following commands in your terminal:

```bash
# Task 1: Create the Zustand Store for Editor Settings
claude run docs/cli-tasks/01-editor-store.md

# Task 2: Define CSS Variables for Typography & Theme
claude run docs/cli-tasks/02-css-variables.md

# Task 3: Implement Advanced Tiptap Extensions (Typewriter, Focus, Linguistic)
claude run docs/cli-tasks/03-tiptap-extensions.md

# Task 4: Build the Settings UI Panel
claude run docs/cli-tasks/04-settings-ui.md
```

## Workflow Protocol

1.  **Agent**: Defines the `editor-enhance.md` spec and breaks it down into these files.
2.  **User**: Runs the commands above.
3.  **CLI**: Reads the specific task file, implements the code, and runs tests/checks.
4.  **Agent & User**: Review the changes and proceed to integration.
