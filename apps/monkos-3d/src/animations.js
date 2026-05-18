/**
 * 몽코스 애니메이션 모듈
 * A: 립싱크, B: 바운스, C: 걷기, D: 시선, E: 가리키기, F: 눈깜빡임
 */

export class MonkosAnimator {
  constructor(character) {
    this.root = character;
    this.head = character.getObjectByName('head');
    this.mouth = character.getObjectByName('mouth');
    this.mouthMesh = character.getObjectByName('mouth_mesh');
    this.eyeL = character.getObjectByName('eye_left');
    this.eyeR = character.getObjectByName('eye_right');
    this.legL = character.getObjectByName('leg_left');
    this.legR = character.getObjectByName('leg_right');
    this.toes = character.getObjectByName('toes');

    // 애니메이션 상태
    this.bouncing = false;
    this.looking = false;
    this.pointing = false;
    this.walking = false;
    this.roaming = false; // 좌우 걸어다니기
    this.blinking = true; // 기본 활성

    this._clock = 0;
    this._blinkTimer = 0;
    this._blinkInterval = 3.0; // 초
    this._nextBlink = 2 + Math.random() * 3;

    // 이동 상태
    this._roamDir = 1; // 1: 오른쪽, -1: 왼쪽
    this._roamX = 0;
    this._roamSpeed = 0.8;
    this._roamRange = 1.5; // 좌우 이동 범위
    this._baseY = -0.3;

    // 초기 스케일 저장
    this._eyeLScaleY = 1;
    this._eyeRScaleY = 1;
    this._mouthBaseScaleY = 1;
  }

  // ── A: 립싱크 (외부에서 volume 0~1 전달) ──
  setMouthOpen(amount) {
    if (!this.mouth) return;
    // amount: 0(닫힘) ~ 1(완전 열림)
    // 진폭 대폭 확대 (3~5배) — 캐릭터라 과장이 자연스럽다
    const scaleY = 0.05 + amount * 5.0;
    this.mouth.scale.y = scaleY;
    // X도 약간 늘려서 입 벌릴 때 옆으로도 커지게
    this.mouth.scale.x = 1.0 + amount * 0.8;
  }

  // ── B: 바운스 토글 ──
  toggleBounce() {
    this.bouncing = !this.bouncing;
    if (!this.bouncing) {
      this.root.position.y = -0.3;
    }
    return this.bouncing;
  }

  // ── C: 걷기 토글 ──
  toggleWalk() {
    this.walking = !this.walking;
    if (!this.walking && this.legL && this.legR) {
      this.legL.rotation.z = 0;
      this.legR.rotation.z = 0;
    }
    return this.walking;
  }

  // ── D: 시선 회전 토글 ──
  toggleLook() {
    this.looking = !this.looking;
    if (!this.looking && this.head) {
      this.head.rotation.y = 0;
    }
    return this.looking;
  }

  // ── E: 가리키기 토글 ──
  togglePoint() {
    this.pointing = !this.pointing;
    if (!this.pointing && this.legL) {
      this.legL.rotation.z = 0;
      this.legL.position.y = this._legLOrigY || this.legL.position.y;
    }
    return this.pointing;
  }

  // ── G: 걸어다니기 (좌우 이동 + 걷기 + 바운스) ──
  toggleRoam() {
    this.roaming = !this.roaming;
    if (this.roaming) {
      this.walking = true;
      this.bouncing = true;
    } else {
      this.walking = false;
      this.bouncing = false;
      this._roamX = 0;
      this.root.position.x = 0;
      this.root.position.y = this._baseY;
      this.root.scale.set(1, 1, 1);
      if (this.legL) this.legL.rotation.z = 0;
      if (this.legR) this.legR.rotation.z = 0;
    }
    return this.roaming;
  }

  // ── F: 눈깜빡임은 기본 활성 (update에서 처리) ──

  // ── 프레임 업데이트 ──
  update(dt) {
    this._clock += dt;

    // G: 걸어다니기 (좌우 이동)
    if (this.roaming) {
      this._roamX += this._roamDir * this._roamSpeed * dt;
      if (this._roamX > this._roamRange) {
        this._roamX = this._roamRange;
        this._roamDir = -1;
        this.root.scale.x = -Math.abs(this.root.scale.x); // 방향 전환 (좌우 반전)
      } else if (this._roamX < -this._roamRange) {
        this._roamX = -this._roamRange;
        this._roamDir = 1;
        this.root.scale.x = Math.abs(this.root.scale.x);
      }
      this.root.position.x = this._roamX;
    }

    // B: 바운스
    if (this.bouncing) {
      const bounceY = Math.abs(Math.sin(this._clock * 4)) * 0.15;
      this.root.position.y = this._baseY + bounceY;
      // 스쿼시 & 스트레치
      this.root.scale.y = 0.95 + bounceY * 0.4;
      const sx = 1 + (1 - this.root.scale.y) * 0.5;
      this.root.scale.x = this._roamDir >= 0 ? sx : -sx;
      this.root.scale.z = sx;
    } else {
      const sx = (this.roaming && this._roamDir < 0) ? -1 : 1;
      this.root.scale.set(sx, 1, 1);
    }

    // C: 걷기
    if (this.walking && this.legL && this.legR) {
      const swing = Math.sin(this._clock * 6) * 0.3;
      this.legL.rotation.z = swing;
      this.legR.rotation.z = -swing;
      // 발가락도 같이
      if (this.toes) {
        this.toes.children.forEach((toe, i) => {
          toe.position.z = Math.sin(this._clock * 6 + i * 0.5) * 0.03;
        });
      }
    }

    // D: 시선 (좌→우 반복)
    if (this.looking && this.head) {
      this.head.rotation.y = Math.sin(this._clock * 2) * 0.5;
    }

    // E: 가리키기 (왼쪽 다리를 들어올림)
    if (this.pointing && this.legL) {
      if (!this._legLOrigY) this._legLOrigY = this.legL.position.y;
      this.legL.rotation.z = -0.8;
      this.legL.position.y = this._legLOrigY + 0.15;
    }

    // F: 눈깜빡임
    if (this.blinking) {
      this._blinkTimer += dt;
      if (this._blinkTimer >= this._nextBlink) {
        // 깜빡임 실행
        this._doBlink();
        this._blinkTimer = 0;
        this._nextBlink = 2 + Math.random() * 4;
      }
    }
  }

  _doBlink() {
    if (!this.eyeL || !this.eyeR) return;

    // 빠르게 스케일 축소 → 복원
    const duration = 150; // ms
    const startTime = performance.now();

    const blink = () => {
      const elapsed = performance.now() - startTime;
      const t = elapsed / duration;

      if (t < 0.5) {
        // 닫히는 중
        const s = 1 - t * 2 * 0.85;
        this.eyeL.scale.y = s;
        this.eyeR.scale.y = s;
      } else if (t < 1.0) {
        // 열리는 중
        const s = 0.15 + (t - 0.5) * 2 * 0.85;
        this.eyeL.scale.y = s;
        this.eyeR.scale.y = s;
      } else {
        this.eyeL.scale.y = 1;
        this.eyeR.scale.y = 1;
        return;
      }
      requestAnimationFrame(blink);
    };
    requestAnimationFrame(blink);
  }
}
