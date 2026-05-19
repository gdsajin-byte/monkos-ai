import SwiftUI

// MARK: - Landing Demo State

class LandingDemoState: ObservableObject {
    @Published var showBrackets = false
    @Published var showScanLine = false
    @Published var scanY: CGFloat = 0.1
    @Published var showEyeDots = false
    @Published var showEyeGuide = false
    @Published var showBgFlash = false
    @Published var showAfterImage = false
    @Published var showChinGuide = false
    @Published var showCoach1 = false
    @Published var showCrownGuide = false
    @Published var showHeadMeasure = false
    @Published var showStamp = false
    @Published var showPassport = false
    @Published var cropScale: CGFloat = 1.0
    @Published var cropOffsetY: CGFloat = 0
    @Published var statusText = "READY"
    @Published var statusMode = 0
    @Published var stepText = ""
    @Published var showStep = false
    @Published var fadeBlack = false
    @Published var showBlur = false
    @Published var showEndCard = false

    private var workItems: [DispatchWorkItem] = []

    func start() {
        reset()
        // 1. Scan
        at(0.5) { self.showBrackets = true; self.statusText = "SCANNING"; self.statusMode = 1 }
        at(0.8) {
            self.showScanLine = true; self.scanY = 0.05
            withAnimation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true)) { self.scanY = 0.90 }
        }
        // 2. BG Remove
        at(2.5) {
            self.showScanLine = false
            self.statusText = "BG REMOVE"; self.showBgFlash = true
        }
        at(2.8) { withAnimation(.easeOut(duration: 0.8)) { self.showAfterImage = true }; self.showBgFlash = false }
        // 3. Crop — zoom into face
        at(3.8) {
            self.statusText = "CROP"
            withAnimation(.easeInOut(duration: 1.2)) { self.cropScale = 1.44; self.cropOffsetY = 0.136 }
        }
        // 4. Eye guide + EYE coach
        at(5.2) {
            self.statusText = "INSPECT"; self.statusMode = 1
            withAnimation(.easeOut(duration: 0.3)) { self.showEyeDots = true }
            withAnimation(.easeOut(duration: 0.4)) { self.showEyeGuide = true }
        }
        at(5.6) { withAnimation(.easeOut(duration: 0.3)) { self.showCoach1 = true } }
        // 5. Chin guide
        at(6.2) { self.showChinGuide = true }
        // 6. Crown guide
        at(6.8) { self.showCrownGuide = true }
        // 7. HEAD measure (crown→chin vertical line + label)
        at(7.4) { withAnimation(.easeOut(duration: 0.5)) { self.showHeadMeasure = true } }
        // 7. Passport appear (1초 여유 후)
        at(9.0) {
            self.showEyeDots = false; self.showEyeGuide = false
            self.showChinGuide = false; self.showCrownGuide = false
            self.showCoach1 = false; self.showHeadMeasure = false
            self.showBrackets = false
            withAnimation(.easeOut(duration: 0.7)) { self.showPassport = true }
        }
        // 8. PASS stamp on passport
        at(10.2) {
            self.statusText = "PASS"; self.statusMode = 2
            self.showStamp = true
        }
        // 9. Blur passport + remove stamp
        at(12.5) {
            self.showStamp = false
            withAnimation(.easeOut(duration: 0.8)) { self.showBlur = true }
        }
        // 10. Brand overlay on blurred passport
        at(13.3) {
            withAnimation(.easeIn(duration: 0.6)) { self.showEndCard = true }
        }
        // 11. Fade out → reset
        at(16.5) { withAnimation(.easeIn(duration: 0.8)) { self.fadeBlack = true } }
        at(17.3) { self.reset() }
        at(18.3) { self.start() }
    }

    func reset() {
        workItems.forEach { $0.cancel() }
        workItems.removeAll()
        showBrackets = false; showScanLine = false; scanY = 0.1
        showEyeDots = false; showEyeGuide = false
        showBgFlash = false; showAfterImage = false
        showChinGuide = false; showCoach1 = false
        showCrownGuide = false; showHeadMeasure = false
        showStamp = false; showPassport = false; showStep = false
        cropScale = 1.0; cropOffsetY = 0
        statusText = "READY"; statusMode = 0; stepText = ""
        fadeBlack = false; showBlur = false; showEndCard = false
    }

    private func at(_ seconds: Double, action: @escaping () -> Void) {
        let item = DispatchWorkItem { [weak self] in
            guard self != nil else { return }
            action()
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds, execute: item)
        workItems.append(item)
    }

    deinit { workItems.forEach { $0.cancel() } }

    // Debug: step-by-step mode
    @Published var debugStep = -1
    private let debugSteps: [(String, (LandingDemoState) -> Void)] = [
        ("READY", { s in s.reset() }),
        ("1 Scan", { s in
            s.showBrackets = true; s.statusText = "SCANNING"; s.statusMode = 1
            s.showScanLine = true; s.scanY = 0.05
            withAnimation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true)) { s.scanY = 0.90 }
        }),
        ("2 BG Remove", { s in
            s.showScanLine = false; s.statusText = "BG REMOVE"; s.statusMode = 1; s.showBgFlash = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                withAnimation(.easeOut(duration: 0.8)) { s.showAfterImage = true }; s.showBgFlash = false
            }
        }),
        ("3 Crop zoom", { s in
            s.statusText = "CROP"
            withAnimation(.easeInOut(duration: 1.2)) { s.cropScale = 1.44; s.cropOffsetY = 0.136 }
        }),
        ("4 Eye guide", { s in
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.3) {
                s.statusText = "INSPECT"; s.statusMode = 1
                withAnimation(.easeOut(duration: 0.3)) { s.showEyeDots = true }
                withAnimation(.easeOut(duration: 0.4)) { s.showEyeGuide = true }
            }
        }),
        ("4b Coach EYE", { s in withAnimation(.easeOut(duration: 0.3)) { s.showCoach1 = true } }),
        ("5 Chin guide", { s in s.showChinGuide = true }),
        ("6 Crown guide", { s in s.showCrownGuide = true }),
        ("7 HEAD measure", { s in withAnimation(.easeOut(duration: 0.5)) { s.showHeadMeasure = true } }),
        ("8 Passport", { s in
            s.showEyeDots = false; s.showEyeGuide = false
            s.showChinGuide = false; s.showCrownGuide = false
            s.showCoach1 = false; s.showHeadMeasure = false
            s.showBrackets = false
            withAnimation(.easeOut(duration: 0.7)) { s.showPassport = true }
        }),
        ("9 PASS stamp", { s in
            s.statusText = "PASS"; s.statusMode = 2
            s.showStamp = true
        }),
        ("10 Blur + remove stamp", { s in
            s.showStamp = false
            withAnimation(.easeOut(duration: 0.8)) { s.showBlur = true }
        }),
        ("11 Brand", { s in
            withAnimation(.easeIn(duration: 0.6)) { s.showEndCard = true }
        }),
        ("12 Fade out", { s in
            withAnimation(.easeIn(duration: 0.8)) { s.fadeBlack = true }
        }),
    ]

    var debugStepName: String {
        guard debugStep >= 0, debugStep < debugSteps.count else { return "—" }
        return "[\(debugStep)/\(debugSteps.count-1)] \(debugSteps[debugStep].0)"
    }

    func nextStep() {
        debugStep += 1
        if debugStep >= debugSteps.count { debugStep = 0; reset() }
        debugSteps[debugStep].1(self)
    }
}

// MARK: - Phone Demo View

struct PhoneDemoView: View {
    @ObservedObject var demo: LandingDemoState

    var body: some View {
        ZStack {
            Color.black

            bundleImage("be_f_1")
                .opacity(demo.showAfterImage ? 0 : 1)

            GeometryReader { geo in
                bundleImage("bg_f_1")
                    .scaleEffect(demo.cropScale)
                    .offset(y: geo.size.height * demo.cropOffsetY)
            }
            .clipped()
            .opacity(demo.showAfterImage ? 1 : 0)

            Color.white.opacity(demo.showBgFlash ? 0.7 : 0)

            if demo.showScanLine {
                GeometryReader { geo in
                    Rectangle()
                        .fill(LinearGradient(colors: [.clear, V1.accent.opacity(0.8), V1.accent, V1.accent.opacity(0.8), .clear],
                                             startPoint: .leading, endPoint: .trailing))
                        .frame(height: 2)
                        .shadow(color: V1.accent.opacity(0.6), radius: 8, y: 0)
                        .offset(y: geo.size.height * demo.scanY)
                }
            }

            if demo.showBrackets { demoBrackets }
            if demo.showEyeDots { demoEyeDots }
            demoGuideLines
            demoCoachLabels

            VStack {
                HStack {
                    Text(demo.statusText)
                        .font(.system(size: 8, weight: .heavy, design: .monospaced))
                        .tracking(1.5)
                        .foregroundStyle(demo.statusMode == 2 ? Color(hex: "05080E") : V1.accent)
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(RoundedRectangle(cornerRadius: 4)
                            .fill(demo.statusMode == 2 ? V1.accent : .black.opacity(0.7)))
                    Spacer()
                }
                .padding(8)
                Spacer()
            }

            if demo.showPassport {
                bundleImage("PASSPORTUSA")
                    .transition(.opacity)
            }

            if demo.showStamp {
                demoPassStamp
                    .transition(.scale(scale: 3.0).combined(with: .opacity))
                    .animation(.spring(response: 0.35, dampingFraction: 0.55), value: demo.showStamp)
            }

            if demo.showBlur {
                Rectangle()
                    .fill(.ultraThinMaterial)
                    .environment(\.colorScheme, .dark)
                    .opacity(0.85)
            }

            if demo.showEndCard {
                VStack(spacing: 8) {
                    HStack(spacing: 0) {
                        Text("ID").font(.system(size: 38, weight: .black)).foregroundStyle(V1.text)
                        Text("PASS").font(.system(size: 38, weight: .black)).foregroundStyle(V1.accent)
                    }
                    Text("powered by MONKOS AI")
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .foregroundStyle(V1.text.opacity(0.5))
                        .tracking(1)
                }
            }

            V1.bg.opacity(demo.fadeBlack ? 1 : 0)
        }
        .aspectRatio(1.0, contentMode: .fit)
        .frame(maxWidth: 260)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(V1.accent.opacity(0.3), lineWidth: 2))
        .shadow(color: V1.accent.opacity(0.12), radius: 40)
        .shadow(color: .black.opacity(0.6), radius: 30, y: 24)
    }

    private var demoBrackets: some View {
        GeometryReader { geo in
            let inset: CGFloat = 12, len: CGFloat = 22
            ForEach(0..<4, id: \.self) { i in
                let isRight = i % 2 == 1, isBottom = i >= 2
                Path { p in
                    let x = isRight ? geo.size.width - inset : inset
                    let y = isBottom ? geo.size.height - inset : inset
                    let dx: CGFloat = isRight ? -len : len
                    let dy: CGFloat = isBottom ? -len : len
                    p.move(to: CGPoint(x: x, y: y + dy))
                    p.addLine(to: CGPoint(x: x, y: y))
                    p.addLine(to: CGPoint(x: x + dx, y: y))
                }.stroke(V1.accent, lineWidth: 2)
            }
        }
    }

    private var demoEyeDots: some View {
        GeometryReader { geo in
            Circle().fill(V1.accent).frame(width: 7, height: 7)
                .shadow(color: V1.accent, radius: 6)
                .position(x: geo.size.width * 0.44, y: geo.size.height * 0.43)
            Circle().fill(V1.accent).frame(width: 7, height: 7)
                .shadow(color: V1.accent, radius: 6)
                .position(x: geo.size.width * 0.57, y: geo.size.height * 0.43)
        }
    }

    private var demoGuideLines: some View {
        GeometryReader { geo in
            if demo.showEyeGuide {
                demoGuideLine(y: geo.size.height * 0.43, w: geo.size.width, color: V1.accent).opacity(0.6)
                    .transition(.move(edge: .trailing))
            }
            if demo.showChinGuide {
                demoGuideLine(y: geo.size.height * 0.78, w: geo.size.width, color: V1.accent).opacity(0.6)
                    .transition(.move(edge: .trailing))
                demoCoachLabel("CHIN 78% ✓")
                    .position(x: geo.size.width - 50, y: geo.size.height * 0.78)
                    .transition(.move(edge: .trailing))
            }
            if demo.showCrownGuide {
                demoGuideLine(y: geo.size.height * 0.08, w: geo.size.width, color: Color(hex: "FFD700")).opacity(0.5)
                    .transition(.move(edge: .trailing))
                Text("CROWN ✓")
                    .font(.system(size: 8, weight: .bold, design: .monospaced))
                    .foregroundStyle(Color(hex: "FFD700"))
                    .padding(.horizontal, 7).padding(.vertical, 3)
                    .background(RoundedRectangle(cornerRadius: 3).fill(.black.opacity(0.75)))
                    .position(x: geo.size.width - 42, y: geo.size.height * 0.08)
                    .transition(.move(edge: .trailing))
            }
        }
        .animation(.easeOut(duration: 0.5), value: demo.showChinGuide)
        .animation(.easeOut(duration: 0.5), value: demo.showCrownGuide)
    }

    private func demoGuideLine(y: CGFloat, w: CGFloat, color: Color) -> some View {
        Path { p in p.move(to: CGPoint(x: 0, y: y)); p.addLine(to: CGPoint(x: w, y: y)) }
            .stroke(color, style: StrokeStyle(lineWidth: 1, dash: [5, 5]))
    }

    private var demoCoachLabels: some View {
        GeometryReader { geo in
            let crownY = geo.size.height * 0.08
            let chinY = geo.size.height * 0.78

            if demo.showCoach1 {
                demoCoachLabel("EYE 43% ✓")
                    .position(x: geo.size.width - 50, y: geo.size.height * 0.38)
            }
            if demo.showHeadMeasure {
                Path { p in
                    let x = geo.size.width * 0.15
                    p.move(to: CGPoint(x: x, y: crownY))
                    p.addLine(to: CGPoint(x: x, y: chinY))
                }
                .stroke(V1.accent, style: StrokeStyle(lineWidth: 1.5))

                Path { p in
                    let x = geo.size.width * 0.15
                    let arr: CGFloat = 5
                    p.move(to: CGPoint(x: x - arr, y: crownY + arr))
                    p.addLine(to: CGPoint(x: x, y: crownY))
                    p.addLine(to: CGPoint(x: x + arr, y: crownY + arr))
                    p.move(to: CGPoint(x: x - arr, y: chinY - arr))
                    p.addLine(to: CGPoint(x: x, y: chinY))
                    p.addLine(to: CGPoint(x: x + arr, y: chinY - arr))
                }
                .stroke(V1.accent, lineWidth: 1.5)

                demoCoachLabel("HEAD 34mm ✓")
                    .position(x: geo.size.width * 0.15, y: (crownY + chinY) / 2)
            }
        }
    }

    private func demoCoachLabel(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 8, weight: .bold, design: .monospaced))
            .foregroundStyle(V1.accent)
            .padding(.horizontal, 7).padding(.vertical, 3)
            .background(RoundedRectangle(cornerRadius: 3).fill(.black.opacity(0.75)))
    }

    private var demoPassStamp: some View {
        GeometryReader { geo in
            ZStack {
                Circle()
                    .stroke(V1.accent.opacity(0.9), lineWidth: 3.5)
                Circle()
                    .stroke(V1.accent.opacity(0.7), lineWidth: 1.5)
                    .padding(6)
                VStack(spacing: 1) {
                    Text("IDPASS").font(.system(size: 7, weight: .black, design: .monospaced)).tracking(2.5)
                    Text("PASS").font(.system(size: 26, weight: .black))
                    Text("VERIFIED").font(.system(size: 7, weight: .black, design: .monospaced)).tracking(2.5)
                }
                .foregroundStyle(V1.accent.opacity(0.9))
            }
            .frame(width: 95, height: 95)
            .rotationEffect(.degrees(-18))
            .position(x: geo.size.width - 58, y: geo.size.height - 58)
        }
    }
}
