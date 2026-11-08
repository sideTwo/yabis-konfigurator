#!/usr/bin/env bash
# Zerlegt die Artlist-Clips aus bilder/artlist/flug-*.mp4 in Einzelbilder (WebP, 1920 px) für den Flugspieler.
#   bash _quelle/flug-bilder.sh
# Danach in js/daten.js bei FLUEGE die ausgegebene Bildzahl als "bilder" eintragen.
set -euo pipefail
FF="/c/Users/bilal/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe"
cd "$(dirname "$0")/.."
for clip in bilder/artlist/flug-*.mp4; do
  [ -e "$clip" ] || { echo "Keine Clips in bilder/artlist/"; exit 0; }
  name=$(basename "$clip" .mp4)
  rm -rf "bilder/fluege/$name"; mkdir -p "bilder/fluege/$name"
  "$FF" -v error -i "$clip" -vf "fps=30,scale=1920:1080:flags=lanczos" -c:v libwebp -quality 78 -start_number 0 "bilder/fluege/$name/%03d.webp"
  echo "$name: $(ls bilder/fluege/$name | wc -l) Bilder"
done
