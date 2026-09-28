"""스캔 PDF(글자층 없음) OCR → text/<연도>/<번호>_<법인명>.txt 덮어쓰기. tesseract kor 필요."""
import os, sys, json, subprocess, tempfile, re
from concurrent.futures import ThreadPoolExecutor
import pymupdf as fitz
TESS = os.environ.get('TESSDATA_PREFIX', os.path.expanduser('~/tessdata'))
def page(args):
    p, i = args
    doc = fitz.open(p); pix = doc[i].get_pixmap(dpi=300, colorspace=fitz.csGRAY)
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f: pix.save(f.name); img = f.name
    r = subprocess.run(['tesseract', img, '-', '-l', 'kor', '--psm', '6', '--tessdata-dir', TESS], capture_output=True, text=True)
    os.remove(img); return r.stdout
def main(year):
    rep = json.load(open(f'text/{year}_report.json', encoding='utf-8'))
    src = f'raw/{year}'; files = {int(f.split('.')[0]): f for f in os.listdir(src)}
    for r in rep:
        if r['ext'] != '.pdf' or r['chars'] > 3000: continue
        p = os.path.join(src, files[r['no']]); n = len(fitz.open(p))
        with ThreadPoolExecutor(os.cpu_count()) as ex: pages = list(ex.map(page, [(p, i) for i in range(n)]))
        t = '\n'.join(pages)
        open(f"text/{year}/{r['no']:02d}_{r['name']}.txt", 'w', encoding='utf-8').write(t)
        r['ocr'] = True; r['chars'] = len(re.findall(r'[가-힣]', t)); print(year, r['name'], r['chars'], flush=True)
    json.dump(rep, open(f'text/{year}_report.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
if __name__ == '__main__': main(sys.argv[1])
