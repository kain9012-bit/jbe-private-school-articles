"""정관 전문을 조문 단위로 나누고, 지적(findings)의 인용문 위치를 표시해 화면용 파일로 쓴다.

python scripts/build_articles.py 2026
→ web/public/articles/<번호>.json  (법인을 고를 때만 받아 옴)

한 조문 = {id, head, title, paras:[[{t, f?}...]...]}
  t: 글자, f: 이 글자 조각이 걸린 지적 번호(법인 findings 배열 순서, build_data.py 의 정렬과 같음)
"""
import json, os, re, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YEAR = sys.argv[1] if len(sys.argv) > 1 else '2026'
LEVEL_ORDER = {'저촉': 0, '미반영': 1, '누락': 2, '확인필요': 3, '정비': 4}
SKIP = re.compile(r'[\s　·ㆍ․⋅.,:;\-<>〈〉「」『』"\'“”‘’()（）\[\]\\*]')

# 새 문단이 시작되는 줄 — 그 밖의 줄은 앞 줄에 이어 붙인다(pdf 줄바꿈 복원)
PARA_START = re.compile(r'^(제\s*\d+\s*(조|장|절|관)|[①-⑳]|\(?\d{1,2}\s*[.)]\s|\d{1,2}의\d\.|[가-하]\s*[.)]\s|<|부\s*칙|\[?별\s*표|\||=|#)')
ART = re.compile(r'^제\s*(\d+)\s*조\s*(의\s*\d+)?\s*[\(（]\s*([^)）]{0,40})[)）]?')
SECTION = re.compile(r'^(제\s*\d+\s*(장|절|관)\s*.{0,30}|부\s*칙.*)$')


def clean_lines(text):
    out = []
    for raw in text.split('\n'):
        l = raw.strip()
        l = re.sub(r'^#+\s*', '', l)            # kordoc 마크다운 머리
        l = re.sub(r'^-\s+(?=[①-⑳\d가-하])', '', l)  # kordoc 목록 기호
        if not l or l.startswith('![image]'):
            continue
        if out and not PARA_START.match(l) and not SECTION.match(l):
            prev = out[-1]
            # 한글 사이 줄바꿈은 붙이고, 그 밖은 한 칸 띄움
            out[-1] = prev + ('' if re.search(r'[가-힣]$', prev) and re.match(r'^[가-힣]', l) else ' ') + l
        else:
            out.append(l)
    return out


def split_articles(lines):
    blocks, cur = [], {'id': 'front', 'head': '머리말', 'title': '', 'lines': []}
    for l in lines:
        m = ART.match(l)
        if m:
            blocks.append(cur)
            head = f"제{m.group(1)}조" + (re.sub(r'\s', '', m.group(2)) if m.group(2) else '')
            cur = {'id': head, 'head': head, 'title': m.group(3).strip(), 'lines': [l]}
        elif SECTION.match(l) and len(l) < 40:
            blocks.append(cur)
            cur = {'id': f"sec{len(blocks)}", 'head': re.sub(r'\s+', ' ', l), 'title': '', 'section': True, 'lines': []}
        else:
            cur['lines'].append(l)
    blocks.append(cur)
    # 같은 조번호가 목차·부칙에 또 나오면 id 가 겹치지 않게
    seen = {}
    for b in blocks:
        k = b['id']; seen[k] = seen.get(k, 0) + 1
        if seen[k] > 1: b['id'] = f"{k}~{seen[k]}"
    return [b for b in blocks if b['lines'] or b.get('section')]


def norm_map(s):
    """공백·문장부호를 뺀 문자열과, 그 각 글자의 원래 위치."""
    chars, idx = [], []
    for i, ch in enumerate(s):
        if not SKIP.match(ch):
            chars.append(ch); idx.append(i)
    return ''.join(chars), idx


def build(stem, corp_findings, scanned):
    text = open(os.path.join(ROOT, 'text', YEAR, stem + '.txt'), encoding='utf-8').read()
    blocks = split_articles(clean_lines(text))
    # 조문마다 문단 문자열
    for b in blocks:
        b['paras'] = b.pop('lines')
    # 전체를 한 줄로 이어 인용문 위치를 찾는다
    flat, owner = [], []   # owner[i] = (block, para, char)
    for bi, b in enumerate(blocks):
        for pi, p in enumerate(b['paras']):
            for ci, ch in enumerate(p):
                flat.append(ch); owner.append((bi, pi, ci))
            flat.append('\n'); owner.append(None)
    flat = ''.join(flat)
    nflat, nidx = norm_map(flat)
    marks = {}  # (bi,pi) -> list of (start,end,f)
    anchors = {}
    for fi, f in enumerate(corp_findings):
        q = f.get('quote') or ''
        nq, _ = norm_map(q)
        hit = None
        if len(nq) >= 4:
            # 본문 첫 등장 대신, 지적한 조문 안의 등장을 우선
            starts = [m.start() for m in re.finditer(re.escape(nq), nflat)]
            if starts:
                art = re.sub(r'\s', '', (f.get('article') or '').split('외')[0])
                pick = starts[0]
                for s in starts:
                    o = owner[nidx[s]]
                    if o and blocks[o[0]]['head'] == art:
                        pick = s; break
                a, z = nidx[pick], nidx[pick + len(nq) - 1]
                hit = (a, z)
        if hit:
            a, z = hit
            o1 = owner[a]
            # 여러 문단에 걸치면 문단마다 나눠 표시
            i = a
            while i <= z:
                o = owner[i]
                if o is None: i += 1; continue
                bi, pi, ci = o
                plen = len(blocks[bi]['paras'][pi])
                end_ci = min(plen - 1, ci + (z - i))
                marks.setdefault((bi, pi), []).append((ci, end_ci + 1, fi))
                i += (end_ci - ci) + 2
            anchors[fi] = blocks[o1[0]]['id']
        else:
            # 인용 위치를 못 찾거나(누락 등) 인용이 없으면 조문 머리로 붙인다
            art = re.sub(r'\s', '', (f.get('article') or '').split('외')[0])
            b = next((b for b in blocks if b['head'] == art), None)
            anchors[fi] = b['id'] if b else None
    # 문단을 조각으로
    for bi, b in enumerate(blocks):
        segs_all = []
        for pi, p in enumerate(b['paras']):
            ms = sorted(marks.get((bi, pi), []))
            segs, pos = [], 0
            for s, e, fi in ms:
                if s < pos: s = pos
                if s >= e: continue
                if s > pos: segs.append({'t': p[pos:s]})
                segs.append({'t': p[s:e], 'f': fi})
                pos = e
            if pos < len(p): segs.append({'t': p[pos:]})
            segs_all.append(segs)
        b['paras'] = segs_all
        b['findings'] = sorted({fi for fi, bid in anchors.items() if bid == b['id']})
    orphan = sorted(fi for fi, bid in anchors.items() if bid is None)
    return {'blocks': blocks, 'orphan': orphan, 'scanned': scanned}


def main():
    rep_path = os.path.join(ROOT, 'text', f'{YEAR}_report.json')
    scanned = {r['no'] for r in json.load(open(rep_path, encoding='utf-8')) if r['ext'] == '.pdf' and (r.get('ocr') or r['chars'] < 3000)} if os.path.exists(rep_path) else set()
    out_dir = os.path.join(ROOT, 'web', 'public', 'articles'); os.makedirs(out_dir, exist_ok=True)
    stats = []
    for p in sorted(glob.glob(os.path.join(ROOT, 'review', YEAR, '*.json'))):
        r = json.load(open(p, encoding='utf-8'))
        stem = os.path.basename(p)[:-5]
        fs = sorted(r['findings'], key=lambda f: (LEVEL_ORDER.get(f['level'], 9), f['item'][0], int(f['item'][1:])))
        d = build(stem, fs, r['no'] in scanned)
        d.update(no=r['no'], name=r['name'])
        json.dump(d, open(os.path.join(out_dir, f"{r['no']}.json"), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        placed = sum(1 for b in d['blocks'] for para in b['paras'] for s in para if 'f' in s)
        arts = sum(1 for b in d['blocks'] if b['id'].startswith('제'))
        stats.append((r['no'], r['name'], arts, len(fs), len({fi for b in d['blocks'] for fi in b['findings']}), len(d['orphan'])))
    for s in stats:
        if s[2] < 40 or s[5] > 2: print('CHECK', s)
    print('법인', len(stats), '조문 평균', sum(s[2] for s in stats) // len(stats),
          '지적', sum(s[3] for s in stats), '조문에 붙음', sum(s[4] for s in stats), '못 붙음', sum(s[5] for s in stats))


if __name__ == '__main__':
    main()
