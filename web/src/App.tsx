import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowUp, Building2, Download, FilePen, Search, X } from 'lucide-react';
import { downloadAll } from './lib/excel';
import { Header } from './components/Header';
import { CorpCard, countBy } from './components/CorpCard';
import { ItemTab } from './components/ItemTab';
import { MethodTab } from './components/MethodTab';
import { Chip, EmptyState, SectionTitle, Stat } from './components/Ui';
import { AS_OF, GROUPS, ITEM_LABEL, LEVELS, type Data, type Level, type Tab } from './types';
import raw from './data/data.json';

const DATA = raw as Data;
const CORPS = DATA.corps;

type Sort = 'severity' | 'name';

export default function App() {
  const [tab, setTab] = useState<Tab>('corp');
  const [level, setLevel] = useState<Level | ''>('');
  const [group, setGroup] = useState('');
  const [item, setItem] = useState('');
  const [changedOnly, setChangedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('name');
  const [q, setQ] = useState('');
  const [top, setTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /** 항목 필터를 먼저 적용한 지적 — 법인 카드와 칩 건수가 같은 기준을 보도록 */
  const scoped = useMemo(
    () =>
      CORPS.filter(
        (c) =>
          (!changedOnly || c.change === '개정') &&
          (!q.trim() || `${c.name}${c.schools.join('')}`.includes(q.trim())),
      ).map((c) => ({
        corp: c,
        findings: c.findings.filter(
          (f) => (!group || f.item[0] === group) && (!item || f.item === item),
        ),
      })),
    [changedOnly, q, group, item],
  );

  const shown = scoped
    .map((x) => ({ ...x, findings: x.findings.filter((f) => !level || f.level === level) }))
    .filter((x) => x.findings.length > 0 || (!level && !group && !item))
    .sort((a, b) => {
      if (sort === 'name') return a.corp.name.localeCompare(b.corp.name, 'ko');
      const ca = countBy(a.findings), cb = countBy(b.findings);
      return (
        cb.저촉 - ca.저촉 || cb.미반영 - ca.미반영 || cb.누락 - ca.누락 || a.corp.name.localeCompare(b.corp.name, 'ko')
      );
    });

  const corpsWith = (l: Level) => CORPS.filter((c) => c.findings.some((f) => f.level === l)).length;
  const chipCount = (l?: Level) =>
    scoped.filter((x) => x.findings.some((f) => !l || f.level === l)).length;
  const revised = CORPS.filter((c) => c.change === '개정').length;

  const pickItem = (it: string) => {
    setItem(it);
    setGroup('');
    setLevel('');
    setTab('corp');
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-slate-800 font-sans antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      <a className="krds-skip" href="#container">
        본문 바로가기
      </a>
      <Header tab={tab} onTab={setTab} />

      <div className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="jbe-display text-3xl sm:text-[2.75rem] font-extrabold text-slate-900 leading-tight tracking-tight">
            학교법인 정관, <span className="text-blue-700">사립학교법과 맞나</span>
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            {AS_OF.articles} 기준 공개된 학교법인 정관 {CORPS.length}개를 현행 사립학교법·시행령과 항목별로
            대조한 1차 결과. 모든 지적에 정관·법령 원문을 붙임 ·{' '}
            <button
              type="button"
              onClick={() => setTab('method')}
              className="font-bold text-blue-700 underline underline-offset-2 hover:text-blue-800"
            >
              점검 방법과 한계
            </button>
          </p>
          {tab === 'corp' && (
            <div className="mt-5 grid gap-3 grid-cols-2 lg:grid-cols-5">
              <Stat icon={<Building2 className="w-3.5 h-3.5" aria-hidden="true" />} label="점검 법인" value={CORPS.length} desc={`${DATA.prev} 대비 개정 ${revised}곳`} />
              <Stat icon={<AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />} label="저촉 있는 법인" value={corpsWith('저촉')} desc="법령과 다른 기준" tone="red" />
              <Stat icon={<FilePen className="w-3.5 h-3.5" aria-hidden="true" />} label="미반영 있는 법인" value={corpsWith('미반영')} desc="개정 법령 미반영" tone="amber" />
              <Stat label="누락 있는 법인" value={corpsWith('누락')} desc="정관 위임사항 부재" />
              <Stat label="정비 있는 법인" value={corpsWith('정비')} desc="명칭·조문번호·용어" />
            </div>
          )}
        </div>
      </div>

      <main id="container" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {tab === 'method' ? (
          <MethodTab total={CORPS.length} ocr={CORPS.filter((c) => c.ocr).length} />
        ) : tab === 'item' ? (
          <ItemTab corps={CORPS} onPick={pickItem} />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Chip on={level === ''} onClick={() => setLevel('')} count={chipCount()}>
                전체
              </Chip>
              {LEVELS.map((l) => (
                <Chip key={l} on={level === l} onClick={() => setLevel(l)} count={chipCount(l)}>
                  {l}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={group}
                onChange={(e) => { setGroup(e.target.value); setItem(''); }}
                aria-label="항목 묶음"
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 bg-white hover:border-blue-600"
              >
                <option value="">항목 전체</option>
                {Object.entries(GROUPS).map(([k, v]) => (
                  <option key={k} value={k}>{k}. {v}</option>
                ))}
              </select>
              {item && (
                <button
                  type="button"
                  onClick={() => setItem('')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-600 text-sm font-bold text-blue-700"
                >
                  {item} {ITEM_LABEL[item]}
                  <X className="w-3.5 h-3.5" aria-label="항목 필터 해제" />
                </button>
              )}
              <label className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                <input type="checkbox" checked={changedOnly} onChange={(e) => setChangedOnly(e.target.checked)} />
                올해 개정된 법인만
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                aria-label="정렬"
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 bg-white hover:border-blue-600"
              >
                <option value="name">법인명 가나다순</option>
                <option value="severity">저촉 많은 순</option>
              </select>
              <span className="flex-1" />
              <label className="flex items-center gap-1.5 flex-1 min-w-[12rem] max-w-sm rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white focus-within:border-blue-600">
                <Search className="w-4 h-4 text-slate-400" aria-hidden="true" />
                <span className="sr-only">검색</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="search"
                  placeholder="법인명 · 학교명 검색"
                  className="flex-1 min-w-0 text-sm outline-none"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-2">
              <SectionTitle count={shown.length} desc="카드를 누르면 지적 내용과 원문이 펼쳐짐">
                법인
              </SectionTitle>
              <button
                type="button"
                onClick={() => downloadAll(CORPS, DATA.year)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-sm font-bold text-white"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                전체 엑셀 내려받기
              </button>
            </div>
            {shown.length === 0 ? (
              <div className="mt-4">
                <EmptyState icon={<Search className="w-5 h-5" aria-hidden="true" />} title="조건에 맞는 법인 없음" desc="구분·항목·검색어를 바꿔 보세요." />
              </div>
            ) : (
              <div className="mt-2.5 space-y-2.5">
                {shown.map((x) => (
                  <CorpCard key={`${x.corp.no}|${level}|${group}|${item}`} corp={x.corp} findings={x.findings} year={DATA.year} open={shown.length <= 3} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-slate-900 mt-auto jbe-noprint">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap justify-between gap-4 text-sm text-slate-300">
          <div>
            <b className="block text-white">학교법인 정관 점검</b>
            전북특별자치도교육청 공개 학교법인 정관 · 사립학교법 대조 결과
          </div>
          <div className="text-slate-400">
            출처 —{' '}
            <a href={AS_OF.boardUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
              교육청 누리집 학교법인정관
            </a>
            , 국가법령정보센터 원문 미러(legalize-kr)
          </div>
        </div>
      </footer>

      {top && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="맨 위로"
          className="fixed right-4 bottom-4 w-11 h-11 rounded-full border border-slate-300 bg-white text-slate-600 shadow-md hover:border-blue-600 hover:text-blue-700 flex items-center justify-center jbe-noprint"
        >
          <ArrowUp className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
