import { useState, useEffect, useRef, useCallback } from "react";

// ── 디자인 토큰 (monkos 시스템 그대로)
const C = {
  bg:       "#0A0E17",
  card:     "#111827",
  border:   "#1E293B",
  accent:   "#8B5CF6",
  accentGlow: "rgba(139,92,246,0.35)",
  gold:     "#F59E0B",
  green:    "#10B981",
  greenGlow:"rgba(16,185,129,0.3)",
  red:      "#EF4444",
  text:     "#F1F5F9",
  sub:      "#94A3B8",
  muted:    "#64748B",
};

// ── AI 코치 상태 머신
// idle → ready → detecting → coaching → countdown → captured → done
const COACH_STATES = {
  idle:       { color: C.muted,  ring: C.border,  pulse: false },
  ready:      { color: C.sub,   ring: C.border,  pulse: false },
  detecting:  { color: C.gold,  ring: C.gold,    pulse: true  },
  coaching:   { color: C.gold,  ring: C.gold,    pulse: true  },
  ok:         { color: C.green, ring: C.green,   pulse: true  },
  countdown:  { color: C.green, ring: C.green,   pulse: false },
  captured:   { color: C.green, ring: C.green,   pulse: false },
};

// ── 코치 메시지 시나리오 (실제 앱에선 MediaPipe 결과로 교체)
const COACH_SCRIPT = [
  { state: "detecting",  msg: "얼굴을 인식하는 중…",          icon: "👁️",  duration: 1200 },
  { state: "coaching",   msg: "조금 더 정면을 봐주세요",        icon: "↔️",  duration: 1400 },
  { state: "coaching",   msg: "턱을 살짝 내려주세요",          icon: "⬇️",  duration: 1400 },
  { state: "coaching",   msg: "눈썹이 원 안에 들어왔나요?",    icon: "👀",  duration: 1400 },
  { state: "ok",         msg: "완벽합니다! 잠시 멈춰주세요",   icon: "✓",   duration: 800  },
];

export default function CameraRoom() {
  const [phase, setPhase] = useState("standby"); // standby | session | captured
  const [coachIdx, setCoachIdx] = useState(-1);
  const [countdown, setCountdown] = useState(null); // 3→2→1→null
  const [flash, setFlash] = useState(false);
  const [shimmer, setShimmer] = useState(false);
  const [capturedImg, setCapturedImg] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // ── 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      // 카메라 권한 없으면 더미 모드로 진행 (프로토타입)
    }
    setPhase("session");
    runCoachScript();
  }, []);

  // ── 카메라 정지
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ── AI 코칭 스크립트 실행
  const runCoachScript = useCallback(() => {
    let idx = 0;
    const step = () => {
      if (idx >= COACH_SCRIPT.length) {
        // 코칭 완료 → 카운트다운
        startCountdown();
        return;
      }
      setCoachIdx(idx);
      timerRef.current = setTimeout(() => {
        idx++;
        step();
      }, COACH_SCRIPT[idx].duration);
    };
    step();
  }, []);

  // ── 카운트다운 3→2→1→촬영
  const startCountdown = useCallback(() => {
    setCountdown(3);
    let n = 3;
    const tick = () => {
      n--;
      if (n > 0) {
        setCountdown(n);
        timerRef.current = setTimeout(tick, 1000);
      } else {
        setCountdown(null);
        doCapture();
      }
    };
    timerRef.current = setTimeout(tick, 1000);
  }, []);

  // ── 촬영
  const doCapture = useCallback(() => {
    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    // Canvas로 프레임 캡처
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width  = videoRef.current.videoWidth  || 640;
      canvasRef.current.height = videoRef.current.videoHeight || 480;
      ctx.save();
      ctx.translate(canvasRef.current.width, 0);
      ctx.scale(-1, 1); // 좌우 미러 해제
      ctx.drawImage(videoRef.current, 0, 0);
      ctx.restore();
      setCapturedImg(canvasRef.current.toDataURL("image/jpeg", 0.95));
    } else {
      // 카메라 없는 경우 플레이스홀더
      setCapturedImg("placeholder");
    }

    setShimmer(true);
    setTimeout(() => {
      stopCamera();
      setPhase("captured");
      setShimmer(false);
    }, 1200);
  }, [stopCamera]);

  // ── 재촬영
  const retake = useCallback(() => {
    setCapturedImg(null);
    setCoachIdx(-1);
    setCountdown(null);
    setPhase("standby");
  }, []);

  // ── cleanup
  useEffect(() => {
    return () => {
      stopCamera();
      clearTimeout(timerRef.current);
    };
  }, [stopCamera]);

  // ── 현재 코치 상태 계산
  const currentCoach = coachIdx >= 0 ? COACH_SCRIPT[coachIdx] : null;
  const ringState =
    countdown !== null       ? COACH_STATES.countdown :
    currentCoach?.state === "ok" ? COACH_STATES.ok :
    currentCoach?.state === "coaching" ? COACH_STATES.coaching :
    currentCoach?.state === "detecting" ? COACH_STATES.detecting :
    COACH_STATES.idle;

  // ────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
      padding: 24,
    }}>
      {/* Phone 프레임 */}
      <div style={{
        width: 370,
        minHeight: 740,
        background: C.card,
        borderRadius: 40,
        border: `1.5px solid ${C.border}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        boxShadow: `0 0 80px rgba(0,0,0,0.6), 0 0 0 1px ${C.border}`,
      }}>

        {/* 상단 상태바 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px 8px",
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 12, color: C.muted }}>9:41</div>
          <div style={{
            fontSize: 13, fontWeight: 800, letterSpacing: "0.08em",
            background: `linear-gradient(135deg, #A78BFA, #8B5CF6)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>MONKOS</div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: C.gold,
            background: "rgba(245,158,11,0.12)",
            padding: "2px 8px", borderRadius: 8,
          }}>10c</div>
        </div>

        {/* 메인 콘텐츠 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px 24px" }}>

          {/* ══ STANDBY 화면 ══ */}
          {phase === "standby" && (
            <StandbyScreen onStart={startCamera} />
          )}

          {/* ══ SESSION 화면 (촬영 중) ══ */}
          {phase === "session" && (
            <SessionScreen
              videoRef={videoRef}
              canvasRef={canvasRef}
              ringState={ringState}
              currentCoach={currentCoach}
              countdown={countdown}
              flash={flash}
              shimmer={shimmer}
            />
          )}

          {/* ══ CAPTURED 화면 (촬영 완료) ══ */}
          {phase === "captured" && (
            <CapturedScreen capturedImg={capturedImg} onRetake={retake} />
          )}

        </div>
      </div>

      {/* hidden canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <style>{`
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 var(--ring-color); }
          70%  { box-shadow: 0 0 0 12px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        @keyframes ping {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes countdown-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          50%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes flash-screen {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes shimmer-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes checkmark {
          0%   { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════
// STANDBY SCREEN
// ════════════════════════════════════════════
function StandbyScreen({ onStart }) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>

      {/* 타이틀 */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>
          STAGE 2 · 촬영
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>
          촬영 준비가 되셨나요?
        </h2>
        <p style={{ fontSize: 13, color: C.sub, margin: "8px 0 0", lineHeight: 1.6 }}>
          가이드 원에 얼굴을 맞추면<br />AI가 확인 후 자동으로 촬영합니다
        </p>
      </div>

      {/* 프리뷰 프레임 (더미) */}
      <div style={{
        width: 260,
        height: 320,
        borderRadius: 20,
        background: "linear-gradient(160deg, #0d1220, #111827)",
        border: `1.5px solid ${C.border}`,
        position: "relative",
        overflow: "hidden",
        marginBottom: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* 가이드 오벌 (미리보기) */}
        <div style={{
          width: 150,
          height: 190,
          borderRadius: "50%",
          border: `2px dashed ${C.muted}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.5,
        }}>
          <div style={{ fontSize: 32 }}>👤</div>
        </div>

        {/* 코너 마커 */}
        {[
          { top: 12, left: 12, borderTop: `2px solid ${C.accent}`, borderLeft: `2px solid ${C.accent}` },
          { top: 12, right: 12, borderTop: `2px solid ${C.accent}`, borderRight: `2px solid ${C.accent}` },
          { bottom: 12, left: 12, borderBottom: `2px solid ${C.accent}`, borderLeft: `2px solid ${C.accent}` },
          { bottom: 12, right: 12, borderBottom: `2px solid ${C.accent}`, borderRight: `2px solid ${C.accent}` },
        ].map((s, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 16, height: 16,
            ...s,
          }} />
        ))}

        <div style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 10,
          color: C.muted,
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
        }}>카메라 화면 미리보기</div>
      </div>

      {/* 체크리스트 */}
      <div style={{
        width: "100%",
        background: "rgba(255,255,255,0.03)",
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 24,
        border: `1px solid ${C.border}`,
      }}>
        {[
          { icon: "💡", text: "밝은 곳에서 촬영해주세요" },
          { icon: "👀", text: "눈썹·이마가 보이도록 준비해주세요" },
          { icon: "📷", text: "카메라와 약 50cm 거리를 유지하세요" },
        ].map((item, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 0",
            borderBottom: i < 2 ? `1px solid ${C.border}` : "none",
          }}>
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            <span style={{ fontSize: 12, color: C.sub }}>{item.text}</span>
          </div>
        ))}
      </div>

      {/* 시작 버튼 */}
      <button
        onClick={onStart}
        style={{
          width: "100%",
          padding: "16px 0",
          borderRadius: 16,
          border: "none",
          background: `linear-gradient(135deg, #8B5CF6, #7C3AED)`,
          color: "#fff",
          fontSize: 16,
          fontWeight: 800,
          cursor: "pointer",
          letterSpacing: "-0.01em",
          boxShadow: `0 4px 24px ${C.accentGlow}`,
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseDown={e => { e.currentTarget.style.transform = "scale(0.98)"; }}
        onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        촬영 시작하기 →
      </button>
    </div>
  );
}

// ════════════════════════════════════════════
// SESSION SCREEN (촬영 중)
// ════════════════════════════════════════════
function SessionScreen({ videoRef, ringState, currentCoach, countdown, flash, shimmer }) {
  const isOk = currentCoach?.state === "ok" || countdown !== null;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* 상태 레이블 */}
      <div style={{
        fontSize: 11,
        letterSpacing: "0.15em",
        color: isOk ? C.green : C.gold,
        marginBottom: 14,
        textTransform: "uppercase",
        animation: "fade-in 0.3s ease",
      }}>
        {countdown !== null ? "촬영 준비 완료" : isOk ? "자세 확인 완료" : "AI 코칭 중"}
      </div>

      {/* ── 카메라 뷰파인더 ── */}
      <div style={{
        width: 260,
        height: 320,
        borderRadius: 20,
        background: "#000",
        position: "relative",
        overflow: "hidden",
        marginBottom: 20,
        "--ring-color": ringState.color + "80",
        animation: ringState.pulse ? "breathe 1.5s ease-in-out infinite" : "none",
        boxShadow: isOk
          ? `0 0 0 3px ${C.green}, 0 0 32px ${C.greenGlow}`
          : `0 0 0 2px ${ringState.ring}60`,
        transition: "box-shadow 0.4s ease",
      }}>

        {/* 실제 카메라 피드 */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)", // 셀카 미러
          }}
        />

        {/* 얼굴 가이드 오벌 오버레이 */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}>
          <div style={{
            width: 145,
            height: 185,
            borderRadius: "50%",
            border: `2.5px solid ${isOk ? C.green : C.gold}`,
            boxShadow: isOk
              ? `0 0 0 3000px rgba(0,0,0,0.45), inset 0 0 20px ${C.greenGlow}`
              : `0 0 0 3000px rgba(0,0,0,0.55)`,
            transition: "border-color 0.4s, box-shadow 0.4s",
            position: "relative",
          }}>
            {/* 오벌 펄스 링 (ok 상태) */}
            {isOk && (
              <div style={{
                position: "absolute",
                inset: -8,
                borderRadius: "50%",
                border: `2px solid ${C.green}`,
                animation: "ping 1.2s ease-out infinite",
                opacity: 0.5,
              }} />
            )}
          </div>
        </div>

        {/* 코너 마커 */}
        {[
          { top: 10, left: 10, borderTop: `2px solid ${isOk ? C.green : C.accent}`, borderLeft: `2px solid ${isOk ? C.green : C.accent}` },
          { top: 10, right: 10, borderTop: `2px solid ${isOk ? C.green : C.accent}`, borderRight: `2px solid ${isOk ? C.green : C.accent}` },
          { bottom: 10, left: 10, borderBottom: `2px solid ${isOk ? C.green : C.accent}`, borderLeft: `2px solid ${isOk ? C.green : C.accent}` },
          { bottom: 10, right: 10, borderBottom: `2px solid ${isOk ? C.green : C.accent}`, borderRight: `2px solid ${isOk ? C.green : C.accent}` },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", width: 18, height: 18, transition: "border-color 0.4s", ...s }} />
        ))}

        {/* ── 카운트다운 오버레이 ── */}
        {countdown !== null && (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.3)",
          }}>
            <div style={{
              fontSize: 96,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1,
              textShadow: `0 0 40px ${C.green}`,
              animation: "countdown-pop 0.4s ease",
              key: countdown,
            }}>
              {countdown}
            </div>
          </div>
        )}

        {/* 셔터 플래시 */}
        {flash && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "#fff",
            animation: "flash-screen 0.3s ease forwards",
            zIndex: 10,
          }} />
        )}

        {/* 시머 (생성 중) */}
        {shimmer && (
          <div style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 12,
          }}>
            <div style={{
              width: 40, height: 40,
              border: `3px solid ${C.accent}30`,
              borderTop: `3px solid ${C.accent}`,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <div style={{ fontSize: 12, color: C.sub }}>AI 분석 중…</div>
            {/* 시머 라인 */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.3) 50%, transparent 100%)`,
              animation: "shimmer-slide 1.2s ease infinite",
              width: "50%",
            }} />
          </div>
        )}
      </div>

      {/* ── AI 코치 메시지 카드 ── */}
      <CoachMessage currentCoach={currentCoach} countdown={countdown} />

    </div>
  );
}

// ── 코치 메시지 컴포넌트
function CoachMessage({ currentCoach, countdown }) {
  const isOk = currentCoach?.state === "ok";
  const isCoaching = currentCoach?.state === "coaching";

  if (countdown !== null) {
    return (
      <div style={{
        width: "100%",
        padding: "14px 16px",
        borderRadius: 14,
        background: `rgba(16,185,129,0.1)`,
        border: `1px solid ${C.green}40`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        animation: "fade-in 0.3s ease",
      }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: "50%",
          background: `${C.green}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}>✓</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>
            준비되셨습니다
          </div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
            촬영합니다…
          </div>
        </div>
      </div>
    );
  }

  if (!currentCoach) {
    return (
      <div style={{
        width: "100%",
        padding: "14px 16px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
        }}>📷</div>
        <div style={{ fontSize: 12, color: C.sub }}>
          카메라를 켜고 있습니다…
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: "100%",
      padding: "14px 16px",
      borderRadius: 14,
      background: isOk ? `rgba(16,185,129,0.1)` : `rgba(245,158,11,0.08)`,
      border: `1px solid ${isOk ? C.green : C.gold}40`,
      display: "flex",
      alignItems: "center",
      gap: 12,
      animation: "fade-in 0.3s ease",
      key: currentCoach.msg,
    }}>
      <div style={{
        width: 36, height: 36,
        borderRadius: "50%",
        background: isOk ? `${C.green}20` : `${C.gold}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        flexShrink: 0,
      }}>{currentCoach.icon}</div>
      <div>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: isOk ? C.green : C.gold,
          marginBottom: 2,
        }}>
          {isOk ? "AI 코치" : "AI 코치"}
        </div>
        <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
          {currentCoach.msg}
        </div>
      </div>

      {/* 진행 점 표시 */}
      {isCoaching && (
        <div style={{
          marginLeft: "auto",
          display: "flex",
          gap: 3,
          flexShrink: 0,
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 4, height: 4,
              borderRadius: "50%",
              background: C.gold,
              opacity: 0.6,
              animation: `breathe 1s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
// CAPTURED SCREEN (촬영 완료)
// ════════════════════════════════════════════
function CapturedScreen({ capturedImg, onRetake }) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", animation: "fade-in 0.5s ease" }}>

      {/* 완료 뱃지 */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 14px",
        borderRadius: 20,
        background: `${C.green}15`,
        border: `1px solid ${C.green}40`,
        marginBottom: 16,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: "0.08em" }}>
          촬영 완료
        </span>
      </div>

      {/* 촬영된 이미지 */}
      <div style={{
        width: 220,
        height: 275,
        borderRadius: 16,
        overflow: "hidden",
        border: `2px solid ${C.green}60`,
        marginBottom: 16,
        position: "relative",
        boxShadow: `0 0 40px ${C.greenGlow}`,
      }}>
        {capturedImg && capturedImg !== "placeholder" ? (
          <img
            src={capturedImg}
            alt="촬영된 사진"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(160deg, #1a2540, #0f172a)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}>
            <div style={{ fontSize: 48 }}>🙂</div>
            <div style={{ fontSize: 11, color: C.muted }}>촬영된 사진</div>
          </div>
        )}

        {/* 촬영 원본 라벨 */}
        <div style={{
          position: "absolute",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 10,
          color: "rgba(255,255,255,0.7)",
          background: "rgba(0,0,0,0.5)",
          padding: "2px 8px",
          borderRadius: 6,
          whiteSpace: "nowrap",
          backdropFilter: "blur(4px)",
        }}>촬영 원본</div>
      </div>

      {/* 상태 요약 */}
      <div style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${C.border}`,
        marginBottom: 20,
      }}>
        {[
          { label: "얼굴 정면", status: "✓", ok: true },
          { label: "눈썹·이마 노출", status: "✓", ok: true },
          { label: "고개 각도", status: "✓", ok: true },
          { label: "조명", status: "✓", ok: true },
        ].map((item, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "5px 0",
            borderBottom: i < 3 ? `1px solid ${C.border}` : "none",
          }}>
            <span style={{ fontSize: 12, color: C.sub }}>{item.label}</span>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: item.ok ? C.green : C.red,
            }}>{item.status}</span>
          </div>
        ))}
      </div>

      {/* 액션 버튼들 */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <button style={{
          width: "100%",
          padding: "15px 0",
          borderRadius: 14,
          border: "none",
          background: `linear-gradient(135deg, #8B5CF6, #7C3AED)`,
          color: "#fff",
          fontSize: 15,
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: `0 4px 20px ${C.accentGlow}`,
        }}>
          AI 리터칭 시작 — 10c
        </button>

        <button
          onClick={onRetake}
          style={{
            width: "100%",
            padding: "13px 0",
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            background: "transparent",
            color: C.sub,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}>
          다시 촬영하기
        </button>
      </div>
    </div>
  );
}
