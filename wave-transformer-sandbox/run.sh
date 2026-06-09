#!/usr/bin/env sh

set -eu

cd "$(dirname "$0")"

echo "Budowanie obrazu wave-transformer-sandbox..."
docker compose build

# Usuń poprzedni kontener projektu, aby jego port mógł zostać ponownie użyty.
docker compose down --remove-orphans >/dev/null 2>&1 || true

is_port_free() {
  port="$1"

  if command -v lsof >/dev/null 2>&1; then
    ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
  elif command -v nc >/dev/null 2>&1; then
    ! nc -z 127.0.0.1 "$port" >/dev/null 2>&1
  else
    ! docker ps --format '{{.Ports}}' | grep -q "0.0.0.0:${port}->"
  fi
}

APP_PORT=""
port=5173
while [ "$port" -le 5199 ]; do
  if is_port_free "$port"; then
    APP_PORT="$port"
    break
  fi
  port=$((port + 1))
done

if [ -z "$APP_PORT" ]; then
  echo "Brak wolnego portu w zakresie 5173-5199." >&2
  exit 1
fi

export APP_PORT
docker compose up -d --no-build

echo ""
echo "Aplikacja działa pod adresem: http://localhost:${APP_PORT}"
echo "Zatrzymanie: docker compose down"
