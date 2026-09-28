# 학교법인 정관 점검

전북특별자치도교육청 누리집에 해마다 공개되는 학교법인 정관을
현행 사립학교법·시행령과 항목별로 대조한 결과, 그리고 그 결과를 보여주는 화면.

- 대상: [교육청 누리집 학교법인정관](https://www.jbe.go.kr/board/list.jbe?boardId=BBS_0000088&menuCd=DOM_000000106004002000&contentsSid=344) 2026.3.1. 기준 71개 법인
- 기준 법령: 사립학교법(2026.5.12. 시행) · 시행령(2025.12.23.) — legalize-kr 미러, 2026.9.23. 커밋
- 판정 구분: 저촉 / 미반영 / 누락 / 확인필요 / 정비 (`checklist.md`)
- 1차 결과(2026.9.28.): 지적 890건 — 저촉 있는 법인 50 · 미반영 67 · 누락 19

## 폴더

| 경로 | 내용 |
|---|---|
| `raw/<연도>/` | 게시판 zip 을 푼 원본(hwp·hwpx·pdf) |
| `text/<연도>/` | 본문 텍스트. 스캔본 6곳은 OCR 본문 |
| `text/diff_<전년>_<연도>.json` | 전년 대비 조문 단위 개정 여부 |
| `law/` | 현행 법령 원문(md) · `_현행법령목록.txt` |
| `checklist.md` | 점검 항목표(A~J, 약 60개)와 판정 기준 |
| `REVIEW_PROMPT.md` | 법인별 점검 작업 지시(세션에서 Claude 가 이것대로 점검) |
| `review/<연도>/*.json` | 법인별 결과 — 지적(findings)·정관↔법 조문 대응표(law_map) |
| `audit_*.{md,json}` | '저촉' 판정 독립 재검토 기록 |
| `scripts/` | 수집·추출·OCR·대조·검증·화면 자료 만들기 |
| `web/` | 화면(Vite + React, jbe-ordinance-check 와 같은 틀) |

## 해마다 갱신

1. `python scripts/collect.py 2027` — 새 공개본 받기
2. `python scripts/extract.py 2027` — 본문 추출. `LOW` 로 찍힌 스캔본은 `scripts/ocr.py 2027`
   (tesseract 한국어 데이터 `tools/kor.traineddata` 필요)
3. `python scripts/diff.py 2026 2027` — '변경'으로 잡힌 법인만 재점검 대상
4. 세션에서 Claude 에게 재점검 요청 → `REVIEW_PROMPT.md` 대로 `review/2027/` 작성,
   바뀌지 않은 법인은 `review/2026/` 결과 복사
5. `python scripts/verify.py review/2027` — 인용문이 원문과 맞는지 검사. 통과 전 발행 금지
6. `python scripts/build_data.py 2027 2026` → `web/` 빌드·배포

## 법령이 개정됐을 때

화면 '항목별 · 조문별' 탭의 **법 조문으로 정관 찾기**에 바뀐 조문(예: `제20조`, `영 제8조의3`)을 넣으면
대응하는 정관 조문이 법인별로 나옴. 그 조문만 전 법인 재점검.

## 화면 띄우기

```bash
cd web
npm install
npm run dev     # http://localhost:3000
npm run build   # dist/
```

버셀 배포는 `web/vercel.json` 그대로 (Root Directory 를 `web` 으로).

## 한계

- AI 1차 판정 — 법률 자문 아님. 시정 요구 전 담당자 확인
- 스캔본 OCR 본문은 숫자 오독 가능 → 애매하면 '확인필요'
- 교원징계위원회 위원 수는 교육행정자료(2026) 학생 수(`students_2026.json`)로 판정. 200명 이상·미만 학교가 섞인 법인은 '확인필요'
- 송파학원(전남)·호남기독학원(광주)은 전북 소재 학교 때문에 공개 대상. 법인 사무소가 다른 시·도라 관할청 명칭 판정 생략
