import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Scale, Search } from 'lucide-react';
import { Badge, EmptyState, SectionTitle } from './Ui';
import { GROUPS, ITEM_LABEL, LEVELS, LEVEL_TONE, type Corp, type LawMapRow } from '../types';

/**
 * 두 가지 물음에 답하는 화면.
 * ① 어느 항목에서 몇 개 법인이 걸렸나 — 공문 한 번으로 일괄 정비를 요청할 대상을 고를 때
 * ② 법 조문 하나가 바뀌면 어느 법인의 어느 정관 조문을 다시 봐야 하나 — 대응표(lawmap.json)로 찾음
 */
export const ItemTab: React.FC<{ corps: Corp[]; onPick: (item: string) => void }> = ({ corps, onPick }) => {
  const rows = useMemo(() => {
    const m = new Map<string, { item: string; byLevel: Record<string, Set<number>> }>();
    corps.forEach((c) =>
      c.findings.forEach((f) => {
        let r = m.get(f.item);
        if (!r) m.set(f.item, (r = { item: f.item, byLevel: {} }));
        (r.byLevel[f.level] ??= new Set()).add(c.no);
      }),
    );
    return [...m.values()].sort(
      (a, b) => a.item[0].localeCompare(b.item[0]) || +a.item.slice(1) - +b.item.slice(1),
    );
  }, [corps]);

  return (
    <div className="space-y-10">
      <section>
        <SectionTitle desc="칸의 숫자는 법인 수. 항목을 누르면 법인별 결과에서 그 항목만 걸러 봄">
          항목별 현황
        </SectionTitle>
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-3 py-2 font-bold">항목</th>
                {LEVELS.map((l) => (
                  <th key={l} className="px-3 py-2 font-bold text-right whitespace-nowrap">{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const newGroup = i === 0 || rows[i - 1].item[0] !== r.item[0];
                return (
                  <React.Fragment key={r.item}>
                    {newGroup && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={LEVELS.length + 1} className="px-3 py-1.5 text-xs font-bold text-slate-500">
                          {r.item[0]}. {GROUPS[r.item[0]]}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-slate-100 hover:bg-blue-50/40">
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => onPick(r.item)}
                          className="font-bold text-slate-800 hover:text-blue-700 underline decoration-slate-300 underline-offset-2"
                        >
                          {r.item} {ITEM_LABEL[r.item] ?? ''}
                        </button>
                      </td>
                      {LEVELS.map((l) => (
                        <td key={l} className="px-3 py-2 text-right tabular-nums">
                          {r.byLevel[l]?.size ? (
                            <Badge tone={LEVEL_TONE[l]}>{r.byLevel[l].size}</Badge>
                          ) : (
                            <span className="text-slate-300">·</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <LawLookup />
    </div>
  );
};

/** 법 조문 → 정관 조문 역검색. 자료가 커서 이 화면에 들어올 때만 받는다. */
const LawLookup: React.FC = () => {
  const [data, setData] = useState<LawMapRow[] | null>(null);
  const [err, setErr] = useState(false);
  const [q, setQ] = useState('제20조');
  const load = () => {
    setErr(false);
    fetch('./lawmap.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setErr(true));
  };
  useEffect(load, []);

  const key = q.replace(/\s/g, '');
  const hits = useMemo(() => {
    if (!data || !/제\d+조/.test(key)) return [];
    const isDecree = key.startsWith('영');
    const art = key.replace(/^(법|영)/, '');
    // "제20조"가 "제20조의2"까지 잡히지 않도록 뒤 글자를 확인
    const re = new RegExp(`${art}(?![의\\d])`);
    return data
      .map((c) => ({
        ...c,
        rows: c.map.filter((m) =>
          m.laws.some((l) => {
            const s = l.replace(/\s/g, '');
            const decree = s.includes('시행령');
            return decree === isDecree && s.includes('사립학교법') && re.test(s);
          }),
        ),
      }))
      .filter((c) => c.rows.length);
  }, [data, key]);

  return (
    <section>
      <SectionTitle desc="사립학교법·시행령 조문이 개정되면, 그 조문에 대응하는 정관 조문만 골라 다시 봄">
        법 조문으로 정관 찾기
      </SectionTitle>
      <label className="mt-3 flex items-center gap-1.5 max-w-md rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white focus-within:border-blue-600">
        <Scale className="w-4 h-4 text-slate-400" aria-hidden="true" />
        <span className="sr-only">법 조문</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="예: 제20조, 제66조의4, 영 제8조의3"
          className="flex-1 min-w-0 text-sm outline-none"
        />
      </label>
      <p className="mt-1 text-xs text-slate-500">법률은 조문만(제20조), 시행령은 앞에 '영'(영 제8조의3)</p>
      {err ? (
        <div className="mt-4">
          <EmptyState
            icon={<RefreshCw className="w-5 h-5" aria-hidden="true" />}
            title="대응표를 받지 못함"
            desc="네트워크를 확인하고 다시 시도하세요."
          />
          <div className="text-center mt-2">
            <button type="button" onClick={load} className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-bold hover:border-blue-600 hover:text-blue-700">
              다시 시도
            </button>
          </div>
        </div>
      ) : !data ? (
        <p className="mt-4 text-sm text-slate-500">대응표 받는 중…</p>
      ) : hits.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={<Search className="w-5 h-5" aria-hidden="true" />} title="대응하는 정관 조문 없음" desc="조문 표기를 확인하세요." />
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm font-bold text-slate-700">
            <span className="jbe-count tabular-nums">{hits.length}</span>개 법인 · 정관 조문{' '}
            <span className="tabular-nums">{hits.reduce((s, c) => s + c.rows.length, 0)}</span>개
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {hits.map((c) => (
              <div key={c.no} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <b className="text-slate-900">{c.name}</b>
                <ul className="mt-1 text-slate-600">
                  {c.rows.map((r) => (
                    <li key={r.article}>
                      {r.article} {r.title && <span className="text-slate-400">({r.title})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};
