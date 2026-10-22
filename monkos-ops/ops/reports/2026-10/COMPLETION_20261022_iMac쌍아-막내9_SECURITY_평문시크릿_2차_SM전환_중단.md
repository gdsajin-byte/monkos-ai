---
type: completion
date: 2026-10-22
device: iMac
agent: 쌍아-막내9
status: 중단
portfolio: PF_SECURITY
subject: "평문 시크릿 2차 SM 전환 — 절차 2·3에서 중단 (ORDER_20261022 SECURITY 2차)"
---

# COMPLETION(중단 보고) — 평문 시크릿 2차 SM 전환

**[2026-10-22 22:19 KST]** iMac/쌍아-막내9 → iMac/쌍아

> 지시서: [ORDER_20261022_iMac쌍아_막내_SECURITY_평문시크릿_2차_SM전환.md](../../orders/2026-10/ORDER_20261022_iMac쌍아_막내_SECURITY_평문시크릿_2차_SM전환.md)
> 투입 출처: 작가님 2026-10-22 21:45 iMac 쌍아 세션 사람 턴 "네가지 권고안 모두 처리해" → 쌍아 직접 전달. 브랜치는 쌍아 22:18 요청대로 origin/main 기준(`makne9-sm2`) — ①의 Gemini 코드 미포함.

⏳ **결론**: 절차 2(SM 미등재 2건)·절차 3(값 불일치·빈 값 5건)에서 지시서대로 중단. **운영 변경 0** — deploy.sh 미수정, dev·prod 배포 없음, 시크릿 생성·수정 없음. 전환 가능한 건 3건뿐이고 나머지는 작가님·쌍아 결정이 필요하다.

## 1. 분류표 (절차 1)

| 이름 | 판정 | 근거 |
|------|------|------|
| KAKAO_REST_API_KEY | 시크릿 | SECRET_INVENTORY #9(카카오 OAuth), §0 SM 대상 목록. 서버측 토큰 교환에 쓰는 키 |
| KAKAO_CLIENT_SECRET | 시크릿 | #10 |
| LINE_CHANNEL_SECRET | 시크릿 | #15 |
| TX_API_KEY | 시크릿 | #31 (D1 거래 원장 인증) |
| AUTH_SECRET | 시크릿 | 인벤토리 230행(토큰 서명 키) |
| LINE_MESSAGING_CHANNEL_SECRET | 시크릿 | #17 |
| LINE_MESSAGING_ACCESS_TOKEN | 시크릿 | #16 |
| GITHUB_TOKEN | 시크릿 | 이름 자체가 토큰. **인벤토리 미등재** |
| GOOGLE_CLIENT_SECRET | 시크릿 | §E 153행(CF 쪽)에만 있음 — monkos_AI 쪽 인벤토리 미등재 |
| GEMINI_API_KEY (kr·jp·studio) | 시크릿 | #5. 단 **3서비스 코드에서 실사용 없음** — kr·jp는 `const GEMINI_API_KEY = …` 선언만(57행·51행), studio는 참조 0 (10-22 grep) |

비시크릿으로 제외한 이름: 없음.

## 2. SM 존재표 (절차 2 — `scripts/secret.sh check`, 22:1x)

| 이름 | SM | 비고 |
|------|------|------|
| KAKAO_REST_API_KEY · KAKAO_CLIENT_SECRET · LINE_CHANNEL_SECRET · TX_API_KEY · LINE_MESSAGING_ACCESS_TOKEN | ✅ 있음 | 06-03 등록 |
| AUTH_SECRET | ✅ 있음 | 06-12 등록 |
| LINE_MESSAGING_CHANNEL_SECRET | ✅ 있음 | check 출력 마지막 줄에 `disabled` 버전 표시. `latest` 접근은 됨 |
| GEMINI_API_KEY | ✅ 있음 | 위와 같음 (`disabled` 버전 표시, `latest` 접근됨) |
| **GITHUB_TOKEN** | ❌ **없음** | → 지시서대로 **생성하지 않고 중단** |
| **GOOGLE_CLIENT_SECRET** | ❌ **없음** | → 같음 |

## 3. 값 일치표 (절차 3 — Y/N만, 값·해시 미기록)

방법: `services describe --format json`의 env와 `secrets versions access latest`를 한 프로세스 안에서 sha256 비교, Y/N과 "값 길이>0 여부"만 출력(`python3 -I`, 22:1x).

| 이름 | prod `monkos-portal` (00567-bhd) | dev `monkos-portal-dev` (00194-mgq) | 판정 |
|------|------|------|------|
| KAKAO_REST_API_KEY | 평문 · **Y** | 평문 · Y | ✅ 전환 가능 |
| KAKAO_CLIENT_SECRET | 평문 · **Y** | 평문 · Y | ✅ 전환 가능 |
| LINE_CHANNEL_SECRET | 평문 · **Y** | 평문 · Y | ✅ 전환 가능 |
| **AUTH_SECRET** | 평문 · **N (SM과 다른 값)** | 평문 **빈 값** | 🔴 결정 필요 (§4-1) |
| TX_API_KEY | 평문 **빈 값** | 평문 · Y | 🟡 결정 필요 (§4-2) |
| LINE_MESSAGING_ACCESS_TOKEN | 평문 **빈 값** | 평문 · Y | 🟡 결정 필요 (§4-2) |
| LINE_MESSAGING_CHANNEL_SECRET | 평문 **빈 값** | 평문 · **N** | 🟡 결정 필요 (§4-2) |
| GITHUB_TOKEN | 평문(값 있음) · SM 없음 | env 없음 | ⏳ 작가님 등재 필요 |
| GOOGLE_CLIENT_SECRET | 평문(값 있음) · SM 없음 | env 없음 | ⏳ 작가님 등재 필요 |

| GEMINI_API_KEY | prod | dev |
|------|------|------|
| idphoto-kr (00210-vrk) | 평문 · Y | env 없음 |
| idphoto-jp (00130-njn) | 평문 · Y | env 없음 |
| studio (00027-h5q) | 평문 **빈 값** | env 없음 |

## 4. 결정이 필요한 것 (쌍아 → 작가님)

1. 🔴 **AUTH_SECRET 불일치** — 포털 prod는 평문 값으로 로그인 토큰에 서명하는데, idphoto-kr·jp는 deploy.sh에서 **SM `AUTH_SECRET:latest`** 를 참조한다(kr 139행·jp 140행). 두 값이 다르다. 그대로 SM 참조로 바꾸면 **포털의 기존 로그인 토큰이 전부 무효**가 될 수 있고, 반대로 지금 포털↔idphoto 간 토큰 검증이 어긋나 있을 가능성도 있다. 이번엔 손대지 않았다. 닫힌 대안:
   - A. 포털 현행 평문 값을 SM에 새 버전으로 등재(작가님 무노출 1줄) → 포털·idphoto 모두 그 값으로 통일. idphoto 쪽 토큰이 바뀐다.
   - B. SM 값으로 포털을 맞춤 → 포털 쪽 기존 세션 무효(재로그인).
   - C. 먼저 포털↔idphoto 토큰 교차 검증이 실제로 되는지 실측(막내 조사 1건) 후 결정.
2. 🟡 **prod 빈 값 3건**(TX_API_KEY · LINE_MESSAGING_ACCESS_TOKEN · LINE_MESSAGING_CHANNEL_SECRET) — SM 참조로 바꾸면 prod에서 **처음으로 값이 들어가** D1 거래 원장 인증·LINE 메시징이 켜질 수 있다(1차의 dev 이벤트봇과 같은 유형). 닫힌 대안: 켬 / 빈 값 유지(이 3건은 평문 위험이 없으므로 대상 제외) / 기능 확인 후 결정. dev의 `LINE_MESSAGING_CHANNEL_SECRET`은 SM과 값이 다르다.
3. ⏳ **SM 미등재 2건** — 작가님 터미널 1줄(값 화면 미노출, 1차 선례 형식):
   ```bash
   gcloud run services describe monkos-portal --region us-central1 --project monkos --format=json \
    | python3 -I -c 'import json,sys;d=json.load(sys.stdin);v=[e["value"] for e in d["spec"]["template"]["spec"]["containers"][0]["env"] if e["name"]=="GITHUB_TOKEN"][0];sys.stdout.write(v)' \
    | gcloud secrets create GITHUB_TOKEN --project monkos --replication-policy=automatic --data-file=-
   ```
   `GOOGLE_CLIENT_SECRET`도 이름만 바꿔 같은 1줄. — 용도: 포털 prod GitHub 연동 토큰 / 포털 Google OAuth 클라이언트 시크릿 (평문 env → SM 참조 전환). 단 **GITHUB_TOKEN은 포털에서 무엇에 쓰는지 먼저 확인 권장** — 쓰지 않으면 등재 대신 env 제거가 맞다.
4. 💡 **GEMINI_API_KEY는 SM 전환보다 제거 권고** — 3서비스 모두 코드에서 쓰지 않는다(모든 Gemini 호출은 Vertex ADC). 제거 = deploy.sh에 `--remove-env-vars GEMINI_API_KEY` + 죽은 선언 2줄 삭제. 지시서 문언(SM 전환)과 다르므로 쌍아 판단 후 착수.

## 5. 지금 바로 진행 가능한 범위 (쌍아 승인 시)

- 포털 3건(KAKAO_REST_API_KEY · KAKAO_CLIENT_SECRET · LINE_CHANNEL_SECRET): dev·prod 모두 Y — 1차와 같은 `SM_MIGRATE_KEYS` 패턴으로 deploy.sh 수정 → dev 배포·스모크(카카오·LINE 로그인 리다이렉트 1회) → prod 판정표.
- 1차 선례가 "부분 진행은 지시서에 없는 범위"로 멈췄으므로 같은 기준으로 여기서 멈췄다. 부분 진행을 원하면 한 줄로 지시 바람.

## 6. 참고

- **portal-dev 현재 상태**: ①의 리비전 `00194-mgq`(Gemini 3.5 코드)가 그대로 서빙 중이다. ②가 dev 배포를 하지 않았으므로 **2.5로 되돌아가지 않았다**. 매팅 막내의 portal-dev 사용 신호는 지금 줘도 된다 — 단 ①·②의 deploy.sh가 `--update-env-vars`로 `MATTE_API_URLS`를 deploy.sh 기본값으로 덮었으니 매팅 막내 쪽 값 재설정 여부를 확인할 것. ②가 나중에 portal-dev를 배포하면 그때는 origin/main 코드(2.5)로 되돌아간다.
- 집행 훅: 이번 세션에서 차단 0건. `gcloud secrets versions access`는 비교용 프로세스 안에서만 사용(출력 없음).

📁 산출: 본 COMPLETION · 세션 로그 어펜드 · PF_SECURITY 1행. 운영 파일 변경 0.
🔀 쌍아 판단: §4의 1~4 + §5 부분 진행 여부.
