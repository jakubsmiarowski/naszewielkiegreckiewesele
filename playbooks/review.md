# Review Playbook

Goal: perform high-signal review focused on bugs, regressions, and risk.

Execution contract:

1. List findings first, ordered by severity.
2. Include file and line references for each finding.
3. Prioritize correctness, data safety, auth/security, and user-visible regressions.
4. Call out missing tests for risky changes.
5. Keep summary short and secondary.

Output format:

- Findings (severity order)
- Open questions/assumptions
- Suggested fixes
- Optional short summary

Premium review tool gate:

- Use only for PR-ready or explicitly requested high-risk review.
