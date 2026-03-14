# Photoshop + Claude(소넷이) AppleScript 연동 리서치

> [2026-02-23 19:26 KST] iMac/막내 → 작가님
> 지시서: `ORDER_20260223_포토샵_AppleScript_리서치.md`

---

## A. AppleScript → Photoshop 제어

### A-1. 버전별 AppleScript 지원 현황

**현 장비 확인: Photoshop 2025 (v26.11.0) — AppleScript 완전 지원**

- SDEF 파일 위치: `/Applications/Adobe Photoshop 2025/Adobe Photoshop 2025.app/Contents/Resources/Photoshop.sdef`
- SDEF 규모: 2,567줄, **1,181개 정의** (명령, 클래스, 속성, 열거형)
- Bundle ID: `com.adobe.Photoshop` (버전 무관 타겟팅 가능)

| 버전 | AppleScript | 비고 |
|------|------------|------|
| CS2~CS6 | ✅ 완전 지원 | Adobe 공식 AppleScript Reference PDF 발행 |
| CC 2017~2023 | ✅ 완전 지원 | `tell application "Adobe Photoshop CC 20XX"` |
| 2024 (v25) | ✅ 완전 지원 | 앱명이 `"Adobe Photoshop 2024"`로 변경 — 기존 스크립트 호환성 파괴 |
| 2025 (v26) | ✅ 완전 지원 | SDEF 확인. File > Scripts 메뉴에서 .applescript 숨김 처리 (외부 실행은 정상) |
| 2026 | 미확인 | 미출시 |

**버전 무관 타겟팅 방법:**
```applescript
tell application id "com.adobe.Photoshop"
    -- 버전명 변경에 영향받지 않음
end tell
```

### A-2. 제어 가능 범위

SDEF에서 직접 추출한 제어 범위:

| 카테고리 | 제어 가능 항목 |
|---------|-------------|
| **문서** | 열기/닫기/저장/복제/인쇄/병합/크롭/트림/리사이즈/회전/모드 변환 |
| **레이어** | 생성/삭제/복제/이동/회전/스케일/래스터라이즈/병합/링크/그룹 |
| **레이어 속성** | 이름/불투명도/블렌드모드/가시성/잠금/바운드/위치 |
| **선택 영역** | 전체선택/해제/페더/축소/확장/반전/유사선택/경계/저장/불러오기 |
| **필터** | 가우시안 블러, 모션 블러, 언샤프 마스크, 노이즈, 구름, 왜곡, 하이패스 등 |
| **색상 보정** | 밝기/대비, 레벨, 커브, 색상 균형, 채도, 반전, 포스터라이즈, 임계값 |
| **액션** | 녹화된 Photoshop 액션 이름으로 실행 |
| **JavaScript 브리지** | 인라인 JS 또는 JSX 파일 실행, 인수 전달, 결과 반환 |
| **배치 처리** | 파일 목록에 액션 일괄 적용 (대상/네이밍/에러 로깅) |
| **파일 형식** | JPEG/PNG/TIFF/PSD/PDF/BMP/EPS/GIF/Targa/PICT/RAW 저장 |
| **패스** | 생성/선택/스트로크/채우기/클리핑패스/셰이프 변환 |
| **텍스트** | 텍스트 레이어 내용/폰트/크기/색상/정렬 제어 |
| **메타데이터** | XMP 메타데이터 읽기/쓰기 |

**제한사항:** Neural Filters, Generative Fill, Content-Aware 등 최신 AI 기능은 SDEF에 없음. `do javascript`로 Action Manager(batchPlay) 호출 필요.

### A-3. 실용 예시 6개

**예시 1 — 파일 열기 + 리사이즈:**
```applescript
tell application id "com.adobe.Photoshop"
    activate
    set ruler units of settings to pixel units
    open alias "Macintosh HD:Users:username:Desktop:photo.jpg"
    resize image current document width 1920 resample method bicubic
    save current document
    close current document
end tell
```

**예시 2 — JPEG 품질 지정 저장:**
```applescript
tell application id "com.adobe.Photoshop"
    set doc to current document
    set jpegOpts to {class:JPEG save options, embed color profile:true, quality:10, format options:progressive, scans:3}
    save doc in file "Macintosh HD:Users:username:Desktop:output.jpg" as JPEG with options jpegOpts
end tell
```

**예시 3 — 레이어 생성 + 속성 설정:**
```applescript
tell application id "com.adobe.Photoshop"
    set doc to current document
    make new art layer in doc with properties {name:"보정 레이어", opacity:80.0, blend mode:multiply}
    make new art layer in doc with properties {name:"타이틀", kind:text layer}
    set contents of text object of art layer "타이틀" of doc to "MONKOS"
end tell
```

**예시 4 — 녹화된 액션 실행:**
```applescript
tell application id "com.adobe.Photoshop"
    activate
    do action "Sepia Toning" from "Default Actions"
end tell
```

**예시 5 — 폴더 일괄 처리 (리사이즈 + JPEG 저장):**
```applescript
set processFolder to choose folder with prompt "소스 폴더 선택"
set targetFolder to choose folder with prompt "출력 폴더 선택"

tell application "Finder"
    set listImages to (files of entire contents of processFolder whose name extension is "jpg" or name extension is "png") as alias list
end tell

repeat with thisImage in listImages
    tell application id "com.adobe.Photoshop"
        activate
        set ruler units of settings to pixel units
        open thisImage
        resize image current document width 1200 resample method bicubic
        set jpegOpts to {class:JPEG save options, quality:10}
        save current document in targetFolder as JPEG with options jpegOpts
        close current document saving no
    end tell
end repeat
```

**예시 6 — JavaScript 브리지 (AppleScript 한계 초과 시):**
```applescript
tell application id "com.adobe.Photoshop"
    -- 인라인 JS
    do javascript "var doc = app.activeDocument; doc.activeLayer.applyGaussianBlur(5.0);"

    -- JSX 파일 실행
    do javascript file "Macintosh HD:Users:username:Desktop:myScript.jsx"

    -- 인수 전달 + 결과 반환
    set result to do javascript "arguments[0] + ' processed';" with arguments {"test"}
end tell
```

### A-4. ExtendScript(JSX) vs AppleScript vs UXP 비교

| 항목 | AppleScript | ExtendScript (JSX) | UXP (JavaScript) |
|------|-------------|---------------------|-------------------|
| **언어** | AppleScript (영어형) | ES3 (구형 JS) | ES6+ (모던 JS, V8) |
| **플랫폼** | macOS 전용 | 크로스 플랫폼 | 크로스 플랫폼 |
| **실행** | osascript, Script Editor | File > Scripts 또는 `do javascript` | Photoshop 내 플러그인 패널 |
| **DOM 접근** | 높음 (SDEF) | 최고 (가장 완전) | 부분적 (확장 중) |
| **헤드리스** | ✅ (터미널에서 실행) | ✅ (osascript 브리지) | ❌ (UI 필요) |
| **Adobe 입장** | "지원" (SDEF 계속 제공) | "레거시" (기능 추가 없음) | "권장" (활발 개발) |
| **폐기 위험** | 중-저 (Apple이 AppleEvents 유지) | 중-고 (CEP 단계적 폐기) | 낮음 |

**결론:** 터미널/CLI 자동화(우리 유스케이스) → **AppleScript + `do javascript` 브리지가 최적**. AppleScript로 프로세스 제어, JSX로 복잡한 포토샵 조작.

### A-5. macOS 호환성

| macOS | Photoshop | AppleScript 상태 |
|-------|-----------|-----------------|
| Ventura (13) | PS 2023+ | 정상. 앱명 타겟팅 주의 |
| Sonoma (14) | PS 2024+ | 정상. TCC 자동화 권한 필요 |
| Sequoia (15) | PS 2025+ | 정상. 동일 TCC 모델 |

**알려진 이슈:**
1. 앱명 변경 파괴: `"Adobe Photoshop CC 20XX"` → `"Adobe Photoshop 2024"`. **해결: `application id "com.adobe.Photoshop"` 사용**
2. TCC 팝업: 최초 실행 시 "Terminal.app이 Adobe Photoshop을 제어하려고 합니다" → 허용 (1회)

---

## B. Claude Code → Photoshop 파이프라인

### B-1. osascript 실행 — 실현 가능 확인

```bash
# 인라인 실행
osascript -e 'tell application id "com.adobe.Photoshop" to get name of current document'

# JavaScript 브리지
osascript -e 'tell application id "com.adobe.Photoshop" to do javascript "app.activeDocument.name;"'
```

### B-2. 파이프라인 설계

```
작가님 (자연어 명령)
    │
    ▼
소넷이/막내 (AppleScript 생성)
    │
    ▼
Bash: osascript -e '<생성된 스크립트>'
    │
    ▼
macOS AppleEvents (IPC)
    │
    ▼
Adobe Photoshop 2025 (실행)
    │
    ▼
결과 반환 (stdout) → 보고
```

**실현 가능.** Claude Code의 Bash 도구로 `osascript` 실행 → Photoshop이 Apple Events로 응답 → 결과 반환.

### B-3. 자연어 → AppleScript 흐름

1. 작가님: "Desktop/photos 폴더의 JPG 전부 1200px로 리사이즈해서 고품질 JPEG 저장해"
2. Claude Code: AppleScript 생성 (SDEF 지식 기반)
3. 복잡한 조작 → JSX 코드를 `do javascript` 래핑
4. `osascript` 실행 → Photoshop 처리
5. 결과 보고

**2계층 접근:**
- AppleScript: 프로세스 제어 (파일 열기/저장/닫기, 폴더 루프)
- JSX via `do javascript`: 복잡한 Photoshop 조작 (필터, 보정, 생성 기능)

### B-4. 보안 권한 (TCC)

| 권한 | 위치 | 트리거 | 1회성 |
|------|------|--------|-------|
| **자동화** (AppleEvents) | 시스템 설정 > 개인정보 보호 > 자동화 | 최초 osascript → Photoshop 실행 시 | ✅ |
| **손쉬운 사용** | 시스템 설정 > 개인정보 보호 > 손쉬운 사용 | System Events UI 자동화 시에만 | 해당 없음 (순수 AppleScript는 불필요) |
| **전체 디스크 접근** | 시스템 설정 > 개인정보 보호 > 전체 디스크 | 보호된 디렉토리 접근 시에만 | 해당 없음 (일반 경로면 불필요) |

**핵심:** 자동화 권한 1회 허용만 하면 됨. 거부 시 에러 -1743 → 시스템 설정에서 수동 활성화.

---

## C. 대안 경로 비교

| 방식 | 설치 복잡도 | 제어 깊이 | 헤드리스 | 미래성 | 적합 용도 |
|------|-----------|----------|---------|--------|----------|
| **AppleScript + osascript** | 낮음 (설치 불필요) | 높음 (SDEF + JSX 브리지) | ✅ | 중 | **Claude Code CLI 자동화** |
| **AppleScript + `do javascript`** | 낮음 | 최고 (AppleScript + JSX DOM 전체) | ✅ | 중-높 | **최적: 양쪽 장점** |
| **UXP 플러그인 + WebSocket** | 중 (플러그인 개발) | 높음 (batchPlay) | ❌ | 높음 | 프로덕션 플러그인 |
| **Actions + AppleScript 트리거** | 낮음 | 중 (녹화된 것만) | ✅ | 중 | 단순 반복 워크플로우 |
| **CEP/ExtendScript** | 중 | 최고 (전체 DOM) | ✅ | 낮음 (폐기 진행) | 레거시 유지보수만 |
| **MCP 서버 (adb-mcp)** | 높음 (3개 프로세스) | 높음 | ❌ | 중 (초기 단계) | Claude Desktop 인터랙티브 |

---

## D. 실전 유스케이스 (MONKOS 맥락)

### D-1. 증명사진 배치 리사이즈/크롭

```applescript
-- 증명사진 규격: 3x4cm (413x531px @300dpi)
tell application id "com.adobe.Photoshop"
    set ruler units of settings to pixel units
    open alias "Macintosh HD:Users:jeong-kyushin:Desktop:raw_photo.jpg"
    resize image current document width 413 height 531 resample method bicubic sharper
    set jpegOpts to {class:JPEG save options, quality:12}
    save current document in file "Macintosh HD:Users:jeong-kyushin:Desktop:id_photo.jpg" as JPEG with options jpegOpts
    close current document saving no
end tell
```

### D-2. 배경 레이어 교체 자동화

```applescript
tell application id "com.adobe.Photoshop"
    -- JSX로 배경 선택+삭제+교체 (Content-Aware는 Action Manager 필요)
    do javascript "
        var doc = app.activeDocument;
        // 배경색 설정
        var bgColor = new SolidColor();
        bgColor.rgb.red = 200; bgColor.rgb.green = 220; bgColor.rgb.blue = 240;
        // 배경 레이어 선택 후 채우기
        doc.activeLayer = doc.backgroundLayer;
        doc.selection.selectAll();
        doc.selection.fill(bgColor);
        doc.selection.deselect();
    "
end tell
```

### D-3. 광고 이미지 일괄 포맷 변환

```applescript
-- ~/MONKOS_ADS/ 내 PNG → WebP 변환 (JSX 브리지)
tell application id "com.adobe.Photoshop"
    do javascript "
        var folder = new Folder('~/MONKOS_ADS/');
        var files = folder.getFiles('*.png');
        for (var i = 0; i < files.length; i++) {
            app.open(files[i]);
            var doc = app.activeDocument;
            var saveFile = new File(files[i].fsName.replace('.png', '.webp'));
            // WebP는 Save for Web 또는 Export As 필요
            doc.exportDocument(saveFile, ExportType.SAVEFORWEB);
            doc.close(SaveOptions.DONOTSAVECHANGES);
        }
    "
end tell
```

### D-4. 결제경로 캡처 후 자동 PPT 배치 (토스 심사용)

```applescript
-- 캡처 이미지를 규격 리사이즈 + 테두리 추가
tell application id "com.adobe.Photoshop"
    do javascript "
        var doc = app.activeDocument;
        // 캔버스 리사이즈 (여백 추가)
        doc.resizeCanvas(doc.width + 40, doc.height + 40, AnchorPosition.MIDDLECENTER);
        // 리사이즈 to PPT 슬라이드 비율 (16:9 → 1920x1080)
        doc.resizeImage(UnitValue(1920, 'px'), UnitValue(1080, 'px'), 72, ResampleMethod.BICUBIC);
    " with arguments {}
end tell
```

---

## 결론 및 권장

### 채택 방식: AppleScript + `do javascript` 브리지

| 항목 | 내용 |
|------|------|
| **방식** | `osascript` → AppleScript → Photoshop (필요 시 JSX 브리지) |
| **설치** | 없음 (macOS + Photoshop 기본 제공) |
| **사전 설정** | TCC 자동화 권한 1회 허용 |
| **제어 깊이** | 최고 (SDEF 1,181개 정의 + JSX 전체 DOM) |
| **제한** | Photoshop 실행 상태 필수, Neural Filters 등 AI 기능은 Action Manager 경유 |

### 활성화 절차 (작가님 승인 후)

1. Photoshop 2025 실행
2. 터미널에서 테스트: `osascript -e 'tell application id "com.adobe.Photoshop" to get name of current document'`
3. TCC 팝업 → "허용" 클릭
4. 이후 소넷이/막내가 자유롭게 Photoshop 제어 가능

### 미확인 사항
- CEP 완전 제거 시기 (Adobe 미발표)
- Photoshop 2026 AppleScript 지원 여부 (미출시)
- SDEF 폐기 가능성 (현재 징후 없음)
