---
type: order
date: 2026-10-27
from: iMac/쌍아
to: iMac/쌍아-막내21
device: iMac
agent: 쌍아
subject: 매팅 백업 알림 문구 사유별 분리 + 백업 안내 3키 id·vi 추가 — dev 검증까지 (prod 배포 없음)
status: 대기
portfolio: PF_INFRA
---

# ORDER — 백업 알림 사유 분리 + id·vi 안내 (후속)

**[2026-10-27 18:50 KST]** iMac/쌍아 → iMac/쌍아-막내21

> 출처: 작가님 2026-10-27 18:49 KST (iMac 쌍아 세션 사람 턴) "A 배포 승인" — 쌍아 17:18 보고의 A안("두 가지 반영 후 배포"). 선행: [ORDER_20261027 매팅워밍조건부](ORDER_20261027_iMac쌍아_막내21_INFRA_매팅워밍조건부_백업지연안내.md) · [COMPLETION](../../reports/2026-10/COMPLETION_20261027_iMac쌍아-막내21_INFRA_매팅워밍조건부.md).

## 할 일

### 1. 텔레그램 백업 알림 — 사유를 문구에 반영 (`portal/lib/matte.js`)
- `alertMatteBackup(slug, sec)` → `alertMatteBackup(slug, sec, reason)`. 호출부(`noteBackup`)에서 기존 `backupReason`을 넘긴다.
- 문구: `${ENV_TAG}⚠️ 매팅 백업 전환 — ${label}, RunPod 처리 (${slug}, ${sec}s)`
  - `프리플라이트 불통` → `iMac 불통` / `포화 초과` → `iMac 포화` / `호출 실패` → `iMac 호출 실패` / 그 외·null → `iMac 불통`
- 쿨다운 키·체인 동작·로그 형식(`[Matte] BACKUP …`) **불변**.

### 2. id·vi 안내 3키 (`lib/cms/specs-i18n.js`) — 아래 문구 그대로
| 키 | id | vi |
|---|---|---|
| `engineBackupNotice` | Saat ini kami memproses dengan server cadangan. Mungkin perlu 20–30 detik lebih lama dari biasanya. | Hiện chúng tôi đang xử lý bằng máy chủ dự phòng. Có thể mất thêm 20–30 giây so với bình thường. |
| `genBackupWorking` | Sedang diproses di server cadangan — mohon tunggu sebentar lagi | Đang xử lý trên máy chủ dự phòng — vui lòng đợi thêm một chút |
| `genRefundAssure` | Jika pemrosesan gagal, kredit pembuatan tidak akan dipotong dan otomatis dikembalikan. | Nếu xử lý thất bại, lượt tạo sẽ không bị trừ và sẽ được tự động hoàn lại. |

- 키 위치는 ko~es와 같은 블록. 기존 id·vi 블록 구조(폴백 방식 포함)를 먼저 확인하고 맞춘다.

## 검증
- jest 전량 통과 + 사유 3종 → 라벨 매핑 단위 확인(텔레그램 실발송 불요 — 발송 함수 모킹 또는 문자열 조립 테스트).
- dev 배포(`deploy.sh` dev 경로만) 후 id·vi specs 퍼널 페이지에서 3키 렌더 확인(소스 문자열 아닌 실제 마크업/번들 — live-verify 3절). 내부 명칭 고객 노출 0(id·vi 문구에 iMac·RunPod 없음).
- ⚠️ iMac 매팅 서버·터널 손대지 않는다. dev env 변경 없음(이번엔 불통 재현 불요).
- **prod 배포·엣지 재배포 금지** — 쌍아가 작가님 승인 토큰으로 집행한다.

## 산출물
- 커밋 2개(롤백 단위): 아래 메시지.
- 기존 COMPLETION 파일에 `## 후속 (18:50 ORDER)` 절 어펜드 — 변경·dev rev·검증 결과·판정 방법.
- 막내 세션 로그 어펜드.

## 쓰기 범위
`portal/lib/matte.js`, `lib/cms/specs-i18n.js`, 관련 테스트 파일, 위 COMPLETION·세션 로그. 그 외 없음.

## ⚠️ 준수 조항
- 헌법 3조 1·2항, 4조 4항(되는 것만 — genRefundAssure는 기존과 같은 경로 조건으로만 노출), ch8(고객 대면 내부 명칭 금지), ch5(prod = 작가님 승인), ch1 7조(범위 확장 금지).

## 완료 기준
- [ ] 커밋·푸시 + 원격 SHA 대조, 쌍아(로컬 주소 monk-project-2f)에 세션 메시지 1회

## 커밋 메시지
```
[fix] 매팅 백업 알림 사유별 문구 — 불통·포화·호출 실패
[feat] 매팅 백업 안내 id·vi 추가
```
