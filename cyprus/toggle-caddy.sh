#!/usr/bin/env bash
# toggle-caddy.sh: Caddy on http://localhost:8080/ (this folder, Caddyfile) when it is off; stops it when it is on
cd "$(dirname "$0")"
if caddy stop > /dev/null 2>&1; then
  echo "Caddy stopped"
else
  caddy start --config Caddyfile --adapter caddyfile > /tmp/caddy.log 2>&1 && echo "Caddy on http://localhost:8080/ (log: /tmp/caddy.log)"
fi
