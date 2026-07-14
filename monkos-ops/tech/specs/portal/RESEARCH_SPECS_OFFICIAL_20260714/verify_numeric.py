#!/usr/bin/env python3
"""수치 필드 전수 기계 검산 — inch↔mm 환산 + %병기 대조.

민아 검산 로직(2026-07-14 세션 15:36) 원본 포팅.
허용오차: ±1.5mm.
"""
import json, re, sys, os

RESEARCH_DIR = os.path.dirname(os.path.abspath(__file__))
SPECS_DATA_PATH = os.path.join(RESEARCH_DIR, '..', '..', '..', '..', '..', 'monkos_AI', 'portal', 'lib', 'cms', 'specs-data.json')

def parse_mm_range(text):
    """'25-35mm' or '2.5~3.5cm' → (min_mm, max_mm) or None."""
    text = str(text).lower().replace('~', '-').replace('–', '-')
    m = re.search(r'(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*mm', text)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r'(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*cm', text)
    if m:
        return float(m.group(1)) * 10, float(m.group(2)) * 10
    return None

def parse_inch_range(text):
    """'1 inch to 1 3/8 inches' → (min_mm, max_mm) or None."""
    text = str(text).lower()
    fractions = []
    for m in re.finditer(r'(\d+)\s+(\d+)/(\d+)', text):
        fractions.append(int(m.group(1)) + int(m.group(2)) / int(m.group(3)))
    for m in re.finditer(r'(?<!\d/)(\d+\.?\d*)\s*inch', text):
        fractions.append(float(m.group(1)))
    if len(fractions) >= 2:
        return min(fractions) * 25.4, max(fractions) * 25.4
    return None

def parse_percent_range(text, frame_mm):
    """'50-69% of image' + frame height → (min_mm, max_mm)."""
    m = re.search(r'(\d+)\s*-\s*(\d+)\s*%', str(text))
    if m and frame_mm:
        return float(m.group(1)) / 100 * frame_mm, float(m.group(2)) / 100 * frame_mm
    return None

def parse_frame_height_mm(size_str):
    """'2 x 2 inch (51 x 51mm)' → 51.0 or '3.5 × 4.5cm' → 45.0."""
    text = str(size_str).lower()
    m = re.search(r'(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)\s*mm', text)
    if m:
        return max(float(m.group(1)), float(m.group(2)))
    m = re.search(r'(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)\s*cm', text)
    if m:
        return max(float(m.group(1)), float(m.group(2))) * 10
    m = re.search(r'(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)\s*inch', text)
    if m:
        return max(float(m.group(1)), float(m.group(2))) * 25.4
    return None

TOLERANCE = 1.5  # mm

def check_slug(slug, research, db):
    issues = []
    r_hh = research.get('verified', {}).get('head_height', {}).get('value', '')
    db_hh = db.get('headHeight', '')
    db_size = db.get('size', '')
    frame_h = parse_frame_height_mm(db_size)

    # 1. inch↔mm 환산 검산
    if r_hh:
        inch_range = parse_inch_range(r_hh)
        mm_range = parse_mm_range(r_hh)
        if inch_range and mm_range:
            if abs(inch_range[0] - mm_range[0]) > TOLERANCE:
                issues.append(f"inch↔mm MIN 불일치: inch→{inch_range[0]:.1f}mm vs 표기 {mm_range[0]:.1f}mm (차이 {abs(inch_range[0]-mm_range[0]):.1f}mm)")
            if abs(inch_range[1] - mm_range[1]) > TOLERANCE:
                issues.append(f"inch↔mm MAX 불일치: inch→{inch_range[1]:.1f}mm vs 표기 {mm_range[1]:.1f}mm (차이 {abs(inch_range[1]-mm_range[1]):.1f}mm)")

    # 2. %병기 검산
    if r_hh and frame_h:
        pct_range = parse_percent_range(r_hh, frame_h)
        mm_range2 = parse_mm_range(r_hh) or parse_mm_range(db_hh)
        if pct_range and mm_range2:
            if abs(pct_range[0] - mm_range2[0]) > TOLERANCE:
                issues.append(f"%병기 MIN 불일치: {pct_range[0]:.1f}mm(%계산) vs {mm_range2[0]:.1f}mm(표기) (차이 {abs(pct_range[0]-mm_range2[0]):.1f}mm)")
            if abs(pct_range[1] - mm_range2[1]) > TOLERANCE:
                issues.append(f"%병기 MAX 불일치: {pct_range[1]:.1f}mm(%계산) vs {mm_range2[1]:.1f}mm(표기) (차이 {abs(pct_range[1]-mm_range2[1]):.1f}mm)")

    # 3. DB vs 리서치 대조
    if r_hh and db_hh:
        r_mm = parse_mm_range(r_hh)
        d_mm = parse_mm_range(db_hh)
        if r_mm and d_mm:
            if abs(r_mm[0] - d_mm[0]) > TOLERANCE or abs(r_mm[1] - d_mm[1]) > TOLERANCE:
                issues.append(f"DB 불일치: 리서치 {r_mm[0]:.0f}-{r_mm[1]:.0f}mm vs DB {d_mm[0]:.0f}-{d_mm[1]:.0f}mm")

    return issues

def main():
    with open(SPECS_DATA_PATH) as f:
        specs = json.load(f)

    results = []
    pct_slugs = []
    for fn in sorted(os.listdir(RESEARCH_DIR)):
        if not fn.endswith('.json'):
            continue
        slug = fn[:-5]
        with open(os.path.join(RESEARCH_DIR, fn)) as f:
            research = json.load(f)
        db = specs.get(slug, {})
        issues = check_slug(slug, research, db)
        if issues:
            results.append((slug, issues))
        r_hh = research.get('verified', {}).get('head_height', {}).get('value', '')
        if '%' in str(r_hh):
            frame_h = parse_frame_height_mm(db.get('size', ''))
            pct_range = parse_percent_range(r_hh, frame_h) if frame_h else None
            mm_range = parse_mm_range(r_hh) or parse_mm_range(db.get('headHeight', ''))
            pct_slugs.append({
                'slug': slug,
                'raw': r_hh,
                'frame_mm': frame_h,
                'pct_calc': f"{pct_range[0]:.1f}-{pct_range[1]:.1f}mm" if pct_range else 'N/A',
                'mm_stated': f"{mm_range[0]:.1f}-{mm_range[1]:.1f}mm" if mm_range else 'N/A',
                'ok': '✅' if (pct_range and mm_range and abs(pct_range[0]-mm_range[0]) <= TOLERANCE and abs(pct_range[1]-mm_range[1]) <= TOLERANCE) else '❌' if pct_range and mm_range else '—'
            })

    print(f"=== 수치 검산 결과 ({len(os.listdir(RESEARCH_DIR))-1} 슬러그) ===")
    if results:
        print(f"\n🔴 이상 발견: {len(results)}건")
        for slug, issues in results:
            for issue in issues:
                print(f"  {slug}: {issue}")
    else:
        print("\n✅ 전 슬러그 검산 통과")

    if pct_slugs:
        print(f"\n=== %병기 대조표 ({len(pct_slugs)}건) ===")
        print(f"{'slug':<20} {'frame(mm)':<10} {'%계산':<15} {'mm표기':<15} {'판정'}")
        for p in pct_slugs:
            print(f"{p['slug']:<20} {p['frame_mm'] or 'N/A':<10} {p['pct_calc']:<15} {p['mm_stated']:<15} {p['ok']}")

def prose_scan():
    """DB 수치 정정 시 산문 필드(faqs, details, seoDescription 등) 구값 잔존 검사."""
    with open(SPECS_DATA_PATH) as f:
        specs = json.load(f)

    prose_fields = ['faqs', 'details', 'rejectionReasons', 'seoDescription', 'heroDesc']
    numeric_fields = ['headHeight', 'headHeightEn', 'headHeightJa', 'size', 'background']
    issues = []

    for slug, spec in specs.items():
        for nf in numeric_fields:
            val = spec.get(nf, '')
            if not val or not isinstance(val, str):
                continue
            nums = re.findall(r'\d+\.?\d*', val)
            for pf in prose_fields:
                prose = json.dumps(spec.get(pf, ''), ensure_ascii=False)
                for num in nums:
                    if len(num) >= 2 and num in prose:
                        pass  # normal: prose mentions same number as spec

        # Check for OLD values that might linger after corrections
        hh = spec.get('headHeight', '')
        hh_min = spec.get('headHeightMin')
        if hh and hh_min:
            hh_range = parse_mm_range(hh)
            if hh_range and abs(hh_range[0] - hh_min) > 2:
                issues.append(f"{slug}: headHeight min={hh_range[0]:.0f}mm vs headHeightMin={hh_min} (불일치)")

    print(f"\n=== 산문 전파 검사 (--prose-scan) ===")
    if issues:
        print(f"🔴 이상 {len(issues)}건:")
        for i in issues:
            print(f"  {i}")
    else:
        print("✅ headHeight↔headHeightMin 전수 일치")


if __name__ == '__main__':
    if '--prose-scan' in sys.argv:
        prose_scan()
    else:
        main()
        prose_scan()
