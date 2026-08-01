/**
 * 관상×사주 리포트 어드민 API — PF_FACEREAD Phase A
 *
 * 어드민 비공개 표면 전용. 공개 라우트·과금·Firestore 저장은 Phase C 범위다.
 *  - GET /api/admin/gwansang/data : 룰 DB 정본(lib/cms/gwansang-data.json) 서빙
 *  - GET /api/admin/gwansang/saju : 생년월일(+시각) → 사주 4주 + 관상 오행 궁합
 *
 * 사진은 서버로 오지 않는다. 얼굴 계측은 전량 브라우저(FaceMesh 478)에서 끝난다.
 */
import { createRequire } from 'module';
import { requireAdmin } from './admin-auth.js';
import { computeSaju, elementRelation, TERM_RANGE } from '../gwansang/saju.js';

const _require = createRequire(import.meta.url);
export const GWANSANG_DB = _require('./gwansang-data.json');

function json(res, status, payload, cache = 'no-store') {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache });
  res.end(JSON.stringify(payload));
}

/** GET /api/admin/gwansang/data — 룰 DB 정본 */
export function handleGwansangData(req, res) {
  if (!requireAdmin(req, res)) return;
  json(res, 200, GWANSANG_DB, 'no-cache');
}

/** GET /api/admin/gwansang/saju?date=YYYY-MM-DD&time=HH:MM&faceElement=wood */
export function handleGwansangSaju(req, res) {
  if (!requireAdmin(req, res)) return;

  const url = new URL(req.url, 'http://localhost');
  const date = url.searchParams.get('date');
  const time = url.searchParams.get('time');
  const faceElement = url.searchParams.get('faceElement');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json(res, 400, { error: 'bad_date', message: '생년월일을 YYYY-MM-DD 형식으로 보내주세요.' });
  }
  if (time && !/^\d{1,2}:\d{2}$/.test(time)) {
    return json(res, 400, { error: 'bad_time', message: '출생 시각을 HH:MM 형식으로 보내주세요.' });
  }

  let saju;
  try {
    saju = computeSaju(date, time, GWANSANG_DB.saju);
  } catch (e) {
    // 무음 강등 금지 — 계산 실패는 명시 오류로 반환한다
    return json(res, 500, { error: 'saju_failed', message: `사주 산출에 실패했습니다: ${e.message}` });
  }
  if (!saju) return json(res, 400, { error: 'bad_date', message: '생년월일을 해석하지 못했습니다.' });
  if (saju.error) return json(res, 422, saju);

  const relation = faceElement && GWANSANG_DB.saju.elements[faceElement]
    ? elementRelation(faceElement, saju.dayElement, GWANSANG_DB.saju)
    : null;

  json(res, 200, { saju, relation, termRange: TERM_RANGE });
}
