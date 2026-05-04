#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# check-secrets.sh — block commits that contain hardcoded secrets
#
# Runs as a pre-commit hook AND can be run manually:
#   bash scripts/check-secrets.sh
#
# Detects: AWS keys, Google API keys, Supabase service-role JWTs, generic
# private keys, Stripe keys, OpenAI keys, JWT tokens, .env file additions,
# and anything matching common credential patterns.
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Files staged for commit (added/modified, exclude deleted)
STAGED=$(git diff --cached --name-only --diff-filter=ACMR)

if [ -z "$STAGED" ]; then
  exit 0
fi

VIOLATIONS=0
report() {
  echo -e "${RED}✗ SECRET DETECTED${NC} $1"
  VIOLATIONS=$((VIOLATIONS + 1))
}

# ─── 1. Block any .env* file (even if .gitignore missed) ────────────────
for f in $STAGED; do
  case "$f" in
    .env|.env.*|*.env|*.env.local|*.env.production|*.env.development)
      if [ "$f" != ".env.example" ]; then
        report "$f — env files must not be committed"
      fi
      ;;
    *.pem|*.key|*.p12|*.pfx|service-account.json|*-credentials.json|*-secrets.json|secrets.*|credentials.*)
      report "$f — credential/key file detected"
      ;;
  esac
done

# ─── 2. Pattern-scan staged content ─────────────────────────────────────
# Exclude self-documenting files (this script, env template, README/docs)
# from value-pattern scans — they describe patterns without containing real
# secrets. File-level checks (Layer 1 above) still apply universally.
SAFE_FILES_RE='^(scripts/check-secrets\.sh|\.env\.example|README\.md|.*\.md)$'
SCAN_FILES=$(echo "$STAGED" | grep -Ev "$SAFE_FILES_RE" || true)

if [ -z "$SCAN_FILES" ]; then
  DIFF=""
else
  DIFF=$(git diff --cached --diff-filter=ACMR -U0 -- $SCAN_FILES)
fi

# AWS Access Key ID (AKIA + 16 chars)
if echo "$DIFF" | grep -E 'AKIA[0-9A-Z]{16}' >/dev/null; then
  report "AWS Access Key ID pattern (AKIA…)"
fi

# AWS Secret Access Key (40-char base64-ish)
if echo "$DIFF" | grep -E 'aws.{0,20}(secret|key).{0,20}["'\''=:][[:space:]]*[A-Za-z0-9/+=]{40}' >/dev/null; then
  report "AWS Secret Access Key pattern"
fi

# Google API Key (AIza…)
if echo "$DIFF" | grep -E 'AIza[0-9A-Za-z_-]{35}' >/dev/null; then
  report "Google API Key pattern (AIza…)"
fi

# OpenAI / Anthropic-style keys
if echo "$DIFF" | grep -E 'sk-[A-Za-z0-9_-]{20,}' >/dev/null; then
  report "OpenAI/Anthropic-style API key (sk-…)"
fi

# Stripe live keys
if echo "$DIFF" | grep -E '(sk|rk|pk)_live_[0-9a-zA-Z]{20,}' >/dev/null; then
  report "Stripe live key (sk_live_/rk_live_/pk_live_)"
fi

# Generic JWT
if echo "$DIFF" | grep -E 'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}' >/dev/null; then
  report "JWT token pattern (eyJ…eyJ…)"
fi

# Supabase service-role hint
if echo "$DIFF" | grep -Ei 'supabase.{0,20}service.{0,5}role' >/dev/null; then
  report "Supabase service-role mention — verify via env, not literal"
fi

# Private key blocks
if echo "$DIFF" | grep -E 'BEGIN ((RSA|EC|OPENSSH|PGP|DSA) )?PRIVATE KEY' >/dev/null; then
  report "Private key block detected"
fi

# Generic high-entropy assignment patterns (api_key/password/secret = "…")
if echo "$DIFF" | grep -Ei '(api[_-]?key|secret|password|passwd|access[_-]?token)[[:space:]]*[:=][[:space:]]*["'\''][A-Za-z0-9_+/=-]{16,}["'\'']' >/dev/null; then
  report "Generic credential assignment pattern"
fi

# ─── 3. Result ──────────────────────────────────────────────────────────
if [ "$VIOLATIONS" -gt 0 ]; then
  echo ""
  echo -e "${RED}Commit blocked — $VIOLATIONS issue(s) above.${NC}"
  echo -e "${YELLOW}Fix:${NC} move secrets to .env.local (gitignored) and reference via process.env.*"
  echo -e "${YELLOW}Override (NOT recommended):${NC} git commit --no-verify"
  exit 1
fi

echo -e "${GREEN}✓ No secrets detected in staged changes.${NC}"
exit 0
