"""전년도 ↔ 올해 정관 대조 → 개정 여부 판정. python scripts/diff.py 2025 2026"""
import os, re, sys, json, difflib
def norm(t):
    # 공백·줄바꿈·문장부호 차이는 개정으로 보지 않음(hwp→pdf 변환 잡음)
    return re.sub(r'[\s\u3000\u00b7\u318d\u2024\u2027\u30fb.,:;\-<>〈〉「」『』"\'“”‘’]', '', t)
def articles(t):
    # 본문 조문 단위(제N조(제목)) 로 나눔 — 목차 줄은 제외
    t = norm(t); out = {}
    for m in re.finditer(r'제(\d+조(?:의\d+)?)\(([^)]{1,30})\)(.*?)(?=제\d+조(?:의\d+)?\([^)]{1,30}\)|부칙|\Z)', t, re.S):
        k = m.group(1)
        if len(m.group(0)) > 25: out.setdefault(k, m.group(0))  # 목차 줄(제목만) 제외  # 첫 번째(본문) — 목차는 괄호 형식이 달라 대개 안 걸림
    return out
def main(a, b):
    ra = {r['no']: r for r in json.load(open(f'text/{a}_report.json', encoding='utf-8'))}
    rb = json.load(open(f'text/{b}_report.json', encoding='utf-8'))
    res = []
    for r in rb:
        fa = f"text/{a}/{r['no']:02d}_{ra[r['no']]['name']}.txt" if r['no'] in ra else None
        fb = f"text/{b}/{r['no']:02d}_{r['name']}.txt"
        ta = open(fa, encoding='utf-8').read() if fa and os.path.exists(fa) else ''
        tb = open(fb, encoding='utf-8').read()
        na, nb = norm(ta), norm(tb)
        ratio = difflib.SequenceMatcher(None, na, nb, autojunk=False).quick_ratio() if na and nb else 0
        same = na == nb
        A, B = articles(ta), articles(tb)
        changed = sorted([k for k in B if k in A and A[k] != B[k]], key=lambda s: [int(x) for x in re.findall(r'\d+', s)])
        added = [k for k in B if k not in A]; removed = [k for k in A if k not in B]
        res.append(dict(no=r['no'], name=r['name'], prev_name=ra.get(r['no'], {}).get('name'), fmt_prev=ra.get(r['no'], {}).get('ext'), fmt=r['ext'],
                        identical=same, ratio=round(ratio, 4), n_art=len(B), changed=changed, added=added, removed=removed,
                        ocr=bool(r.get('ocr') or ra.get(r['no'], {}).get('ocr'))))
    json.dump(res, open(f'text/diff_{a}_{b}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for x in res:
        tag = '동일' if x['identical'] else ('변경' if (x['changed'] or x['added'] or x['removed']) else '형식만')
        print(f"{x['no']:2d} {x['name']:<10} {tag:<4} {x['fmt_prev']}->{x['fmt']} r={x['ratio']} 조={x['n_art']} 변경{len(x['changed'])} 신설{len(x['added'])} 삭제{len(x['removed'])} {'OCR' if x['ocr'] else ''} {x['changed'][:8]}")
if __name__ == '__main__': main(sys.argv[1], sys.argv[2])
