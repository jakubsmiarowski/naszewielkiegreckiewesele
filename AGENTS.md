# Codex Playbook Guardrails

These rules exist to protect weekly model limits and keep delivery quality high.

## Non-negotiable workflow

1. Classify the task before coding: `bugfix`, `feature`, `refactor`, `tests`, or `review`.
2. Use one matching playbook from `/playbooks`.
3. Work in one substantial pass whenever possible:
   - gather context,
   - implement,
   - verify,
   - summarize.
4. Keep it local-first for cheap feedback:
   - run `npm run check` for code edits,
   - run `npm run test` when behavior changes.
5. Do not run premium review flows for routine edits.

## Budget modes

- `saver` (weekly remaining <= 40%): one-pass only, no optional explorations, no premium review.
- `balanced` (weekly remaining 40-70%): normal depth, but still batch requests.
- `deep` (weekly remaining > 70%): allowed for high-impact or risky work.

## Premium review gate

`Sprawdz kod` is allowed only when at least one is true:

- PR is ready for review.
- Security/auth/payment/data-migration risk is present.
- User explicitly asks for premium review.

If none are true, skip it.

## Prompt quality rule

Avoid many short prompts. Build one complete prompt with:

- objective,
- scope/files,
- constraints,
- acceptance criteria,
- what was already checked.

## Enforcement helper

Use `scripts/codex-safe.sh` (or `npm run codex:safe`) as default entrypoint.
It injects playbook + budget-mode guardrails before launching Codex.
