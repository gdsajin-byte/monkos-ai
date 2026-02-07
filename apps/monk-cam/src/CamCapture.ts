/**
 * CamCapture - 웹캠 캡처 모듈
 *
 * 기능:
 * - 카메라 열기 (전면/후면)
 * - 실시간 프리뷰
 * - 프레임 캡처 → base64
 * - 카메라 종료
 */

export interface CamCaptureOptions {
  facingMode?: 'user' | 'environment';  // user: 전면(셀피), environment: 후면
  width?: number;
  height?: number;
  mirror?: boolean;  // 좌우반전 (셀피용)
  maxSize?: number;  // 캡처 시 최대 크기 (리사이즈)
}

export interface CaptureResult {
  dataUrl: string;      // base64 이미지
  width: number;
  height: number;
  timestamp: number;
}

const DEFAULT_OPTIONS: CamCaptureOptions = {
  facingMode: 'user',
  width: 720,
  height: 960,
  mirror: true,
  maxSize: 720
};

export class CamCapture {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private options: CamCaptureOptions;

  constructor(options: Partial<CamCaptureOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * 카메라 시작 & 비디오 엘리먼트에 연결
   */
  async start(videoElement: HTMLVideoElement): Promise<void> {
    // 기존 스트림 정리
    this.stop();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.options.facingMode,
          width: { ideal: this.options.width },
          height: { ideal: this.options.height }
        },
        audio: false
      });

      this.videoElement = videoElement;
      this.videoElement.srcObject = this.stream;

      // 미러링 적용
      if (this.options.mirror && this.options.facingMode === 'user') {
        this.videoElement.style.transform = 'scaleX(-1)';
      } else {
        this.videoElement.style.transform = 'none';
      }

      await this.videoElement.play();
    } catch (error) {
      throw new Error(`카메라 접근 실패: ${(error as Error).message}`);
    }
  }

  /**
   * 현재 프레임 캡처 → base64 반환
   */
  capture(quality: number = 0.92): CaptureResult {
    if (!this.videoElement || !this.stream) {
      throw new Error('카메라가 시작되지 않았습니다');
    }

    const video = this.videoElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // 원본 크기
    let { videoWidth: w, videoHeight: h } = video;

    // 리사이즈 (최대 크기 제한)
    const maxSize = this.options.maxSize || 720;
    if (w > maxSize || h > maxSize) {
      const ratio = Math.min(maxSize / w, maxSize / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    canvas.width = w;
    canvas.height = h;

    // 미러링 적용된 경우 캡처 시에도 반전
    if (this.options.mirror && this.options.facingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, w, h);

    return {
      dataUrl: canvas.toDataURL('image/jpeg', quality),
      width: w,
      height: h,
      timestamp: Date.now()
    };
  }

  /**
   * 카메라 일시정지 (배터리 절약)
   */
  pause(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.enabled = false);
    }
  }

  /**
   * 카메라 재개
   */
  resume(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.enabled = true);
    }
  }

  /**
   * 카메라 종료 & 리소스 해제
   */
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  /**
   * 카메라 전환 (전면 ↔ 후면)
   */
  async switchCamera(): Promise<void> {
    if (!this.videoElement) {
      throw new Error('카메라가 시작되지 않았습니다');
    }

    this.options.facingMode =
      this.options.facingMode === 'user' ? 'environment' : 'user';

    await this.start(this.videoElement);
  }

  /**
   * 현재 상태
   */
  get isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }

  get currentFacing(): 'user' | 'environment' {
    return this.options.facingMode || 'user';
  }
}

export default CamCapture;
