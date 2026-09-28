#!/usr/bin/env bash
# 스캔본(글자층 없는 PDF)을 kordoc(PP-OCRv5 한국어, 로컬)으로 읽어 text/<연도>/ 에 저장
# 사용: bash scripts/ocr_kordoc.sh 2027 1 3 6   (연도, 이어서 게시 번호들 — extract.py 가 LOW 로 찍은 번호)
# 최초 1회: npm i -g kordoc@^4 sharp onnxruntime-node  (모델 약 18MB 자동 다운로드)
set -e
Y=$1; shift
for n in "$@"; do
  f=$(ls "raw/$Y/" | grep -E "^$n\. .*\.pdf$")
  name=$(echo "$f" | sed -E 's/^[0-9]+\. *//; s/ 정관\.pdf$//; s/\.pdf$//')
  out=$(printf "text/%s/%02d_%s.txt" "$Y" "$n" "$name")
  npx kordoc --ocr -o /tmp/kd.md "raw/$Y/$f" >/dev/null
  sed -E '/^!\[image\]\(images\//d' /tmp/kd.md > "$out"
  echo "$out"
done
