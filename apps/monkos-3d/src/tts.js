/**
 * TTS 모듈 — ElevenLabs (primary) + Web Speech API (fallback)
 *
 * ElevenLabs: REST API → MP3 → AudioContext → AnalyserNode → 실시간 볼륨 립싱크
 * Web Speech: 타이밍 기반 시뮬레이션 립싱크 (폴백)
 *
 * API 키는 Vite proxy 경유 (프론트에 노출 없음)
 */

// 프리셋 보이스 (multilingual_v2 한국어 지원)
export const PRESET_VOICES = [
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni — 남성, 친근' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel — 여성, 밝고 또렷' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella — 여성, 따뜻한 톤' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold — 남성, 깊고 단단' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam — 남성, 차분' },
];

export class MonkosTTS {
  constructor(onVolumeChange) {
    this.onVolumeChange = onVolumeChange;
    this.speaking = false;
    this._animFrame = null;

    // ElevenLabs
    this._audioCtx = null;  // lazy init (유저 인터랙션 후)
    this._analyser = null;
    this._source = null;
    this._voiceId = PRESET_VOICES[0].id; // 기본: Antoni
    this._elevenLabsAvailable = false;

    // Web Speech 폴백
    this._synth = window.speechSynthesis;
    this._volume = 0;
    this._targetVolume = 0;
  }

  /**
   * ElevenLabs 프록시 연결 확인 (페이지 로드 시)
   * AudioContext는 여기서 안 만듦 — 첫 발화 시 lazy init
   */
  async initElevenLabs() {
    console.log('[TTS] ElevenLabs 초기화 시작...');
    try {
      // 프록시 동작 확인 (GET /v1/voices — 권한 없어도 프록시 자체는 확인 가능)
      const res = await fetch('/api/elevenlabs/v1/voices');
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/html')) {
        // HTML이 왔으면 proxy가 안 먹힌 것
        throw new Error('Proxy 미작동 — HTML 응답 수신. Vite proxy 설정 확인 필요');
      }

      if (res.ok) {
        const data = await res.json();
        const voices = data.voices || [];
        console.log(`[TTS] ElevenLabs 보이스 ${voices.length}개 조회 성공`);
      } else {
        // 403/401 등 — API 키는 전달됐지만 권한 부족. TTS는 가능할 수 있음
        const body = await res.json().catch(() => ({}));
        console.log(`[TTS] voices API ${res.status}: ${body.detail?.message || 'unknown'}. TTS 엔드포인트로 재확인...`);
      }

      // TTS 엔드포인트 직접 확인 (짧은 텍스트)
      console.log(`[TTS] TTS 테스트 호출 — voice: ${this._voiceId}`);
      const testRes = await fetch(`/api/elevenlabs/v1/text-to-speech/${this._voiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '준비',
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });

      if (!testRes.ok) {
        const errBody = await testRes.text().catch(() => '');
        throw new Error(`TTS 테스트 실패 (${testRes.status}): ${errBody.slice(0, 200)}`);
      }

      const testType = testRes.headers.get('content-type') || '';
      if (!testType.includes('audio') && !testType.includes('mpeg')) {
        throw new Error(`TTS 응답이 오디오가 아님: ${testType}`);
      }

      console.log(`[TTS] ✅ ElevenLabs 준비 완료 — voice: ${this._voiceId}, content-type: ${testType}`);
      this._elevenLabsAvailable = true;
      return { available: true, voiceId: this._voiceId };
    } catch (err) {
      console.error(`[TTS] ❌ ElevenLabs 초기화 실패: ${err.message}`);
      console.log('[TTS] Web Speech API 폴백 모드로 전환');
      this._elevenLabsAvailable = false;
      return { available: false, error: err.message };
    }
  }

  /** 보이스 변경 (외부에서 호출) */
  setVoiceId(voiceId) {
    this._voiceId = voiceId;
    console.log(`[TTS] 보이스 변경: ${voiceId}`);
  }

  /** 현재 엔진 확인 */
  get engine() {
    return this._elevenLabsAvailable ? 'ElevenLabs' : 'Web Speech';
  }

  /**
   * 발화 — ElevenLabs 우선, 실패 시 Web Speech 폴백
   */
  speak(text, onEnd) {
    if (this._elevenLabsAvailable && this._voiceId) {
      console.log(`[TTS] ElevenLabs 발화: voice=${this._voiceId}, text="${text.slice(0, 25)}..."`);
      this._speakElevenLabs(text, onEnd);
    } else {
      console.log(`[TTS] Web Speech 발화: "${text.slice(0, 25)}..."`);
      this._speakWebSpeech(text, onEnd);
    }
  }

  stop() {
    this.speaking = false;
    if (this._source) {
      try { this._source.stop(); } catch {}
      this._source = null;
    }
    this._synth.cancel();
    this._stopLipSync();
  }

  // ── ElevenLabs TTS ──
  async _speakElevenLabs(text, onEnd) {
    this.speaking = true;

    try {
      // AudioContext lazy init (첫 유저 인터랙션 이후 보장)
      if (!this._audioCtx) {
        console.log('[TTS] AudioContext 생성 (lazy init)');
        this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this._analyser = this._audioCtx.createAnalyser();
        this._analyser.fftSize = 256;
        this._analyser.smoothingTimeConstant = 0.3;
        this._analyser.connect(this._audioCtx.destination);
      }

      if (this._audioCtx.state === 'suspended') {
        console.log('[TTS] AudioContext resume...');
        await this._audioCtx.resume();
      }

      const t0 = performance.now();
      const res = await fetch(`/api/elevenlabs/v1/text-to-speech/${this._voiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`API ${res.status}: ${errText.slice(0, 200)}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      const latency = Math.round(performance.now() - t0);
      console.log(`[TTS] ElevenLabs 응답: ${arrayBuffer.byteLength} bytes, ${latency}ms`);

      const audioBuffer = await this._audioCtx.decodeAudioData(arrayBuffer);

      // 이전 소스 정리
      if (this._source) {
        try { this._source.stop(); } catch {}
      }

      this._source = this._audioCtx.createBufferSource();
      this._source.buffer = audioBuffer;
      this._source.connect(this._analyser);
      this._source.start();

      this._startAnalyserLipSync();

      this._source.onended = () => {
        console.log('[TTS] ElevenLabs 발화 종료');
        this.speaking = false;
        this._source = null;
        this._stopLipSync();
        if (onEnd) onEnd();
      };
    } catch (err) {
      console.error(`[TTS] ❌ ElevenLabs FAILED: ${err.message}, falling back to Web Speech`);
      this.speaking = false;
      this._speakWebSpeech(text, onEnd);
    }
  }

  // AnalyserNode → 실시간 볼륨 → 립싱크
  _startAnalyserLipSync() {
    const bufferLength = this._analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const tick = () => {
      if (!this.speaking) return;

      this._analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const avg = sum / bufferLength / 255;

      const volume = Math.min(1, avg * 2.5);
      this._volume += (volume - this._volume) * 0.4;

      if (this.onVolumeChange) this.onVolumeChange(this._volume);
      this._animFrame = requestAnimationFrame(tick);
    };

    this._animFrame = requestAnimationFrame(tick);
  }

  // ── Web Speech API 폴백 ──
  _speakWebSpeech(text, onEnd) {
    if (this._synth.speaking) this._synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.95;
    utterance.pitch = 1.1;

    const voices = this._synth.getVoices();
    const koreanVoice = voices.find(v => v.lang.startsWith('ko'));
    if (koreanVoice) utterance.voice = koreanVoice;

    this.speaking = true;

    utterance.onboundary = () => {
      this._targetVolume = 0.6 + Math.random() * 0.4;
      setTimeout(() => {
        if (this.speaking) this._targetVolume = Math.random() * 0.08;
      }, 100 + Math.random() * 80);
    };

    utterance.onstart = () => {
      this.speaking = true;
      this._startSimulatedLipSync();
    };

    utterance.onend = () => {
      this.speaking = false;
      this._targetVolume = 0;
      this._stopLipSync();
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.speaking = false;
      this._stopLipSync();
    };

    this._synth.speak(utterance);
  }

  _startSimulatedLipSync() {
    const tick = () => {
      if (!this.speaking) return;
      this._volume += (this._targetVolume - this._volume) * 0.5;
      if (this.onVolumeChange) this.onVolumeChange(this._volume);
      this._animFrame = requestAnimationFrame(tick);
    };

    const interval = () => {
      if (!this.speaking) return;
      this._targetVolume = 0.6 + Math.random() * 0.4;
      setTimeout(() => {
        if (this.speaking) this._targetVolume = Math.random() * 0.08;
      }, 100 + Math.random() * 80);
      setTimeout(interval, 180 + Math.random() * 120);
    };

    this._animFrame = requestAnimationFrame(tick);
    interval();
  }

  _stopLipSync() {
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
    this._volume = 0;
    this._targetVolume = 0;
    if (this.onVolumeChange) this.onVolumeChange(0);
  }

  static loadVoices() {
    return new Promise((resolve) => {
      const voices = speechSynthesis.getVoices();
      if (voices.length) { resolve(voices); return; }
      speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
    });
  }
}
