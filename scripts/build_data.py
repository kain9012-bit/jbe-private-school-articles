"""review/<연도>/*.json + text/diff_<전년>_<연도>.json → web/src/data/data.json

python scripts/build_data.py 2026 2025
"""
import json, glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YEAR = sys.argv[1] if len(sys.argv) > 1 else '2026'
PREV = sys.argv[2] if len(sys.argv) > 2 else str(int(YEAR) - 1)

diff_path = os.path.join(ROOT, 'text', f'diff_{PREV}_{YEAR}.json')
diff = {d['no']: d for d in json.load(open(diff_path, encoding='utf-8'))} if os.path.exists(diff_path) else {}
LEVEL_ORDER = {'저촉': 0, '미반영': 1, '누락': 2, '확인필요': 3, '정비': 4}


def change_state(no):
    d = diff.get(no)
    if not d: return None
    if d['identical']: return '동일'
    if not (d['changed'] or d['added'] or d['removed']): return '형식만 변경'
    if d['ratio'] < 0.5: return '대조 불가'  # 스캔본↔텍스트 등 형식 차이
    return '개정'


rep_path = os.path.join(ROOT, 'text', f'{YEAR}_report.json')
# 글자층 없는 PDF = 스캔본 → OCR 본문
SCANNED = {r['no'] for r in json.load(open(rep_path, encoding='utf-8')) if r['ext'] == '.pdf' and (r.get('ocr') or r['chars'] < 3000)} if os.path.exists(rep_path) else set()
corps = []
for p in sorted(glob.glob(os.path.join(ROOT, 'review', YEAR, '*.json'))):
    r = json.load(open(p, encoding='utf-8'))
    d = diff.get(r['no'], {})
    findings = sorted(r['findings'], key=lambda f: (LEVEL_ORDER.get(f['level'], 9), f['item'][0], int(f['item'][1:])))
    corps.append({
        'no': r['no'], 'name': r['name'], 'lastAmended': r.get('last_amended'),
        'schools': r.get('schools', []), 'univ': bool(r.get('has_university')),
        'board': r.get('board', {}), 'ocr': r['no'] in SCANNED,
        'change': change_state(r['no']),
        'changedArticles': (d.get('changed', []) + d.get('added', []))[:40],
        'notes': r.get('notes', ''),
        'students': r.get('students', []),
        'findings': [{k: f.get(k) for k in ('item', 'level', 'article', 'quote', 'law', 'law_quote', 'issue', 'fix', 'audit')} for f in findings],
    })

out = {'year': YEAR, 'prev': PREV, 'corps': corps}
lawmap = [{'no': r['no'], 'name': r['name'], 'map': r['law_map']} for r in (json.load(open(p, encoding='utf-8')) for p in sorted(glob.glob(os.path.join(ROOT, 'review', YEAR, '*.json'))))]
lm = os.path.join(ROOT, 'web', 'public', 'lawmap.json'); os.makedirs(os.path.dirname(lm), exist_ok=True)
json.dump(lawmap, open(lm, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
dst = os.path.join(ROOT, 'web', 'src', 'data', 'data.json')
os.makedirs(os.path.dirname(dst), exist_ok=True)
json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(dst, len(corps), '법인', sum(len(c['findings']) for c in corps), '건', os.path.getsize(dst) // 1024, 'KB')
