"""게시판에서 학교법인 정관 zip 을 받아 raw/<연도>/ 에 풉니다.

python scripts/collect.py            # 게시판 목록 출력
python scripts/collect.py 2027       # 제목에 '2027.' 이 들어간 게시글의 첨부 zip 받기

- 다운로드 주소는 상세 화면을 먼저 열어 세션 쿠키를 받은 뒤 Referer 를 붙여야 zip 이 옴
  (그냥 부르면 "document has been moved" HTML 이 옴)
- zip 안 파일명은 CP949 — 그대로 풀면 한글이 깨짐
"""
import os, re, sys, zipfile, io
import requests
from bs4 import BeautifulSoup

BASE = 'https://www.jbe.go.kr/board'
Q = 'boardId=BBS_0000088&menuCd=DOM_000000106004002000'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def posts(s):
    html = s.get(f'{BASE}/list.jbe?{Q}&contentsSid=344', timeout=30).text
    out = []
    for tr in BeautifulSoup(html, 'html.parser').select('tbody tr'):
        a = tr.select_one('a[href*="view.jbe"]'); d = tr.select_one('a[href*="download.jbe"]')
        if not a: continue
        out.append(dict(title=a.get_text(strip=True), view=a['href'], dl=d['href'] if d else None,
                        date=[td.get_text(strip=True) for td in tr.select('td')][-2]))
    return out


def main(year=None):
    s = requests.Session()
    ps = posts(s)
    if not year:
        for p in ps: print(p['date'], p['title'])
        return
    p = next((p for p in ps if f'{year}.' in p['title'].replace(' ', '')), None)
    if not p: sys.exit(f'{year} 게시글 없음')
    view = BASE + '/' + p['view'].split('/board/')[-1]
    s.get(view, timeout=30)
    r = s.get(BASE + '/' + p['dl'].split('/board/')[-1], headers={'Referer': view}, timeout=300)
    if not r.content.startswith(b'PK'): sys.exit('zip 이 아님 — 다운로드 절차가 바뀌었는지 확인')
    dst = os.path.join(ROOT, 'raw', year); os.makedirs(dst, exist_ok=True)
    open(os.path.join(ROOT, 'raw', f'f{year}.bin'), 'wb').write(r.content)
    z = zipfile.ZipFile(io.BytesIO(r.content)); n = 0
    for i in z.infolist():
        name = i.filename
        if not (i.flag_bits & 0x800):
            try: name = name.encode('cp437').decode('cp949')
            except UnicodeError: pass
        if name.endswith('/'): continue
        open(os.path.join(dst, os.path.basename(name)), 'wb').write(z.read(i)); n += 1
    print(p['title'], '→', dst, n, '개')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
