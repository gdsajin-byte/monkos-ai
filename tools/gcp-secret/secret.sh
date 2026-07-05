#!/bin/zsh
# secret — GCP Secret Manager CLI wrapper
# One-command secret management with clipboard integration (macOS)
#
# Usage:
#   secret                     # Interactive: asks name → paste from clipboard
#   secret add  <NAME>         # Register secret (clipboard → Secret Manager)
#   secret get  <NAME>         # Retrieve secret value
#   secret list                # List all secrets
#   secret check <NAME>        # Check existence + version info
#   secret env                 # Sync Secret Manager → .env file
#
# Requirements:
#   - gcloud CLI (authenticated)
#   - GCP project with Secret Manager API enabled
#
# Configuration:
#   Set GCP_SECRET_PROJECT env var or pass --project flag.
#   Falls back to current gcloud project if neither is set.
#
#   For `secret env`:
#   Set SECRET_ENV_FILE env var or it auto-detects .env in current directory.

# --- Config ---
PROJECT="${GCP_SECRET_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
ENV_FILE="${SECRET_ENV_FILE:-.env}"

if [ -z "$PROJECT" ]; then
  echo "Error: No GCP project set. Run 'gcloud config set project <ID>' or export GCP_SECRET_PROJECT=<ID>"
  exit 1
fi

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# --- Clipboard detection ---
clipboard_paste() {
  if command -v pbpaste &>/dev/null; then
    pbpaste | tr -d '\n\r\t '
  elif command -v xclip &>/dev/null; then
    xclip -selection clipboard -o 2>/dev/null | tr -d '\n\r\t '
  elif command -v xsel &>/dev/null; then
    xsel --clipboard --output 2>/dev/null | tr -d '\n\r\t '
  elif command -v wl-paste &>/dev/null; then
    wl-paste 2>/dev/null | tr -d '\n\r\t '
  elif command -v powershell.exe &>/dev/null; then
    powershell.exe -Command "Get-Clipboard" 2>/dev/null | tr -d '\n\r\t '
  else
    echo ""
  fi
}

usage() {
  echo -e "${BLUE}secret${NC} — GCP Secret Manager CLI wrapper"
  echo ""
  echo "  ${GREEN}secret${NC}               Interactive registration (name → clipboard → SM)"
  echo "  ${GREEN}secret add${NC} <NAME>    Register secret from clipboard"
  echo "  ${GREEN}secret get${NC} <NAME>    Retrieve secret value"
  echo "  ${GREEN}secret list${NC}          List all secrets in project"
  echo "  ${GREEN}secret check${NC} <NAME>  Check existence + latest versions"
  echo "  ${GREEN}secret env${NC}           Sync Secret Manager → .env file"
  echo ""
  echo -e "  Project: ${YELLOW}${PROJECT}${NC}"
  echo ""
  echo "  Config:"
  echo "    GCP_SECRET_PROJECT   GCP project ID (default: gcloud current project)"
  echo "    SECRET_ENV_FILE      Path to .env file for sync (default: ./.env)"
  exit 0
}

cmd_interactive() {
  echo -e "${BLUE}GCP Secret Registration${NC}"
  echo ""
  echo -e "1) Copy the secret value to clipboard first"
  echo -e "2) Press Enter when ready:"
  read -r DUMMY
  SECRET_VALUE=$(clipboard_paste)

  if [ -z "$SECRET_VALUE" ]; then
    echo -e "${RED}Clipboard is empty. Copy the value and try again.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓${NC} Clipboard value received (${#SECRET_VALUE} chars)"
  echo ""

  echo -e "Secret name (e.g. MY_API_KEY):"
  read -r NAME
  if [ -z "$NAME" ]; then
    echo -e "${RED}Name cannot be empty.${NC}"
    exit 1
  fi

  _do_register "$NAME" "$SECRET_VALUE"
}

cmd_add() {
  local NAME="$1"
  if [ -z "$NAME" ]; then
    echo -e "${RED}Usage: secret add <NAME>${NC}"
    exit 1
  fi

  local EXISTS
  EXISTS=$(gcloud secrets describe "$NAME" --project="$PROJECT" 2>/dev/null)
  if [ -n "$EXISTS" ]; then
    echo -e "${YELLOW}[existing]${NC} $NAME — adding new version."
  else
    echo -e "${GREEN}[new]${NC} $NAME — creating secret."
  fi

  echo -e "Copy the value to clipboard, then press Enter:"
  read -r DUMMY
  SECRET_VALUE=$(clipboard_paste)

  if [ -z "$SECRET_VALUE" ]; then
    echo -e "${RED}Clipboard is empty.${NC}"
    exit 1
  fi

  _do_register "$NAME" "$SECRET_VALUE"
}

_do_register() {
  local NAME="$1"
  local VALUE="$2"

  echo -ne "${YELLOW}Registering...${NC}"

  local EXISTS
  EXISTS=$(gcloud secrets describe "$NAME" --project="$PROJECT" 2>/dev/null)
  if [ -n "$EXISTS" ]; then
    echo -n "$VALUE" | gcloud secrets versions add "$NAME" --project="$PROJECT" --data-file=- 2>/dev/null
  else
    echo -n "$VALUE" | gcloud secrets create "$NAME" --project="$PROJECT" --data-file=- --replication-policy=automatic 2>/dev/null
  fi

  if [ $? -eq 0 ]; then
    local VER
    VER=$(gcloud secrets versions list "$NAME" --project="$PROJECT" --limit=1 --format="value(name)" 2>/dev/null)
    echo -e "${GREEN}✅ Done${NC} — $NAME (version $VER)"
  else
    echo -e "${RED}❌ Failed${NC} — check gcloud authentication."
    exit 1
  fi
}

cmd_get() {
  local NAME="$1"
  if [ -z "$NAME" ]; then
    echo -e "${RED}Usage: secret get <NAME>${NC}"
    exit 1
  fi
  local VALUE
  VALUE=$(gcloud secrets versions access latest --secret="$NAME" --project="$PROJECT" 2>/dev/null)
  if [ $? -eq 0 ]; then
    echo "$VALUE"
  else
    echo -e "${RED}❌ Not found or access denied: $NAME${NC}"
    exit 1
  fi
}

cmd_list() {
  echo -e "${BLUE}GCP Secret Manager${NC} (project=${PROJECT})"
  echo ""
  gcloud secrets list --project="$PROJECT" --format="table(name,createTime.date('%Y-%m-%d'),replication.automatic)" 2>/dev/null
  echo ""
  local COUNT
  COUNT=$(gcloud secrets list --project="$PROJECT" --format="value(name)" 2>/dev/null | wc -l | tr -d ' ')
  echo -e "Total: ${GREEN}${COUNT}${NC}"
}

cmd_check() {
  local NAME="$1"
  if [ -z "$NAME" ]; then
    echo -e "${RED}Usage: secret check <NAME>${NC}"
    exit 1
  fi
  local DESC
  DESC=$(gcloud secrets describe "$NAME" --project="$PROJECT" --format="yaml(name,createTime,replication)" 2>/dev/null)
  if [ -n "$DESC" ]; then
    echo -e "${GREEN}✅ Exists${NC} — $NAME"
    gcloud secrets versions list "$NAME" --project="$PROJECT" --limit=3 --format="table(name,state,createTime.date('%Y-%m-%d %H:%M'))" 2>/dev/null
  else
    echo -e "${RED}❌ Not found${NC} — $NAME"
    exit 1
  fi
}

cmd_env() {
  if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}.env not found: $ENV_FILE${NC}"
    echo "Set SECRET_ENV_FILE or run from a directory with .env"
    exit 1
  fi

  echo -e "${BLUE}Syncing Secret Manager → .env${NC} ($ENV_FILE)"
  echo ""

  local UPDATED=0
  local SKIPPED=0
  local NOTFOUND=0

  while IFS='=' read -r KEY VALUE; do
    [[ "$KEY" =~ ^#.*$ || -z "$KEY" ]] && continue
    KEY=$(echo "$KEY" | tr -d ' ')

    local SM_VALUE
    SM_VALUE=$(gcloud secrets versions access latest --secret="$KEY" --project="$PROJECT" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$SM_VALUE" ]; then
      local CURRENT
      CURRENT=$(grep "^${KEY}=" "$ENV_FILE" | head -1 | cut -d'=' -f2-)
      if [ "$CURRENT" != "$SM_VALUE" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
          sed -i '' "s|^${KEY}=.*|${KEY}=${SM_VALUE}|" "$ENV_FILE"
        else
          sed -i "s|^${KEY}=.*|${KEY}=${SM_VALUE}|" "$ENV_FILE"
        fi
        echo -e "  ${GREEN}↻${NC} $KEY"
        UPDATED=$((UPDATED + 1))
      else
        SKIPPED=$((SKIPPED + 1))
      fi
    else
      NOTFOUND=$((NOTFOUND + 1))
    fi
  done < "$ENV_FILE"

  echo ""
  echo -e "Updated ${GREEN}${UPDATED}${NC} / Unchanged ${SKIPPED} / Not in SM ${NOTFOUND}"
}

# --- Main ---
case "${1:-}" in
  add)   cmd_add "$2" ;;
  get)   cmd_get "$2" ;;
  list)  cmd_list ;;
  check) cmd_check "$2" ;;
  env)   cmd_env ;;
  -h|--help|help) usage ;;
  *)     cmd_interactive ;;
esac
