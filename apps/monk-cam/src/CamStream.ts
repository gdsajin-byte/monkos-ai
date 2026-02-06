/**
 * CamStream - WebRTC 카메라 스트리밍 (송신)
 *
 * 기능:
 * - 카메라 → WebRTC P2P 송출
 * - 시그널링 서버 연결
 * - ICE candidate 교환
 * - 재연결 처리
 */

export interface CamStreamOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  signalingUrl: string;  // WebSocket 시그널링 서버 URL
  roomId?: string;       // 방 ID (여러 스트림 구분용)
  iceServers?: RTCIceServer[];  // STUN/TURN 서버 (Tailscale 내부망이면 불필요)
}

export type StreamState = 'idle' | 'connecting' | 'streaming' | 'error';

export interface StreamEvents {
  onStateChange?: (state: StreamState) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_OPTIONS: Partial<CamStreamOptions> = {
  facingMode: 'environment',  // 후면 카메라 기본 (시연용)
  width: 1080,
  height: 1920,  // 9:16 세로
  iceServers: []  // Tailscale 내부망용
};

export class CamStream {
  private options: CamStreamOptions;
  private events: StreamEvents;
  private stream: MediaStream | null = null;
  private pc: RTCPeerConnection | null = null;
  private ws: WebSocket | null = null;
  private state: StreamState = 'idle';

  constructor(options: CamStreamOptions, events: StreamEvents = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.events = events;
  }

  /**
   * 스트리밍 시작
   */
  async start(): Promise<void> {
    this.setState('connecting');

    try {
      // 1. 카메라 스트림 획득
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.options.facingMode,
          width: { ideal: this.options.width },
          height: { ideal: this.options.height }
        },
        audio: false
      });

      // 2. WebRTC PeerConnection 생성
      this.pc = new RTCPeerConnection({
        iceServers: this.options.iceServers || []
      });

      // 3. 스트림 트랙 추가
      this.stream.getTracks().forEach(track => {
        this.pc!.addTrack(track, this.stream!);
      });

      // 4. ICE candidate 처리
      this.pc.onicecandidate = (event) => {
        if (event.candidate && this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            roomId: this.options.roomId
          }));
        }
      };

      // 5. 연결 상태 모니터링
      this.pc.onconnectionstatechange = () => {
        if (this.pc?.connectionState === 'connected') {
          this.setState('streaming');
        } else if (this.pc?.connectionState === 'failed') {
          this.handleError(new Error('WebRTC 연결 실패'));
        }
      };

      // 6. 시그널링 서버 연결
      await this.connectSignaling();

    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * 시그널링 서버 연결 & offer 생성
   */
  private async connectSignaling(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.options.signalingUrl);

      this.ws.onopen = async () => {
        try {
          // Offer 생성 & 전송
          const offer = await this.pc!.createOffer();
          await this.pc!.setLocalDescription(offer);

          this.ws!.send(JSON.stringify({
            type: 'offer',
            sdp: offer.sdp,
            roomId: this.options.roomId
          }));

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      this.ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'answer') {
          await this.pc!.setRemoteDescription({
            type: 'answer',
            sdp: message.sdp
          });
        } else if (message.type === 'ice-candidate') {
          await this.pc!.addIceCandidate(message.candidate);
        }
      };

      this.ws.onerror = () => reject(new Error('시그널링 서버 연결 실패'));
      this.ws.onclose = () => {
        if (this.state === 'streaming') {
          // 예상치 못한 종료 → 재연결 시도
          this.reconnect();
        }
      };
    });
  }

  /**
   * 재연결 시도
   */
  private async reconnect(): Promise<void> {
    console.log('[CamStream] 재연결 시도...');
    this.setState('connecting');

    // 잠시 대기 후 재시도
    await new Promise(r => setTimeout(r, 2000));

    if (this.state !== 'idle') {
      try {
        await this.connectSignaling();
      } catch (error) {
        this.handleError(error as Error);
      }
    }
  }

  /**
   * 스트리밍 중지
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

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * 카메라 전환
   */
  async switchCamera(): Promise<void> {
    this.options.facingMode =
      this.options.facingMode === 'user' ? 'environment' : 'user';

    // 기존 비디오 트랙 교체
    if (this.stream && this.pc) {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.options.facingMode,
          width: { ideal: this.options.width },
          height: { ideal: this.options.height }
        },
        audio: false
      });

      const [newTrack] = newStream.getVideoTracks();
      const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');

      if (sender) {
        await sender.replaceTrack(newTrack);
      }

      // 기존 스트림 정리
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = newStream;
    }
  }

  private setState(state: StreamState): void {
    this.state = state;
    this.events.onStateChange?.(state);
  }

  private handleError(error: Error): void {
    console.error('[CamStream]', error);
    this.setState('error');
    this.events.onError?.(error);
  }

  get currentState(): StreamState {
    return this.state;
  }
}

export default CamStream;
