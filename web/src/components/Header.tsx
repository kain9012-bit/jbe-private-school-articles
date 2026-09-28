import React from 'react';
import { Info, Landmark } from 'lucide-react';
import { AS_OF, TAB_LABEL, type Tab } from '../types';

const TABS: Tab[] = ['corp', 'text', 'item', 'method'];

export const Header: React.FC<{ tab: Tab; onTab: (t: Tab) => void }> = ({ tab, onTab }) => (
  <header className="sticky top-0 z-30 bg-white jbe-noprint">
    <div className="bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="flex items-start gap-1.5 min-w-0">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span className="min-w-0">
            <strong className="font-bold text-slate-900">비공식</strong> 자체 점검 자료 · 담당자 검토 전 1차 판정
          </span>
        </span>
        <span className="shrink-0 tabular-nums">
          정관 {AS_OF.articles} 기준 · {AS_OF.lawShort}
        </span>
      </div>
    </div>
    <div className="border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center gap-x-8 gap-y-2">
        {/* 제목을 누르면 전체 새로고침 — 필터·탭·펼침 상태를 모두 첫 화면으로 */}
        <a
          href="./"
          title="처음 화면으로"
          className="flex items-center gap-3 py-3 rounded-lg hover:opacity-80"
        >
          <span className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <strong className="jbe-display block text-lg font-extrabold text-slate-900 leading-tight">
              학교법인 정관 점검
            </strong>
            <span className="block text-xs text-slate-500">전북특별자치도교육청</span>
          </span>
        </a>
        <ul role="tablist" className="flex items-center gap-6 sm:ml-auto overflow-x-auto">
          {TABS.map((t) => (
            <li key={t} role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => onTab(t)}
                className={`py-4 text-base font-bold border-b-[3px] whitespace-nowrap transition-colors ${
                  tab === t
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {TAB_LABEL[t]}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </header>
);
