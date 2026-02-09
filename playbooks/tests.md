# Tests Playbook

Goal: increase confidence with targeted, valuable tests.

Execution contract:

1. Identify highest-risk behavior first.
2. Add tests that validate user-visible behavior and edge cases.
3. Avoid brittle implementation-detail assertions.
4. Keep test data minimal and readable.
5. Run the smallest meaningful test scope, then broader scope if needed.

Output format:

- Risk areas covered
- Tests added/updated
- Why assertions are stable
- Verification run (`npm run test`)
- Remaining gaps
