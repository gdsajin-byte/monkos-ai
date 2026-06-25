---
type: changelog
subject: 디바이스 설정 변경 로그
last_updated: 2026-06-07
---

# Device Changelog

> 디바이스 설정 변경 이력. Append-only.

| 날짜 | 디바이스 | 변경 내용 | 주체 |
|------|----------|----------|------|
| 2026-05-13 | 전체 | 초기 전수 수집 — iMac/M1 완료, 4060(SSH 키 미등록), M2(offline) | iMac/막내1 |
| 2026-05-13 | M1 | SSH 호스트 등록 (`~/.ssh/config`에 m1 추가) | iMac/쌍아 |
| 2026-05-13 | M1 | SSH 키 등록 (비밀번호 없이 접속 가능) | iMac/쌍아 |
| 2026-05-13 | M1 | Claude Code CLI 설치 (2.1.140) | iMac/쌍아 |
| 2026-05-13 | M1 | model → `claude-opus-4-6[1m]` 통일 | iMac/쌍아 |
| 2026-05-13 | 4060 | 설정값 전수 수집 완료 (sshpass 경유) | iMac/쌍아 |
| 2026-05-13 | 4060 | DEVICE_PROFILE.md 갱신 (hostname, OS, CLI 버전, settings, MEMORY) | iMac/쌍아 |
| 2026-06-07 | M2 | SSH 공개키 등록 (iMac → M2 무인증 접속 연동) | M2/쌍아 |
| 2026-06-07 | M2 | DEVICE_PROFILE.md 전수 갱신 (시스템정보, Git, Claude Code, 개발환경) | iMac/쌍아 |
| 2026-06-07 | M2 | 디바이스 일람표 상태 "보류" → "완료" 전환 | iMac/쌍아 |
| 2026-06-23 | M1 | 듀얼 레포 구조 발견 — 쌍아본(`/Users/macmini/`) vs 정본(`/Users/developer/`) 경로 혼동 | M1/쌍아 |
| 2026-06-25 | M1 | 듀얼 레포 해소 반영 — 쌍아 작업본 삭제 완료, 정본 단일화 확정, DEVICE_PROFILE 갱신 | iMac/쌍아 |
