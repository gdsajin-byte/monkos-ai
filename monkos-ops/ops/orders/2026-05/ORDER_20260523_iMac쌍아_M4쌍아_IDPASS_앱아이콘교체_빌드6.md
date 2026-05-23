---
type: order
date: 2026-05-23
from: iMac/쌍아
to: M4/쌍아
subject: IDPASS 앱 아이콘 R2 교체 + build 6 Archive + App Store Connect 업로드
portfolio: PF_CROP
status: 대기
---

# IDPASS 앱 아이콘 R2 교체 + build 6

> **목표**: 파란 M 아이콘 → IDPASS R2(타이트) 아이콘 교체 후 build 6 업로드.
> **소스**: `~/Desktop/CROP APP/ICONs/IDPASS-R2-*.png` (전 사이즈 생성 완료)

---

## ⚠️ 준수 조항

- GUI Xcode에서만 Archive (SSH xcodebuild 금지)
- pbxproj 수동 편집 금지 — Xcode GUI에서 아이콘 교체

---

## Phase 1 — 아이콘 파일 교체

### 1-1. 필요한 사이즈 생성

R2 소스에서 누락된 사이즈를 `sips`로 생성:

```bash
cd ~/Desktop/CROP\ APP/ICONs

# 누락 사이즈 생성 (R2-1024.png 원본에서)
sips -z 20 20 IDPASS-R2-1024.png --out IDPASS-R2-20.png
sips -z 40 40 IDPASS-R2-1024.png --out IDPASS-R2-40.png
sips -z 58 58 IDPASS-R2-1024.png --out IDPASS-R2-58.png
sips -z 80 80 IDPASS-R2-1024.png --out IDPASS-R2-80.png
sips -z 87 87 IDPASS-R2-1024.png --out IDPASS-R2-87.png
sips -z 152 152 IDPASS-R2-1024.png --out IDPASS-R2-152.png
sips -z 167 167 IDPASS-R2-1024.png --out IDPASS-R2-167.png
```

### 1-2. AppIcon.appiconset에 복사

```bash
cd ~/monk_Project/apps/MonkosCrop/MonkosCrop/Assets.xcassets/AppIcon.appiconset

# 기존 파란 M 아이콘 백업
mkdir -p backup && cp *.png backup/

# R2 아이콘 복사 (파일명을 기존 이름에 맞춤)
SRC=~/Desktop/CROP\ APP/ICONs
cp "$SRC/IDPASS-R2-1024.png" AppIcon.png
cp "$SRC/IDPASS-R2-20.png"   AppIcon-20.png
cp "$SRC/IDPASS-R2-29.png"   AppIcon-29.png
cp "$SRC/IDPASS-R2-40.png"   AppIcon-40.png
cp "$SRC/IDPASS-R2-58.png"   AppIcon-58.png
cp "$SRC/IDPASS-R2-60.png"   AppIcon-60.png
cp "$SRC/IDPASS-R2-76.png"   AppIcon-76.png
cp "$SRC/IDPASS-R2-80.png"   AppIcon-80.png
cp "$SRC/IDPASS-R2-87.png"   AppIcon-87.png
cp "$SRC/IDPASS-R2-120.png"  AppIcon-120.png
cp "$SRC/IDPASS-R2-152.png"  AppIcon-152.png
cp "$SRC/IDPASS-R2-167.png"  AppIcon-167.png
cp "$SRC/IDPASS-R2-180.png"  AppIcon-180.png
```

### 1-3. 확인

Xcode에서 프로젝트 열기 → Assets.xcassets → AppIcon → 모든 슬롯에 R2 아이콘 표시 확인.

---

## Phase 2 — build 번호 증가

`project.pbxproj`에서 `CURRENT_PROJECT_VERSION`을 5 → 6으로 변경:

Xcode → 프로젝트 설정 → General → Build 번호: **6**

---

## Phase 3 — Archive + 업로드

1. Xcode GUI에서 **Product → Archive**
2. Organizer → **Distribute App** → App Store Connect
3. 업로드 완료 후 App Store Connect에서 build 6 선택
4. 수출 규정: "해당하지 않음" 선택

---

## Phase 4 — App Store Connect 빌드 교체

1. App Store Connect → IDPASS 증명사진 → iOS 앱 버전 1.0
2. 빌드 섹션 → build 5 제거 → **build 6 선택**
3. 저장

---

## 완료 보고

- PF_CROP 히스토리 1행 어펜드
- 세션 로그 어펜드
- 커밋 → 푸시
