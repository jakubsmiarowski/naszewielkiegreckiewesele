#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLAYBOOK_DIR="$ROOT_DIR/playbooks"

TASK=""
MODE="balanced"
USE_OSS=0
ALLOW_PREMIUM_REVIEW=0
DRY_RUN=0
EXTRA_PROMPT=()

print_help() {
  cat <<'EOF'
Usage:
  scripts/codex-safe.sh [options] [prompt...]

Options:
  -t, --task <bugfix|feature|refactor|tests|review>
  -m, --mode <saver|balanced|deep>               (default: balanced)
      --oss                                      use local OSS model provider
      --allow-premium-review                     allow premium review flow
      --dry-run                                  print final prompt only
  -h, --help                                     show this help

Examples:
  scripts/codex-safe.sh --task bugfix --mode saver "Fix login redirect loop"
  scripts/codex-safe.sh --task review --allow-premium-review "Review auth API changes"
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -t|--task)
      TASK="${2:-}"
      shift 2
      ;;
    -m|--mode)
      MODE="${2:-}"
      shift 2
      ;;
    --oss)
      USE_OSS=1
      shift
      ;;
    --allow-premium-review)
      ALLOW_PREMIUM_REVIEW=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      print_help
      exit 0
      ;;
    --)
      shift
      EXTRA_PROMPT+=("$@")
      break
      ;;
    *)
      EXTRA_PROMPT+=("$1")
      shift
      ;;
  esac
done

if [[ -z "$TASK" ]]; then
  echo "Select task type:"
  select selected in bugfix feature refactor tests review; do
    if [[ -n "$selected" ]]; then
      TASK="$selected"
      break
    fi
    echo "Invalid selection. Try again."
  done
fi

case "$TASK" in
  bugfix|feature|refactor|tests|review) ;;
  *)
    echo "Invalid task: $TASK" >&2
    exit 1
    ;;
esac

case "$MODE" in
  saver)
    MODE_RULE="Budget mode is saver: prefer one-pass execution, avoid optional explorations, keep answers concise, and avoid premium review flows."
    ;;
  balanced)
    MODE_RULE="Budget mode is balanced: solve fully but batch work in larger steps and avoid unnecessary iteration."
    ;;
  deep)
    MODE_RULE="Budget mode is deep: allow broader investigation for high-risk or high-impact tasks."
    ;;
  *)
    echo "Invalid mode: $MODE" >&2
    exit 1
    ;;
esac

if [[ "$ALLOW_PREMIUM_REVIEW" -eq 1 ]]; then
  REVIEW_GATE="Premium review flow is allowed for this session if the change is PR-ready or high-risk."
else
  REVIEW_GATE="Do not run premium review flow in this session."
fi

PLAYBOOK_FILE="$PLAYBOOK_DIR/$TASK.md"
if [[ ! -f "$PLAYBOOK_FILE" ]]; then
  echo "Missing playbook file: $PLAYBOOK_FILE" >&2
  exit 1
fi

if [[ ${#EXTRA_PROMPT[@]} -eq 0 ]]; then
  read -r -p "Describe the task goal: " goal
  EXTRA_PROMPT=("$goal")
fi

USER_GOAL="${EXTRA_PROMPT[*]}"
PLAYBOOK_CONTENT="$(cat "$PLAYBOOK_FILE")"

FINAL_PROMPT=$(cat <<EOF
Follow repository guardrails from AGENTS.md and the selected playbook.
Task type: $TASK
Mode: $MODE
$MODE_RULE
$REVIEW_GATE

Selected playbook:
$PLAYBOOK_CONTENT

User goal:
$USER_GOAL

Execution constraints:
- Work in one substantial pass when possible.
- Run local verification commands appropriate for the change.
- Provide changed files and verification outcomes in the final response.
EOF
)

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "$FINAL_PROMPT"
  exit 0
fi

CODEX_CMD=(codex)
if [[ "$USE_OSS" -eq 1 ]]; then
  CODEX_CMD+=(--oss)
fi
CODEX_CMD+=("$FINAL_PROMPT")

echo "Launching Codex with task=$TASK mode=$MODE"
"${CODEX_CMD[@]}"
