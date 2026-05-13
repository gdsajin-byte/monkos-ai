import SwiftUI

// MARK: - V1TopBar

struct V1TopBar: View {
    let lang: String
    let step: Int
    let onStep: (Int) -> Void

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                HStack(spacing: 6) {
                    Text("MONKOS")
                        .font(.system(size: 16, weight: .black))
                        .foregroundStyle(V1.accent)
                        .kerning(-0.5)
                    Text("CROP")
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .foregroundStyle(V1.dim)
                        .tracking(1)
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

struct MetricBox: View {
    let label: String
    let value: String
    let unit: String
    let active: Bool

    var body: some View {
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
            .foregroundStyle(active ? V1.accent : V1.dim)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 7)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(active ? V1.card : Color(hex: "0A0F18"))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(active ? V1.accent.opacity(0.2) : V1.border, lineWidth: 1)
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

// MARK: - FaceLandmarksOverlay

struct FaceLandmarksOverlay: View {
    let phase: Int

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let eyeY = h * 0.43
            let lx = w * 0.40, rx = w * 0.60
            let crownY = h * 0.06, chinY = h * 0.80

            ZStack {
                if phase >= 2 {
                    Circle().fill(V1.orange).frame(width: 6, height: 6)
                        .position(x: lx, y: eyeY)
                    Circle().fill(V1.orange).frame(width: 6, height: 6)
                        .position(x: rx, y: eyeY)
                    DashedLine(from: CGPoint(x: w * 0.30, y: eyeY),
                               to: CGPoint(x: w * 0.70, y: eyeY))
                        .stroke(V1.orange.opacity(0.7), style: StrokeStyle(lineWidth: 0.8, dash: [3, 3]))
                }
                if phase >= 3 {
                    DashedLine(from: CGPoint(x: w * 0.5, y: h * 0.04),
                               to: CGPoint(x: w * 0.5, y: h * 0.96))
                        .stroke(V1.blue.opacity(0.5), style: StrokeStyle(lineWidth: 0.6, dash: [2, 4]))
                    Ellipse()
                        .stroke(V1.blue.opacity(0.6), lineWidth: 1)
                        .frame(width: w * 0.34, height: h * 0.48)
                        .position(x: w * 0.5, y: h * 0.47)
                }
                if phase >= 5 {
                    DashedLine(from: CGPoint(x: w * 0.25, y: crownY),
                               to: CGPoint(x: w * 0.75, y: crownY))
                        .stroke(V1.accent.opacity(0.9), style: StrokeStyle(lineWidth: 1, dash: [3, 2]))
                    DashedLine(from: CGPoint(x: w * 0.25, y: chinY),
                               to: CGPoint(x: w * 0.75, y: chinY))
                        .stroke(V1.accent.opacity(0.9), style: StrokeStyle(lineWidth: 1, dash: [3, 2]))
                    Text("CROWN")
                        .font(.system(size: 7, weight: .bold, design: .monospaced))
                        .foregroundStyle(V1.accent)
                        .position(x: w * 0.30, y: crownY - 8)
                    Text("CHIN")
                        .font(.system(size: 7, weight: .bold, design: .monospaced))
                        .foregroundStyle(V1.accent)
                        .position(x: w * 0.28, y: chinY + 10)
                }
            }
            .animation(.easeOut(duration: 0.3), value: phase)
        }
        .allowsHitTesting(false)
    }
}

private struct DashedLine: Shape {
    let from: CGPoint
    let to: CGPoint
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: from)
        p.addLine(to: to)
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
                Text("MONKOS")
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
