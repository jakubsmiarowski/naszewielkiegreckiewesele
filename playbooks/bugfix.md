# Bugfix Playbook

Goal: fix a reproducible defect with minimal blast radius.

Execution contract:

1. Restate bug, expected behavior, and shortest repro.
2. Locate root cause before patching.
3. Implement the smallest safe fix.
4. Add or update a test that would fail before the fix.
5. Run relevant verification commands and report results.

Output format:

- Root cause
- Files changed
- Why this fix is minimal and safe
- Verification run (`npm run check`, relevant tests)
- Residual risk
