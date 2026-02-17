/**
 * MONK.js Framework Core v1
 * 마이크로 프레임워크 — Screen, Store, Pipe, Media, Agent
 *
 * @license MIT
 * @version 1.0.0
 */

const Monk = (() => {
  // === 유틸리티 ===
  const log = (msg) => console.log(`[${new Date().toLocaleTimeString('ko-KR')}] ${msg}`);

  const isMobile = () =>
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);

  // 중첩 키 접근 (예: 'user.credits' → obj.user.credits)
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  };

  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((acc, key) => acc[key] ??= {}, obj);
    target[last] = value;
  };

  // === 1. Screen — 화면 상태 머신 ===
  const screens = (definitions) => {
    let current = null;
    const defs = {};

    for (const [name, config] of Object.entries(definitions)) {
      defs[name] = {
        el: typeof config.el === 'string' ? document.querySelector(config.el) : config.el,
        enter: config.enter,
        exit: config.exit,
      };
    }

    const go = async (name, params = {}) => {
      if (!defs[name]) {
        log(`Screen "${name}" 정의되지 않음`);
        return;
      }

      // 이전 화면 exit
      if (current && defs[current]) {
        defs[current].el?.classList.remove('active');
        if (defs[current].exit) await defs[current].exit(params);
      }

      // 새 화면 enter
      current = name;
      defs[name].el?.classList.add('active');
      if (defs[name].enter) await defs[name].enter(params);

      log(`Screen → ${name}`);
    };

    return {
      go,
      get current() { return current; },
    };
  };

  // === 2. Store — Proxy 반응형 상태 + DOM 바인딩 ===
  const watchers = new Map(); // key → Set<callback>

  const store = (initialState) => {
    const state = { ...initialState };
    const bindings = {
      bind: [],      // data-bind
      bindSrc: [],   // data-bind-src
      show: [],      // data-show
      hide: [],      // data-hide
      class: [],     // data-class
    };

    // DOM 바인딩 스캔
    const scanBindings = () => {
      bindings.bind = [...document.querySelectorAll('[data-bind]')];
      bindings.bindSrc = [...document.querySelectorAll('[data-bind-src]')];
      bindings.show = [...document.querySelectorAll('[data-show]')];
      bindings.hide = [...document.querySelectorAll('[data-hide]')];
      bindings.class = [...document.querySelectorAll('[data-class]')];
    };

    // 값 변경 시 DOM 업데이트
    const updateDOM = (key, value) => {
      // data-bind: textContent
      bindings.bind.forEach(el => {
        const bindKey = el.dataset.bind;
        if (bindKey === key || bindKey.startsWith(key + '.')) {
          el.textContent = getNestedValue(proxy, bindKey) ?? '';
        }
      });

      // data-bind-src: src
      bindings.bindSrc.forEach(el => {
        const bindKey = el.dataset.bindSrc;
        if (bindKey === key || bindKey.startsWith(key + '.')) {
          el.src = getNestedValue(proxy, bindKey) ?? '';
        }
      });

      // data-show: truthy → display:'' / falsy → display:none
      bindings.show.forEach(el => {
        const bindKey = el.dataset.show;
        if (bindKey === key || bindKey.startsWith(key + '.')) {
          el.style.display = getNestedValue(proxy, bindKey) ? '' : 'none';
        }
      });

      // data-hide: truthy → none / falsy → ''
      bindings.hide.forEach(el => {
        const bindKey = el.dataset.hide;
        if (bindKey === key || bindKey.startsWith(key + '.')) {
          el.style.display = getNestedValue(proxy, bindKey) ? 'none' : '';
        }
      });

      // data-class: "key:className"
      bindings.class.forEach(el => {
        const [bindKey, className] = el.dataset.class.split(':');
        if (bindKey === key || bindKey.startsWith(key + '.')) {
          const val = getNestedValue(proxy, bindKey);
          el.classList.toggle(className, !!val);
        }
      });

      // watcher 콜백 실행
      const callbacks = watchers.get(key);
      if (callbacks) {
        callbacks.forEach(cb => cb(value, state[key]));
      }
    };

    const proxy = new Proxy(state, {
      get(target, key) {
        return target[key];
      },
      set(target, key, value) {
        const oldValue = target[key];
        target[key] = value;
        updateDOM(key, value);
        return true;
      },
    });

    // 초기 바인딩 스캔 (DOM 로드 후)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scanBindings);
    } else {
      scanBindings();
    }

    return proxy;
  };

  // Store 구독
  const watch = (storeProxy, key, callback) => {
    if (!watchers.has(key)) watchers.set(key, new Set());
    watchers.get(key).add(callback);
    return () => watchers.get(key).delete(callback); // unsubscribe
  };

  // === 3. Pipe — REST/WS 통신 ===
  const pipe = (definitions, options = {}) => {
    const { baseUrl = '', onError, onCreditShort } = options;
    const defs = { ...definitions };
    const wsConnections = {};
    const loops = {};
    const agentCallbacks = {}; // Agent onMessage 콜백 저장

    // REST 실행
    const run = async (name, body = {}) => {
      const def = defs[name];
      if (!def || def.type === 'ws') {
        throw new Error(`Pipe "${name}" is not a REST endpoint`);
      }

      const url = baseUrl + def.path;
      const res = await fetch(url, {
        method: def.type.toUpperCase(),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        const error = { status: res.status, ...data };
        if (res.status === 402 && onCreditShort) {
          onCreditShort(error);
        } else if (onError) {
          onError(name, error);
        }
        throw error;
      }

      return data;
    };

    // WebSocket 연결
    const connect = (name) => {
      const def = defs[name];
      if (!def || def.type !== 'ws') {
        log(`Pipe "${name}" is not a WebSocket endpoint`);
        return;
      }

      if (wsConnections[name]?.readyState <= 1) return; // 이미 연결 중

      const url = typeof def.url === 'function' ? def.url() : def.url;
      const ws = new WebSocket(url);
      wsConnections[name] = ws;

      ws.onopen = () => {
        log(`WS[${name}] 연결`);
        if (def.onOpen) def.onOpen(ws);
      };

      ws.onmessage = async (e) => {
        let parsed;
        try {
          const raw = (e.data instanceof Blob) ? await e.data.text() : e.data;
          parsed = JSON.parse(raw);
        } catch {
          parsed = e.data;
        }
        if (def.onMessage) def.onMessage(parsed, ws);
        // Agent 콜백 호출
        if (agentCallbacks[name]) agentCallbacks[name](parsed, ws);
      };

      ws.onclose = () => {
        log(`WS[${name}] 종료`);
        wsConnections[name] = null;
        if (def.onClose) def.onClose();

        // 자동 재연결
        if (def.reconnect) {
          const { delay = 3000, max = 5 } = def.reconnect;
          ws._reconnectCount = (ws._reconnectCount || 0) + 1;
          if (ws._reconnectCount <= max) {
            setTimeout(() => connect(name), delay);
          }
        }
      };

      ws.onerror = (err) => {
        log(`WS[${name}] 에러`);
      };
    };

    // WebSocket 전송
    const send = (name, data) => {
      const ws = wsConnections[name];
      if (!ws || ws.readyState !== 1) {
        log(`WS[${name}] 연결 안 됨`);
        return;
      }
      ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    };

    // WebSocket 바이너리 전송 (Blob/ArrayBuffer)
    const sendRaw = (name, data) => {
      const ws = wsConnections[name];
      if (!ws || ws.readyState !== 1) return;
      ws.send(data);
    };

    // WebSocket 연결 해제
    const disconnect = (name) => {
      const ws = wsConnections[name];
      if (ws) {
        try { ws.close(); } catch {}
        wsConnections[name] = null;
      }
    };

    // WebSocket 연결 상태
    const isConnected = (name) => {
      const ws = wsConnections[name];
      return ws && ws.readyState === 1;
    };

    // 릴레이 루프 (백프레셔 방지)
    const startLoop = (name, intervalMs, inputFn) => {
      if (loops[name]) return;

      let isProcessing = false;
      loops[name] = setInterval(async () => {
        if (isProcessing) return;

        const input = inputFn();
        if (input == null) return;

        isProcessing = true;
        try {
          const result = await run(name, input);
          // Agent가 등록한 콜백이 있으면 직접 호출
          if (agentCallbacks[name]) {
            agentCallbacks[name](result);
          }
        } catch (err) {
          // 에러는 onError에서 처리됨
        } finally {
          isProcessing = false;
        }
      }, intervalMs);
    };

    const stopLoop = (name) => {
      if (loops[name]) {
        clearInterval(loops[name]);
        delete loops[name];
      }
    };

    return {
      run,
      connect,
      send,
      sendRaw,
      disconnect,
      isConnected,
      startLoop,
      stopLoop,
      _ws: wsConnections,
      _loops: loops,
      _agentCallbacks: agentCallbacks,
    };
  };

  // === 4. Media — 카메라 + 얼굴검출 + 크롭 ===
  const media = (config) => {
    const {
      video: videoSelector,
      canvas: canvasSelector,
      maxSize = 720,
      captureQuality = 0.8,
      frameInterval = 1000,
      faceDetection = true,
      mirror = true,
    } = config;

    const videoEl = typeof videoSelector === 'string'
      ? document.querySelector(videoSelector) : videoSelector;
    const canvasEl = typeof canvasSelector === 'string'
      ? document.querySelector(canvasSelector) : canvasSelector;

    let stream = null;
    let frameTimer = null;
    let frameCallback = null;
    let mediapipeDetector = null;

    // MediaPipe 초기화 (lazy)
    const initMediaPipe = async () => {
      if (mediapipeDetector) return mediapipeDetector;
      if (!faceDetection) return null;

      try {
        const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest');
        const { FaceDetector, FilesetResolver } = vision;
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        mediapipeDetector = await FaceDetector.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          },
          runningMode: 'IMAGE',
        });
        log('MediaPipe 얼굴검출 초기화');
        return mediapipeDetector;
      } catch (e) {
        log('MediaPipe 로드 실패: ' + e.message);
        return null;
      }
    };

    // 카메라 시작
    const start = async () => {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: maxSize }, height: { ideal: maxSize * 4/3 } },
        audio: false,
      });
      videoEl.srcObject = stream;
      await videoEl.play();
      log('카메라 시작');

      // MediaPipe 사전 로드
      if (faceDetection) initMediaPipe();
    };

    // 카메라 정지
    const stop = () => {
      if (frameTimer) {
        clearInterval(frameTimer);
        frameTimer = null;
      }
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
      }
      if (videoEl) videoEl.srcObject = null;
      log('카메라 정지');
    };

    // 현재 프레임 캡처
    const capture = () => {
      if (!videoEl || videoEl.videoWidth === 0) return null;

      const vw = videoEl.videoWidth, vh = videoEl.videoHeight;
      let tw = vw, th = vh;
      if (tw > maxSize || th > maxSize) {
        const ratio = Math.min(maxSize / tw, maxSize / th);
        tw = Math.round(tw * ratio);
        th = Math.round(th * ratio);
      }

      canvasEl.width = tw;
      canvasEl.height = th;
      const ctx = canvasEl.getContext('2d');

      // 미러링 처리
      if (mirror) {
        ctx.translate(tw, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(videoEl, 0, 0, vw, vh, 0, 0, tw, th);

      // 미러링 복원
      if (mirror) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      return canvasEl.toDataURL('image/jpeg', captureQuality);
    };

    // 주기 캡처 콜백 등록
    const onFrame = (callback) => {
      frameCallback = callback;
      if (frameTimer) clearInterval(frameTimer);
      frameTimer = setInterval(() => {
        const data = capture();
        if (data && frameCallback) frameCallback(data);
      }, frameInterval);
    };

    // 주기 캡처 해제
    const offFrame = () => {
      frameCallback = null;
      if (frameTimer) {
        clearInterval(frameTimer);
        frameTimer = null;
      }
    };

    // 얼굴검출 + 규격 크롭
    const crop = async (dataURL, spec) => {
      const { widthMM, heightMM, faceTopMM, faceLenMM } = spec;
      const DPI = 300;
      const mmToPx = (mm) => Math.round(mm * DPI / 25.4);

      const outputW = mmToPx(widthMM);
      const outputH = mmToPx(heightMM);

      const img = new Image();
      img.src = dataURL;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      let faceBox = null;
      let detectMethod = '';

      // 1. MediaPipe
      if (!faceBox && mediapipeDetector) {
        try {
          const result = mediapipeDetector.detect(img);
          if (result.detections?.length > 0) {
            const bbox = result.detections[0].boundingBox;
            faceBox = {
              x: bbox.originX,
              y: bbox.originY,
              width: bbox.width,
              height: bbox.height,
            };
            detectMethod = 'MediaPipe';
          }
        } catch (e) {
          log('MediaPipe 검출 에러: ' + e.message);
        }
      }

      // 2. Chrome FaceDetector API
      if (!faceBox && 'FaceDetector' in window) {
        try {
          const detector = new FaceDetector();
          const faces = await detector.detect(img);
          if (faces.length > 0) {
            faceBox = faces[0].boundingBox;
            detectMethod = 'Chrome API';
          }
        } catch (e) {
          log('Chrome FaceDetector: ' + e.message);
        }
      }

      // 3. 휴리스틱 폴백
      if (!faceBox) {
        const estW = img.width * 0.45;
        const estH = img.height * 0.50;
        faceBox = {
          x: (img.width - estW) / 2,
          y: img.height * 0.06,
          width: estW,
          height: estH,
        };
        detectMethod = '휴리스틱';
      }

      log(`얼굴 검출[${detectMethod}]: ${Math.round(faceBox.width)}x${Math.round(faceBox.height)}px`);

      // 규격 계산
      const faceTop = faceBox.y;
      const faceCenterX = faceBox.x + faceBox.width / 2;
      const faceHeight = faceBox.height;
      const pxPerMM = faceHeight / faceLenMM;

      const srcW = widthMM * pxPerMM;
      const srcH = heightMM * pxPerMM;
      const srcY = faceTop - (faceTopMM * pxPerMM);
      const srcX = faceCenterX - srcW / 2;

      const clampedX = Math.max(0, Math.min(srcX, img.width - srcW));
      const clampedY = Math.max(0, Math.min(srcY, img.height - srcH));

      // 크롭 캔버스
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = outputW;
      cropCanvas.height = outputH;
      const ctx = cropCanvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outputW, outputH);
      ctx.drawImage(img, clampedX, clampedY, srcW, srcH, 0, 0, outputW, outputH);

      const resultUrl = cropCanvas.toDataURL('image/png');
      log(`규격 크롭: ${outputW}x${outputH}px (${widthMM}x${heightMM}mm @${DPI}dpi)`);

      return {
        dataUrl: resultUrl,
        spec,
        outputW,
        outputH,
      };
    };

    // PNG → JPEG 변환
    const toJpeg = async (dataURL, quality = 0.92) => {
      const img = new Image();
      img.src = dataURL;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      return canvas.toDataURL('image/jpeg', quality);
    };

    return {
      start,
      stop,
      capture,
      onFrame,
      offFrame,
      crop,
      toJpeg,
      get videoEl() { return videoEl; },
      get stream() { return stream; },
    };
  };

  // === 5. Agent — AI 에이전트 래퍼 ===
  const agent = (name, config) => {
    const { pipe: pipeInstance, endpoint, type, interval } = config;
    let resultCallback = null;
    let messageCallback = null;

    // REST (Vision) 타입
    if (type === 'rest') {
      const onResult = (callback) => {
        resultCallback = callback;
        // REST용 콜백을 agentCallbacks에 등록
        pipeInstance._agentCallbacks[endpoint] = (result) => {
          if (resultCallback) resultCallback(result);
        };
      };

      const start = (inputFn) => {
        pipeInstance.startLoop(endpoint, interval, inputFn);
        // polling 제거 — Pipe가 직접 콜백 호출
      };

      const stop = () => {
        pipeInstance.stopLoop(endpoint);
        // 콜백 정리
        delete pipeInstance._agentCallbacks[endpoint];
      };

      return { onResult, start, stop, name };
    }

    // WebSocket (Voice) 타입
    if (type === 'ws') {
      const connect = () => pipeInstance.connect(endpoint);
      const disconnect = () => pipeInstance.disconnect(endpoint);
      const inject = (data) => pipeInstance.send(endpoint, data);

      const onMessage = (callback) => {
        messageCallback = callback;
        // Pipe의 agentCallbacks에 등록
        pipeInstance._agentCallbacks[endpoint] = (msg, ws) => {
          if (messageCallback) messageCallback(msg, ws);
        };
      };

      return { connect, disconnect, inject, onMessage, name };
    }

    throw new Error(`Agent type "${type}" not supported`);
  };

  // === Public API ===
  return {
    screens,
    store,
    watch,
    pipe,
    media,
    agent,
    log,
    isMobile,
  };
})();

// ES Module export
export default Monk;
export const { screens, store, watch, pipe, media, agent, log, isMobile } = Monk;
