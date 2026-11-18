#!/bin/bash
# Renders the stage-1 checks. Usage: tools/render_stage1.sh flyovers|stills [ids...]
set -e
cd "$(dirname "$0")/../video"
what=$1; shift
if [ "$what" = flyovers ]; then
  for f in ${@:-F1 F2 F3 F4 F5 F6 F7 F8}; do
    s=$(date +%s)
    npx remotion render out/bundle Fly-$f ../stage1/flyovers/$f.mp4 --scale=0.5 --concurrency=2 --crf=24 --timeout=240000 --log=error
    echo "$f rendered in $(( $(date +%s)-s ))s"
  done
else
  for f in ${@:-dawn battle sunset burning}; do
    s=$(date +%s)
    npx remotion still out/bundle Still-$f ../stage1/stills/$f.png --log=error
    echo "still $f rendered in $(( $(date +%s)-s ))s"
  done
fi
