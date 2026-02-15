#!/bin/bash
# Production release automation script
# Automates version bump, release notes generation, tag creation, and GitHub Release.
#
# Prerequisites: gh CLI installed and authenticated, run from main branch
#
# Usage:
#   bun run release            # Normal mode
#   bun run release -- --dry-run  # Dry-run mode (no tag/push/release)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ ! -f "$SCRIPT_DIR/common.sh" ]]; then
  echo "ERROR: common.sh not found in $SCRIPT_DIR"
  exit 1
fi
source "$SCRIPT_DIR/common.sh"

# ---------- Configuration ----------
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
  esac
done

# ---------- Pre-flight checks ----------
preflight_checks() {
  local branch
  branch=$(get_current_branch)
  if [[ "$branch" != "main" ]]; then
    echo "ERROR: Release must be run from 'main' branch. Current branch: $branch"
    exit 1
  fi

  if [[ -n "$(git status --porcelain)" ]]; then
    echo "ERROR: Working tree is not clean. Commit or stash changes first."
    exit 1
  fi

  if ! command -v gh &>/dev/null; then
    echo "ERROR: 'gh' CLI is not installed. Install it from https://cli.github.com/"
    exit 1
  fi

  if ! gh auth status &>/dev/null 2>&1; then
    echo "ERROR: 'gh' CLI is not authenticated. Run 'gh auth login' first."
    exit 1
  fi
}

# ---------- Version helpers ----------
get_latest_tag() {
  git tag -l 'v[0-9]*' --sort=-v:refname | head -1
}

parse_version() {
  local tag="$1"
  local version="${tag#v}"
  IFS='.' read -r MAJOR MINOR PATCH <<< "$version"

  # Validate parsed values are non-negative integers
  if ! [[ "$MAJOR" =~ ^[0-9]+$ && "$MINOR" =~ ^[0-9]+$ && "$PATCH" =~ ^[0-9]+$ ]]; then
    echo "ERROR: Failed to parse version from tag '$tag'. Expected format: vMAJOR.MINOR.PATCH"
    exit 1
  fi
}

bump_version() {
  local level="$1"
  case "$level" in
    major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
    minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
    patch) PATCH=$((PATCH + 1)) ;;
  esac
}

# Build a git revision range from the latest tag (handles first release with no tags)
git_range() {
  local latest_tag="$1"
  if [[ "$latest_tag" == "__none__" ]]; then
    echo "HEAD"
  else
    echo "${latest_tag}..HEAD"
  fi
}

# ---------- Commit analysis ----------
# Conventional Commits: feat → minor, fix/chore/refactor/etc → patch, BREAKING CHANGE/! → major
determine_bump_level() {
  local latest_tag="$1"
  local range
  range=$(git_range "$latest_tag")
  local bump="patch"

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    if grep -qiE "BREAKING CHANGE|^[a-z]+(\(.+\))?!:" <<< "$line"; then
      echo "major"
      return
    fi
    if grep -qE "^feat(\(.+\))?:" <<< "$line"; then
      bump="minor"
    fi
  done < <(git log "$range" --format="%s")

  echo "$bump"
}

# ---------- Release notes generation ----------
generate_release_notes() {
  local latest_tag="$1"
  local range
  range=$(git_range "$latest_tag")
  local features="" fixes="" others=""

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue

    # Strip conventional commit prefix and scope for display
    local msg
    msg=$(sed -E 's/^[a-z]+(\([^)]*\))?!?:[[:space:]]*//' <<< "$line")

    local entry="- ${msg}"

    if grep -qE "^feat(\(.+\))?:" <<< "$line"; then
      features="${features}${entry}"$'\n'
    elif grep -qE "^fix(\(.+\))?:" <<< "$line"; then
      fixes="${fixes}${entry}"$'\n'
    else
      others="${others}${entry}"$'\n'
    fi
  done < <(git log "$range" --format="%s")

  local notes="## What's Changed"$'\n'

  if [[ -n "$features" ]]; then
    notes+=$'\n'"### New Features"$'\n'"${features}"
  fi
  if [[ -n "$fixes" ]]; then
    notes+=$'\n'"### Bug Fixes"$'\n'"${fixes}"
  fi
  if [[ -n "$others" ]]; then
    notes+=$'\n'"### Other Changes"$'\n'"${others}"
  fi

  echo "$notes"
}

# ---------- Main ----------
main() {
  preflight_checks

  local latest_tag
  latest_tag=$(get_latest_tag)

  if [[ -z "$latest_tag" ]]; then
    echo "No existing tags found. This will be the first release."
    latest_tag="__none__"
    MAJOR=0; MINOR=0; PATCH=0
  else
    parse_version "$latest_tag"
  fi

  echo "Latest tag: ${latest_tag//__none__/(none)} (${MAJOR}.${MINOR}.${PATCH})"

  # Count commits since last tag
  local range
  range=$(git_range "$latest_tag")
  local commit_count
  commit_count=$(git rev-list "$range" --count)
  if [[ "$commit_count" -eq 0 ]]; then
    echo "No new commits since $latest_tag. Nothing to release."
    exit 0
  fi
  echo "Commits since last tag: $commit_count"
  echo ""

  # Determine bump level
  local bump_level
  bump_level=$(determine_bump_level "$latest_tag")
  bump_version "$bump_level"

  local new_tag="v${MAJOR}.${MINOR}.${PATCH}"
  echo "Version bump: $bump_level"
  echo "New version:  $new_tag"
  echo ""

  # Generate release notes
  local release_notes
  release_notes=$(generate_release_notes "$latest_tag")

  echo "--- Release Notes ---"
  echo "$release_notes"
  echo "---------------------"
  echo ""

  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY RUN] Would create tag '$new_tag' and GitHub Release."
    echo "[DRY RUN] Done. No changes were made."
    exit 0
  fi

  # Confirm with user
  read -rp "Proceed with release $new_tag? [Enter to continue / Ctrl+C to cancel] "

  # Create annotated tag
  echo "Creating tag $new_tag ..."
  git tag -a "$new_tag" -m "Release $new_tag"

  # Push tag
  echo "Pushing tag ..."
  git push origin "$new_tag"

  # Create GitHub Release using --notes-file for safety with special characters
  echo "Creating GitHub Release ..."
  local notes_file
  notes_file=$(mktemp)
  echo "$release_notes" > "$notes_file"
  gh release create "$new_tag" \
    --title "$new_tag" \
    --notes-file "$notes_file"
  rm -f "$notes_file"

  echo ""
  echo "Release $new_tag created successfully!"
}

main "$@"
