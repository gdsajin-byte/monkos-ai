# Mirror 런처 디바이스 선택 UI 추가

**발신**: iMac쌍아 — 2026-02-18 11:01 KST
**수신**: iMac막내
**상태**: 대기

---

## 배경
- 현재 런처는 접속한 서버(location.host)에만 연결
- 폰에서 iMac/4060 등 Tailscale 디바이스를 선택할 수 있어야 함
- 선택한 디바이스 정보는 localStorage에 저장하여 재접속 시 유지

## 파일: `apps/monk-cam/demo/mirror_launcher.html`

## 변경 사항

### 1. 상단에 디바이스 선택 카드 추가 (status-card 위에)

```html
<!-- 디바이스 선택 -->
<div class="card" id="device-card">
    <div class="card-title">연결 디바이스</div>
    <div id="device-list"></div>
    <button class="btn btn-gray" id="add-device-btn" style="margin-top:8px;">+ 디바이스 추가</button>
</div>
```

### 2. 기본 디바이스 목록 (JS에 하드코딩)

```javascript
const DEFAULT_DEVICES = [
    { name: 'iMac', host: '100.97.103.10:8443', icon: '🖥' },
    { name: '4060 (GPU)', host: '100.118.31.62:8443', icon: '🎮' },
    { name: '맥미니', host: '100.76.80.99:8443', icon: '💻' },
];
```

### 3. 디바이스 선택 UI 동작

- 각 디바이스를 라디오 버튼 스타일 카드로 표시
- 선택하면 해당 디바이스의 host로 SERVER_HOST 변경
- 선택 시 `localStorage('mirror-device')`에 저장
- 페이지 로드 시 localStorage에서 마지막 선택 복원
- 선택된 디바이스에 초록 테두리 + 체크 표시

### 4. 디바이스 카드 스타일

```css
.device-item {
    display: flex; align-items: center; gap: 10px;
    padding: 12px; border-radius: 8px;
    border: 2px solid #333; margin-bottom: 8px;
    cursor: pointer; font-size: 14px;
}
.device-item.active {
    border-color: #22c55e;
    background: #0a1a0a;
}
.device-item .device-icon { font-size: 20px; }
.device-item .device-name { flex: 1; }
.device-item .device-host { color: #666; font-size: 11px; font-family: monospace; }
.device-item .device-check { color: #22c55e; display: none; }
.device-item.active .device-check { display: block; }
```

### 5. 디바이스 선택 시 연결 상태 갱신

- 디바이스 변경 시 기존 ws 연결 끊고 새 디바이스로 재연결
- 상태 표시도 초기화 (서버 확인 중... / PC 콘솔 대기)

### 6. "+ 디바이스 추가" 버튼

- 클릭 시 이름 + host:port 입력 프롬프트
- 추가된 디바이스는 `localStorage('mirror-custom-devices')`에 저장
- 삭제는 길게 누르면 confirm 후 삭제

### 7. 인증서 수락 링크 자동 생성

- 선택된 디바이스가 현재 접속 서버와 다르면, 인증서 경고 카드에 해당 디바이스 인증서 수락 링크 추가

```
⚠️ 100.118.31.62:8443 인증서를 먼저 수락해야 합니다.
[인증서 수락하기] ← https://100.118.31.62:8443/ 링크
```

### 8. mirror_client.js, mirror_test.html 연동

- 테스트 페이지 열기 버튼: 선택된 디바이스의 mirror_test.html로 이동
- 북마클릿: 선택된 디바이스의 mirror_client.js URL로 생성
- 스크립트 태그: 선택된 디바이스 기준으로 표시

## 동작 흐름

1. 폰에서 아무 Mirror 서버(iMac이든 4060이든)의 /mirror 접속
2. 디바이스 목록에서 원하는 대상 선택 (예: 4060)
3. 인증서 미수락 시 → 인증서 수락 링크 먼저 클릭
4. 테스트 페이지 열기 → 선택된 디바이스로 연결

## 주의

- 기존 기능(북마클릿, 스크립트 태그, 상태 확인) 깨지지 않도록
- 스타일은 기존 다크 테마 톤 유지 (#111, #1a1a1a, #333)

## 완료 보고

완료 시 아래 파일 생성:
`commands/20260218_HHMM_iMac막내_to_작가님&iMac쌍아_디바이스선택UI완료.md`
