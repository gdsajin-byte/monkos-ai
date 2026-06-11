---
type: proposal
date: 2026-06-11
device: 웹
agent: 민아
to: 작가님 (검토: 쌍아)
subject: "Claude for Open Source 신청 패키지 — 팩트시트·체크리스트·에세이 초안·OSS 보강안 (마감 06-30)"
status: 제출 (작가님 결정 대기)
---

# Claude for OSS 신청 패키지

> **[2026-06-11 15:10 KST] 웹/민아 → 작가님**
> 선정 시 Max 20x 6개월 결제 일시중지 = 약 175만원 세이브. 마감 06-30 (D-19), 1만 명 수시 심사(선착 요소). 본 문서 = 즉시 신청 가능한 완성 패키지.

---

## 1. 팩트시트 (교차 검증 완료 — 공식 페이지는 봇 차단으로 보도·가이드·후기 3원 대조)

| 항목 | 확정 내용 |
|------|----------|
| 프로그램 | Claude for Open Source (Anthropic 공식, 2026-02-26 발표) |
| 혜택 | Max 20x 6개월 무료 ($1,200). **기존 구독자 = 결제 6개월 일시중지 → 종료 후 자동 재개**. 그랜트 자체의 자동 결제 전환 없음 |
| 적용 방식 | 승인 시 본인 Claude 계정에 활성화 링크 발급 |
| 제한 | **개인용 플랜 — API 미포함, 자동화 파이프라인 용도 불가** · 1인 1신청 · 양도 불가 |
| Track 1 | 공개 리포 5,000스타↑ or 월 100만 npm DL↑ + 머지 권한 + 최근 3개월 활동 |
| Track 2 | 임계 미달 가능 — 500단어 이내 생태계 중요성 설명. 공식 표현: 핵심 인프라형 프로젝트는 "지표 미달이어도 일단 신청하고 설명하라" |
| 일반 자격 | 18세↑ · Claude 지원국 거주(한국 ✓) · 정상 GitHub 계정 ✓ |
| 신청처 | claude.com/contact-sales/claude-for-oss |

**신청 양식 필드 (가이드 종합)**: GitHub 프로필 링크 · 유지 프로젝트 링크+설명 · 스타/다운로드 수치 · 역할(Maintainer/Core) · 최근 기여 요약 · **Claude Max 활용 계획(구체 유스케이스)** · (Track 2) 생태계 임팩트 서술.

⚠️ 유의: "자동화 파이프라인 용도 불가" 조항 — 신청서의 활용 계획에는 **작가님 개인의 개발·유지보수 용도**로 기술해야 하며, 사내 에이전트 군단 운용을 전면에 쓰면 불리할 수 있음. 에세이 초안은 이를 반영해 작성함.

## 2. 작가님 현황 실측 + 판정

- GitHub `gdsajin-byte`: 공개 리포 **monkos-ai 1개**(설명·바이오·링크 정돈됨, 스타 미미). Track 1 불가.
- **Track 2 합격 확률을 좌우하는 것 = 공개된 실물.** 현재는 서사(20년 사진가·anti-deepfake)는 강하나 받쳐줄 OSS 실체가 얇음.

## 3. OSS 보강안 — 신청 전 1~2일 작업 (강력 권고)

**1순위: 증명사진 규격 오픈 데이터셋 공개** — `id-photo-specs` (신규 공개 리포 or monkos-ai 내)
- 내용: PF_SPECS 자산 중 **공개 표준의 집대성 부분**(국가×문서별 규격 — 치수·배경·비율, 기계가독 JSON) + 9언어 문서 안내
- 근거: ① 이 데이터는 원래 공개 표준의 정리라 기밀·경쟁 리스크 낮음(쌍아 범위 검토 1회 필요) ② 증명사진 도구를 만드는 모든 개발자의 공통 필요물 = "생태계 인프라" 서사에 정확히 부합 ③ 백링크·개발자 축 자산으로 탈락해도 무손해
- 라이선스 제안: 데이터 CC-BY 4.0 (출처 표기 = monkos.ai 백링크 유도)

**2순위: 클라이언트 완결형 크롭 패턴 문서+데모 공개** — 개발기(SPEC_20260318) 기보유, "사진이 디바이스를 떠나지 않는다" 프라이버시 패턴. 코드 공개 범위는 쌍아 검토 필수.

## 4. Track 2 에세이 초안 (영문, ~340단어 — 500 한도 내. ※ §3 1순위 공개를 전제로 작성, 미공개 신청 시 [ ] 부분 삭제)

```
I am JK Shin, a professional photographer of 20 years and the maintainer of
MONKOS (github.com/gdsajin-byte/monkos-ai), an identity-photo platform built
around two principles I believe matter to the broader software ecosystem:
anti-deepfake by design, and photos that never leave the user's device.

Identity photos are quietly becoming a deepfake frontline. Consumer AI tools
can now generate "official-looking" ID photos with altered identity, and most
tooling in this space treats that as a feature rather than a risk. I build in
the opposite direction: identity preservation is the first principle, with
real-time capture verification and conservative retouching boundaries informed
by two decades of studio compliance work with government photo standards.

Two resources I maintain are useful beyond my own product:

1. [An open, machine-readable dataset of identity-photo specifications —
dimensions, background, face-ratio rules — covering 200+ countries and
document types, in 9 languages. Every developer building photo tooling
re-collects this scattered information; I am publishing it as open data
(CC-BY) so they no longer have to.]

2. A client-side-complete ICAO crop pattern: face detection, compliance
checking and cropping run entirely in the browser, with zero server upload.
As privacy regulation tightens, I believe this "nothing leaves the device"
pattern deserves to be a documented, reusable reference — not a trade secret.

I do not meet the star threshold; my work's value is infrastructural rather
than popular. I am applying under the Ecosystem Impact track because ID-photo
compliance data and privacy-preserving capture patterns are exactly the kind
of unglamorous plumbing the ecosystem depends on.

I already use Claude Max daily as my primary development tool — for
maintaining the dataset, documenting the crop pattern, and writing the
technical guides that accompany them. Six months of supported access would go
directly into completing and maintaining these open resources alongside my
studio work.
```

## 5. 신청 체크리스트 (작가님 실행 순서)

1. ☐ §3 1순위 공개 여부 결정 (권고: 공개 후 신청 — 쌍아 범위 검토 → 막내 리포 구성, 1~2일)
2. ☐ claude.com/contact-sales/claude-for-oss 접속 (작가님 Claude 계정 = 현 Max 20x 결제 계정으로)
3. ☐ 양식: GitHub `gdsajin-byte` · 리포 링크 · 역할 Maintainer · 최근 기여(데이터셋·크롭 패턴·기술 문서) · 활용 계획(§4 마지막 문단 요지)
4. ☐ Track 2 에세이 §4 붙여넣기 (공개 안 했으면 [ ] 단락 제거 후)
5. ☐ 제출 — 수시 심사이므로 빠를수록 유리. 결과는 계정 메일로 수신 → 아침 루틴 메일 트리아지가 자동 포착

## ✅❌💡⏳

- ✅ 팩트시트·양식 필드·에세이 초안·OSS 보강안·체크리스트 완성
- ⏳ 작가님 결정 2건: ① 규격 데이터셋 공개 승인(쌍아 범위 검토 경유) ② 신청 시점(즉시 vs 공개 후)
- 💡 "개인용·API 불가" 조항 준수 — 에세이는 개인 개발 용도 중심으로 작성됨
