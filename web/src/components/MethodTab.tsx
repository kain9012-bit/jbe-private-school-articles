import React from 'react';
import { SectionTitle } from './Ui';
import { AS_OF, LEVELS, LEVEL_DESC } from '../types';

const Li: React.FC<{ t: string; children: React.ReactNode }> = ({ t, children }) => (
  <li className="flex gap-2">
    <b className="shrink-0 text-slate-900">{t}</b>
    <span className="text-slate-600">— {children}</span>
  </li>
);

export const MethodTab: React.FC<{ total: number; ocr: number }> = ({ total, ocr }) => (
  <div className="max-w-4xl space-y-10">
    <section>
      <SectionTitle>대상과 기준</SectionTitle>
      <ul className="mt-3 space-y-1.5">
        <Li t="정관">
          교육청 누리집 「학교법인정관」 게시판 {AS_OF.articles} 기준 공개본({AS_OF.posted} 게시) {total}개 법인
        </Li>
        <Li t="법령">{AS_OF.law} — 국가법령정보센터 원문 미러(legalize-kr)</Li>
        <Li t="학생 수">교육행정자료(2026.4.1. 기준) 학교별 학생인원수 — 교원징계위원회 위원 수 판정</Li>
        <Li t="참고 법령">사학기관 재무·회계 규칙, 초·중등교육법, 고등교육법(대학 설치 법인만), 사립학교교원 징계규칙</Li>
        <Li t="점검 항목">필수 기재사항·임원·이사회·정관 변경·재산·교원·징계·사무직원·표기·대학 10개 묶음, 약 60개 항목</Li>
      </ul>
    </section>

    <section>
      <SectionTitle>판정 구분</SectionTitle>
      <ul className="mt-3 space-y-1.5">
        {LEVELS.map((l) => (
          <Li key={l} t={l}>{LEVEL_DESC[l]}</Li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-slate-500">
        정관이 법보다 엄격한 경우(이사 임기 4년 등)와 법령이 직접 적용되는 사항을 정관에 안 적은 경우는 지적하지 않음
      </p>
    </section>

    <section>
      <SectionTitle>점검 절차</SectionTitle>
      <ol className="mt-3 space-y-1.5 list-decimal pl-5 text-slate-600">
        <li>게시판 zip 내려받기 → hwp·hwpx·pdf 본문 추출. 스캔본 {ocr}곳은 한글 OCR 후 판정에 쓴 숫자를 원본 이미지로 재확인 (카드의 정관 원문 인용은 OCR 글자 그대로)</li>
        <li>항목표(checklist)에 따라 정관 전문을 현행 법령 원문과 대조 — AI가 1차 판정</li>
        <li>모든 지적에 정관 원문·법령 원문 인용 첨부, 인용이 원문과 글자 그대로 맞는지 스크립트로 검증</li>
        <li>'저촉' 판정 전건을 다른 검토자(AI)가 원문으로 재검토 → 하향 조정 결과를 카드에 표시</li>
        <li>정관 조문 ↔ 법 조문 대응표 작성</li>
      </ol>
    </section>

    <section>
      <SectionTitle>해마다 갱신하는 방법</SectionTitle>
      <ul className="mt-3 space-y-1.5">
        <Li t="정관 개정">
          새 공개본을 전년도 본문과 조문 단위로 대조 → '개정'으로 잡힌 법인만 전체 재점검. 나머지는 전년 결과 유지
        </Li>
        <Li t="법령 개정">
          바뀐 사립학교법·시행령 조문을 '법 조문으로 정관 찾기'에 넣음 → 대응하는 정관 조문만 전 법인 재점검
        </Li>
        <Li t="형식 변경">hwp → pdf 처럼 파일 형식만 바뀐 경우는 줄바꿈·문장부호를 걸러 개정으로 보지 않음</Li>
      </ul>
    </section>

    <section>
      <SectionTitle>한계</SectionTitle>
      <ul className="mt-3 space-y-1.5 list-disc pl-5 text-slate-600">
        <li>AI 1차 판정 — 법률 자문 아님. 시정 요구 전 담당자 확인 필요</li>
        <li>정관 본문만 대조 — 별표(정원표)·부칙 경과규정 제외</li>
        <li>법률·시행령·교육부령까지만 대조 — 교육부 고시·지침, 교육청 지침 제외</li>
        <li>교원징계위원회 위원 수 — 200명 이상·미만 학교를 함께 둔 법인 4곳은 적용 기준 불명확, '확인필요'로 둠</li>
      </ul>
    </section>
  </div>
);
