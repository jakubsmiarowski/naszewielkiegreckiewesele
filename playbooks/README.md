# Codex Playbooks

Use one playbook per task:

- `bugfix.md`
- `feature.md`
- `refactor.md`
- `tests.md`
- `review.md`

Recommended launch command:

```bash
npm run codex:safe -- --task bugfix --mode saver "Fix dashboard crash when invitation token is missing"
```

Mode guidance:

- `saver`: protect weekly limits.
- `balanced`: default.
- `deep`: use for high-impact or risky work only.
