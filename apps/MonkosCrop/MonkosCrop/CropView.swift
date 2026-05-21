import SwiftUI
import Combine

// MARK: - V1TopBar

struct V1TopBar: View {
    let lang: String
    let step: Int
    let onStep: (Int) -> Void
    var onHome: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Button {
                    onHome?()
                } label: {
                    HStack(spacing: 6) {
                        Text("ID")
                            .font(.system(size: 16, weight: .black))
                            .foregroundStyle(V1.text)
                        Text("PASS")
                            .font(.system(size: 16, weight: .black))
                            .foregroundStyle(V1.accent)
                    }
                }
                Spacer()
                Text("FREE")
                    .font(.system(size: 9, weight: .heavy, design: .monospaced))
                    .foregroundStyle(V1.accent)
                    .tracking(1.2)
                    .padding(.horizontal, 7).padding(.vertical, 3)
                    .background(V1.accent.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 3))
            }

            HStack(spacing: 5) {
                ForEach(stepLabels, id: \.id) { s in
                    let active = step >= s.id
                    VStack(spacing: 5) {
                        RoundedRectangle(cornerRadius: 1)
                            .fill(active ? V1.accent : V1.border)
                            .frame(height: 2)
                        Text(s.names[lang] ?? s.names["en"] ?? "")
                            .font(.system(size: 8, weight: .bold, design: .monospaced))
                            .foregroundStyle(active ? V1.accent : V1.dim)
                            .tracking(1)
                    }
                    .contentShape(Rectangle())
                    .onTapGesture { onStep(s.id) }
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 8).padding(.bottom, 10)
    }
}

// MARK: - SpecBadge

struct SpecBadge: View {
    let country: Country
    let doc: DocSpec
    let lang: String

    var body: some View {
        HStack(spacing: 6) {
            Text(country.flag).font(.system(size: 12))
            Text("\(country.name(lang)) · \(doc.name(lang))")
                .font(.system(size: 10, design: .monospaced))
            Text(doc.size.replacingOccurrences(of: " mm", with: ""))
                .font(.system(size: 9, design: .monospaced))
                .opacity(0.6)
        }
        .foregroundStyle(V1.accent)
        .padding(.horizontal, 9).padding(.vertical, 4)
        .background(V1.accent.opacity(0.08))
        .overlay(Capsule().stroke(V1.accent.opacity(0.3), lineWidth: 1))
        .clipShape(Capsule())
    }
}

// MARK: - MetricBox

enum Signal { case neutral, pass, warn, fail
    var color: Color {
        switch self {
        case .neutral: return V1.accent
        case .pass: return Color(hex: "00D4AA")
        case .warn: return Color(hex: "FFB020")
        case .fail: return Color(hex: "E74C3C")
        }
    }
}

struct MetricBox: View {
    let label: String
    let value: String
    let unit: String
    let active: Bool
    var signal: Signal = .neutral

    var body: some View {
        let c = active ? signal.color : V1.dim
        VStack(spacing: 1) {
            Text(label.uppercased())
                .font(.system(size: 8, weight: .bold, design: .monospaced))
                .foregroundStyle(V1.muted)
            HStack(spacing: 1) {
                Text(active ? value : "—")
                    .font(.system(size: 13, weight: .heavy, design: .monospaced))
                if active {
                    Text(unit)
                        .font(.system(size: 8, weight: .semibold, design: .monospaced))
                }
            }
            .foregroundStyle(c)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 7)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(active ? V1.card : Color(hex: "0A0F18"))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(active ? c.opacity(0.3) : V1.border, lineWidth: 1)
        )
    }
}

// MARK: - CornerBrackets

struct CornerBrackets: View {
    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let s: CGFloat = 16
            let m: CGFloat = 6
            Path { p in
                p.move(to: CGPoint(x: m, y: m + s))
                p.addLine(to: CGPoint(x: m, y: m))
                p.addLine(to: CGPoint(x: m + s, y: m))

                p.move(to: CGPoint(x: w - m - s, y: m))
                p.addLine(to: CGPoint(x: w - m, y: m))
                p.addLine(to: CGPoint(x: w - m, y: m + s))

                p.move(to: CGPoint(x: m, y: h - m - s))
                p.addLine(to: CGPoint(x: m, y: h - m))
                p.addLine(to: CGPoint(x: m + s, y: h - m))

                p.move(to: CGPoint(x: w - m - s, y: h - m))
                p.addLine(to: CGPoint(x: w - m, y: h - m))
                p.addLine(to: CGPoint(x: w - m, y: h - m - s))
            }
            .stroke(V1.accent, lineWidth: 2)
        }
    }
}

// MARK: - FaceLandmarksOverlay (흰색 가로선 3개 + 꺽은선 라벨)

struct FaceLandmarksOverlay: View {
    let phase: Int
    var faceResult: FaceDetectionResult? = nil
    var cropX: CGFloat = 0
    var cropY: CGFloat = 0
    var cropW: CGFloat = 1
    var cropH: CGFloat = 1
    @Binding var crownAdjust: CGFloat
    @State private var dragStart: CGFloat = 0

    private func toViewY(_ origY: CGFloat, vh: CGFloat) -> CGFloat {
        (origY - cropY) / cropH * vh
    }

    var body: some View {
        GeometryReader { geo in
            let vw = geo.size.width
            let vh = geo.size.height

            if let f = faceResult {
                let eyeY = toViewY(f.eyeCenterY, vh: vh)
                let chinY = toViewY(f.chinY, vh: vh)
                let eyeToChin = chinY - eyeY
                let crownY = (eyeY - eyeToChin) + crownAdjust * vh

                ZStack {
                    // Phase 2: EYE 라인
                    if phase >= 2 {
                        GuideLineShape(y: eyeY, vw: vw, labelSide: .right, hookUp: true)
                            .stroke(.white.opacity(0.85), lineWidth: 0.8)
                        Text("EYE")
                            .font(.system(size: 8, weight: .bold, design: .monospaced))
                            .foregroundStyle(.white.opacity(0.7))
                            .position(x: vw - 28, y: eyeY - 18)
                    }

                    // Phase 4+: CROWN 라인
                    if phase >= 4 {
                        let crownColor: Color = phase >= 6 ? .white.opacity(0.85) : Color(hex: "FFB020")
                        let crownStyle = phase >= 6
                            ? StrokeStyle(lineWidth: 0.8)
                            : StrokeStyle(lineWidth: 0.8, dash: [4, 3])
                        GuideLineShape(y: crownY, vw: vw, labelSide: .left, hookUp: true)
                            .stroke(crownColor, style: crownStyle)
                        Text("CROWN")
                            .font(.system(size: 8, weight: .bold, design: .monospaced))
                            .foregroundStyle(crownColor)
                            .position(x: 38, y: crownY - 18)
                    }

                    // Phase 5: 정수리 드래그 핸들 (확인 대기 중에만)
                    if phase == 5 {
                        Circle()
                            .fill(V1.accent)
                            .frame(width: 16, height: 16)
                            .overlay(
                                VStack(spacing: 1) {
                                    Image(systemName: "chevron.up").font(.system(size: 5, weight: .bold))
                                    Image(systemName: "chevron.down").font(.system(size: 5, weight: .bold))
                                }
                                .foregroundStyle(Color(hex: "05080E"))
                            )
                            .position(x: vw - 18, y: crownY)
                            .gesture(
                                DragGesture()
                                    .onChanged { v in
                                        let raw = dragStart + v.translation.height / vh
                                        crownAdjust = max(-0.12, min(0.12, raw))
                                    }
                                    .onEnded { _ in dragStart = crownAdjust }
                            )
                    }

                    // Phase 5: CHIN 라인
                    if phase >= 5 {
                        GuideLineShape(y: chinY, vw: vw, labelSide: .left, hookUp: false)
                            .stroke(.white.opacity(0.85), lineWidth: 0.8)
                        Text("CHIN")
                            .font(.system(size: 8, weight: .bold, design: .monospaced))
                            .foregroundStyle(.white.opacity(0.7))
                            .position(x: 30, y: chinY + 18)
                    }
                }
                .animation(.easeOut(duration: 0.3), value: phase)
            }
        }
    }
}

// 가로선 + 끝에 꺽은선
private struct GuideLineShape: Shape {
    let y: CGFloat
    let vw: CGFloat
    let labelSide: LabelSide
    let hookUp: Bool
    enum LabelSide { case left, right }

    func path(in rect: CGRect) -> Path {
        let margin: CGFloat = 10
        let hookLen: CGFloat = 12

        var p = Path()
        // 메인 가로선
        p.move(to: CGPoint(x: margin, y: y))
        p.addLine(to: CGPoint(x: vw - margin, y: y))

        // 꺽은선 (라벨 쪽)
        let hookX = labelSide == .left ? margin : vw - margin
        let hookY = hookUp ? y - hookLen : y + hookLen
        p.move(to: CGPoint(x: hookX, y: y))
        p.addLine(to: CGPoint(x: hookX, y: hookY))

        return p
    }
}

// MARK: - PhaseToast

struct PhaseToast: View {
    let phase: Int
    let lang: String

    var body: some View {
        if let texts = phaseToasts[phase],
           let text = texts[lang] ?? texts["ko"] {
            Text(text)
                .font(.system(size: 11, weight: .bold, design: .monospaced))
                .foregroundStyle(V1.accent)
                .shadow(color: V1.accent.opacity(0.5), radius: 10)
                .shadow(color: .black.opacity(0.9), radius: 4, y: 1)
                .transition(.opacity.combined(with: .scale(scale: 0.95)))
                .id(phase)
        }
    }
}

// MARK: - VerifiedStamp

struct VerifiedStamp: View {
    var size: CGFloat = 130

    var body: some View {
        ZStack {
            Circle()
                .fill(.ultraThinMaterial)
                .frame(width: size, height: size)
            Circle()
                .stroke(V1.accent, lineWidth: 3)
                .frame(width: size, height: size)
                .shadow(color: V1.accent.opacity(0.3), radius: 15)
            VStack(spacing: 2) {
                Text("IDPASS")
                    .font(.system(size: size * 0.10, weight: .black))
                    .tracking(2)
                Text("VERIFIED")
                    .font(.system(size: size * 0.06, weight: .bold, design: .monospaced))
                    .tracking(1)
                Text("✓")
                    .font(.system(size: size * 0.20))
            }
            .foregroundStyle(V1.accent)
        }
        .rotationEffect(.degrees(-12))
        .transition(.scale(scale: 0.4).combined(with: .opacity))
    }
}

// MARK: - BundleImage

struct BundleImage: View {
    let name: String

    var body: some View {
        #if canImport(UIKit)
        if let path = Bundle.main.path(forResource: name, ofType: "jpg") ?? Bundle.main.path(forResource: name, ofType: "png"),
           let img = UIImage(contentsOfFile: path) {
            Image(uiImage: img).resizable().aspectRatio(contentMode: .fill)
        } else {
            Color(hex: "1A1A2A")
        }
        #else
        if let url = Bundle.module.url(forResource: name, withExtension: "jpg") ?? Bundle.module.url(forResource: name, withExtension: "png"),
           let img = NSImage(contentsOf: url) {
            Image(nsImage: img).resizable().aspectRatio(contentMode: .fill)
        } else {
            Color(hex: "1A1A2A")
        }
        #endif
    }
}

// MARK: - BackButton

struct BackButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text("‹")
                .font(.system(size: 18, weight: .medium))
                .foregroundStyle(V1.muted)
                .frame(width: 28, height: 28)
                .background(RoundedRectangle(cornerRadius: 7).fill(V1.card))
                .overlay(RoundedRectangle(cornerRadius: 7).stroke(V1.border, lineWidth: 1))
        }
    }
}

// MARK: - AccentButton

struct AccentButton: View {
    let title: String
    var enabled: Bool = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14, weight: .heavy))
                .foregroundStyle(enabled ? Color(hex: "05080E") : V1.dim)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(enabled ? V1.accent : V1.border)
                )
                .shadow(color: enabled ? V1.accent.opacity(0.25) : .clear, radius: 10)
        }
        .disabled(!enabled)
    }
}

// MARK: - GuideOverlay (웹 crop.js SVG 오버레이 이식)

struct GuideOverlay: View {
    @Binding var state: CropState
    let metrics: CropMetrics
    let spec: PhotoSpec
    @State private var crownDragBase: CGFloat? = nil

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width, h = geo.size.height
            let eyeY = (state.leftPupil.y + state.rightPupil.y) / 2
            let cColor: Color = metrics.centerSignal == .pass ? .green.opacity(0.4) :
                metrics.centerSignal == .warn ? .yellow.opacity(0.6) : .red.opacity(0.6)

            Canvas { ctx, _ in
                ctx.fill(Path(CGRect(x: 0, y: 0, width: w, height: max(0, state.crown.y))),
                         with: .color(.black.opacity(0.35)))
                ctx.fill(Path(CGRect(x: 0, y: state.chin.y, width: w, height: max(0, h - state.chin.y))),
                         with: .color(.black.opacity(0.35)))

                var cp = Path(); cp.move(to: CGPoint(x: 0, y: state.crown.y)); cp.addLine(to: CGPoint(x: w, y: state.crown.y))
                ctx.stroke(cp, with: .color(metrics.faceSignal.color), lineWidth: 1)

                var chp = Path(); chp.move(to: CGPoint(x: 0, y: state.chin.y)); chp.addLine(to: CGPoint(x: w, y: state.chin.y))
                ctx.stroke(chp, with: .color(.white.opacity(0.5)), lineWidth: 0.8)

                var ep = Path(); ep.move(to: CGPoint(x: 10, y: eyeY)); ep.addLine(to: CGPoint(x: w - 10, y: eyeY))
                ctx.stroke(ep, with: .color(metrics.eyeSignal.color), lineWidth: 0.8)

                var vp = Path(); vp.move(to: CGPoint(x: w / 2, y: 0)); vp.addLine(to: CGPoint(x: w / 2, y: h))
                ctx.stroke(vp, with: .color(cColor), style: StrokeStyle(lineWidth: 1, dash: [4, 4]))
            }

            Circle().fill(metrics.faceSignal.color).frame(width: 18, height: 18)
                .overlay(VStack(spacing: 1) {
                    Image(systemName: "chevron.up").font(.system(size: 5, weight: .bold))
                    Image(systemName: "chevron.down").font(.system(size: 5, weight: .bold))
                }.foregroundStyle(Color(hex: "05080E")))
                .position(x: w - 20, y: state.crown.y)
                .gesture(DragGesture()
                    .onChanged { v in
                        if crownDragBase == nil { crownDragBase = state.crown.y }
                        state.crown.y = max(2, min(state.chin.y - 20, crownDragBase! + v.translation.height))
                    }
                    .onEnded { _ in crownDragBase = nil })

            VStack(spacing: 1) {
                Text(String(format: "%.1fmm", metrics.faceMm))
                    .font(.system(size: 10, weight: .heavy, design: .monospaced))
                Text("/\(Int(spec.faceMin))~\(Int(spec.faceMax))")
                    .font(.system(size: 7, design: .monospaced)).opacity(0.7)
            }
            .foregroundStyle(metrics.faceSignal.color)
            .padding(.horizontal, 6).padding(.vertical, 3)
            .background(RoundedRectangle(cornerRadius: 4).fill(V1.bg.opacity(0.85)))
            .overlay(RoundedRectangle(cornerRadius: 4).stroke(metrics.faceSignal.color.opacity(0.5), lineWidth: 1))
            .position(x: w / 2, y: (state.crown.y + state.chin.y) / 2)

            Text("CROWN").font(.system(size: 7, weight: .bold, design: .monospaced))
                .foregroundStyle(metrics.faceSignal.color.opacity(0.8))
                .position(x: 32, y: state.crown.y - 10)
            Text("CHIN").font(.system(size: 7, weight: .bold, design: .monospaced))
                .foregroundStyle(.white.opacity(0.5))
                .position(x: 26, y: state.chin.y + 10)
            Text(String(format: "EYE %.0f%%", metrics.eyePct))
                .font(.system(size: 7, weight: .bold, design: .monospaced))
                .foregroundStyle(metrics.eyeSignal.color.opacity(0.8))
                .position(x: w - 35, y: eyeY - 10)
        }
    }
}

// MARK: - ICAO Range Bar

struct ICAORangeBar: View {
    let lang: String

    var body: some View {
        VStack(spacing: 4) {
            HStack {
                Text(tr("icao_range", lang))
                    .font(.system(size: 10))
                    .foregroundStyle(V1.muted)
                Spacer()
                Text("34.0 mm")
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundStyle(V1.accent)
            }
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 3)
                    .fill(.white.opacity(0.05))
                    .frame(height: 5)
                GeometryReader { geo in
                    RoundedRectangle(cornerRadius: 3)
                        .fill(V1.accent.opacity(0.13))
                        .overlay(RoundedRectangle(cornerRadius: 3).stroke(V1.accent.opacity(0.26), lineWidth: 1))
                        .frame(width: geo.size.width * 0.6)
                        .offset(x: geo.size.width * 0.2)
                    Circle()
                        .fill(V1.accent)
                        .overlay(Circle().stroke(V1.bg, lineWidth: 2))
                        .frame(width: 11, height: 11)
                        .offset(x: geo.size.width * 0.5 - 5.5, y: -3)
                }
                .frame(height: 5)
            }
            HStack {
                Text("32mm")
                Spacer()
                Text("36mm")
            }
            .font(.system(size: 8, design: .monospaced))
            .foregroundStyle(V1.dim)
        }
        .padding(10)
        .background(RoundedRectangle(cornerRadius: 10).fill(V1.card))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(V1.border, lineWidth: 1))
    }
}

// MARK: - Before/After Slider Card (C3)

struct BeforeAfterSlider: View {
    let lang: String
    @State private var sliderPos: CGFloat = 0.5
    @State private var isDragging = false
    @State private var sweepT: CGFloat = 0
    private let sweepTimer = Timer.publish(every: 0.03, on: .main, in: .common).autoconnect()

    var body: some View {
        VStack(spacing: 0) {
            GeometryReader { geo in
                let w = geo.size.width
                let h = geo.size.height

                ZStack {
                    BundleImage(name: "be_f_1")
                        .frame(width: w, height: h)
                        .clipped()
                        .grayscale(0.85)
                        .brightness(-0.15)
                        .contrast(0.95)

                    BundleImage(name: "pass_f_1")
                        .frame(width: w, height: h)
                        .clipped()
                        .clipShape(SliderClip(pos: sliderPos))

                    Rectangle()
                        .fill(.white)
                        .frame(width: 2)
                        .shadow(color: .white.opacity(0.55), radius: 8)
                        .position(x: w * sliderPos, y: h / 2)

                    Circle()
                        .fill(.white)
                        .frame(width: 36, height: 36)
                        .shadow(color: .black.opacity(0.4), radius: 8)
                        .overlay(
                            Text("‹›")
                                .font(.system(size: 14, weight: .heavy, design: .monospaced))
                                .foregroundStyle(Color(hex: "1E1B4B"))
                        )
                        .position(x: w * sliderPos, y: h / 2)

                    VStack {
                        HStack {
                            Text("BEFORE")
                                .font(.system(size: 9, weight: .heavy, design: .monospaced))
                                .foregroundStyle(.white.opacity(0.9))
                                .tracking(1.5)
                                .padding(.horizontal, 8).padding(.vertical, 4)
                                .background(RoundedRectangle(cornerRadius: 5).fill(.black.opacity(0.6)))
                            Spacer()
                            Text("AFTER · AI")
                                .font(.system(size: 9, weight: .heavy, design: .monospaced))
                                .foregroundStyle(Color(hex: "1E1B4B"))
                                .tracking(1.5)
                                .padding(.horizontal, 8).padding(.vertical, 4)
                                .background(RoundedRectangle(cornerRadius: 5).fill(V1.purple))
                                .shadow(color: V1.purple.opacity(0.45), radius: 5)
                            Spacer().frame(width: 0)
                        }
                        .padding(12)
                        Spacer()
                    }
                }
                .contentShape(Rectangle())
                .gesture(DragGesture(minimumDistance: 0)
                    .onChanged { v in
                        isDragging = true
                        sliderPos = max(0.05, min(0.95, v.location.x / w))
                    }
                    .onEnded { _ in isDragging = false }
                )
                #if os(macOS)
                .onHover { hovering in
                    if hovering { NSCursor.resizeLeftRight.push() } else { NSCursor.pop() }
                }
                #endif
            }
            .frame(height: 220)
            .clipped()

            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text("MONKOS · AI STUDIO")
                        .font(.system(size: 9, weight: .heavy, design: .monospaced))
                        .foregroundStyle(V1.purple)
                        .tracking(2)
                    Spacer()
                    Text(tr("slider_compare", lang))
                        .font(.system(size: 8, design: .monospaced))
                        .foregroundStyle(V1.muted)
                }
                .padding(.bottom, 10)

                HStack(spacing: 0) {
                    Text(tr("slider_drag", lang))
                        .font(.system(size: 24, weight: .black))
                        .foregroundStyle(V1.text)
                    Text(tr("slider_accent", lang))
                        .font(.system(size: 24, weight: .black))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color(hex: "C4B5FD"), Color(hex: "F472B6")],
                                startPoint: .leading, endPoint: .trailing
                            )
                        )
                }
                .lineLimit(2)
                .minimumScaleFactor(0.8)

                Text(tr("slider_sub", lang))
                    .font(.system(size: 11.5))
                    .foregroundStyle(V1.muted)
                    .padding(.top, 8)

                Button {} label: {
                    HStack(spacing: 7) {
                        Text(tr("slider_cta", lang))
                        Text("→")
                    }
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(Color(hex: "1E1B4B"))
                    .padding(.horizontal, 18).padding(.vertical, 12)
                    .background(Capsule().fill(V1.purple))
                    .shadow(color: V1.purple.opacity(0.35), radius: 12)
                }
                .padding(.top, 14)
            }
            .padding(.horizontal, 18).padding(.vertical, 16)
        }
        .background(RoundedRectangle(cornerRadius: 24).fill(V1.card))
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(.white.opacity(0.08), lineWidth: 0.5))
        .shadow(color: .black.opacity(0.4), radius: 20)
        .onReceive(sweepTimer) { _ in
            guard !isDragging else { return }
            sweepT += 0.02
            sliderPos = 0.5 + sin(sweepT) * 0.22
        }
    }
}

private struct SliderClip: Shape {
    var pos: CGFloat

    var animatableData: CGFloat {
        get { pos }
        set { pos = newValue }
    }

    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.addRect(CGRect(x: rect.width * pos, y: 0,
                         width: rect.width * (1 - pos), height: rect.height))
        return p
    }
}

// MARK: - SNS Icon Row

struct SNSIconRow: View {
    let snsItems = [
        ("instagram", "camera"),
        ("x", "xmark"),
        ("youtube", "play.rectangle"),
        ("tiktok", "music.note"),
        ("telegram", "paperplane"),
        ("threads", "at"),
    ]

    var body: some View {
        HStack(spacing: 6) {
            ForEach(snsItems, id: \.0) { item in
                Button {} label: {
                    Image(systemName: item.1)
                        .font(.system(size: 14))
                        .foregroundStyle(.white.opacity(0.75))
                        .frame(maxWidth: .infinity)
                        .aspectRatio(1, contentMode: .fit)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.white.opacity(0.04))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(.white.opacity(0.07), lineWidth: 1)
                        )
                }
            }
        }
    }
}
