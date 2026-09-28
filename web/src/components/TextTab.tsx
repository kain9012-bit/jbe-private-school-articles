import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, FileText, RefreshCw, Scale, ShieldCheck } from 'lucide-react';
import { Badge, EmptyState } from './Ui';
import { ITEM_LABEL, LEVEL_TONE, type Corp, type Finding, type Level } from '../types';

/** build_articles.py 가 만드는 web/public/articles/<번호>.json */
type Seg = { t: string; f?: number };
type Block = { id: string; head: string; title: string; section?: boolean; paras: Seg[][]; findings: number[] };
type Doc = { no: number; name: string; scanned: boolean; blocks: Block[]; orphan: number[] };

const MARK: Record<Level, string> = {
  저촉: 'bg-red-100 decoration-red-500',
  미반영: 'bg-amber-100 decoration-amber-500',
  누락: 'bg-blue-100 decoration-blue-500',
  확인필요: 'bg-slate-200 decoration-slate-500',
  정비: 'bg-slate-100 decoration-slate-400',
};
const BOX: Record<Level, string> = {
  저촉: 'border-red-200 bg-red-50/60',
  미반영: 'border-amber-200 bg-amber-50/60',
  누락: 'border-blue-200 bg-blue-50/60',
  확인필요: 'border-slate-200 bg-slate-50',
  정비: 'border-slate-200 bg-slate-50',
};

const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** 조문 아래 붙는 설명 — 무엇이 틀렸고, 어떻게 고치면 되는지 */
const Note: React.FC<{ f: Finding; i: number; highlighted: boolean }> = ({ f, i, highlighted }) => (
  <div
    id={`f-${i}`}
    className={`scroll-mt-40 mt-2 rounded-lg border px-3 py-2.5 text-sm ${BOX[f.level]} ${highlighted ? 'ring-2 ring-blue-600' : ''}`}
  >
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={LEVEL_TONE[f.level]}>{f.level}</Badge>
      <span className="text-xs text-slate-500">
        {f.item} {ITEM_LABEL[f.item] ?? ''}
      </span>
    </div>
    <p className="mt-1 font-bold text-slate-900">{f.issue}</p>
    {f.fix && (
      <p className="mt-1 flex items-start gap-1.5 text-blue-800">
        <ArrowRight className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          <b>이렇게 고치면</b> — {f.fix}
        </span>
      </p>
    )}
    {f.law && (
      <p className="mt-1.5 text-xs text-slate-600">
        <Scale className="inline w-3 h-3 mr-1 -mt-0.5 text-blue-700" aria-hidden="true" />
        <b className="text-blue-700">{f.law}</b>
        {f.law_quote && <span> — {f.law_quote}</span>}
      </p>
    )}
    {f.audit && (
      <p className="mt-1 text-xs text-slate-500">
        <ShieldCheck className="inline w-3 h-3 mr-1 -mt-0.5" aria-hidden="true" />
        재검토 {f.audit.verdict}
        {f.audit.from ? ` (${f.audit.from} → ${f.level})` : ''} · {f.audit.reason}
      </p>
    )}
  </div>
);

export const TextTab: React.FC<{
  corps: Corp[];
  no: number;
  focus: number | null;
  onPick: (no: number) => void;
}> = ({ corps, no, focus, onPick }) => {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [err, setErr] = useState(false);
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const corp = corps.find((c) => c.no === no)!;
  const sorted = useMemo(() => [...corps].sort((a, b) => a.name.localeCompare(b.name, 'ko')), [corps]);

  const load = () => {
    setErr(false);
    setDoc(null);
    fetch(`./articles/${no}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDoc)
      .catch(() => setErr(true));
  };
  useEffect(load, [no]);

  // 지적 카드에서 넘어왔으면 그 설명으로 이동
  useEffect(() => {
    if (!doc) return;
    const t = setTimeout(() => {
      if (focus !== null) go(`f-${focus}`);
      else window.scrollTo({ top: 0 });
    }, 80);
    return () => clearTimeout(t);
  }, [doc, focus]);

  const blocks = doc ? doc.blocks.filter((b) => !onlyFlagged || b.findings.length || b.section) : [];
  const toc = doc ? doc.blocks.filter((b) => !b.section && b.id !== 'front' && (!onlyFlagged || b.findings.length)) : [];
  const worst = (b: Block): Level | null => {
    const ls = b.findings.map((i) => corp.findings[i]?.level).filter(Boolean) as Level[];
    return (['저촉', '미반영', '누락', '확인필요', '정비'] as Level[]).find((l) => ls.includes(l)) ?? null;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={no}
          onChange={(e) => onPick(Number(e.target.value))}
          aria-label="학교법인"
          className="rounded-lg border border-slate-300 px-3 py-2 text-base font-bold text-slate-800 bg-white hover:border-blue-600"
        >
          {sorted.map((c) => (
            <option key={c.no} value={c.no}>
              {c.name} ({c.findings.length}건)
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-500">{corp.schools.join(' · ')}</span>
        <span className="flex-1" />
        <label className="inline-flex items-center gap-1.5 text-sm text-slate-600">
          <input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} />
          지적 있는 조문만
        </label>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>형광 표시 = 지적된 문장, 바로 아래 상자 = 틀린 점과 고칠 방향</span>
        {(['저촉', '미반영', '누락', '확인필요', '정비'] as Level[]).map((l) => (
          <span key={l} className={`px-1.5 rounded underline decoration-2 underline-offset-2 ${MARK[l]}`}>{l}</span>
        ))}
      </p>

      {err ? (
        <div className="mt-6">
          <EmptyState icon={<RefreshCw className="w-5 h-5" aria-hidden="true" />} title="정관 본문을 받지 못함" desc="네트워크를 확인하고 다시 시도하세요." />
          <div className="text-center mt-2">
            <button type="button" onClick={load} className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-bold hover:border-blue-600 hover:text-blue-700">
              다시 시도
            </button>
          </div>
        </div>
      ) : !doc ? (
        <p className="mt-6 text-sm text-slate-500">정관 본문 받는 중…</p>
      ) : (
        <div className="mt-5 grid gap-8 lg:grid-cols-[14rem_1fr]">
          <nav aria-label="조문 목차" className="hidden lg:block">
            <div className="sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto pr-2 text-sm">
              <b className="block mb-1 text-xs text-slate-500">조문 목차 {toc.length}</b>
              <ul className="space-y-0.5">
                {toc.map((b) => {
                  const w = worst(b);
                  return (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => go(`a-${b.id}`)}
                        className={`w-full text-left px-2 py-0.5 rounded hover:bg-slate-100 truncate ${w ? 'font-bold text-slate-900' : 'text-slate-500'}`}
                      >
                        {w && <span className={`inline-block w-2 h-2 rounded-full mr-1.5 align-middle ${w === '저촉' ? 'bg-red-500' : w === '미반영' ? 'bg-amber-500' : w === '누락' ? 'bg-blue-500' : 'bg-slate-400'}`} />}
                        {b.head} {b.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          <article className="min-w-0 max-w-3xl">
            {doc.scanned && (
              <p className="mb-4 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                스캔본 — OCR로 읽은 본문이라 오탈자가 섞여 있음. 판정에 쓴 숫자·문구는 원본 이미지로 확인함. 공식 원문은 교육청 게시판 파일
              </p>
            )}
            {doc.orphan.length > 0 && (
              <section className="mb-6">
                <h3 className="text-sm font-bold text-slate-700">정관에 해당 문장이 없는 지적</h3>
                {doc.orphan.map((i) => (
                  <Note key={i} f={corp.findings[i]} i={i} highlighted={focus === i} />
                ))}
              </section>
            )}
            {blocks.map((b) =>
              b.section ? (
                <h3 key={b.id} className="jbe-display mt-8 mb-2 text-lg font-extrabold text-slate-900 border-b border-slate-200 pb-1">
                  {b.head}
                </h3>
              ) : (
                <section key={b.id} id={`a-${b.id}`} className={`scroll-mt-40 py-2 ${b.findings.length ? 'pl-3 border-l-4 border-blue-600/70' : ''}`}>
                  {b.paras.map((p, pi) => (
                    <p key={pi} className={`leading-relaxed ${pi === 0 ? '' : 'mt-0.5 pl-3'} ${b.id === 'front' ? 'text-slate-500 text-sm' : 'text-slate-800'}`}>
                      {p.map((s, si) =>
                        s.f === undefined || !corp.findings[s.f] ? (
                          <React.Fragment key={si}>{s.t}</React.Fragment>
                        ) : (
                          <mark
                            key={si}
                            onClick={() => go(`f-${s.f}`)}
                            title={corp.findings[s.f].issue}
                            className={`cursor-pointer rounded px-0.5 text-inherit underline decoration-2 underline-offset-2 ${MARK[corp.findings[s.f].level]}`}
                          >
                            {s.t}
                          </mark>
                        ),
                      )}
                    </p>
                  ))}
                  {b.findings.map((i) => corp.findings[i] && <Note key={i} f={corp.findings[i]} i={i} highlighted={focus === i} />)}
                </section>
              ),
            )}
            <p className="mt-10 border-t border-slate-200 pt-3 text-xs text-slate-500 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              본문은 공개 정관 파일에서 뽑은 글자. 줄바꿈만 조문·항 단위로 다시 맞춤
            </p>
          </article>
        </div>
      )}
    </div>
  );
};
