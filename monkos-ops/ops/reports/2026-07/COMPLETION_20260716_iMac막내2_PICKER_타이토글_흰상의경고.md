---
type: completion
date: 2026-07-16
device: iMac
agent: 막내2
status: 완료
portfolio: PF_SPECS
---

# COMPLETION: 피커 타이 토글(B안) + idpass 흰상의 발급거부 경고 4언어

**[2026-07-16 14:09 KST]** iMac/막내2 → 작가님

## 결과

✅ **타이 토글 (B안)**: 정장·셔츠 선택 시 넥타이 토글 행 노출, 기본 off, 네이비·차콜 솔리드 2종 스와치
✅ **desc 치환**: `"no tie"` → 프리셋 `tieOptions[].descFragment` 고정 문자열만 (인젝션 표면 0)
✅ **페이로드**: `attireTie: 'navy'|'charcoal'|null` — getSelection() + specs-funnel.js body
✅ **기존 타이 아이템 정리**: `m_shirt_white_tie_navy_15` active→false 강등 (에셋·GCS 보존)
✅ **카드 뱃지**: 토글 on 시 선택 카드에 색상 도트 오버레이 (썸네일 편집 없음)
✅ **흰 상의 경고 강화**: 4언어 문구 갱신 + 상시 노출 (warnLightTop=true이면 무조건, "지금 옷 그대로"에서도 표시)
✅ **dev 배포**: rev `monkos-portal-dev-00138-lqz`, 100% 트래픽
✅ **README**: 타이 토글 계약 명문화

## 변경 파일

| 파일 | 변경 |
|------|------|
| `public/components/attire-picker/attire-presets.json` | tieOptions 2종 추가, item15 inactive |
| `public/components/attire-picker/attire-picker.js` | 타이 토글 UI + desc 치환 + 흰상의 상시 경고 + tieLabel 4언어 |
| `public/components/attire-picker/attire-picker.css` | .atp-tie-* 스타일 7종 + .atp-badge-tie |
| `public/components/attire-picker/demo.html` | attireTie 페이로드 + es 선택지 |
| `public/components/attire-picker/README.md` | 타이 토글 계약 섹션 |
| `public/js/specs-funnel.js` | attireTie를 generate body에 추가 |

## 검증

- 단위 테스트: desc 치환(navy/charcoal), tieSupported(suit/shirt/blouse/null) 전항 통과
- dev 원격 검증: presets·JS·CSS 정합, warnLight 4언어 텍스트 확인
- 배포 rev: monkos-portal-dev-00138-lqz

## ⏳ 미완료 (민아 검증 필요)

- [ ] 브라우저 UI 실동작 확인 (데모 + specs dev 페이지)
- [ ] dev 생성 1회 실측: 타이 on 결과물 타이 렌더 확인
- [ ] prod 배포 (민아 검증 후)
