---
type: order
date: 2026-04-24
from: iMac/쌍아
to: iMac/막내1
status: 대기
priority: 1
---

[2026-04-24 13:37 KST] iMac/쌍아 → iMac/막내1

# ORDER: 퍼널 UX 진단 + 랜딩 이탈 즉시 수정

## 배경

GA 30일 데이터 기준, idphoto-kr 랜딩 페이지에서 **93.5%가 이탈**한다.
1,997명이 들어와 130명만 /prep으로 진행. CTA와 가치 전달이 실패하고 있다.

서비스 가동 1개월+ 유의미한 결제 0건. 퍼널 첫 관문이 가장 심각한 병목.

## 임무

### Phase 1: 현황 진단 (분석만, 코드 수정 없음)

1. **idphoto-kr 랜딩 페이지** (`monkos_AI/idphoto-kr/public/index.html`) 분석
   - Above the fold에 무엇이 보이는가
   - CTA(Call-to-Action) 버튼의 위치, 문구, 색상
   - 사용자가 "이 서비스가 뭔지, 왜 써야 하는지" 3초 안에 파악할 수 있는가
   - 모바일 뷰에서의 레이아웃 (idphoto는 모바일 트래픽이 대부분일 가능성 높음)

2. **idphoto-jp 랜딩 페이지** 동일 분석

3. **monkos.ai 포털** → idphoto 서비스 진입 경로 분석
   - 포털에서 idphoto-kr/jp로 어떻게 연결되는가
   - 연결 동선이 명확한가

4. **퍼널 각 단계 페이지** 분석
   - /prep → /camera.html → /result.html → /charge.html → /thankyou.html
   - 각 단계의 이탈 요인 (로딩 시간, 복잡한 UI, 불명확한 다음 스텝)

### Phase 2: 즉시 수정

진단 결과를 기반으로 다음 개선 실행:

1. **랜딩 CTA 강화** — 가치 제안 문구 개선, CTA 버튼 명확화
2. **모바일 퍼스트 점검** — 모바일에서의 Above the fold 최적화
3. **퍼널 단계 간 안내 개선** — "다음에 무엇이 일어나는지" 명시
4. 수정 후 dev 배포로 확인

## ⚠️ 준수 조항
- 법률 ch2 (코딩 규칙) 준수
- 배포는 `deploy.sh` 경유 (법률 ch5 2조)
- 비밀정보 수정 시 승인 필수 (헌법 4조 1항)

## 산출물
- `COMPLETION_20260424_막내1_퍼널UX진단.md` — 진단 결과 + 수정 사항 + before/after 스크린샷 경로

## 참조
- GA 데이터: idphoto-kr 랜딩 1,997유저 → prep 130유저 (6.5% 전환)
- idphoto-kr: `monkos_AI/idphoto-kr/`
- idphoto-jp: `monkos_AI/idphoto-jp/`
- 포털: `monkos_AI/portal/`
