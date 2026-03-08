---
type: REPORT
date: 2026-02-28
device: M1
agent: 쌍아
subject: 서비스 아키텍처 노드맵 (Mermaid 소스)
target: 코웍이 → 시각화 렌더링
---

# MONKOS 서비스 아키텍처 노드맵

> M1/쌍아가 폴더 스캔 + 세션 로그 기반으로 작성.
> 코웍이가 Mermaid 아티팩트로 렌더링할 것.

---

## 1. 전체 프로젝트 구조

```mermaid
graph TD
    ROOT["monk_project<br/><b>MONK.KR / MONKOS.AI</b>"]

    ROOT --> MONKKR["<b>MONK_kr/</b><br/>메인 웹사이트<br/>monk.kr"]
    ROOT --> APPS["<b>apps/</b><br/>독립 앱 8개"]
    ROOT --> MAI["<b>monkos_AI/</b><br/>AI 프로덕션 앱"]
    ROOT --> OPS["<b>monkos-ops/</b><br/>운영 체계"]
    ROOT --> DOCS["<b>docs/</b><br/>지식 DB"]
    ROOT --> GOV["<b>governance/</b><br/>헌법·법률"]
    ROOT --> SAGA["<b>_saga/</b><br/>교육·소스"]
    ROOT --> MKT["<b>marketing/</b><br/>콘텐츠·자동화"]

    %% MONK_kr 하위
    MONKKR --> STUDIO["monk_studio/<br/>스튜디오 서비스"]
    MONKKR --> AILAB["ai_lab/<br/>AI 실험실"]
    MONKKR --> B2B["b2b/"]
    MONKKR --> ACADEMY["Academy/"]
    MONKKR --> CFW["cloudflare-workers/<br/>CF Worker API"]
    MONKKR --> CFWI["cloudflare-workers-imagen/<br/>Imagen Worker"]

    STUDIO --> IDPHOTO_S["id_photo/<br/>standard·premium·deluxe"]
    STUDIO --> PROFILE["profile/"]
    STUDIO --> FAMILY["family/"]
    STUDIO --> GROUP["group/"]

    AILAB --> PHOTOLAB["photolab/<br/>engine/"]
    AILAB --> IMGPRO["image_pro/"]
    AILAB --> LOOKBOOK["lookbook/"]
    AILAB --> MODELAG["model_agency/"]

    CFW --> VTXPROXY["vertex-ai-proxy/"]

    %% apps 하위
    APPS --> IMG4["<b>monk_imagen4/</b><br/>가장 복잡"]
    APPS --> AISTUDIO["monk-ai-studio-pro/"]
    APPS --> IMG3["imagen3/"]
    APPS --> CHAT["MonkosChat/"]
    APPS --> CAM["monk-cam/"]
    APPS --> COACH["photo-coach/"]
    APPS --> PLMPA["photolab-monkkr-mpa-0219/"]
    APPS --> PLLEG["photolab-monkkr-legacy/"]

    IMG4 --> IMG4_MOD["modules/<br/>imagen3-pro<br/>imagen4-generator<br/>lumina-lookbook"]
    IMG4 --> IMG4_CORE["components/ core/<br/>functions/ services/"]

    %% monkos_AI 하위
    MAI --> IDKR["<b>idphoto-kr/</b><br/>🇰🇷 증명사진 한국"]
    MAI --> IDJP["idphoto-jp/<br/>🇯🇵 증명사진 일본"]
    MAI --> PORTAL["<b>portal/</b><br/>통합 백엔드"]
    MAI --> INFRA["infrastructure/"]

    %% monkos-ops 하위
    OPS --> OP1["01_전략/"]
    OPS --> OP2["02_리서치/"]
    OPS --> OP3["03_개발/<br/>specs/ tasks/ releases/"]
    OPS --> OP4["04_문서/"]
    OPS --> OP5["05_공유/<br/>han/ kku/"]
    OPS --> OP6["06_로그/<br/>sessions/"]
    OPS --> OPSOPS["ops/<br/>orders/ reports/ sessions/"]

    %% 스타일
    style IDKR fill:#ff6b6b,color:#fff
    style PORTAL fill:#ff6b6b,color:#fff
    style IMG4 fill:#ffa94d,color:#fff
    style ROOT fill:#339af0,color:#fff
    style MONKKR fill:#51cf66,color:#fff
    style APPS fill:#51cf66,color:#fff
    style MAI fill:#51cf66,color:#fff
    style OPS fill:#868e96,color:#fff
    style DOCS fill:#868e96,color:#fff
    style GOV fill:#868e96,color:#fff
```

---

## 2. 서비스 흐름 (idphoto-kr 중심 — 디버깅 집중 영역)

```mermaid
flowchart TD
    USER(("사용자"))

    USER -->|"monk.kr 또는<br/>monkos.ai 접속"| INDEX

    subgraph IDKR["<b>idphoto-kr</b> (Cloud Run)"]
        INDEX["index.html<br/><b>GateModule</b><br/>로그인 + 이벤트 70c"]
        PREP["prep.html / prep.js<br/><b>선택옵션</b><br/>용도·연령·의상·표정·헤어·배경"]
        CAMERA["camera.html<br/><b>촬영/업로드</b>"]
        RESULT["result.html / result.js<br/><b>결과</b><br/>비교컷(워터마크)<br/>크롭 다운로드 70c<br/>규격탭(여권/반명함)"]
        THANKYOU["thankyou.html / thankyou.js<br/><b>완료</b><br/>풀 원본 20c<br/>미션 100c"]
        SHARED["shared.js<br/><b>인증·크레딧 공통</b>"]
        CONFIG["config.js<br/><b>설정·과금 단가</b>"]
    end

    INDEX --> PREP --> CAMERA --> RESULT --> THANKYOU

    INDEX -.->|"인증 체크"| SHARED
    PREP -.->|"인증 체크"| SHARED
    RESULT -.->|"인증 체크"| SHARED
    THANKYOU -.->|"인증 체크"| SHARED
    SHARED -.->|"단가 참조"| CONFIG

    subgraph PORTAL["<b>portal</b> (Cloud Run)"]
        AUTH["lib/auth.js<br/>카카오·LINE·구글 OAuth"]
        CREDITS["lib/credits.js<br/>크레딧 조회·차감<br/>D1 원장"]
        PAYMENTS["lib/payments.js<br/>토스 결제 컨펌·환불"]
        EVENTS["lib/events.js<br/>이벤트 보상 지급"]
        CHATENG["lib/chat-engine.js<br/>RAG + 7채널 챗봇"]
        TELEGRAM["lib/telegram.js<br/>TG 알림·CS봇"]
        KAKAOBOT["lib/kakao-chatbot.js<br/>카카오 스킬서버"]
        COACHING["lib/coaching.js<br/>코칭 프롬프트"]
        CREDHTML["credits.html<br/>크레딧 충전 페이지<br/>토스 SDK v1"]
    end

    SHARED -->|"로그인 요청"| AUTH
    SHARED -->|"크레딧 조회"| CREDITS
    RESULT -->|"결제 요청"| PAYMENTS
    INDEX -->|"이벤트 수령"| EVENTS

    subgraph TOSS["토스페이먼츠"]
        TOSSAPI["API 개별 키<br/>SDK v1/payment"]
    end

    PAYMENTS -->|"컨펌"| TOSSAPI
    CREDHTML -->|"충전"| TOSSAPI

    subgraph EXTERNAL["외부 서비스"]
        KAKAO["카카오 OAuth + 채널"]
        LINE["LINE OAuth"]
        GOOGLE["Google OAuth"]
        D1["Cloudflare D1<br/>거래 원장"]
        FIRESTORE["Firestore<br/>유저·이벤트"]
        GCS["GCS<br/>이미지 저장"]
    end

    AUTH --> KAKAO
    AUTH --> LINE
    AUTH --> GOOGLE
    CREDITS --> D1
    EVENTS --> FIRESTORE
    CAMERA -->|"생성 요청"| GCS

    %% 스타일
    style IDKR fill:#fff3bf,stroke:#f59f00
    style PORTAL fill:#d0ebff,stroke:#339af0
    style TOSS fill:#d3f9d8,stroke:#40c057
    style EXTERNAL fill:#f8f9fa,stroke:#868e96
    style INDEX fill:#ffa94d,color:#fff
    style RESULT fill:#ffa94d,color:#fff
    style SHARED fill:#ff6b6b,color:#fff
    style AUTH fill:#ff6b6b,color:#fff
    style CREDITS fill:#ff6b6b,color:#fff
    style PAYMENTS fill:#ff6b6b,color:#fff
```

---

## 3. 인증 상태 문제 (근본 수술 대상)

```mermaid
flowchart LR
    subgraph CURRENT["⚠️ 현재 — 3중 혼재"]
        SS["<b>sessionStorage</b><br/>monkos_user<br/>monkos_token<br/>(2/27 전환)<br/>세션 종료 시 삭제"]
        LS["<b>localStorage</b><br/>monkos_free_gen<br/>(영구 유지)<br/>무료생성 방지"]
        COOKIE["<b>.monkos.ai 쿠키</b><br/>HttpOnly, Secure<br/>SameSite=Lax<br/>(2/27 추가)<br/>크로스도메인용"]
    end

    SS --- CONFLICT{"⚠️ 충돌<br/>비로그인인데<br/>12cr 표시 버그"}
    COOKIE --- CONFLICT

    subgraph TARGET["✅ 목표 — A-1 근본 수술"]
        COOKIE_ONLY["<b>쿠키 단일화</b><br/>.monkos.ai 쿠키만<br/>유일한 인증 수단"]
        NO_SS["sessionStorage<br/>인증 로직 제거"]
        SHARED_SINGLE["shared.js<br/>단일 인증 함수"]
        LOGOUT_EP["로그아웃 시<br/>쿠키 삭제 엔드포인트"]
    end

    CONFLICT -->|"해결"| COOKIE_ONLY
    COOKIE_ONLY --> NO_SS
    COOKIE_ONLY --> SHARED_SINGLE
    COOKIE_ONLY --> LOGOUT_EP

    style CURRENT fill:#fff3bf,stroke:#f59f00
    style TARGET fill:#d3f9d8,stroke:#40c057
    style CONFLICT fill:#ff6b6b,color:#fff
    style COOKIE_ONLY fill:#51cf66,color:#fff
```

---

## 4. 미결 어젠다 우선순위

```mermaid
flowchart TD
    subgraph P0["🔴 P0 — 즉시"]
        A1["A-1 인증 아키텍처 근본 수술<br/>쿠키 단일화"]
        A2["A-2 토스 실결제 테스트<br/>(A-1 완료 후)"]
    end

    subgraph P1["🟠 P1 — 이번 주"]
        B1["카카오 비즈앱 심사 제출"]
        B2["GateModule 기존유저 분기<br/>(이벤트 이미 수령 시 UX)"]
        B3["서버측 원본 격리<br/>(Network 탭 2차 방어)"]
    end

    subgraph P2["🟡 P2 — 다음"]
        C1["선택옵션 P2 개선 5건"]
        C2["RAG 업데이트"]
        C3["/studio 앱 설계"]
        C4["시머링 광고판"]
        C5["인화배송서비스"]
    end

    A1 -->|"완료 후"| A2
    A1 -->|"부작용 해소"| B2
    A2 -->|"결제 안정 후"| B1

    style P0 fill:#ff6b6b,color:#fff
    style P1 fill:#ffa94d,color:#fff
    style P2 fill:#ffd43b,color:#000
```

---

## 사용법

코웍이에게 이 파일을 넘기면서:
> "이 md 파일의 Mermaid 코드 블록 4개를 각각 아티팩트로 렌더링해줘"

라고 하시면 됩니다.
