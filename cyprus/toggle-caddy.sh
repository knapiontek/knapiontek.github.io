#!/usr/bin/env bash
caddy file-server --listen :8080 > /tmp/caddy.log 2>&1 &
