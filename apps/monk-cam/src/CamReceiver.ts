/**
 * CamReceiver - WebRTC 스트림 수신
 *
 * 기능:
 * - WebRTC P2P 스트림 수신
 * - 비디오 엘리먼트에 표시
 * - 프레임 캡처 (AI 분석용)
 */

export interface CamReceiverOptions {
  signalingUrl: string;
  roomId?: string;
  iceServers?: RTCIceServer[];
}

export type ReceiverState = 'idle' | 'waiting' | 'connected' | 'error';

export interface ReceiverEvents {
  onStateChange?: (state: ReceiverState) => void;
  onStream?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;
}

export class CamReceiver {
  private options: CamReceiverOptions;
  private events: ReceiverEvents;
  private pc: RTCPeerConnection | null = null;
  private ws: WebSocket | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private remoteStream: MediaStream | null = null;
  private state: ReceiverState = 'idle';

  constructor(options: CamReceiverOptions, events: ReceiverEvents = {}) {
    this.options = options;
    this.events = events;
  }

  /**
   * 수신 대기 시작
   */
  async start(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    this.setState('waiting');

    try {
      // 1. WebRTC PeerConnection 생성
      this.pc = new RTCPeerConnection({
        iceServers: this.options.iceServers || []
      });

      // 2. 원격 스트림 수신 핸들러
      this.pc.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        if (this.videoElement) {
          this.videoElement.srcObject = this.remoteStream;
        }
        this.setState('connected');
        this.events.onStream?.(this.remoteStream);
      };

      // 3. ICE candidate 처리
      this.pc.onicecandidate = (event) => {
        if (event.candidate && this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            roomId: this.options.roomId
          }));
        }
      };

      // 4. 연결 상태 모니터링
      this.pc.onconnectionstatechange = () => {
        if (this.pc?.connectionState === 'disconnected') {
          this.setState('waiting');
        } else if (this.pc?.connectionState === 'failed') {
          this.handleError(new Error('WebRTC 연결 실패'));
        }
      };

      // 5. 시그널링 서버 연결
      await this.connectSignaling();

    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * 시그널링 서버 연결 & answer 처리
   */
  private async connectSignaling(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.options.signalingUrl);

      this.ws.onopen = () => {
        // 수신자임을 알림
        this.ws!.send(JSON.stringify({
          type: 'join',
          role: 'receiver',
          roomId: this.options.roomId
        }));
        resolve();
      };

      this.ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'offer') {
          // Offer 수신 → Answer 생성
          await this.pc!.setRemoteDescription({
            type: 'offer',
            sdp: message.sdp
          });

          const answer = await this.pc!.createAnswer();
          await this.pc!.setLocalDescription(answer);

          this.ws!.send(JSON.stringify({
            type: 'answer',
            sdp: answer.sdp,
            roomId: this.options.roomId
          }));

        } else if (message.type === 'ice-candidate') {
          await this.pc!.addIceCandidate(message.candidate);
        }
      };

      this.ws.onerror = () => reject(new Error('시그널링 서버 연결 실패'));
      this.ws.onclose = () => {
        if (this.state === 'connected') {
          this.setState('waiting');
          this.reconnect();
        }
      };
    });
  }

  /**
   * 재연결 시도
   */
  private async reconnect(): Promise<void> {
    console.log('[CamReceiver] 재연결 대기...');
    await new Promise(r => setTimeout(r, 2000));

    if (this.state !== 'idle' && this.videoElement) {
      try {
        await this.connectSignaling();
      } catch (error) {
        this.handleError(error as Error);
      }
    }
  }

  /**
   * 현재 프레임 캡처 (AI 분석용)
   */
  captureFrame(quality: number = 0.92): string | null {
    if (!this.videoElement || !this.remoteStream) {
      return null;
    }

    const video = this.videoElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL('image/jpeg', quality);
  }

  /**
   * 수신 중지
   */
  stop(): void {
    this.setState('idle');

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.remoteStream = null;
  }

  private setState(state: ReceiverState): void {
    this.state = state;
    this.events.onStateChange?.(state);
  }

  private handleError(error: Error): void {
    console.error('[CamReceiver]', error);
    this.setState('error');
    this.events.onError?.(error);
  }

  get currentState(): ReceiverState {
    return this.state;
  }

  get hasStream(): boolean {
    return this.remoteStream !== null;
  }
}

export default CamReceiver;
