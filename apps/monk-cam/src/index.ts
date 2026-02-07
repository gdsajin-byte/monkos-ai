/**
 * @monkos/cam - MONKOS Camera Module
 *
 * 사용 예시:
 *
 * 1. 캡처만 (증명사진, AI 분석)
 *    import { CamCapture } from '@monkos/cam';
 *    const cam = new CamCapture({ facingMode: 'user' });
 *    await cam.start(videoElement);
 *    const result = cam.capture();
 *
 * 2. 스트리밍 송신 (폰 → PC)
 *    import { CamStream } from '@monkos/cam';
 *    const stream = new CamStream({ signalingUrl: 'wss://...' });
 *    await stream.start();
 *
 * 3. 스트리밍 수신 (PC에서 폰 화면 표시)
 *    import { CamReceiver } from '@monkos/cam';
 *    const receiver = new CamReceiver({ signalingUrl: 'wss://...' });
 *    await receiver.start(videoElement);
 */

export { CamCapture, type CamCaptureOptions, type CaptureResult } from './CamCapture';
export { CamStream, type CamStreamOptions, type StreamState, type StreamEvents } from './CamStream';
export { CamReceiver, type CamReceiverOptions, type ReceiverState, type ReceiverEvents } from './CamReceiver';
