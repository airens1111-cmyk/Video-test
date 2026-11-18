#!/bin/bash
cd "$(dirname "$0")/../video"
for b in cry shock; do
  s=$(date +%s)
  npx remotion render out/bundle Pose-$b ../stage1/action/$b.mp4 --concurrency=2 --crf=20 --timeout=240000 --log=error
  echo "$b rendered in $(( $(date +%s)-s ))s"
done
npx remotion still out/bundle Pose-cry ../stage1/action/cry_still.png --frame=60 --timeout=240000 --log=error
npx remotion still out/bundle Pose-shock ../stage1/action/shock_still.png --frame=70 --timeout=240000 --log=error
npx remotion still out/bundle Faces-sheet ../stage1/faces/faces_sheet.png --timeout=120000 --log=error
npx remotion render out/bundle Faces-anim ../stage1/faces/faces_anim.mp4 --concurrency=3 --crf=20 --timeout=120000 --log=error
echo done
