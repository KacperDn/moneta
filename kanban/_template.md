---
id: 000
title: Short, specific title
status: ready        # ready | running | review | done | blocked
files:                # whitelist of files the agent may create or modify
  - src/utils/example.ts
  - src/utils/example.test.ts
verify: npm test -- --run example
---
2-6 sentences describing the task: what module or function, what it should
do, and any constraint worth calling out (edge cases, existing patterns to
follow).

Acceptance criteria:
- ...
- ...
