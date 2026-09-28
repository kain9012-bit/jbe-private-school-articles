import React, { useState } from 'react';
import { ChevronDown, FileText, Scale, ShieldCheck } from 'lucide-react';
import { Badge } from './Ui';
import { ITEM_LABEL, LEVELS, LEVEL_TONE, type Corp, type Finding, type Level } from '../types';

const CHANGE_TONE: Record<string, 'green' | 'slate' | 'amber' | 'blue'> = {
  개정: 'amber',
  동일: 'slate',
  '형식만 변경': 'slate',
  '대조 불가': 'blue',
};

export const countBy = (f: Finding[]) => {
  const c = Object.fromEntries(LEVELS.map((l) => [l, 0])) as Record<Level, number>;
  f.forEach((x) => (c[x.level] += 1));
  return c;
};

/** 지적 한 줄 — 정관 원문과 법령 원문을 나란히 둬서 판정을 그대로 믿지 않고 확인할 수 있게 한다. */
const Row: React.FC<{ f: Finding }> = ({ f }) => (
  <div className="grid gap-x-4 gap-y-1.5 px-4 py-3 border-t border-slate-100 sm:grid-cols-[9rem_1fr]">
    <div className="flex sm:flex-col items-start gap-1.5">
      <Badge tone={LEVEL_TONE[f.level]}>{f.level}</Badge>
      <span className="text-sm font-bold text-slate-700">{f.article}</span>
      <span className="text-xs text-slate-400">
        {f.item} {ITEM_LABEL[f.item] ?? ''}
      </span>
    </div>
    <div className="min-w-0">
      <p className="font-bold text-slate-900">{f.issue}</p>
      {f.fix && <p className="mt-0.5 text-sm text-blue-700">→ {f.fix}</p>}
      <div className="mt-2 grid gap-2 md:grid-cols-2 text-sm">
        {f.quote && (
          <blockquote className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
            <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
              <FileText className="w-3 h-3" aria-hidden="true" />
              정관 원문
            </span>
            {f.quote}
          </blockquote>
        )}
        {f.law && (
          <blockquote className="rounded border border-blue-100 bg-blue-50/60 px-3 py-2 text-slate-600">
            <span className="flex items-center gap-1 text-xs font-bold text-blue-700">
              <Scale className="w-3 h-3" aria-hidden="true" />
              {f.law}
            </span>
            {f.law_quote}
          </blockquote>
        )}
      </div>
      {f.audit && (
        <p className="mt-1.5 flex items-start gap-1 text-xs text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />
          <span>
            재검토 {f.audit.verdict}
            {f.audit.from ? ` (${f.audit.from} → ${f.level})` : ''} · {f.audit.reason}
          </span>
        </p>
      )}
    </div>
  </div>
);

export const CorpCard: React.FC<{ corp: Corp; findings: Finding[]; open?: boolean }> = ({
  corp,
  findings,
  open: initial = false,
}) => {
  const [open, setOpen] = useState(initial);
  const c = countBy(findings);
  const b = corp.board;
  return (
    <article className="jbe-card bg-white rounded-lg border border-slate-200 overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="w-full text-left flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 hover:bg-slate-50"
      >
        <span className="w-8 text-sm text-slate-400 tabular-nums">{corp.no}</span>
        <span className="flex-1 min-w-[14rem]">
          <strong className="text-base text-slate-900">{corp.name}</strong>
          <span className="block text-xs text-slate-500 truncate">{corp.schools.join(' · ')}</span>
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          {LEVELS.filter((l) => c[l] > 0).map((l) => (
            <Badge key={l} tone={LEVEL_TONE[l]}>
              {l} {c[l]}
            </Badge>
          ))}
          {corp.change && <Badge tone={CHANGE_TONE[corp.change]}>전년 대비 {corp.change}</Badge>}
          {corp.ocr && <Badge tone="blue">스캔본</Badge>}
          {corp.univ && <Badge tone="blue">대학</Badge>}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="border-t border-slate-200">
          <dl className="px-4 py-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-4 bg-slate-50/60">
            <div><dt className="inline text-slate-500">최종 개정 </dt><dd className="inline font-bold">{corp.lastAmended ?? '—'}</dd></div>
            <div><dt className="inline text-slate-500">이사·감사 </dt><dd className="inline font-bold">{b.directors ?? '—'}명 · {b.auditors ?? '—'}명 (개방이사 {b.open_directors ?? '—'})</dd></div>
            <div><dt className="inline text-slate-500">임기 </dt><dd className="inline font-bold">이사 {b.director_term ?? '—'} · 감사 {b.auditor_term ?? '—'}</dd></div>
            <div><dt className="inline text-slate-500">학교장 임기 </dt><dd className="inline font-bold">{b.principal_term ?? '—'}</dd></div>
            <div className="sm:col-span-2 lg:col-span-4"><dt className="inline text-slate-500">학생 수 </dt><dd className="inline font-bold">{corp.students.length ? corp.students.map((x) => `${x.matched} ${x.students.toLocaleString('ko-KR')}명`).join(' · ') : '—'}</dd><span className="text-slate-500"> · 징계위원 {b.discipline_committee ?? '—'}</span></div>
          </dl>
          {findings.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">조건에 맞는 지적 없음</p>
          ) : (
            findings.map((f, i) => <Row key={i} f={f} />)
          )}
          {corp.notes && (
            <details className="px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
              <summary className="cursor-pointer font-bold text-slate-600">검토 메모</summary>
              <p className="mt-1.5 whitespace-pre-line">{corp.notes}</p>
            </details>
          )}
        </div>
      )}
    </article>
  );
};
