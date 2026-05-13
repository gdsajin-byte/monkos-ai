---
type: index
subject: 전 디바이스 Claude Code 설정 인덱스
last_updated: 2026-05-13
---

# Devices — 전 디바이스 설정 정본

> 각 디바이스의 Claude Code 설정값, 시스템 정보, 접근 정보를 관리한다.

## 디바이스 일람표

| # | 디바이스 | 위치 | OS | SSH | Tailscale IP | Claude Code | 수집 상태 |
|---|----------|------|-----|-----|-------------|-------------|----------|
| 1 | **iMac** | 사무실 | macOS 13 (Intel) | 로컬 | 100.97.103.10 | 2.1.126 | ✅ 완료 |
| 2 | **M1** | 집 | macOS 15 (ARM) | `ssh m1` | 100.76.80.99 | 미설치 | ✅ 완료 |
| 3 | **4060** | 미확인 | Windows(추정) | `ssh 4060` | 100.118.31.62 | 미확인 | ❌ SSH 키 미등록 |
| 4 | **M2** | 집 | macOS(추정) | `ssh m2` | 100.93.220.17 | 미확인 | ❌ Offline |

## 역할 분담

| 디바이스 | 주 용도 | 주 에이전트 |
|----------|---------|------------|
| iMac | 메인 워크스테이션 — 배포, 코딩, CDP, 콘텐츠 | 쌍아, 막내N, 민아 |
| M1 | 야간 설계, 지시서, 전략 | 쌍아, 막내N, 민아, 소넷이 |
| 4060 | GPU 작업 (추정) | 쌍아, 막내N |
| M2 | 꾸(와이프) 디바이스 — 마케팅/SNS | — |

## 설정 분기 요약

| 설정 | iMac | M1 | 비고 |
|------|------|-----|------|
| model | opus-4-6[1m] | opus-4-6 | iMac만 1M |
| effortLevel | — | high | M1만 설정 |
| 배포 권한 | ✅ | ❌ | iMac 집중 |
| MCP chrome-devtools | ✅ | ❌ | CDP iMac 전용 |
| memory 파일 | 3개 | 28개 | M1이 레거시 풍부 |

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
- 미수집 디바이스(4060, M2)는 접속 가능 시 재수집
