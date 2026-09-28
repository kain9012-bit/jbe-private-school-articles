"""정관 원문(hwp/hwpx/pdf) → text/<연도>/<번호>_<법인명>.txt"""
import os, re, sys, zipfile, zlib, struct, json
import pymupdf as fitz, olefile

def hwpx_text(p):
    z = zipfile.ZipFile(p)
    secs = sorted([n for n in z.namelist() if re.match(r'Contents/section\d+\.xml', n)],
                  key=lambda s: int(re.findall(r'\d+', s)[0]))
    out = []
    for s in secs:
        x = z.read(s).decode('utf-8')
        for para in re.findall(r'<hp:p[ >].*?</hp:p>', x, re.S):
            t = ''.join(re.findall(r'<hp:t(?: [^>]*)?>(.*?)</hp:t>', para, re.S))
            t = re.sub(r'<[^>]+>', '', t)
            out.append(t)
    import html
    return html.unescape('\n'.join(out))

def hwp_text(p):
    f = olefile.OleFileIO(p)
    hdr = f.openstream('FileHeader').read()
    compressed = hdr[36] & 1
    secs = sorted([e for e in f.listdir() if e[0] == 'BodyText'], key=lambda e: int(e[1][7:]))
    out = []
    for e in secs:
        d = f.openstream(e).read()
        if compressed: d = zlib.decompress(d, -15)
        i = 0
        while i < len(d):
            h = struct.unpack_from('<I', d, i)[0]; tag = h & 0x3ff; size = (h >> 20) & 0xfff; i += 4
            if size == 0xfff: size = struct.unpack_from('<I', d, i)[0]; i += 4
            if tag == 67:  # PARA_TEXT
                b = d[i:i+size]; s = []; j = 0
                while j < len(b):
                    c = struct.unpack_from('<H', b, j)[0]
                    if c < 32:
                        if c in (0, 10, 13) or 24 <= c <= 31: j += 2; continue
                        if c == 9: s.append('\t')
                        j += 16; continue
                    s.append(chr(c)); j += 2
                out.append(''.join(s).encode('utf-16-le','surrogatepass').decode('utf-16-le','replace'))
            i += size
    return '\n'.join(out)

def pdf_text(p):
    doc = fitz.open(p)
    return '\n'.join(pg.get_text() for pg in doc), len(doc)

def main(year):
    src = f'raw/{year}'; dst = f'text/{year}'; os.makedirs(dst, exist_ok=True)
    rep = []
    for fn in sorted(os.listdir(src), key=lambda s: int(s.split('.')[0])):
        no = int(fn.split('.')[0]); name = re.sub(r'^\d+\.\s*', '', os.path.splitext(fn)[0]).replace(' 정관', '').strip()
        ext = os.path.splitext(fn)[1].lower(); p = os.path.join(src, fn); pages = None
        try:
            if ext == '.hwpx': t = hwpx_text(p)
            elif ext == '.hwp': t = hwp_text(p)
            elif ext == '.pdf': t, pages = pdf_text(p)
            else: t = ''
        except Exception as e:
            t = ''; print('ERR', fn, e)
        open(os.path.join(dst, f'{no:02d}_{name}.txt'), 'w', encoding='utf-8').write(t)
        hangul = len(re.findall(r'[가-힣]', t))
        rep.append(dict(no=no, name=name, ext=ext, pages=pages, chars=hangul, articles=len(re.findall(r'제\s*\d+\s*조\s*(?:의\s*\d+)?\s*[(（]', t))))
    json.dump(rep, open(f'text/{year}_report.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for r in rep:
        if r['chars'] < 3000: print('LOW', r)          # 스캔본 → scripts/ocr_kordoc.sh
        elif r['ext'] == '.pdf' and r['articles'] < 30: print('SCRAMBLED', r)  # 글자 순서 뒤섞임 → kordoc 으로 다시 추출
    print(year, 'done', len(rep))

if __name__ == '__main__':
    main(sys.argv[1])
