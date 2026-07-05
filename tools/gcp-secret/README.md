# secret — GCP Secret Manager CLI Wrapper

> One command to rule your secrets. Clipboard → GCP Secret Manager in 3 seconds.

Managing secrets with `gcloud` is verbose:

```bash
# Without secret.sh (the old way)
echo -n "my-api-key-value" | gcloud secrets create MY_API_KEY \
  --project=my-project --data-file=- --replication-policy=automatic

gcloud secrets versions access latest --secret=MY_API_KEY --project=my-project
```

```bash
# With secret.sh
secret add MY_API_KEY    # Reads from clipboard, done.
secret get MY_API_KEY    # Prints the value.
```

## Install

```bash
# Download
curl -o ~/.local/bin/secret https://raw.githubusercontent.com/gdsajin-byte/monkos-ai/main/tools/gcp-secret/secret.sh
chmod +x ~/.local/bin/secret

# Or clone and alias
git clone https://github.com/gdsajin-byte/monkos-ai.git
echo 'alias secret="/path/to/monkos-ai/tools/gcp-secret/secret.sh"' >> ~/.zshrc
```

### Prerequisites

- `gcloud` CLI installed and authenticated (`gcloud auth login`)
- GCP project with **Secret Manager API** enabled
- macOS (`pbpaste`), Linux (`xclip`/`xsel`/`wl-paste`), or WSL (`powershell.exe`)

## Usage

### Register a secret (clipboard → Secret Manager)

```bash
# Copy your API key to clipboard first (Cmd+C / Ctrl+C)
secret add MY_API_KEY
# → ✅ Done — MY_API_KEY (version 1)
```

### Interactive mode

```bash
secret
# → Prompts for name, reads value from clipboard
```

### Retrieve a secret

```bash
secret get MY_API_KEY
# → prints the value to stdout
```

### Check if a secret exists

```bash
secret check MY_API_KEY
# → ✅ Exists — MY_API_KEY
# → Shows latest 3 versions with timestamps
```

### List all secrets

```bash
secret list
# → Table of all secrets in the project
```

### Sync Secret Manager → .env

```bash
secret env
# → Compares each key in .env against Secret Manager
# → Updates values that differ
# → Reports: Updated 3 / Unchanged 12 / Not in SM 2
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `GCP_SECRET_PROJECT` | Current `gcloud` project | GCP project ID |
| `SECRET_ENV_FILE` | `./.env` | Path to .env file for `secret env` |

```bash
# Example: use a specific project
export GCP_SECRET_PROJECT=my-production-project
secret list
```

## Why clipboard?

Secret values should never appear in shell history. `secret.sh` reads from the system clipboard instead of command-line arguments, so your API keys stay out of `~/.zsh_history`.

## Commands

| Command | Description |
|---------|-------------|
| `secret` | Interactive registration |
| `secret add <NAME>` | Register from clipboard |
| `secret get <NAME>` | Retrieve value |
| `secret check <NAME>` | Existence + version info |
| `secret list` | List all secrets |
| `secret env` | Sync SM → .env |
| `secret help` | Show help |

## License

MIT — by [MONKOS](https://monkos.ai)
