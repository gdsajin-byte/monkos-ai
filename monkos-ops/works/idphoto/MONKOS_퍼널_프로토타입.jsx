import React, { useState, useEffect } from "react";

// MONKOS 촬영 퍼널 프로토타입 — 3페이지 + 충전 + 엔딩
// 현재 앱 다크 테마 기반, 모바일 390px 기준

const C = {
  bg: "#0A0E17",
  card: "#111827",
  cardHover: "#1A2235",
  border: "#1E293B",
  accent: "#8B5CF6",
  accentSoft: "rgba(139,92,246,0.12)",
  blue: "#3B82F6",
  blueSoft: "rgba(59,130,246,0.12)",
  gold: "#F59E0B",
  goldSoft: "rgba(245,158,11,0.10)",
  green: "#10B981",
  greenSoft: "rgba(16,185,129,0.10)",
  red: "#EF4444",
  redSoft: "rgba(239,68,68,0.10)",
  pink: "#EC4899",
  cyan: "#06B6D4",
  text: "#F1F5F9",
  sub: "#94A3B8",
  muted: "#64748B",
  dim: "#475569",
  white: "#FFFFFF",
};

const Phone = ({ children, title, sub, credit = 10, step, totalSteps, onChatbot }) => (
  <div style={{
    width: 370, minHeight: 700, borderRadius: 32,
    background: C.bg, border: `2px solid ${C.border}`,
    overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
    display: "flex", flexDirection: "column", position: "relative",
  }}>
    {/* Status */}
    <div style={{ padding: "10px 24px 0", display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted }}>
      <span style={{ fontWeight: 700 }}>9:41</span>
      <span style={{ letterSpacing: 1 }}>●●● ◗</span>
    </div>
    {/* Header */}
    <div style={{
      padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div onClick={onChatbot} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 900, color: "#fff",
          boxShadow: "0 0 12px rgba(139,92,246,0.3)",
        }}>M</div>
        <div>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>MONKOS</span>
          {sub && <div style={{ fontSize: 9, color: C.muted, marginTop: 0 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 10, color: C.accent, marginLeft: 2 }}>💬</span>
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
        borderRadius: 20, background: "linear-gradient(135deg, #1a1500, #2a2000)",
        border: "1px solid #F59E0B30",
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 11,
          background: "linear-gradient(135deg, #F59E0B, #D97706)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 8, fontWeight: 900, color: "#000",
        }}>Cr</div>
        <span style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>{credit}</span>
        <span style={{ fontSize: 10, color: C.gold }}>c</span>
      </div>
    </div>
    {/* Progress */}
    {step && (
      <div style={{ padding: "10px 20px 0", display: "flex", gap: 4, alignItems: "center" }}>
        {Array.from({ length: totalSteps || 3 }, (_, i) => (
          <div key={i} style={{
            height: 3, flex: i + 1 <= step ? 2 : 1, borderRadius: 2,
            background: i + 1 <= step ? C.accent : C.border,
            transition: "all 0.3s",
          }} />
        ))}
      </div>
    )}
    {/* Content */}
    <div style={{ flex: 1, overflow: "auto", padding: "0 0 20px" }}>
      {children}
    </div>
  </div>
);

const SelectCard = ({ icon, title, spec, desc, selected, onClick, disabled, badge, warn }) => (
  <div onClick={disabled ? undefined : onClick} style={{
    padding: "16px", borderRadius: 14,
    background: disabled ? `${C.card}60` : selected ? C.accentSoft : C.card,
    border: `1.5px solid ${disabled ? C.border : selected ? C.accent : C.border}`,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s", position: "relative",
  }}>
    {badge && (
      <span style={{
        position: "absolute", top: -8, right: 12, padding: "2px 8px",
        borderRadius: 6, fontSize: 9, fontWeight: 800,
        background: badge === "SOON" ? C.muted : C.accent, color: "#fff",
      }}>{badge}</span>
    )}
    <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 14, fontWeight: 700, color: disabled ? C.muted : C.text }}>{title}</div>
    {spec && (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6, marginTop: 4,
        padding: "3px 8px", borderRadius: 6,
        background: disabled ? "transparent" : `${C.cyan}12`, border: `1px solid ${disabled ? C.border : C.cyan}25`,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: disabled ? C.dim : C.cyan }}>{spec}</span>
      </div>
    )}
    {desc && <div style={{ fontSize: 11, color: disabled ? C.dim : C.sub, marginTop: 5, lineHeight: 1.4 }}>{desc}</div>}
    {warn && <div style={{ fontSize: 10, color: C.gold, marginTop: 4 }}>{warn}</div>}
  </div>
);

const ConfirmRow = ({ icon, label, value, onEdit }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 0", borderBottom: `1px solid ${C.border}`,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</span>
        {value && <span style={{ fontSize: 13, color: C.muted }}> {value}</span>}
      </div>
    </div>
    <span onClick={onEdit} style={{ fontSize: 12, color: C.accent, cursor: "pointer", fontWeight: 600 }}>수정</span>
  </div>
);

const HelpBubble = ({ items, visible }) => {
  if (!visible) return null;
  return (
    <div style={{
      margin: "0 20px 12px", padding: 14, borderRadius: 12,
      background: C.card, border: `1px solid ${C.accent}30`,
      fontSize: 12, color: C.sub, lineHeight: 1.7,
    }}>
      {items.map((item, i) => (
        <div key={i} style={{ marginBottom: i < items.length - 1 ? 4 : 0 }}>
          <span style={{ color: item.warn ? C.red : C.green, marginRight: 4 }}>
            {item.warn ? "⚠️" : "✅"}
          </span>
          {item.text}
        </div>
      ))}
    </div>
  );
};

// ── 챗봇 도우미 패널 ──
const ChatbotPanel = ({ visible, onClose, page, format, age }) => {
  if (!visible) return null;
  
  const getContextHelp = () => {
    if (page === "p1") return [
      { q: "여권이랑 신분증 차이가 뭐예요?", a: "여권은 3.5×4.5cm, 신분증(주민등록증·운전면허)은 3×4cm입니다. 규정은 동일하게 적용돼요." },
      { q: "비자 사진도 되나요?", a: "많은 국가의 비자가 여권 규격과 동일합니다. 별도 규격이 필요한 경우(미국·인도·중국 등) 몽크사진관으로 안내해 드릴게요." },
      { q: "증명사진은 뭐에 쓸 수 있어요?", a: "이력서, 학생증, 사원증, 원서접수 등 반명함(3×4) 규격이 필요한 모든 용도에 사용할 수 있어요." },
    ];
    if (page === "p2") return [
      { q: "아기 사진은 어떻게 찍어요?", a: "부모님이 무릎에 안고 아기가 정면을 바라볼 수 있도록 함께 셀카로 촬영하세요. 36개월 이하는 입을 벌려도 용인됩니다." },
      { q: "어린이 촬영 팁이 있나요?", a: "안정적인 분위기에서 헤어·의상을 챙겨주세요. 화려한 액세서리는 지양하고, 여권은 정면 응시가 중요합니다." },
      { q: "학생증은 교복을 입어야 하나요?", a: "네, 학생증용은 교복을 직접 입고 촬영해 주세요. 교복은 AI가 합성하지 않습니다." },
    ];
    if (page === "p3") return [
      { q: "의상을 바꿀 수 있나요?", a: "네, 수정 버튼을 눌러 캐주얼이나 정장으로 변경할 수 있어요. 그대로가 기본값입니다." },
      { q: "배경색은 바꿀 수 있나요?", a: format === "passport" ? "여권/신분증은 흰색 배경 고정입니다." : "증명사진은 흰색/회색/파랑/베이지 중 선택할 수 있어요." },
      { q: "헤어 보정은 어떻게 되나요?", a: "깔끔 정리(잔머리 정돈)와 올림머리 변환을 선택할 수 있어요. 기본은 촬영한 그대로입니다." },
    ];
    return [
      { q: "도움이 필요해요", a: "무엇이든 물어보세요! 촬영 가이드, 규격 안내, 결제 문의 모두 도와드릴게요." },
    ];
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 20,
      background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-end",
    }}>
      <div style={{
        width: "100%", maxHeight: "75%", borderRadius: "20px 20px 0 0",
        background: C.bg, border: `1px solid ${C.accent}30`,
        borderBottom: "none", overflow: "auto", padding: "16px 20px 24px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: "#fff",
            }}>M</div>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>MONKOS 도우미</span>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: C.muted, fontSize: 18, cursor: "pointer",
          }}>✕</button>
        </div>
        
        <div style={{ fontSize: 12, color: C.sub, marginBottom: 14 }}>
          자주 묻는 질문을 눌러보세요 💬
        </div>
        
        {getContextHelp().map((item, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{
              padding: "10px 14px", borderRadius: "12px 12px 12px 4px",
              background: C.accentSoft, border: `1px solid ${C.accent}20`,
              fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 6,
            }}>💬 {item.q}</div>
            <div style={{
              padding: "10px 14px", borderRadius: "12px 12px 4px 12px",
              background: C.card, border: `1px solid ${C.border}`,
              fontSize: 12, color: C.sub, lineHeight: 1.6, marginLeft: 20,
            }}>{item.a}</div>
          </div>
        ))}
        
        <div style={{
          marginTop: 14, padding: 12, borderRadius: 10, textAlign: "center",
          background: `${C.card}`, border: `1px dashed ${C.border}`,
        }}>
          <div style={{ fontSize: 11, color: C.muted }}>더 자세한 문의는</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#229ED9", marginTop: 4 }}>💬 텔레그램 CS 문의 →</div>
        </div>
      </div>
    </div>
  );
};

// ── 충전 화면 컴포넌트 ──
// ── 메인 ──
export default function MonkosFunnelPrototype() {
  const [page, setPage] = useState("p1");
  const [showHelp, setShowHelp] = useState(false);
  const [showCharge, setShowCharge] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [credit, setCredit] = useState(10);

  // 선택 상태
  const [format, setFormat] = useState(null);
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState(null);
  const [clothing, setClothing] = useState("default");
  const [clothingColor, setClothingColor] = useState(null);
  const [suitColor, setSuitColor] = useState("navy");
  const [shirtColor, setShirtColor] = useState("white");
  const [tieColor, setTieColor] = useState("navy");
  const [tiePattern, setTiePattern] = useState("solid");
  const [hair, setHair] = useState("default");
  const [bgColor, setBgColor] = useState("white");
  const [styleEdit, setStyleEdit] = useState(null); // null | "clothing" | "hair" | "bg"

  const goNext = (target) => {
    setShowHelp(false);
    setStyleEdit(null);
    setPage(target);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050810",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "32px 16px",
      fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
    }}>
      {/* 페이지 네비 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { id: "p1", label: "1p 규격" },
          { id: "p2", label: "2p 성별+연령" },
          { id: "p3", label: "3p 스타일" },
          { id: "p4", label: "4p CONFIRM" },
          { id: "charge", label: "충전" },
          { id: "preview", label: "프리뷰" },
          { id: "ending", label: "엔딩" },
        ].map(p => (
          <button key={p.id} onClick={() => { setPage(p.id); setShowHelp(false); setShowCharge(false); }} style={{
            padding: "6px 14px", borderRadius: 8, border: "none",
            background: page === p.id ? C.accent : C.card,
            color: page === p.id ? "#fff" : C.sub,
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>{p.label}</button>
        ))}
      </div>

      {/* ═══ 1p 규격 선택 ═══ */}
      {page === "p1" && (
        <Phone sub="촬영 준비" credit={credit} step={1} totalSteps={3} onChatbot={() => setShowChatbot(true)}>
          <div style={{ padding: "20px 20px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 6 }}>STEP 1</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: C.text, margin: "0 0 16px", lineHeight: 1.3 }}>
              규격을 선택해 주세요
            </h2>
          </div>

          <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <SelectCard
              icon="🛡️" title="여권 / 신분증"
              spec="3.5×4.5cm · 흰색 배경"
              desc="여권발급 · 운전면허 · 주민등록증 · 외국인등록증 등"
              warn="⚠️ 눈썹·이마 노출 필수 · 무표정 정면"
              selected={format === "passport"}
              onClick={() => setFormat("passport")}
              badge="발급 보장"
            />

            <SelectCard
              icon="📋" title="증명사진"
              spec="3×4cm 반명함 · 배경 컬러 선택 가능"
              desc="이력서 · 학생증 · 사원증 · 원서접수 등"
              warn="💡 용도에 맞는 의상(교복·군복 등) 착용 · 깔끔한 헤어 정돈"
              selected={format === "id"}
              onClick={() => setFormat("id")}
            />

            {/* 다른 규격 안내 → 몽크사진관 */}
            <div style={{
              padding: "12px 16px", borderRadius: 12,
              background: `${C.card}80`, border: `1px dashed ${C.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>비자 · SNS · 기타 규격</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>몽크사진관에서 상담해 드려요</div>
              </div>
              <div style={{
                padding: "6px 12px", borderRadius: 8,
                background: "#229ED915", border: "1px solid #229ED930",
                fontSize: 11, fontWeight: 700, color: "#229ED9",
              }}>Telegram →</div>
            </div>
          </div>

          {format && (
            <div style={{ padding: "12px 20px" }}>
              <button onClick={() => goNext("p2")} style={{
                width: "100%", padding: 16, borderRadius: 14, border: "none",
                background: C.accent, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>다음 →</button>
            </div>
          )}
        </Phone>
      )}

      {/* ═══ 2p 성별 + 연령 ═══ */}
      {page === "p2" && (
        <Phone sub="촬영 준비" credit={credit} step={2} totalSteps={3} onChatbot={() => setShowChatbot(true)}>
          <div style={{ padding: "20px 20px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 6 }}>STEP 2</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: C.text, margin: "0 0 16px", lineHeight: 1.3 }}>
              성별과 연령대를 선택해 주세요
            </h2>

            {/* 성별 */}
            <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 8 }}>성별</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              <SelectCard icon="👩" title="여성" selected={gender === "f"} onClick={() => setGender("f")} />
              <SelectCard icon="👨" title="남성" selected={gender === "m"} onClick={() => setGender("m")} />
            </div>

            {/* 연령 */}
            <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 8 }}>연령대</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <SelectCard
                icon="👶" title="영유아" desc="~36개월"
                warn="부모님이 안고 셀카 촬영"
                selected={age === "baby"} onClick={() => setAge("baby")}
              />
              <SelectCard
                icon="🧒" title="어린이" desc="4세~초등"
                warn="깔끔한 의상 · 정면 응시 유도"
                selected={age === "child"} onClick={() => setAge("child")}
              />
              <SelectCard
                icon="🎒" title="중고생" desc="교복 착용층"
                warn={format === "passport" ? "눈썹·이마 노출 · 무표정 정면" : "헤어·의상 정돈 · 좋은 인상의 표정"}
                selected={age === "teen"} onClick={() => setAge("teen")}
              />
              <SelectCard
                icon="🙂" title="성인" desc="일반"
                warn={format === "passport" ? "눈썹·이마 노출 · 무표정 정면" : "헤어·의상 정돈 · 좋은 인상의 표정"}
                selected={age === "adult"} onClick={() => setAge("adult")}
              />
            </div>
          </div>

          {gender && age && (
            <div style={{ padding: "16px 20px" }}>
              <button onClick={() => goNext("p3")} style={{
                width: "100%", padding: 16, borderRadius: 14, border: "none",
                background: C.accent, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>다음 →</button>
            </div>
          )}
        </Phone>
      )}

      {/* ═══ 3p 스타일 선택 ═══ */}
      {page === "p3" && (
        <Phone sub="촬영 준비" credit={credit} step={3} totalSteps={4} onChatbot={() => setShowChatbot(true)}>
          <div style={{ padding: "20px 20px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 6 }}>STEP 3</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: C.text, margin: "0 0 16px" }}>
              스타일을 선택해 주세요
            </h2>
          </div>

          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 8 }}>

            {/* 의상 */}
            <div style={{
              padding: "14px 16px", borderRadius: 12,
              background: C.card, border: `1px solid ${styleEdit === "clothing" ? C.accent : C.border}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: styleEdit === "clothing" ? 12 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>👔</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>의상</span>
                  <span style={{ fontSize: 12, color: C.muted }}>
                    {clothing === "default" ? "그대로" : clothing === "casual" ? `캐주얼 · ${clothingColor || "베이지"}` : clothing === "change" ? `의상변경 · ${clothingColor || ""}` : clothing === "suit" ? "정장" : "그대로"}
                  </span>
                </div>
                <span onClick={() => setStyleEdit(styleEdit === "clothing" ? null : "clothing")} style={{
                  fontSize: 12, color: C.accent, cursor: "pointer", fontWeight: 600,
                }}>{styleEdit === "clothing" ? "닫기" : "변경 >"}</span>
              </div>

              {styleEdit === "clothing" && (
                <div>
                  {/* 메인 선택 */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {(age === "baby" || age === "child" ? [
                      { id: "default", label: "그대로" },
                      { id: "change", label: "의상변경" },
                    ] : [
                      { id: "default", label: "그대로" },
                      { id: "casual", label: "캐주얼" },
                      { id: "suit", label: "정장" },
                    ]).map(opt => (
                      <button key={opt.id} onClick={() => { setClothing(opt.id); setClothingColor(null); }} style={{
                        padding: "8px 16px", borderRadius: 8, border: "none",
                        background: clothing === opt.id ? C.accent : `${C.border}80`,
                        color: clothing === opt.id ? "#fff" : C.sub,
                        fontSize: 12, fontWeight: 600, cursor: "pointer", flex: 1,
                      }}>{opt.label}</button>
                    ))}
                  </div>

                  {/* 아기용 컬러 */}
                  {(age === "baby" || age === "child") && clothing === "change" && (
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>컬러 선택</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {[
                          { id: "skyblue", label: "하늘색", color: "#87CEEB" },
                          { id: "pink", label: "핑크", color: "#FFB6C1" },
                          { id: "lemon", label: "레몬", color: "#FFFACD" },
                          { id: "green", label: "그린", color: "#90EE90" },
                        ].map(c => (
                          <button key={c.id} onClick={() => setClothingColor(c.id)} style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "6px 12px", borderRadius: 8, border: "none",
                            background: clothingColor === c.id ? `${C.accent}30` : C.bg,
                            border: `1.5px solid ${clothingColor === c.id ? C.accent : C.border}`,
                            cursor: "pointer",
                          }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, background: c.color }} />
                            <span style={{ fontSize: 11, color: C.sub }}>{c.label}</span>
                          </button>
                        ))}
                      </div>
                      {format === "passport" && (
                        <div style={{ fontSize: 10, color: C.red, marginTop: 6 }}>⚠️ 여권/신분증은 흰색 의상 불가</div>
                      )}
                    </div>
                  )}

                  {/* 캐주얼 컬러 */}
                  {(age === "teen" || age === "adult") && clothing === "casual" && (
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>컬러 선택</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {[
                          { id: "beige", label: "베이지", color: "#D2B48C" },
                          { id: "blue", label: "블루", color: "#4682B4" },
                          { id: "wine", label: "와인", color: "#722F37" },
                          { id: "green", label: "그린", color: "#2E8B57" },
                        ].map(c => (
                          <button key={c.id} onClick={() => setClothingColor(c.id)} style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "6px 12px", borderRadius: 8,
                            background: clothingColor === c.id ? `${C.accent}30` : C.bg,
                            border: `1.5px solid ${clothingColor === c.id ? C.accent : C.border}`,
                            cursor: "pointer",
                          }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, background: c.color }} />
                            <span style={{ fontSize: 11, color: C.sub }}>{c.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 정장 */}
                  {(age === "teen" || age === "adult") && clothing === "suit" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>🧥 수트</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {[
                            { id: "navy", label: "네이비", color: "#1B2A4A" },
                            { id: "brown", label: "브라운", color: "#6B4226" },
                            { id: "gray", label: "그레이", color: "#808080" },
                            { id: "black", label: "블랙", color: "#1A1A1A" },
                          ].map(c => (
                            <button key={c.id} onClick={() => setSuitColor(c.id)} style={{
                              display: "flex", alignItems: "center", gap: 4,
                              padding: "6px 10px", borderRadius: 8,
                              background: suitColor === c.id ? `${C.accent}30` : C.bg,
                              border: `1.5px solid ${suitColor === c.id ? C.accent : C.border}`,
                              cursor: "pointer",
                            }}>
                              <div style={{ width: 12, height: 12, borderRadius: 3, background: c.color, border: "1px solid #333" }} />
                              <span style={{ fontSize: 10, color: C.sub }}>{c.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>👔 셔츠</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {[
                            { id: "white", label: "화이트", color: "#FFFFFF" },
                            { id: "ltblue", label: "연블루", color: "#B0D4F1" },
                            { id: "ltpink", label: "연핑크", color: "#FFD1DC" },
                            { id: "ltbeige", label: "연베이지", color: "#F5DEB3" },
                          ].map(c => (
                            <button key={c.id} onClick={() => setShirtColor(c.id)} style={{
                              display: "flex", alignItems: "center", gap: 4,
                              padding: "6px 10px", borderRadius: 8,
                              background: shirtColor === c.id ? `${C.accent}30` : C.bg,
                              border: `1.5px solid ${shirtColor === c.id ? C.accent : C.border}`,
                              cursor: "pointer",
                            }}>
                              <div style={{ width: 12, height: 12, borderRadius: 3, background: c.color, border: "1px solid #444" }} />
                              <span style={{ fontSize: 10, color: C.sub }}>{c.label}</span>
                            </button>
                          ))}
                        </div>
                        {format === "passport" && shirtColor === "white" && (
                          <div style={{ fontSize: 10, color: C.red, marginTop: 4 }}>⚠️ 여권/신분증은 화이트 셔츠 불가</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>👔 타이</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                          {[
                            { id: "none", label: "노타이", color: null },
                            { id: "navy", label: "네이비", color: "#1B2A4A" },
                            { id: "wine", label: "와인", color: "#722F37" },
                            { id: "black", label: "블랙", color: "#1A1A1A" },
                          ].map(c => (
                            <button key={c.id} onClick={() => setTieColor(c.id)} style={{
                              display: "flex", alignItems: "center", gap: 4,
                              padding: "6px 10px", borderRadius: 8,
                              background: tieColor === c.id ? `${C.accent}30` : C.bg,
                              border: `1.5px solid ${tieColor === c.id ? C.accent : C.border}`,
                              cursor: "pointer",
                            }}>
                              {c.color ? <div style={{ width: 12, height: 12, borderRadius: 3, background: c.color, border: "1px solid #333" }} /> : null}
                              <span style={{ fontSize: 10, color: C.sub }}>{c.label}</span>
                            </button>
                          ))}
                          {tieColor !== "none" && <>
                          <span style={{ fontSize: 10, color: C.muted, margin: "0 4px" }}>·</span>
                          {[
                            { id: "solid", label: "민" },
                            { id: "stripe", label: "스트라이프" },
                          ].map(p => (
                            <button key={p.id} onClick={() => setTiePattern(p.id)} style={{
                              padding: "6px 10px", borderRadius: 8,
                              background: tiePattern === p.id ? `${C.accent}30` : C.bg,
                              border: `1.5px solid ${tiePattern === p.id ? C.accent : C.border}`,
                              color: C.sub, fontSize: 10, cursor: "pointer",
                            }}>{p.label}</button>
                          ))}
                          </>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 헤어 (중고생/성인만) */}
            {(age === "teen" || age === "adult") && (
              <div style={{
                padding: "14px 16px", borderRadius: 12,
                background: C.card, border: `1px solid ${styleEdit === "hair" ? C.accent : C.border}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: styleEdit === "hair" ? 12 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>💇</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>헤어</span>
                    <span style={{ fontSize: 12, color: C.muted }}>
                      {hair === "default" ? "그대로" : hair === "tidy" ? "깔끔 정리" : "올림머리"}
                    </span>
                  </div>
                  <span onClick={() => setStyleEdit(styleEdit === "hair" ? null : "hair")} style={{
                    fontSize: 12, color: C.accent, cursor: "pointer", fontWeight: 600,
                  }}>{styleEdit === "hair" ? "닫기" : "변경 >"}</span>
                </div>

                {styleEdit === "hair" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { id: "default", label: "그대로", desc: "촬영한 그대로" },
                      { id: "tidy", label: "깔끔 정리", desc: "잔머리 정돈" },
                      { id: "updo", label: "올림머리", desc: "올림 스타일" },
                    ].map(h => (
                      <button key={h.id} onClick={() => setHair(h.id)} style={{
                        flex: 1, padding: "10px 8px", borderRadius: 8, border: "none",
                        background: hair === h.id ? C.accent : `${C.border}80`,
                        color: hair === h.id ? "#fff" : C.sub,
                        fontSize: 11, fontWeight: 600, cursor: "pointer",
                        textAlign: "center",
                      }}>
                        <div>{h.label}</div>
                        <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{h.desc}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 배경 (증명사진만) */}
            {format === "id" && (
              <div style={{
                padding: "14px 16px", borderRadius: 12,
                background: C.card, border: `1px solid ${styleEdit === "bg" ? C.accent : C.border}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: styleEdit === "bg" ? 12 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>🎨</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>배경</span>
                    <span style={{ fontSize: 12, color: C.muted }}>
                      {bgColor === "white" ? "흰색" : bgColor === "gray" ? "회색" : bgColor === "blue" ? "파랑" : "베이지"}
                    </span>
                  </div>
                  <span onClick={() => setStyleEdit(styleEdit === "bg" ? null : "bg")} style={{
                    fontSize: 12, color: C.accent, cursor: "pointer", fontWeight: 600,
                  }}>{styleEdit === "bg" ? "닫기" : "변경 >"}</span>
                </div>

                {styleEdit === "bg" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { id: "white", label: "흰색", color: "#FFFFFF" },
                      { id: "gray", label: "회색", color: "#B0B0B0" },
                      { id: "blue", label: "파랑", color: "#4A90D9" },
                      { id: "beige", label: "베이지", color: "#F5DEB3" },
                    ].map(c => (
                      <button key={c.id} onClick={() => setBgColor(c.id)} style={{
                        flex: 1, padding: "10px 8px", borderRadius: 8,
                        background: bgColor === c.id ? `${C.accent}30` : C.bg,
                        border: `1.5px solid ${bgColor === c.id ? C.accent : C.border}`,
                        cursor: "pointer", textAlign: "center",
                      }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, background: c.color, margin: "0 auto 4px", border: "1px solid #444" }} />
                        <div style={{ fontSize: 10, color: C.sub }}>{c.label}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 여권 배경 고정 안내 */}
            {format === "passport" && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: `${C.gold}08`, border: `1px solid ${C.gold}20`,
                fontSize: 11, color: C.gold,
              }}>🎨 여권/신분증 배경은 흰색으로 고정됩니다</div>
            )}
          </div>

          <div style={{ padding: "16px 20px" }}>
            <button onClick={() => goNext("p4")} style={{
              width: "100%", padding: 16, borderRadius: 14, border: "none",
              background: C.accent, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}>다음 →</button>
          </div>
        </Phone>
      )}

      {/* ═══ 4p CONFIRM ═══ */}
      {page === "p4" && (
        <Phone sub="촬영 준비" credit={credit} step={4} totalSteps={4} onChatbot={() => setShowChatbot(true)}>
          <div style={{ padding: "20px 20px 0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 6 }}>CONFIRM</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: C.text, margin: "0 0 4px" }}>촬영 정보 확인</h2>
          </div>

          <div style={{ padding: "0 20px" }}>
            <ConfirmRow icon="📋" label={format === "passport" ? "여권 / 신분증" : "증명사진"} />
            <ConfirmRow icon={gender === "f" ? "👩" : "👨"} label={`${age === "baby" ? "영유아" : age === "child" ? "어린이" : age === "teen" ? "중고생" : "성인"} · ${gender === "f" ? "여성" : "남성"}`} />
            <ConfirmRow icon="👔" label="의상" value={clothing === "default" ? "그대로" : clothing === "casual" ? `캐주얼 · ${clothingColor || ""}` : clothing === "suit" ? "정장" : clothing === "change" ? `의상변경 · ${clothingColor || ""}` : "그대로"} />
            {(age === "teen" || age === "adult") && (
              <ConfirmRow icon="💇" label="헤어" value={hair === "default" ? "그대로" : hair === "tidy" ? "깔끔 정리" : "올림머리"} />
            )}
            {format === "id" && (
              <ConfirmRow icon="🎨" label="배경" value={bgColor === "white" ? "흰색 ⬜" : bgColor === "gray" ? "회색" : bgColor === "blue" ? "파랑" : "베이지"} />
            )}
          </div>

          {/* 코칭 멘트 */}
          <div style={{
            margin: "16px 20px", padding: "10px 14px", borderRadius: 10,
            background: C.accentSoft, border: `1px solid ${C.accent}25`,
            fontSize: 12, color: C.accent, textAlign: "center", fontWeight: 600,
          }}>
            {age === "baby" ? "아이를 안고 촬영해도 됩니다" :
             age === "child" ? "정면을 바라보도록 유도해 주세요" :
             format === "passport" ? "눈썹 · 이마가 보이도록 준비해 주세요" :
             "좋은 인상의 표정으로 촬영해 주세요"}
          </div>

          <div style={{ padding: "0 20px" }}>
            <button onClick={() => {
              if (credit >= 10) { setCredit(credit - 10); goNext("preview"); }
              else { goNext("charge"); }
            }} style={{
              width: "100%", padding: 16, borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
              color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
            }}>{credit >= 10 ? "촬영 시작하기 → (10c)" : "크레딧 부족 · 충전하기"}</button>
          </div>
        </Phone>
      )}

      {/* ═══ 충전 화면 ═══ */}
      {page === "charge" && (() => {
        const [smallQty, setSmallQtyLocal] = [1, () => {}]; // 소액은 메인에서 관리
        const products = [
          {
            id: "single", credits: 70, bonus: 10, total: 80,
            original: "10,150", price: "9,900", priceNum: 9900,
            realDiscount: "실질 14%",
            desc: "생성 + 다운로드 1회 충족",
            tag: "추천", tagBg: C.accent, tagColor: "#fff",
            bg: C.accentSoft, border: `${C.accent}50`,
          },
          {
            id: "pack2", credits: 140, bonus: 20, total: 160,
            original: "20,300", price: "18,900", priceNum: 18900,
            realDiscount: "실질 19%",
            desc: "2회 충족",
            tag: null, bg: C.card, border: C.border,
          },
          {
            id: "pack4", credits: 280, bonus: 60, total: 340,
            original: "40,600", price: "34,900", priceNum: 34900,
            realDiscount: "실질 29%",
            desc: "4회 충족 + 여유 20c",
            tag: "★BEST", tagBg: C.gold, tagColor: "#000",
            bg: C.goldSoft, border: `${C.gold}30`,
          },
        ];
        return (
        <Phone sub="크레딧 충전" credit={credit} onChatbot={() => setShowChatbot(true)}>
          <div style={{ padding: "16px 20px" }}>

            {/* 잔고 + 부족 안내 */}
            <div style={{
              padding: "12px 16px", borderRadius: 12, marginBottom: 12,
              background: C.card, border: `1px solid ${C.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted }}>내 크레딧</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.gold }}>{credit}c</div>
              </div>
              {credit < 80 && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: C.red }}>부족</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.red }}>{80 - credit}c</div>
                </div>
              )}
            </div>

            {/* 기축 안내 */}
            <div style={{
              padding: "8px 12px", borderRadius: 8, marginBottom: 16,
              background: `${C.gold}08`, border: `1px solid ${C.gold}15`,
            }}>
              <span style={{ fontSize: 11, color: C.gold }}>
                💡 10c = $1 (≈₩1,450) · 생성 10c · 다운로드 70c · <b>1회 = 80c</b>
              </span>
            </div>

            {/* 상품 카드 */}
            {products.map(p => (
              <div key={p.id} onClick={() => { setCredit(credit + p.total); goNext("preview"); }} style={{
                padding: "14px 16px", borderRadius: 14, marginBottom: 8,
                background: p.bg, border: `1.5px solid ${p.border}`,
                cursor: "pointer", position: "relative",
              }}>
                {p.tag && (
                  <span style={{
                    position: "absolute", top: -8, right: 12, padding: "2px 10px",
                    borderRadius: 6, fontSize: 9, fontWeight: 800,
                    background: p.tagBg, color: p.tagColor,
                  }}>{p.tag}</span>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: C.text }}>{p.credits}c</span>
                    <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>+{p.bonus}c</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{
                      textDecoration: "line-through", textDecorationColor: C.red,
                      color: C.muted, fontSize: 11,
                    }}>₩{p.original}</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: C.gold }}>₩{p.price}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: C.sub }}>
                    총 <span style={{ color: C.green, fontWeight: 700 }}>{p.total}c</span> · {p.desc}
                  </span>
                  <span style={{
                    fontSize: 10, padding: "2px 6px", borderRadius: 4,
                    background: `${C.green}15`, color: C.green, fontWeight: 700,
                  }}>{p.realDiscount}</span>
                </div>

                <div style={{
                  marginTop: 6, padding: "3px 8px", borderRadius: 6,
                  background: `${C.accent}08`, display: "inline-block",
                }}>
                  <span style={{ fontSize: 10, color: C.muted }}>
                    장당 ₩{Math.round(p.priceNum / (p.total / 80)).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}

            {/* 소액 충전 */}
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, margin: "12px 0 8px", textAlign: "center" }}>
              소액 충전 (10c 단위 · 보너스 없음)
            </div>
            <div style={{
              padding: "12px 16px", borderRadius: 14,
              background: C.card, border: `1px solid ${C.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 12, color: C.sub }}>10c = ₩1,450</span>
              <button onClick={() => { setCredit(credit + 10); }} style={{
                padding: "8px 16px", borderRadius: 8, border: "none",
                background: C.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>+10c 충전</button>
            </div>

            {/* 결제 수단 안내 */}
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <span style={{ fontSize: 10, color: C.muted }}>토스페이먼츠 · 카카오페이 · 네이버페이</span>
            </div>

            {/* 닫기 */}
            <button onClick={() => goNext("p4")} style={{
              width: "100%", padding: 12, marginTop: 12, borderRadius: 14,
              border: `1px solid ${C.border}`, background: "transparent",
              color: C.muted, fontSize: 13, cursor: "pointer",
            }}>돌아가기</button>
          </div>
        </Phone>
        );
      })()}

      {/* ═══ 프리뷰 ═══ */}
      {page === "preview" && (
        <Phone sub="AI 생성 완료" credit={credit} onChatbot={() => setShowChatbot(true)}>
          <div style={{ padding: "20px" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 4, animation: "pulse 2s infinite" }}>✨</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 6, letterSpacing: "0.1em" }}>COMPLETE</div>
              <h2 style={{
                fontSize: 18, fontWeight: 900, color: C.text, margin: 0,
                background: "linear-gradient(135deg, #F1F5F9, #E2E8F0, #F1F5F9)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                고객님의 증명사진이<br />완성되었습니다
              </h2>
              <style>{`@keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.7; transform:scale(1.1); } }`}</style>
            </div>

            {/* 전후 비교 (워터마크) */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2,
              borderRadius: 16, overflow: "hidden", marginBottom: 12,
              border: `1px solid ${C.border}`,
            }}>
              <div style={{
                height: 180, background: "linear-gradient(135deg, #1a1a2e, #16213e)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                <div style={{ fontSize: 36, opacity: 0.5 }}>🤳</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>BEFORE</div>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(139,92,246,0.03) 10px, rgba(139,92,246,0.03) 20px)",
                }} />
              </div>
              <div style={{
                height: 180, background: "linear-gradient(135deg, #0f172a, #1e293b)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                <div style={{ fontSize: 36 }}>🧑‍💼</div>
                <div style={{ fontSize: 10, color: C.accent, marginTop: 4 }}>AFTER</div>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(139,92,246,0.03) 10px, rgba(139,92,246,0.03) 20px)",
                }} />
                <div style={{ position: "absolute", top: 8, right: 8, fontSize: 8, color: C.accent, opacity: 0.4, fontWeight: 700 }}>WATERMARK</div>
              </div>
            </div>

            {/* 규격 완성본 디스플레이 */}
            <div style={{
              padding: 16, borderRadius: 14, marginBottom: 16,
              background: C.card, border: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 64, height: 80, borderRadius: 8, flexShrink: 0,
                background: "linear-gradient(135deg, #f0f0f0, #e0e0e0)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid #fff",
              }}>
                <span style={{ fontSize: 28 }}>🧑‍💼</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                  {format === "passport" ? "여권 / 신분증" : "증명사진"}
                </div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                  {format === "passport" ? "3.5×4.5cm · 흰색 배경" : `3×4cm · ${bgColor === "white" ? "흰색" : bgColor === "gray" ? "회색" : bgColor === "blue" ? "파랑" : "베이지"} 배경`}
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                  {clothing === "default" ? "의상 그대로" : clothing === "suit" ? "정장" : clothing === "casual" ? "캐주얼" : "의상변경"} · {hair === "default" ? "헤어 그대로" : hair === "tidy" ? "깔끔정리" : "올림머리"}
                </div>
              </div>
            </div>

            {/* 다운로드 버튼 */}
            {credit >= 70 ? (
              <button onClick={() => { setCredit(credit - 70); goNext("ending"); }} style={{
                width: "100%", padding: 16, borderRadius: 14, border: "none",
                background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>📥 워터마크 없는 증명사진 다운로드 — 70c</button>
            ) : (
              <div>
                {/* 비활성 다운로드 */}
                <button disabled style={{
                  width: "100%", padding: 16, borderRadius: 14, border: "none",
                  background: C.border, color: C.muted,
                  fontSize: 15, fontWeight: 700, cursor: "default",
                }}>📥 워터마크 없는 증명사진 다운로드 — 70c</button>

                {/* 부족 안내 */}
                <div style={{
                  margin: "12px 0", padding: "12px 16px", borderRadius: 12,
                  background: `${C.red}08`, border: `1px solid ${C.red}20`,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.red }}>
                    크레딧이 부족합니다
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
                    현재 <span style={{ color: C.gold, fontWeight: 700 }}>{credit}c</span> / 필요 <span style={{ color: C.red, fontWeight: 700 }}>70c</span>
                  </div>
                </div>

                {/* 충전 바로가기 */}
                <button onClick={() => goNext("charge")} style={{
                  width: "100%", padding: 14, borderRadius: 14, border: "none",
                  background: C.gold, color: "#000",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>충전하러 가기 →</button>
              </div>
            )}
          </div>
        </Phone>
      )}

      {/* ═══ 엔딩 페이지 ═══ */}
      {page === "ending" && (
        <Phone sub="완료" credit={credit} onChatbot={() => setShowChatbot(true)}>
          <div style={{ padding: "16px 20px" }}>

            {/* 셀레브레이션 */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 6, animation: "pulse 2s infinite" }}>🎉</div>
              <h2 style={{
                fontSize: 18, fontWeight: 900, margin: "0 0 4px",
                background: "linear-gradient(135deg, #F1F5F9, #E2E8F0, #F1F5F9)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>증명사진이 완성되었습니다!</h2>
              <p style={{ fontSize: 12, color: C.sub, margin: 0 }}>
                아래에서 다운로드해 주세요
              </p>
              <style>{`@keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.8; transform:scale(1.08); } }`}</style>
            </div>

            {/* 완성본 */}
            <div style={{
              height: 220, borderRadius: 16, marginBottom: 12,
              background: "linear-gradient(135deg, #f0f0f0, #e8e8e8)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              border: "3px solid #fff",
            }}>
              <div style={{ fontSize: 64 }}>🧑‍💼</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4, fontWeight: 600 }}>
                {format === "passport" ? "여권 규격 35×45mm" : "증명사진 3×4cm 반명함"}
              </div>
            </div>

            {/* 다운로드 */}
            <button style={{
              width: "100%", padding: 14, borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
              color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: "pointer", marginBottom: 8,
            }}>📥 다운로드</button>

            {/* 전후컷 썸네일 + 저장 */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: 12, borderRadius: 12, marginBottom: 16,
              background: C.card, border: `1px solid ${C.border}`,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 8, flexShrink: 0,
                background: "linear-gradient(135deg, #1a1a2e, #1e293b)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 9, color: C.muted }}>B → A</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>📸 전후 비교 저장</div>
                <div style={{ fontSize: 10, color: C.muted }}>갤러리에 저장 · 무료</div>
              </div>
              <div style={{
                padding: "6px 12px", borderRadius: 8,
                background: C.greenSoft, border: `1px solid ${C.green}30`,
                fontSize: 11, fontWeight: 700, color: C.green,
              }}>저장</div>
            </div>

            {/* 구분선 */}
            <div style={{ height: 1, background: C.border, margin: "0 0 16px" }} />

            {/* 잔고 */}
            <div style={{
              padding: "10px 16px", borderRadius: 10, marginBottom: 12,
              background: C.card, display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 12, color: C.sub }}>내 크레딧</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.gold }}>{credit}c</span>
            </div>

            {/* 업셀 옵션 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              <div onClick={() => {}} style={{
                padding: "14px 16px", borderRadius: 12,
                background: C.card, border: `1px solid ${C.border}`,
                cursor: "pointer",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>📸 풀샷 원본 받기</div>
                    <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>크롭되지 않은 풀 원본 사진</div>
                  </div>
                  <div style={{
                    padding: "6px 14px", borderRadius: 8,
                    background: C.accentSoft, border: `1px solid ${C.accent}40`,
                    fontSize: 13, fontWeight: 800, color: C.accent,
                  }}>20c</div>
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>눌러서 미리보기 → 다운로드</div>
              </div>

              <div style={{
                padding: "14px 16px", borderRadius: 12,
                background: `${C.card}80`, border: `1px dashed ${C.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>🖨️ 인화 서비스 · CS</div>
                  <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>몽크사진관 공식 채널</div>
                </div>
                <div style={{
                  padding: "6px 12px", borderRadius: 8,
                  background: "#229ED915", border: "1px solid #229ED930",
                  fontSize: 11, fontWeight: 700, color: "#229ED9",
                }}>Telegram →</div>
              </div>
            </div>

            {/* SNS 이벤트 */}
            <div style={{
              padding: "14px 16px", borderRadius: 14,
              background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(236,72,153,0.08))",
              border: `1px solid ${C.gold}25`, marginBottom: 16,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>🎉 SNS 인증 이벤트</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>전후 비교를 SNS에 올리고 인증하면</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.gold }}>100c</div>
              </div>
            </div>

            {/* 발급 보장 — 최하단 */}
            <div style={{
              padding: "14px 16px", borderRadius: 12, marginBottom: 16,
              background: C.greenSoft, border: `1px solid ${C.green}20`,
              textAlign: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>🛡️</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.green }}>발급 보장</span>
              </div>
              <div style={{ fontSize: 11, color: C.sub, marginBottom: 8 }}>
                반려 시 100c를 지급해 드립니다
              </div>
              <button style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: "#229ED9", color: "#fff",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}>반려되셨다면 여기를 눌러주세요 →</button>
            </div>

            {/* 홈으로 */}
            <button onClick={() => { setPage("p1"); setFormat(null); setGender(null); setAge(null); setClothing("default"); setClothingColor(null); setSuitColor("navy"); setShirtColor("white"); setTieColor("navy"); setTiePattern("solid"); setHair("default"); setBgColor("white"); setStyleEdit(null); setCredit(10); }} style={{
              width: "100%", padding: 14, borderRadius: 14,
              border: `1px solid ${C.border}`, background: "transparent",
              color: C.sub, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>홈으로 돌아가기</button>
          </div>
        </Phone>
      )}

      {/* ═══ 챗봇 도우미 오버레이 ═══ */}
      {showChatbot && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 370, maxHeight: 600, borderRadius: 24,
            background: C.bg, border: `1px solid ${C.accent}30`,
            overflow: "hidden", boxShadow: "0 24px 80px rgba(139,92,246,0.2)",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{
              padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 900, color: "#fff",
                }}>M</div>
                <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>MONKOS 도우미</span>
              </div>
              <button onClick={() => setShowChatbot(false)} style={{
                background: "none", border: "none", color: C.muted, fontSize: 18, cursor: "pointer",
              }}>✕</button>
            </div>
            
            <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 14 }}>
                현재 화면에 맞는 도움말이에요 💬
              </div>
              
              {(page === "p1" ? [
                { q: "여권이랑 신분증 차이가 뭐예요?", a: "여권은 3.5×4.5cm, 신분증(주민등록증·운전면허)은 3×4cm입니다. 규정은 동일하게 적용돼요." },
                { q: "비자 사진도 되나요?", a: "많은 국가의 비자가 여권 규격과 동일합니다. 별도 규격(미국·인도·중국 등)은 몽크사진관으로 안내해 드려요." },
                { q: "증명사진은 뭐에 쓸 수 있어요?", a: "이력서, 학생증, 사원증, 원서접수 등 반명함(3×4) 규격이 필요한 모든 용도에 사용 가능해요." },
              ] : page === "p2" ? [
                { q: "아기 사진은 어떻게 찍어요?", a: "부모님이 무릎에 안고 아기가 정면을 바라보도록 함께 셀카로 촬영하세요. 36개월 이하는 입을 벌려도 용인됩니다." },
                { q: "어린이 촬영 팁이 있나요?", a: "안정적인 분위기에서 헤어·의상을 챙겨주세요. 화려한 액세서리는 지양하고, 여권은 정면 응시가 중요합니다." },
                { q: "학생증은 교복을 입어야 하나요?", a: "네, 학생증용은 교복을 직접 입고 촬영해 주세요. 교복은 AI가 합성하지 않습니다." },
              ] : page === "p3" ? [
                { q: "의상을 바꿀 수 있나요?", a: "수정 버튼을 눌러 캐주얼이나 정장으로 변경할 수 있어요. 기본값은 촬영한 그대로입니다." },
                { q: "배경색은 바꿀 수 있나요?", a: format === "passport" ? "여권/신분증은 흰색 배경 고정입니다." : "증명사진은 흰색/회색/파랑/베이지 중 선택 가능해요." },
                { q: "헤어 보정은 어떻게 되나요?", a: "깔끔 정리(잔머리 정돈), 올림머리 변환을 선택할 수 있어요. 기본은 그대로입니다." },
              ] : page === "preview" ? [
                { q: "워터마크는 왜 있어요?", a: "미리보기용입니다. 다운로드하시면 깨끗한 원본을 받을 수 있어요." },
                { q: "마음에 안 들면 다시 찍을 수 있나요?", a: "생성 크레딧(10c)으로 다시 촬영·생성할 수 있어요." },
              ] : page === "ending" ? [
                { q: "발급 보장이 뭐예요?", a: "여권사진이 반려되면 텔레그램 CS를 통해 인증 후 100c를 지급해 드립니다." },
                { q: "전후 비교 사진은 어디에 쓰나요?", a: "SNS에 올리고 인증하면 100c를 받을 수 있어요! 무료로 저장하세요." },
                { q: "다른 규격이 필요해요", a: "다른 규격 추가(10c)로 반명함, 비자 등으로 크롭 변환할 수 있어요." },
              ] : [
                { q: "도움이 필요해요", a: "무엇이든 물어보세요! 촬영 가이드, 규격 안내, 결제 문의 모두 도와드릴게요." },
              ]).map((item, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{
                    padding: "10px 14px", borderRadius: "12px 12px 12px 4px",
                    background: C.accentSoft, border: `1px solid ${C.accent}20`,
                    fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 6,
                  }}>💬 {item.q}</div>
                  <div style={{
                    padding: "10px 14px", borderRadius: "12px 12px 4px 12px",
                    background: C.card, border: `1px solid ${C.border}`,
                    fontSize: 12, color: C.sub, lineHeight: 1.6, marginLeft: 20,
                  }}>{item.a}</div>
                </div>
              ))}
              
              <div style={{
                marginTop: 14, padding: 12, borderRadius: 10, textAlign: "center",
                background: C.card, border: `1px dashed ${C.border}`,
              }}>
                <div style={{ fontSize: 11, color: C.muted }}>더 자세한 문의는</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#229ED9", marginTop: 4 }}>💬 텔레그램 CS 문의 →</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
