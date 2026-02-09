# Refactor Playbook

Goal: improve structure/readability without changing behavior.

Execution contract:

1. Define invariants that must stay unchanged.
2. Refactor in small logical chunks.
3. Keep public behavior and interfaces stable unless explicitly requested.
4. Add tests only where current coverage is missing for protected behavior.
5. Verify behavior parity with checks/tests.

Output format:

- Invariants protected
- Structural improvements made
- Files changed
- Verification run (`npm run check`, `npm run test`)
- Regression risk notes
