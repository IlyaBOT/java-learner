#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
classes_dir="$(mktemp -d)"
trap 'rm -r "$classes_dir"' EXIT

if ! command -v javac >/dev/null || ! command -v java >/dev/null; then
  echo 'Нужен JDK 8+ с java и javac в PATH.' >&2
  exit 1
fi

if javac -help 2>&1 | grep -q -- '--release'; then
  target=(--release 8)
else
  target=(-source 8 -target 8)
fi

javac "${target[@]}" -encoding UTF-8 -d "$classes_dir" "$project_root/examples/Hello.java" "$project_root/tests/Verifier.java" "$project_root"/work/ch*/*.java
hello="$(java -cp "$classes_dir" Hello)"
if [[ "$hello" != JAVA_READY ]]; then
  echo "Пример Hello сломан: $hello" >&2
  exit 1
fi
echo '[PASS] пример Hello'

pending=0
checked=0
for chapter_file in "$project_root"/work/ch*/*.java; do
  chapter="$(basename "$(dirname "$chapter_file")")"
  chapter="${chapter#ch}"
  if grep -Eq '^[[:space:]]*// TODO:' "$chapter_file"; then
    echo "[PENDING] глава $chapter: $(basename "$chapter_file")"
    pending=$((pending + 1))
    continue
  fi
  echo "[CHECK] глава $chapter"
  java -cp "$classes_dir" Verifier "$chapter"
  checked=$((checked + 1))
done
echo "Проверено: $checked / 12. Ожидают решения: $pending / 12."
