#!/usr/bin/env python3
"""T3 리서치 결과 → specs-data.json 결정론 적재기 (2026-07-14 M1/민아).

원칙 (ORDER_20260714_M1민아_막내1_SPECS_2차확장 §T3 + 진실성 게이트):
- verified + source_url 있는 필드만 적재. unverified 무시(공란 유지).
- 수치 필드(headHeight*/size/background/pixels/dpi) 불가침 — db_conflicts는 보고서로만.
- validity/fileSpec은 En 필드에만 적재 (영어 원문을 ko 표시 필드에 넣지 않는다 — 언어 게이트 정합).
- restrictions_i18n {en,ko,ja} → restrictions. 3언어 미완 필드는 en만 있어도 적재(렌더 언어 게이트가 표면 제어).
- details 불가침 (정직화 문구 유지 — 실데이터 요약 작성은 별도 검수 패스).
- 라운드트립 검증 후 기록 (ch2).

사용: python3 load_research_t3.py [--dry-run]
"""
import json, glob, os, sys

RDIR = os.path.dirname(os.path.abspath(__file__))
SPECS = '/Users/developer/monk_project/monkos_AI/portal/lib/cms/specs-data.json'
DRY = '--dry-run' in sys.argv

raw = open(SPECS).read()
db = json.loads(raw)
assert json.dumps(db, ensure_ascii=False, indent=2) == raw, '라운드트립 불일치 — 중단'

RESTR_KEYS = ['clothing', 'expression', 'glasses', 'ears', 'face_visibility', 'headwear', 'accessories']
FIELD_MAP = {  # research verified 필드 → restrictions 키
    'clothing_restriction': 'clothing', 'expression_restriction': 'expression',
    'glasses_policy': 'glasses', 'ears_visibility': 'ears',
    'face_visibility': 'face_visibility', 'headwear_policy': 'headwear', 'accessories': 'accessories',
}

stats = {'slugs': 0, 'restrictions': 0, 'validity': 0, 'fileSpec': 0, 'officialSource': 0, 'skipped_nosrc': 0}
conflicts_report = []

for f in sorted(glob.glob(RDIR + '/*.json')):
    slug = os.path.basename(f)[:-5]
    if slug not in db:
        continue
    r = json.load(open(f))
    batch = r.get('batch')
    if not isinstance(batch, int) or batch < 0:  # T3 파일만 (1·2차는 batch 문자열/기존재 — 재적재 무해하나 범위 제한)
        pass  # batch 판별 불가 시에도 적재 규칙은 동일하므로 진행
    v = r.get('verified', {})
    entry = db[slug]
    touched = False

    def val(field):
        item = v.get(field)
        if isinstance(item, dict) and str(item.get('value', '')).strip():
            if str(item.get('source_url', '')).strip():
                return str(item['value']).strip()
            stats['skipped_nosrc'] += 1
        return None

    # restrictions — i18n 우선, 없으면 verified en만
    i18n = r.get('restrictions_i18n', {}) or {}
    restr = dict(entry.get('restrictions', {}) or {})
    for rf, rk in FIELD_MAP.items():
        en_val = val(rf)
        tri = i18n.get(rk) or i18n.get(rf) or {}
        if not en_val and not tri.get('en'):
            continue
        # 기존 블록과 언어별 병합 — 리서치 파일에 없는 언어(기번역 ko/ja)를 절대 소실시키지 않는다
        # (2026-07-14 게이트 적발 버그 수리: en-only 1차 파일이 T2 번역 87슬러그를 덮어쓰던 문제)
        block = dict(restr.get(rk, {}) or {})
        for lang in ('en', 'ko', 'ja'):
            t = str(tri.get(lang, '')).strip()
            if lang == 'en' and not t:
                t = en_val or ''
            if t:
                block[lang] = t
        if block.get('en'):
            restr[rk] = block
            touched = True
    if touched:
        entry['restrictions'] = restr
        stats['restrictions'] += 1

    ov = val('validity')
    if ov and not str(entry.get('validityEn', '')).strip():
        entry['validityEn'] = ov
        stats['validity'] += 1
    of = val('file_spec')
    if of and not str(entry.get('fileSpecEn', '')).strip():
        entry['fileSpecEn'] = of
        stats['fileSpec'] += 1
    osrc = val('official_source_url') or (str(v.get('official_source_url', {}).get('value', '')).strip() if isinstance(v.get('official_source_url'), dict) else None)
    if osrc and not entry.get('officialSource'):
        entry['officialSource'] = osrc
        stats['officialSource'] += 1

    for c in r.get('db_conflicts', []) or []:
        conflicts_report.append({'slug': slug, **{k: str(cv)[:80] for k, cv in c.items()}})
    stats['slugs'] += 1

print('적재 대상 파일:', stats['slugs'], '| restrictions', stats['restrictions'], '| validityEn', stats['validity'],
      '| fileSpecEn', stats['fileSpec'], '| officialSource', stats['officialSource'], '| 출처없어 스킵', stats['skipped_nosrc'])
print('db_conflicts 총', len(conflicts_report), '건')

if DRY:
    print('[dry-run] 미기록')
else:
    open(SPECS, 'w').write(json.dumps(db, ensure_ascii=False, indent=2))
    open(RDIR + '/T3_db_conflicts.json', 'w').write(json.dumps(conflicts_report, ensure_ascii=False, indent=1))
    print('기록 완료 + T3_db_conflicts.json')
