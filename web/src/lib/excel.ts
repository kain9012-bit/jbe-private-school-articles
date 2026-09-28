import { GROUPS, ITEM_LABEL, LEVELS, type Corp } from '../types';

/**
 * 엑셀 내려받기. 라이브러리(SheetJS)가 커서 단추를 누를 때만 불러온다.
 * 법인별은 그 법인의 지적 전체, 전체는 71개 법인 지적 목록 + 법인 요약 두 장.
 */
const HEAD = [
  '법인명', '설치학교', '구분', '항목', '항목명', '정관 조문', '지적 내용', '개정 방향',
  '정관 원문', '근거 법령', '법령 원문', '재검토',
];
const WIDTH = [14, 28, 8, 6, 18, 12, 50, 36, 50, 28, 50, 40];

const rowsOf = (c: Corp) =>
  c.findings.map((f) => [
    c.name,
    c.schools.join(', '),
    f.level,
    f.item,
    `${GROUPS[f.item[0]] ?? ''} · ${ITEM_LABEL[f.item] ?? ''}`,
    f.article,
    f.issue,
    f.fix ?? '',
    f.quote ?? '',
    f.law ?? '',
    f.law_quote ?? '',
    f.audit ? `${f.audit.verdict}${f.audit.from ? `(${f.audit.from}→${f.level})` : ''} · ${f.audit.reason}` : '',
  ]);

const summaryRow = (c: Corp) => {
  const n = (l: string) => c.findings.filter((f) => f.level === l).length;
  return [
    c.name,
    c.schools.join(', '),
    c.students.map((s) => `${s.matched} ${s.students}명`).join(', '),
    c.lastAmended ?? '',
    ...LEVELS.map(n),
    c.findings.length,
    c.ocr ? '스캔본(OCR)' : '',
  ];
};

async function save(sheets: { name: string; head: string[]; rows: (string | number)[][]; width: number[] }[], file: string) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([s.head, ...s.rows]);
    ws['!cols'] = s.width.map((wch) => ({ wch }));
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: s.rows.length, c: s.head.length - 1 } }) };
    XLSX.utils.book_append_sheet(wb, ws, s.name);
  }
  // writeFile 은 일부 브라우저에서 파일명이 'download' 로 떨어져서 직접 내려보낸다
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = file;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export const downloadCorp = (c: Corp, year: string) =>
  save([{ name: '지적 목록', head: HEAD, rows: rowsOf(c), width: WIDTH }], `학교법인정관점검_${year}_${c.name}.xlsx`);

export const downloadAll = (corps: Corp[], year: string) => {
  const sorted = [...corps].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  return save(
    [
      {
        name: '법인 요약',
        head: ['법인명', '설치학교', '학생 수(2026.4.1.)', '최종 개정', ...LEVELS, '합계', '비고'],
        rows: sorted.map(summaryRow),
        width: [14, 36, 44, 16, 6, 6, 6, 8, 6, 6, 12],
      },
      { name: '지적 목록', head: HEAD, rows: sorted.flatMap(rowsOf), width: WIDTH },
    ],
    `학교법인정관점검_${year}_전체.xlsx`,
  );
};
