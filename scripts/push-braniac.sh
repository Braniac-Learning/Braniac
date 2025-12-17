#!/usr/bin/env bash
# push-braniac.sh
# Convenience script to stage, commit, and push current branch to the 'braniac' remote.
# Usage:
#   ./scripts/push-braniac.sh        # interactive: will prompt for commit message if there are changes
#   ./scripts/push-braniac.sh -m "message"   # provide commit message non-interactively
#   ./scripts/push-braniac.sh --no-commit    # don't create a commit, just push current branch
# Notes:
# - Expects a remote named 'braniac' to exist and point to the Braniac repo.
# - Uses osxkeychain or SSH as configured in your git settings for authentication.

set -euo pipefail

script_name="$(basename "$0")"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"
if [ -z "$REPO_ROOT" ]; then
  echo "Error: not inside a git repository. cd to the repo and re-run the script."
  exit 1
fi

cd "$REPO_ROOT"

# Parse flags
NO_COMMIT=0
MSG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -m)
      shift
      MSG="$1"
      shift
      ;;
    --no-commit)
      NO_COMMIT=1
      shift
      ;;
    -h|--help)
      echo "Usage: $script_name [-m \"message\"] [--no-commit]"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      echo "Usage: $script_name [-m \"message\"] [--no-commit]"
      exit 2
      ;;
  esac
done

# Ensure braniac remote exists
if ! git remote get-url braniac >/dev/null 2>&1; then
  echo "Remote 'braniac' not found. Set it with:\n  git remote add braniac <URL>"
  exit 1
fi

# Determine branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ -z "$BRANCH" ]; then
  echo "Could not determine current branch." >&2
  exit 1
fi

# Show status
echo "Repository: $REPO_ROOT"
echo "Current branch: $BRANCH"

git status --short

if [ "$NO_COMMIT" -eq 0 ]; then
  # Stage everything
  echo "\nStaging all changes (git add .)"
  git add .

  # If there's nothing to commit, skip creating a commit
  if git diff --cached --quiet; then
    echo "No changes staged for commit. Skipping commit step."
  else
    if [ -z "$MSG" ]; then
      echo
      read -r -p "Commit message: " MSG
      # allow user to cancel
      if [ -z "$MSG" ]; then
        echo "Empty commit message — aborting."
        exit 1
      fi
    fi

    git commit -m "$MSG"
  fi
else
  echo "--no-commit provided: skipping staging and commit."
fi

# Push (set upstream if needed)
# If branch has no upstream, set it to braniac/BRANCH
UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)
if [ -z "$UPSTREAM" ]; then
  echo "Setting upstream and pushing to braniac/$BRANCH"
  git push -u braniac "$BRANCH"
else
  echo "Pushing to upstream (braniac or other)"
  git push braniac "$BRANCH"
fi

echo "Done. Branch '$BRANCH' pushed to 'braniac'."