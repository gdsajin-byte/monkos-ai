# @monkos/cam

MONKOS 카메라 모듈 - 캡처 & WebRTC 스트리밍

## 모듈 구성

| 모듈 | 용도 |
|------|------|
| `CamCapture` | 웹캠 캡처 → base64 (증명사진, AI 분석) |
| `CamStream` | WebRTC 송출 (폰 → PC) |
| `CamReceiver` | WebRTC 수신 (PC에서 표시) |

## 사용법

### 1. CamCapture (캡처)

```typescript
import { CamCapture } from '@monkos/cam';

const cam = new CamCapture({
  facingMode: 'user',     // 'user' (전면) | 'environment' (후면)
  mirror: true,           // 셀피 미러링
  maxSize: 720            // 캡처 시 최대 크기
});

// 시작
await cam.start(videoElement);

// 캡처
const result = cam.capture();
console.log(result.dataUrl);  // base64 이미지

// 카메라 전환
await cam.switchCamera();

// 종료
cam.stop();
```

### 2. CamStream (송출)

```typescript
import { CamStream } from '@monkos/cam';

const stream = new CamStream({
  signalingUrl: 'wss://your-signal-server',
  roomId: 'room-123',
  facingMode: 'environment'
}, {
  onStateChange: (state) => console.log('상태:', state),
  onError: (err) => console.error(err)
});

await stream.start();
```

### 3. CamReceiver (수신)

```typescript
import { CamReceiver } from '@monkos/cam';

const receiver = new CamReceiver({
  signalingUrl: 'wss://your-signal-server',
  roomId: 'room-123'
}, {
  onStream: (stream) => console.log('스트림 연결됨'),
  onStateChange: (state) => console.log('상태:', state)
});

await receiver.start(videoElement);

// 프레임 캡처 (AI 분석용)
const frame = receiver.captureFrame();
```

## 데모

```bash
cd apps/monk-cam
npx serve demo
```

## 사용처

- **photolab**: 증명사진 촬영
- **monk-present**: 라이브 프레젠테이션
- **monkos-ai**: 채팅 캠 입력
