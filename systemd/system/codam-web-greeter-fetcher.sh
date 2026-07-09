#!/bin/bash

# Exit on error
set -e

# Get the data-server-url variable from the config file and append the hostname
DATA_SERVER_URL=$(/usr/bin/grep -Po '(?<=data-server-url=).*' /usr/share/web-greeter/themes/codam/settings.ini | /usr/bin/sed 's/^"\(.*\)"$/\1/')
DATA_SERVER_URL="$DATA_SERVER_URL$(/usr/bin/hostname)"

/usr/bin/echo "Starting run at $(/usr/bin/date)"
/usr/bin/echo "Fetching data from $DATA_SERVER_URL..."

# Get the data from the data server with timeout
DATA=$(/usr/bin/curl -s --connect-timeout 3 --max-time 30 "$DATA_SERVER_URL")

# Check if the data is valid JSON
if ! /usr/bin/jq -e . >/dev/null 2>&1 <<<"$DATA"; then
	/usr/bin/echo "Invalid JSON data received from data server"
	exit 1
else
	/usr/bin/echo "Valid JSON data received from data server"
fi


source /usr/share/42/berlin.conf 2>/dev/null || true

# Replace the messages in the data with the GREETER_MSG from the config file
if [ -n "$GREETER_MSG" ]; then
	DATA=$(/usr/bin/jq --arg msg "$GREETER_MSG" '.message = $msg' <<< "$DATA")
fi

if [ -n "$GREETER_BUBBLE_MSG" ]; then
	DATA=$(/usr/bin/jq --arg msg "$GREETER_BUBBLE_MSG" '.bubble_message = $msg' <<< "$DATA")
fi

if [ -n "$GREETER_BACKGROUND_VIDEO" ]; then
	DATA=$(/usr/bin/jq --argjson val "$GREETER_BACKGROUND_VIDEO" '.background_video = $val' <<< "$DATA")
fi

if [ -n "$MODE" ]; then
	DATA=$(/usr/bin/jq --arg msg "$MODE" '.mode = $msg' <<< "$DATA")
fi

# Wallpaper image path used only in default mode (other modes have their own wallpaper).
# When empty/unset, the animated gradient background is shown instead.
if [ -n "$GREETER_DEFAULT_WALLPAPER" ]; then
	DATA=$(/usr/bin/jq --arg val "$GREETER_DEFAULT_WALLPAPER" '.default_wallpaper = $val' <<< "$DATA")
fi

# Maintenance mode: LOGIN=disabled replaces the login form with a maintenance notice
if [ -n "$LOGIN" ]; then
	DATA=$(/usr/bin/jq --arg val "$LOGIN" '.login = $val' <<< "$DATA")
fi

# Machine diagnostics for the IT panel (best-effort; empty fields are fine)
IP_ADDR=$(/usr/bin/hostname -I 2>/dev/null | /usr/bin/awk '{print $1}' || true)
DEFAULT_IFACE=$(/usr/sbin/ip route show default 2>/dev/null | /usr/bin/awk '/default/ {print $5; exit}' || true)
MAC_ADDR=$(/usr/bin/cat "/sys/class/net/${DEFAULT_IFACE}/address" 2>/dev/null || true)
UPTIME=$(/usr/bin/uptime -p 2>/dev/null || true)
DISK=$(/usr/bin/df -h / 2>/dev/null | /usr/bin/awk 'NR==2 {print $5" ("$3"/"$2")"}' || true)

DATA=$(/usr/bin/jq \
	--arg ip "$IP_ADDR" --arg mac "$MAC_ADDR" \
	--arg uptime "$UPTIME" --arg disk "$DISK" --arg version "$VERSION" \
	'.diagnostics = {ip: $ip, mac: $mac, uptime: $uptime, disk: $disk, config_version: $version}' <<< "$DATA")

# Last real user who logged in on this machine (skip shared/system accounts)
LAST_USER=$(/usr/bin/last -w 2>/dev/null | /usr/bin/awk '{print $1}' | /usr/bin/grep -vE '^(bocal|exam|checkin|event|root|lightdm|reboot|shutdown|wtmp)$' | /usr/bin/grep -vE '^$' | /usr/bin/head -1 || true)
DATA=$(/usr/bin/jq --arg val "$LAST_USER" '.last_user = $val' <<< "$DATA")

# Create a file for the data with the correct permissions and store the data in it
DATA_FILE="/usr/share/web-greeter/themes/codam/data.json"
/usr/bin/touch "$DATA_FILE"
/usr/bin/chmod 644 "$DATA_FILE"
/usr/bin/chown codam-web-greeter:codam-web-greeter "$DATA_FILE"
/usr/bin/echo "$DATA" > "$DATA_FILE"

/usr/bin/echo "Data fetched successfully and saved to $DATA_FILE"
