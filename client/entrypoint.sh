#!/bin/sh
set -e

ASSETS=/opt/app-assets
ROOT=/usr/share/nginx/html
HTML=$ROOT/index.html

cp -a "$ASSETS"/. "$ROOT"/

for var in $(env | grep '^VITE_' | cut -d= -f1); do
  placeholder="__${var}__"
  # & \ and | are special in a sed replacement, | being our delimiter
  value=$(printenv "$var" | sed 's/[&|\]/\\&/g')
  sed -i "s|${placeholder}|${value}|g" "$HTML"
done

if grep -q '__VITE_[A-Z0-9_]*__' "$HTML"; then
  echo "entrypoint: unresolved config placeholders in index.html:" >&2
  grep -o '__VITE_[A-Z0-9_]*__' "$HTML" | sort -u >&2
fi

exec nginx -g "daemon off;"
