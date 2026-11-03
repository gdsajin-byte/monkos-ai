---
type: index
subject: 전 디바이스 Claude Code 설정 인덱스
last_updated: 2026-10-23
---

# Devices — 전 디바이스 설정 정본

> 각 디바이스의 Claude Code 설정값, 시스템 정보, 접근 정보를 관리한다.
> **이 일람표가 디바이스 ↔ 노드·IP·ssh 별칭의 정본이다** (법률 ch1 4조는 약칭만 정의, 10-23 포인터 신설). 노드 판정은 이름 추정이 아니라 IP로 대조한다 — 10-23 `macmini-macmini`(M1)를 M2로 오판한 사고가 근거. 호스트명 열은 10-23 `tailscale status` 실측값. M2 위치는 ch1 4조 약칭(몽크사진관, 꾸)에 맞춤.

## 디바이스 일람표

| # | 디바이스 | 위치 | OS | SSH | Tailscale IP | Tailscale 호스트명 (10-23 실측) | 로컬 hostname · 식별 파일 (11-03) | Claude Code | 수집 상태 |
|---|----------|------|-----|-----|-------------|------------------|------------------|-------------|----------|
| 1 | **iMac** | 사무실 | macOS 13 (Intel) | 로컬 | 100.97.103.10 | `jeong-kyu-imac` | `Jeong-Kyuui-iMac.local` · ✅ `iMac` | 2.1.126 | ✅ 완료 |
| 2 | **M1** | 집 | macOS 26.6.2 (ARM, 11-03 실측) | `ssh m1` | 100.76.80.99 | `macmini-macmini` | `Macminiui-Macmini.local` · ✅ `M1` | 2.1.140 | ✅ 완료 |
| 3 | **4060** | 집 | Windows 11 (10.0.26300) | `ssh 4060` | 100.118.31.62 | `monk-4060` | `MONK-4060` · ✅ `4060` (`%USERPROFILE%\.claude\monk-device`) | 확장 2.1.284 | 🟡 11-03 테일넷 복귀 — 재구축으로 ssh 호스트 키 변경(iMac `known_hosts` 7행 구 ECDSA 키 경고 지속, 키 인증은 통과 — 11-03 막내8 실측)·python3 3.12.10 설치(11-03, winget·사용자 범위)·git 자격증명은 데스크톱 세션 전용 |
| 4 | **M2** | 몽크사진관 (꾸) | macOS Sequoia 15.7.4 | `ssh m2` | 100.81.38.20 | `kku-macmini-m2-macmini` | (미실측) · ⬜ 미배치 — hostname 패턴으로 판별 | 2.1.50 | ✅ 완료 |
| 5 | ~~**M4**~~ | — | macOS 26.4.1 (M3 Pro) | ~~`ssh m4`~~ | ~~100.121.220.14~~ | (테일넷 미등재) | — | — | ❌ 실효 (한송이 05-27 퇴사, 접근 불가 — 과거 헤더 해석용) |
| 6 | **iPhone** | 휴대 | iOS | — | 100.115.57.53 | `iphone181` | — | — | ✅ Tailscale 연결 |

> **기기 식별 파일** (11-03 신설, ORDER_20261103 막내8): `~/.claude/monk-device` 1행에 약칭(`iMac|M1|M2|4060|웹`). 세션 시작 훅이 hostname보다 먼저 읽는다(환경변수 `MONK_DEVICE`가 그보다 우선). 레포 밖·기기별 1회 설정. 새 기기·hostname 변경 시 이 파일만 만들면 된다. 판별표 정본: `.claude/commands/session-start.md` §디바이스 판별.

## 역할 분담

| 디바이스 | 주 용도 | 주 에이전트 |
|----------|---------|------------|
| iMac | 메인 워크스테이션 — 배포, 코딩, CDP, 콘텐츠 | 쌍아, 막내N, 민아 |
| M1 | 야간 설계, 지시서, 전략 | 쌍아, 막내N, 민아, 소넷이 |
| 4060 | AI Factory — 모델 벤치마크, SDXL, LLM 추론 | 쌍아, 막내N |
| M2 | 꾸(와이프) — 콘텐츠 루틴, 마케팅 | 쌍아, 코웍이 |
| M4 | iOS 빌드 + TestFlight — 한송이 | 한(코웍이) |
| iPhone | 모바일 관제 (Tailscale 허브) | — |

## 설정 분기 요약

| 설정 | iMac | M1 | 4060 | 비고 |
|------|------|-----|------|------|
| model | opus-4-6[1m] | opus-4-6[1m] | 미지정 | 4060 통일 필요 |
| CLI 버전 | 2.1.126 | 2.1.140 | 2.1.52 | 4060 업데이트 필요 |
| effortLevel | — | high | — | M1만 설정 |
| 배포 권한 | ✅ | ❌ | ❌ | iMac 집중 |
| MCP | chrome-devtools | ❌ | ❌ | iMac 전용 |
| memory 파일 | 3개 | 28개 | 1개 | M1이 레거시 풍부 |

상세 비교: [global/GLOBAL_SETTINGS.md](global/GLOBAL_SETTINGS.md)

## 파일 구조

```
devices/
├── README.md                     ← 이 파일 (인덱스)
├── DEVICE_CHANGELOG.md           ← 세팅 변경 로그
├── global/
│   └── GLOBAL_SETTINGS.md        ← 공통 설정 기준선 + 비교표
├── imac/
│   └── DEVICE_PROFILE.md
├── m1/
│   └── DEVICE_PROFILE.md
├── m2/
│   └── DEVICE_PROFILE.md
└── w4060/
    └── DEVICE_PROFILE.md
```

## 갱신 규칙

- 디바이스 설정 변경 시 해당 DEVICE_PROFILE.md 갱신 + DEVICE_CHANGELOG.md 어펜드
- 신규 디바이스 추가 시 폴더 생성 + 이 README 테이블 갱신
- M2 수집 완료 (2026-06-07). 전 디바이스 프로파일 수집 완료
