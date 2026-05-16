---
type: device_profile
id: M4
tailscale_ip: 100.121.220.14
ssh_host: "m4"
os: macOS 26.4.1 (ARM, Apple M3 Pro)
owner: 한송이
location: 사무실
primary_agents: [한(코웍이)]
claude_code_version: "미설치"
last_updated: 2026-05-16
---

# M4 — Device Profile

## 시스템 정보

- **hostname**: han-macbookpro
- **OS**: macOS 26.4.1 (Build 25E253, ARM arm64)
- **CPU**: Apple M3 Pro
- **RAM**: 18 GB
- **Disk**: 926GB (사용 12GB, 3%)
- **Tailscale IP**: 100.121.220.14
- **SSH**: `ssh m4` (User: hansonngyi)
- **monk_project 경로**: `/Users/hansonngyi/developer/monk_project/`

## 개발 환경

- **Xcode**: 26.5 (Build 17F42)
- **Swift**: 6.3.2 (swiftlang-6.3.2.1.108)
- **iOS SDK**: iphoneos 26.5 + iphonesimulator 26.5
- **서명 인증서**: Apple Development: JeongKyu Shin (Q63WT2V55B)
- **Claude Code**: 미설치

## MonkosCrop 빌드 상태

- macOS 빌드: `.build/debug/MonkosCrop` (2026-05-15 18:51)
- iOS 빌드: 미시도 (SDK 다운로드 완료)

## 특이사항

- 한송이 전용 디바이스 (팀원용)
- iMac에서 `ssh m4`로 원격 접속 가능
- iOS 앱 빌드 + TestFlight 배포 용도
- Repo 상태: main 브랜치, iMac 대비 커밋 뒤처짐 있을 수 있음 (pull 필요)
