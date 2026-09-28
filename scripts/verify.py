"""점검 결과 검증 — 인용문이 정관·법령 원문에 글자 그대로 있는지 확인.

python scripts/verify.py review/2026            # 전체
python scripts/verify.py review/2026/02_춘봉학원.json

통과 조건
- findings[].quote  : text/<연도>/<같은 파일명>.txt 안에 있어야 함 (공백·줄바꿈·문장부호 무시)
- findings[].law_quote : law/*.md 안에 있어야 함 (같은 방식)
- level 은 저촉/미반영/누락/정비/확인필요 중 하나, item 은 checklist 항목 ID 형식
- 누락은 quote 가 비어 있어도 됨
"""
import json, os, re, sys, glob

LEVELS = {'저촉', '미반영', '누락', '정비', '확인필요'}
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def norm(t):
    t = t.replace('ㆍ', '·').replace('․', '·').replace('⋅', '·')
    return re.sub(r'[\s　·.,:;\-<>〈〉「」『』"\'“”‘’()（）\[\]\\*]', '', t)


LAW = norm(''.join(open(p, encoding='utf-8').read() for p in glob.glob(os.path.join(ROOT, 'law', '*.md'))))


def check(path):
    d = json.load(open(path, encoding='utf-8'))
    year = os.path.basename(os.path.dirname(path))
    src = os.path.join(ROOT, 'text', year, os.path.basename(path).replace('.json', '.txt'))
    text = norm(open(src, encoding='utf-8').read())
    errs = []
    for i, f in enumerate(d.get('findings', [])):
        tag = f"#{i} {f.get('item')} {f.get('article')}"
        if f.get('level') not in LEVELS: errs.append(f'{tag}: level={f.get("level")}')
        if not re.fullmatch(r'[A-J]\d{1,2}', f.get('item', '')): errs.append(f'{tag}: item 형식')
        q = f.get('quote', '')
        if f.get('level') != '누락' and not q: errs.append(f'{tag}: quote 없음')
        if q and norm(q) not in text: errs.append(f'{tag}: 정관 원문에 없는 인용 → {q[:40]}')
        lq = f.get('law_quote', '')
        if lq and norm(lq) not in LAW: errs.append(f'{tag}: 법령 원문에 없는 인용 → {lq[:40]}')
    for m in d.get('law_map', []):
        if not re.match(r'제\d+조', m.get('article', '')): errs.append(f"law_map article 형식: {m.get('article')}")
    return errs


if __name__ == '__main__':
    target = sys.argv[1]
    files = sorted(glob.glob(os.path.join(target, '*.json'))) if os.path.isdir(target) else [target]
    bad = 0
    for p in files:
        e = check(p)
        if e:
            bad += 1
            print('FAIL', os.path.basename(p))
            for x in e: print('   ', x)
    print(f'{len(files) - bad}/{len(files)} 통과')
    sys.exit(1 if bad else 0)
