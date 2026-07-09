#!/usr/bin/env bash
#
# Quick-deploy the greeter theme to a test machine.
#
# Usage:
#   ./deploy.sh [ssh-host] [--restart] [--no-build]
#
#   ssh-host     Host alias from your ~/.ssh/config (the one that sets up the
#                ProxyJump through cluster.42berlin.de). Defaults to "dump-old".
#                Override via arg or the DEPLOY_HOST env var.
#   --no-restart Don't restart lightdm afterwards (by default it IS restarted,
#                which kicks any active session, so the changes show immediately).
#   --no-build   Skip `make build` and deploy the existing dist/ as-is.
#   --no-systemd Skip installing the systemd scripts. By default they ARE
#                installed (via systemd/install.sh) — needed for the
#                diagnostics/last-user data, reboot-after-logout, etc. — and the
#                fetcher is run once afterwards.
#
# Note: this deploys the greeter THEME only (client + static → dist/). Changes to
# the systemd scripts (fetcher/idler) live elsewhere and need `sudo bash
# systemd/install.sh` on the target separately.
set -euo pipefail

HOST="${DEPLOY_HOST:-dump-old}"
RESTART=1
BUILD=1
SYSTEMD=1
for arg in "$@"; do
	case "$arg" in
		--no-restart) RESTART=0 ;;
		--no-build)   BUILD=0 ;;
		--no-systemd) SYSTEMD=0 ;;
		-h|--help)    sed -n '2,25p' "$0"; exit 0 ;;
		--*)          echo "Unknown option: $arg" >&2; exit 1 ;;
		*)            HOST="$arg" ;;
	esac
done

DEST="/usr/share/web-greeter/themes/codam/"
STAGE="/tmp/codam-greeter-dist/"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$BUILD" -eq 1 ]; then
	echo "==> Building (make build)..."
	make -C "$ROOT_DIR" build
fi

if [ ! -d "$ROOT_DIR/dist" ]; then
	echo "No dist/ found — run without --no-build first." >&2
	exit 1
fi

echo "==> Uploading dist/ to $HOST:$STAGE ..."
rsync -az --delete --exclude='*.bk' "$ROOT_DIR/dist/" "$HOST:$STAGE"

# Install into the (root-owned) theme dir. --exclude=data.json keeps the machine's
# fetched data; ssh -t lets sudo prompt for a password if needed.
echo "==> Installing into $HOST:$DEST (sudo; keeps data.json)..."
ssh -t "$HOST" "sudo rsync -a --delete --exclude=data.json '$STAGE' '$DEST'"

if [ "$SYSTEMD" -eq 1 ]; then
	SYSTEMD_STAGE="/tmp/codam-greeter-systemd/"
	echo "==> Uploading systemd/ and running install.sh on $HOST (sudo)..."
	rsync -az --delete "$ROOT_DIR/systemd/" "$HOST:$SYSTEMD_STAGE"
	ssh -t "$HOST" "sudo bash '${SYSTEMD_STAGE}install.sh' && sudo systemctl start codam-web-greeter.service"
fi

if [ "$RESTART" -eq 1 ]; then
	echo "==> Restarting greeter (lightdm) on $HOST ..."
	ssh -t "$HOST" "sudo systemctl restart lightdm"
else
	echo "Skipped lightdm restart (--no-restart). Run: ssh $HOST 'sudo systemctl restart lightdm'"
fi

echo "==> Done."
