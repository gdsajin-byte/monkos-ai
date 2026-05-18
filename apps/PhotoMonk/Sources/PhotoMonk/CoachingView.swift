import SwiftUI
import AVFoundation
#if os(iOS)
import AudioToolbox
#endif

// MARK: - Main View

struct CoachingView: View {

    @StateObject private var camera = CameraManager()
    @StateObject private var engine = CoachingEngine()
    @StateObject private var speech = SpeechCoach()

    @State private var showFlash = false

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            if camera.permissionGranted {
                cameraLayer

                if engine.phase != .captured {
                    if engine.showOverlay {
                        ovalGuide
                            .transition(.opacity)
                        landmarkOverlay
                            .transition(.opacity)
                    }
                    shootingUI
                }

                if showFlash {
                    Color.white.ignoresSafeArea()
                        .allowsHitTesting(false)
                }
            } else {
                permissionView
            }

            if engine.phase == .captured, let data = camera.capturedImageData {
                resultView(data: data)
            }
        }
        .animation(.easeInOut(duration: 0.4), value: engine.showOverlay)
        .onAppear {
            engine.onCapture = { [weak camera] in camera?.capturePhoto() }
            camera.onFrame = { [weak engine] buf in engine?.analyze(pixelBuffer: buf) }
            camera.start()
        }
        .onDisappear {
            camera.stop()
            speech.stop()
        }
        .onChange(of: engine.message) { _, msg in
            if engine.phase == .positioning {
                speech.speak(msg)
            }
        }
        .onChange(of: engine.sequenceStep) { _, step in
            guard step >= 0 else { return }
            let tts = speech.sequenceMessage(step)
            speech.speak(tts, force: true)

            // Flash + shutter at capture moment (step 5 → 6.5s handled by engine)
        }
        .onChange(of: camera.capturedImageData) { _, data in
            guard data != nil else { return }
            doFlash()
            engine.captureCompleted()
            camera.stop()
        }
        .onChange(of: engine.phase) { _, phase in
            if phase == .positioning && engine.sequenceStep == -1 {
                // Returned from interrupt — speak interrupt message
                let interruptMsg = speech.sequenceMessage(-1)
                speech.speak(interruptMsg, force: true)
            }
        }
    }

    // MARK: - Camera

    private var cameraLayer: some View {
        CameraPreview(session: camera.session)
            .ignoresSafeArea()
    }

    // MARK: - Oval Guide

    private var ovalGuide: some View {
        GeometryReader { geo in
            let ovalW = geo.size.width * 0.62
            let ovalH = ovalW * 1.35
            let origin = CGPoint(x: (geo.size.width - ovalW) / 2,
                                 y: (geo.size.height - ovalH) / 2 - 30)

            Canvas { ctx, size in
                let path = Path(ellipseIn: CGRect(origin: origin,
                                                   size: CGSize(width: ovalW, height: ovalH)))
                var outer = Path(CGRect(origin: .zero, size: size))
                outer.addPath(path)
                ctx.fill(outer, with: .color(.black.opacity(0.45)), style: FillStyle(eoFill: true))
            }
            .allowsHitTesting(false)

            Ellipse()
                .stroke(borderColor, lineWidth: 3)
                .frame(width: ovalW, height: ovalH)
                .position(x: geo.size.width / 2, y: (geo.size.height / 2) - 30)
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
    }

    private var borderColor: Color {
        switch engine.status {
        case .ready:       return .green
        case .almostReady: return .yellow
        case .correcting:  return .red
        }
    }

    // MARK: - Landmark Overlay

    private var landmarkOverlay: some View {
        GeometryReader { geo in
            let size = geo.size
            let lm = engine.landmarks

            if lm.available {
                // Eye dots
                if let le = lm.leftEyeCenter {
                    Circle().fill(dotColor).frame(width: 10, height: 10)
                        .position(screenPt(le, in: size))
                }
                if let re = lm.rightEyeCenter {
                    Circle().fill(dotColor).frame(width: 10, height: 10)
                        .position(screenPt(re, in: size))
                }

                // Nose dot
                if let nose = lm.noseCenter {
                    Circle().fill(dotColor).frame(width: 8, height: 8)
                        .position(screenPt(nose, in: size))
                }

                // Chin line
                if lm.chinPoints.count >= 3 {
                    Path { path in
                        let pts = lm.chinPoints.map { screenPt($0, in: size) }
                        path.move(to: pts[0])
                        for pt in pts.dropFirst() { path.addLine(to: pt) }
                    }
                    .stroke(dotColor.opacity(0.6), lineWidth: 1.5)
                }

                // Crown estimate (dashed)
                if let crown = lm.crownEstimate {
                    let sp = screenPt(crown, in: size)
                    Path { path in
                        path.move(to: CGPoint(x: sp.x - 25, y: sp.y))
                        path.addLine(to: CGPoint(x: sp.x + 25, y: sp.y))
                    }
                    .stroke(.gray.opacity(0.4),
                            style: StrokeStyle(lineWidth: 1, dash: [5, 3]))
                }
            }
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
    }

    private var dotColor: Color {
        switch engine.status {
        case .ready:       return .green
        case .almostReady: return .yellow
        case .correcting:  return .red
        }
    }

    private func screenPt(_ visionPt: CGPoint, in size: CGSize) -> CGPoint {
        CGPoint(x: visionPt.x * size.width,
                y: (1.0 - visionPt.y) * size.height)
    }

    // MARK: - Shooting UI

    private var shootingUI: some View {
        VStack {
            // Top: message bar
            Text(engine.message)
                .font(.title2.bold())
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
                .padding(.top, 60)

            Spacer()

            // Center: countdown numbers (during sequence)
            if engine.phase == .sequence && engine.sequenceStep >= 3 {
                let num = 3 - (engine.sequenceStep - 3)
                if num > 0 {
                    Text("\(num)")
                        .font(.system(size: 120, weight: .bold, design: .rounded))
                        .foregroundStyle(.white.opacity(0.9))
                        .transition(.scale.combined(with: .opacity))
                        .id(num)
                }
                Spacer()
            }

            // Bottom: controls (positioning only)
            if engine.phase == .positioning {
                bottomControls
            }

            // Bottom: sequence status
            if engine.phase == .sequence && engine.sequenceStep < 3 {
                HStack(spacing: 8) {
                    ProgressView()
                        .tint(.green)
                    Text("촬영 준비 중…")
                        .font(.headline)
                        .foregroundStyle(.white)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(.ultraThinMaterial, in: Capsule())
                .padding(.bottom, 50)
            }
        }
        .animation(.spring(duration: 0.3), value: engine.sequenceStep)
    }

    private var bottomControls: some View {
        VStack(spacing: 16) {
            HStack(spacing: 8) {
                Text(engine.status.rawValue).font(.title)
                Text(statusLabel).font(.headline).foregroundStyle(.white)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 8)
            .background(.ultraThinMaterial, in: Capsule())

            HStack(spacing: 40) {
                Button {
                    speech.enabled.toggle()
                } label: {
                    Image(systemName: speech.enabled ? "speaker.wave.2.fill" : "speaker.slash.fill")
                        .font(.title2).foregroundStyle(.white)
                        .frame(width: 50, height: 50)
                        .background(.ultraThinMaterial, in: Circle())
                }

                Button {
                    camera.capturePhoto()
                } label: {
                    Circle()
                        .fill(engine.allRulesPassed ? .white : .gray.opacity(0.5))
                        .frame(width: 72, height: 72)
                        .overlay(Circle().stroke(.white, lineWidth: 4).frame(width: 82, height: 82))
                }
                .disabled(!engine.faceDetected)

                // Locale cycle (ko → ja → en)
                Button {
                    cycleLocale()
                } label: {
                    Text(localeLabel)
                        .font(.caption.bold()).foregroundStyle(.white)
                        .frame(width: 50, height: 50)
                        .background(.ultraThinMaterial, in: Circle())
                }
            }
        }
        .padding(.bottom, 50)
    }

    private var statusLabel: String {
        switch engine.status {
        case .correcting:  return "교정 필요"
        case .almostReady: return "거의 완료"
        case .ready:       return "촬영 가능"
        }
    }

    private var localeLabel: String {
        switch speech.locale {
        case "ja-JP": return "JP"
        case "en-US": return "EN"
        default:      return "KR"
        }
    }

    private func cycleLocale() {
        switch speech.locale {
        case "ko-KR": speech.locale = "ja-JP"
        case "ja-JP": speech.locale = "en-US"
        default:      speech.locale = "ko-KR"
        }
    }

    // MARK: - Flash

    private func doFlash() {
        showFlash = true
        #if os(iOS)
        AudioServicesPlaySystemSound(1108)
        #endif
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            withAnimation(.easeOut(duration: 0.15)) { showFlash = false }
        }
    }

    // MARK: - Permission

    private var permissionView: some View {
        VStack(spacing: 20) {
            Image(systemName: "camera.fill")
                .font(.system(size: 60)).foregroundStyle(.gray)
            Text("카메라 권한이 필요합니다")
                .font(.title2).foregroundStyle(.white)
            Text("설정 > 개인정보 보호 > 카메라에서\n권한을 허용해주세요")
                .font(.body).foregroundStyle(.gray).multilineTextAlignment(.center)
        }
    }

    // MARK: - Result

    private func resultView(data: Data) -> some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VStack(spacing: 24) {
                Text("촬영 완료")
                    .font(.title.bold()).foregroundStyle(.white)

                #if canImport(UIKit)
                if let img = UIImage(data: data) {
                    Image(uiImage: img)
                        .resizable().scaledToFit()
                        .frame(maxWidth: 300, maxHeight: 400)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                #else
                if let img = NSImage(data: data) {
                    Image(nsImage: img)
                        .resizable().scaledToFit()
                        .frame(maxWidth: 300, maxHeight: 400)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                #endif

                HStack(spacing: 24) {
                    Button("다시 촬영") {
                        engine.retake()
                        camera.capturedImageData = nil
                        camera.start()
                    }
                    .buttonStyle(.borderedProminent).tint(.gray)

                    Button("사용하기") { }
                    .buttonStyle(.borderedProminent).tint(.blue)
                }
            }
        }
    }
}

// MARK: - Camera Preview

#if canImport(UIKit)
struct CameraPreview: UIViewRepresentable {
    let session: AVCaptureSession
    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)
        let layer = AVCaptureVideoPreviewLayer(session: session)
        layer.videoGravity = .resizeAspectFill
        layer.connection?.isVideoMirrored = true
        view.layer.addSublayer(layer)
        context.coordinator.previewLayer = layer
        return view
    }
    func updateUIView(_ uiView: UIView, context: Context) {
        context.coordinator.previewLayer?.frame = uiView.bounds
    }
    func makeCoordinator() -> Coordinator { Coordinator() }
    class Coordinator { var previewLayer: AVCaptureVideoPreviewLayer? }
}
#else
struct CameraPreview: NSViewRepresentable {
    let session: AVCaptureSession
    func makeNSView(context: Context) -> NSView {
        let view = NSView(frame: .zero)
        view.wantsLayer = true
        let layer = AVCaptureVideoPreviewLayer(session: session)
        layer.videoGravity = .resizeAspectFill
        view.layer = layer
        context.coordinator.previewLayer = layer
        return view
    }
    func updateNSView(_ nsView: NSView, context: Context) {
        context.coordinator.previewLayer?.frame = nsView.bounds
    }
    func makeCoordinator() -> Coordinator { Coordinator() }
    class Coordinator { var previewLayer: AVCaptureVideoPreviewLayer? }
}
#endif
