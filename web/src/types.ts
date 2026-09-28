/** 지적 한 건. scripts/build_data.py 가 review/<연도>/*.json 에서 옮겨 온다. */
export type Finding = {
  /** 점검 항목 ID (checklist.md) */
  item: string;
  level: Level;
  /** 정관 조문 */
  article: string;
  /** 정관 원문 인용 */
  quote: string;
  /** 근거 법령 조문 */
  law: string;
  /** 법령 원문 인용 */
  law_quote?: string;
  issue: string;
  fix?: string;
  /** 독립 재검토 결과 — 저촉 판정만 받음 */
  audit?: { verdict: string; reason: string; from?: string };
};

export type Corp = {
  no: number;
  name: string;
  lastAmended: string | null;
  schools: string[];
  univ: boolean;
  board: Record<string, string | number>;
  ocr: boolean;
  /** 전년도 공개본 대비 */
  change: '동일' | '형식만 변경' | '개정' | '대조 불가' | null;
  changedArticles: string[];
  notes: string;
  /** 학교별 학생 수 (교육행정자료 2026.4.1. 기준) */
  students: { school: string; matched: string; students: number }[];
  findings: Finding[];
};

export type Data = { year: string; prev: string; corps: Corp[] };

export type LawMapRow = { no: number; name: string; map: { article: string; title: string; laws: string[] }[] };

export type Level = '저촉' | '미반영' | '누락' | '확인필요' | '정비';

export const LEVELS: Level[] = ['저촉', '미반영', '누락', '확인필요', '정비'];

export const LEVEL_DESC: Record<Level, string> = {
  저촉: '현행 법령과 다른 기준을 정함 — 정관대로 운영하면 위법',
  미반영: '법령 개정으로 바뀐 사유·절차가 정관에 빠짐',
  누락: '법령이 정관에 맡긴 사항을 두지 않음',
  확인필요: '해석이 갈리거나 원문·학생 수 확인이 필요함',
  정비: '옛 법령명·기관명·조문번호·용어',
};

export const LEVEL_TONE: Record<Level, 'red' | 'amber' | 'blue' | 'slate' | 'green'> = {
  저촉: 'red',
  미반영: 'amber',
  누락: 'blue',
  확인필요: 'slate',
  정비: 'slate',
};

/** checklist.md 항목 묶음 */
export const GROUPS: Record<string, string> = {
  A: '필수 기재사항',
  B: '임원',
  C: '이사회',
  D: '정관 변경·해산',
  E: '재산·회계',
  F: '교원 임용·휴직',
  G: '징계',
  H: '사무직원',
  I: '표기',
  J: '대학 관련',
};

export const ITEM_LABEL: Record<string, string> = {
  A1: '목적', A2: '명칭', A3: '설치학교', A4: '사무소', A5: '자산·회계', A6: '임원 정원·임면',
  A7: '이사회', A8: '수익사업', A9: '정관 변경', A10: '해산', A11: '공고',
  B1: '이사·감사 정수', B2: '개방이사 수', B3: '개방이사추천위원회', B4: '개방이사 추천 절차',
  B5: '개방이사 자격', B6: '임원 임기', B7: '추천 감사', B8: '친족 제한', B9: '교육경험 이사',
  B10: '임원 결격·당연퇴임', B11: '3분의 2 찬성 선임 대상', B12: '겸직금지·결원 보충',
  B13: '취임 승인·공개', B14: '임원 보수',
  C1: '소집 요구', C2: '소집 통지·공지', C3: '소집권자 궐위', C4: '의결 정족수', C5: '이해상반',
  C6: '회의록', C7: '이사장 직무대행',
  D1: '정관 변경 의결', D2: '정관 변경 보고', D3: '해산',
  E1: '기본재산 처분', E2: '회계 구분', E3: '학교회계 예산 절차', E4: '교비 전출', E5: '회계연도',
  F1: '학교장 임기', F2: '교원 임용 절차', F3: '휴직·복직 위임', F4: '공개전형', F5: '교원인사위원회',
  F6: '이사장 친족 학교장', F7: '기간제교원', F8: '휴직', F9: '직위해제',
  G1: '징계 종류', G2: '정직·감봉 기간', G3: '징계위원회 위원 수', G4: '징계위원회 구성',
  G5: '외부위원 임기', G6: '징계시효', G7: '징계의결 기한·정족수',
  H1: '사무기구·정원', H2: '사무직원 임용 제청', H3: '사무직원 공개전형', H4: '사무직원 결격',
  I1: '관할청 명칭', I2: '옛 법령명·기관명', I3: '법 조문번호', I4: '정관 내부 인용', I5: '폐지 용어',
  J1: '대학평의원회', J2: '대학 교원 임용', J3: '대학의 장 해임',
};

/** 자료 시점. 다시 돌리면 같이 고친다. */
export const AS_OF = {
  articles: '2026.3.1.',
  posted: '2026.3.16.',
  law: '사립학교법 2026.5.12. 시행 · 시행령 2025.12.23.',
  lawShort: '법령 2026.9.23.',
  boardUrl:
    'https://www.jbe.go.kr/board/list.jbe?boardId=BBS_0000088&menuCd=DOM_000000106004002000&contentsSid=344',
};

export type Tab = 'corp' | 'text' | 'item' | 'method';

export const TAB_LABEL: Record<Tab, string> = {
  corp: '법인별 점검 결과',
  text: '정관 원문',
  item: '항목별 · 조문별',
  method: '점검 방법과 한계',
};
