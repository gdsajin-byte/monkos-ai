import Vision
import CoreImage
import Combine

// MARK: - Types

enum CoachingStatus: String {
    case correcting  = "🔴"
    case almostReady = "🟡"
    case ready       = "🟢"
}

enum ShootingPhase {
    case positioning
    case sequence
    case captured
}

struct FaceLandmarks {
    var leftEyeCenter: CGPoint?
    var rightEyeCenter: CGPoint?
    var noseCenter: CGPoint?
    var chinPoints: [CGPoint] = []
    var crownEstimate: CGPoint?
    var available: Bool = false
}

// MARK: - Priority

private enum RulePriority: Int, Comparable {
    case noFace      = 0
    case multiFace   = 1
    case cameraAngle = 2
    case frontal     = 3
    case distance    = 4
    case lighting    = 5
    case sharpness   = 6
    case eyeClosure  = 7

    static func < (lhs: Self, rhs: Self) -> Bool { lhs.rawValue < rhs.rawValue }
    var isCritical: Bool { rawValue <= 2 }
}

private struct RuleResult {
    let priority: RulePriority
    let passed: Bool
    let message: String?
}

private struct ImageQuality {
    var faceLuminance: CGFloat = 0.5
    var overallLuminance: CGFloat = 0.5
    var leftLuminance: CGFloat = 0.5
    var rightLuminance: CGFloat = 0.5
    var sharpness: CGFloat = 1.0
}

// MARK: - Engine

class CoachingEngine: ObservableObject {

    // MARK: Published — State

    @Published var message: String = "카메라를 바라봐주세요"
    @Published var status: CoachingStatus = .correcting
    @Published var faceBounds: CGRect = .zero
    @Published var faceDetected: Bool = false
    @Published var allRulesPassed: Bool = false
    @Published var readyFrameCount: Int = 0

    // MARK: Published — Phase

    @Published var phase: ShootingPhase = .positioning
    @Published var sequenceStep: Int = -1
    @Published var showOverlay: Bool = true
    @Published var landmarks: FaceLandmarks = FaceLandmarks()

    // Capture signal — view observes this
    var onCapture: (() -> Void)?

    static let autoReadyFrames = 10

    // MARK: Thresholds

    private let centerThreshold: CGFloat = 0.20
    private let minFaceRatio: CGFloat = 0.20
    private let maxFaceRatio: CGFloat = 0.70
    private let yawLimit: Double = 25.0
    private let rollLimit: Double = 18.0
    private let eyeAspectMin: CGFloat = 0.12
    private let foreheadLow: CGFloat = 0.30
    private let foreheadHigh: CGFloat = 0.80
    private let chinFrameMin: CGFloat = 0.10
    private let brightnessMin: CGFloat = 0.20
    private let backlightRatio: CGFloat = 2.0
    private let shadowDiff: CGFloat = 0.50
    private let blurMin: CGFloat = 0.03
    private let movementLimit: CGFloat = 0.15

    // MARK: Internal

    private var lastTime: CFAbsoluteTime = 0
    private let interval: CFTimeInterval = 0.08
    private var internalReadyCount: Int = 0
    private let ciCtx = CIContext(options: [.useSoftwareRenderer: false])
    private var pendingWork: [DispatchWorkItem] = []
    private var seqStartBBox: CGRect = .zero
    private var isSequencing = false

    private let visionReq: VNDetectFaceLandmarksRequest = {
        let r = VNDetectFaceLandmarksRequest()
        r.revision = VNDetectFaceLandmarksRequestRevision3
        return r
    }()

    // MARK: - Analyze (Main Entry)

    func analyze(pixelBuffer: CVPixelBuffer) {
        let now = CFAbsoluteTimeGetCurrent()
        guard now - lastTime >= interval else { return }
        lastTime = now

        let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer,
                                            orientation: .upMirrored, options: [:])
        do { try handler.perform([visionReq]) } catch { return }
        let faces = visionReq.results ?? []

        // Always extract landmarks for overlay
        if let face = faces.first {
            extractLandmarks(face: face)
        } else {
            DispatchQueue.main.async { [weak self] in self?.landmarks.available = false }
        }

        if isSequencing {
            checkSequenceIntegrity(faces: faces)
        } else {
            evaluatePositioning(faces: faces, ciImage: ciImage)
        }
    }

    // MARK: - Phase 2: Positioning

    private func evaluatePositioning(faces: [VNFaceObservation], ciImage: CIImage) {
        guard !faces.isEmpty else {
            emit(rules: [RuleResult(priority: .noFace, passed: false,
                                    message: "얼굴이 보이지 않습니다")], bbox: .zero)
            return
        }
        guard faces.count == 1 else {
            emit(rules: [RuleResult(priority: .multiFace, passed: false,
                                    message: "한 명만 촬영해주세요")], bbox: faces[0].boundingBox)
            return
        }

        let face = faces[0]
        let bbox = face.boundingBox
        var rules: [RuleResult] = []

        rules.append(contentsOf: checkCameraAngle(face: face))
        rules.append(contentsOf: checkFrontal(face: face))
        rules.append(contentsOf: checkDistance(bbox: bbox))

        let iq = measureImageQuality(ciImage: ciImage, faceBBox: bbox)
        rules.append(contentsOf: checkLighting(q: iq))
        rules.append(contentsOf: checkSharpness(q: iq))
        rules.append(contentsOf: checkEyes(face: face))

        emit(rules: rules, bbox: bbox)
    }

    // MARK: - Phase 3: Sequence

    func startSequence() {
        guard phase == .positioning else { return }
        isSequencing = true
        seqStartBBox = faceBounds

        DispatchQueue.main.async { [weak self] in
            self?.phase = .sequence
            self?.sequenceStep = -1
            self?.readyFrameCount = 0
        }

        let timeline: [(TimeInterval, String, Int)] = [
            (0.0,  "좋아요, 촬영합니다",       0),
            (1.0,  "그대로~ 표정 부드럽게",     1),
            (2.5,  "카메라 봐주세요",           2),
            (4.0,  "3",                        3),
            (5.0,  "2",                        4),
            (6.0,  "1",                        5),
        ]

        for (delay, display, step) in timeline {
            let item = DispatchWorkItem { [weak self] in
                guard self?.isSequencing == true else { return }
                self?.message = display
                self?.sequenceStep = step
                if step >= 3 { self?.showOverlay = false }
            }
            pendingWork.append(item)
            DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: item)
        }

        // Capture at 6.5s
        let captureItem = DispatchWorkItem { [weak self] in
            guard self?.isSequencing == true else { return }
            self?.onCapture?()
        }
        pendingWork.append(captureItem)
        DispatchQueue.main.asyncAfter(deadline: .now() + 6.5, execute: captureItem)
    }

    func cancelSequence() {
        pendingWork.forEach { $0.cancel() }
        pendingWork.removeAll()
        isSequencing = false

        DispatchQueue.main.async { [weak self] in
            self?.phase = .positioning
            self?.sequenceStep = -1
            self?.showOverlay = true
            self?.message = "앗, 다시 한번 준비해주세요"
            self?.status = .correcting
            self?.readyFrameCount = 0
        }
    }

    func captureCompleted() {
        pendingWork.forEach { $0.cancel() }
        pendingWork.removeAll()
        isSequencing = false

        DispatchQueue.main.async { [weak self] in
            self?.phase = .captured
            self?.sequenceStep = -1
        }
    }

    func retake() {
        DispatchQueue.main.async { [weak self] in
            self?.phase = .positioning
            self?.sequenceStep = -1
            self?.showOverlay = true
            self?.readyFrameCount = 0
            self?.message = "카메라를 바라봐주세요"
            self?.status = .correcting
        }
    }

    // MARK: Interrupt Check

    private func checkSequenceIntegrity(faces: [VNFaceObservation]) {
        if faces.isEmpty {
            cancelSequence()
            return
        }
        let face = faces[0]
        if areEyesClosed(face: face) {
            cancelSequence()
            return
        }
        let dx = abs(face.boundingBox.midX - seqStartBBox.midX)
        let dy = abs(face.boundingBox.midY - seqStartBBox.midY)
        if dx > movementLimit || dy > movementLimit {
            cancelSequence()
            return
        }
        // Update bounds for overlay (even during sequence)
        DispatchQueue.main.async { [weak self] in
            self?.faceBounds = face.boundingBox
        }
    }

    // MARK: - Landmark Extraction

    private func extractLandmarks(face: VNFaceObservation) {
        guard let lm = face.landmarks else {
            DispatchQueue.main.async { [weak self] in self?.landmarks.available = false }
            return
        }
        let bbox = face.boundingBox
        func toImage(_ pt: CGPoint) -> CGPoint {
            CGPoint(x: bbox.origin.x + pt.x * bbox.width,
                    y: bbox.origin.y + pt.y * bbox.height)
        }

        var data = FaceLandmarks()
        data.available = true

        if let le = lm.leftEye {
            let pts = le.normalizedPoints
            data.leftEyeCenter = toImage(center(pts))
        }
        if let re = lm.rightEye {
            let pts = re.normalizedPoints
            data.rightEyeCenter = toImage(center(pts))
        }
        if let nose = lm.nose {
            data.noseCenter = toImage(center(nose.normalizedPoints))
        }
        if let contour = lm.faceContour {
            data.chinPoints = contour.normalizedPoints.map { toImage($0) }
        }

        // Crown estimate
        if let leC = data.leftEyeCenter, let reC = data.rightEyeCenter {
            let eyeY = (leC.y + reC.y) / 2
            let eyeX = (leC.x + reC.x) / 2
            let chinBottom = data.chinPoints.map(\.y).min() ?? bbox.origin.y
            let crownY = eyeY + (eyeY - chinBottom)
            data.crownEstimate = CGPoint(x: eyeX, y: crownY)
        }

        DispatchQueue.main.async { [weak self] in self?.landmarks = data }
    }

    // MARK: - Rules

    private func checkCameraAngle(face: VNFaceObservation) -> [RuleResult] {
        guard let lm = face.landmarks,
              let le = lm.leftEye, let re = lm.rightEye else {
            return [RuleResult(priority: .cameraAngle, passed: true, message: nil)]
        }
        let eyeY = (avgY(le.normalizedPoints) + avgY(re.normalizedPoints)) / 2
        let chinY = lm.faceContour?.normalizedPoints.map(\.y).min() ?? 0
        let foreheadH = 1.0 - eyeY
        let chinH = eyeY - chinY
        let total = foreheadH + chinH
        guard total > 0 else { return [RuleResult(priority: .cameraAngle, passed: true, message: nil)] }
        let ratio = foreheadH / total

        if ratio < foreheadLow {
            return [RuleResult(priority: .cameraAngle, passed: false,
                               message: "카메라를 눈높이로 올려주세요")]
        }
        if ratio > foreheadHigh {
            return [RuleResult(priority: .cameraAngle, passed: false,
                               message: "카메라를 살짝 내려주세요")]
        }
        if face.boundingBox.origin.y < chinFrameMin {
            return [RuleResult(priority: .cameraAngle, passed: false,
                               message: "턱을 살짝 당겨주세요")]
        }
        return [RuleResult(priority: .cameraAngle, passed: true, message: nil)]
    }

    private func checkFrontal(face: VNFaceObservation) -> [RuleResult] {
        let yawDeg = abs((face.yaw?.doubleValue ?? 0) * 180.0 / .pi)
        if yawDeg > yawLimit {
            return [RuleResult(priority: .frontal, passed: false, message: "정면을 봐주세요")]
        }
        return [RuleResult(priority: .frontal, passed: true, message: nil)]
    }

    private func checkDistance(bbox: CGRect) -> [RuleResult] {
        if bbox.height < minFaceRatio {
            return [RuleResult(priority: .distance, passed: false, message: "카메라에 좀 더 가까이")]
        }
        if bbox.height > maxFaceRatio {
            return [RuleResult(priority: .distance, passed: false, message: "조금 뒤로 물러나주세요")]
        }
        let offX = abs(bbox.midX - 0.5)
        let offY = abs(bbox.midY - 0.5)
        if offX > centerThreshold || offY > centerThreshold {
            return [RuleResult(priority: .distance, passed: false, message: "얼굴을 중앙으로 이동해주세요")]
        }
        return [RuleResult(priority: .distance, passed: true, message: nil)]
    }

    private func checkLighting(q: ImageQuality) -> [RuleResult] {
        if q.faceLuminance < brightnessMin {
            return [RuleResult(priority: .lighting, passed: false,
                               message: "조명이 어둡습니다. 밝은 곳으로 이동해주세요")]
        }
        if q.faceLuminance > 0.01 && q.overallLuminance / q.faceLuminance >= backlightRatio {
            return [RuleResult(priority: .lighting, passed: false, message: "역광입니다. 빛을 등지지 마세요")]
        }
        let maxL = max(q.leftLuminance, q.rightLuminance)
        let minL = min(q.leftLuminance, q.rightLuminance)
        if maxL > 0.01 && (maxL - minL) / maxL > shadowDiff {
            return [RuleResult(priority: .lighting, passed: false,
                               message: "얼굴에 그림자가 있습니다. 조명을 조정해주세요")]
        }
        return [RuleResult(priority: .lighting, passed: true, message: nil)]
    }

    private func checkSharpness(q: ImageQuality) -> [RuleResult] {
        if q.sharpness < blurMin {
            return [RuleResult(priority: .sharpness, passed: false,
                               message: "흔들림이 감지됩니다. 카메라를 고정해주세요")]
        }
        return [RuleResult(priority: .sharpness, passed: true, message: nil)]
    }

    private func checkEyes(face: VNFaceObservation) -> [RuleResult] {
        guard let lm = face.landmarks,
              let left = lm.leftEye, let right = lm.rightEye else {
            return [RuleResult(priority: .eyeClosure, passed: true, message: nil)]
        }
        if eyeAspect(left.normalizedPoints) < eyeAspectMin ||
           eyeAspect(right.normalizedPoints) < eyeAspectMin {
            return [RuleResult(priority: .eyeClosure, passed: false, message: "눈을 떠주세요")]
        }
        return [RuleResult(priority: .eyeClosure, passed: true, message: nil)]
    }

    // MARK: - Core Image

    private func measureImageQuality(ciImage: CIImage, faceBBox: CGRect) -> ImageQuality {
        var q = ImageQuality()
        let ext = ciImage.extent
        let faceRect = CGRect(x: faceBBox.origin.x * ext.width,
                              y: faceBBox.origin.y * ext.height,
                              width: faceBBox.width * ext.width,
                              height: faceBBox.height * ext.height)
        guard faceRect.width > 1 && faceRect.height > 1 else { return q }

        q.overallLuminance = luminance(of: ciImage, in: ext)
        q.faceLuminance = luminance(of: ciImage, in: faceRect)

        let leftRect = CGRect(x: faceRect.minX, y: faceRect.minY,
                              width: faceRect.width / 2, height: faceRect.height)
        let rightRect = CGRect(x: faceRect.midX, y: faceRect.minY,
                               width: faceRect.width / 2, height: faceRect.height)
        q.leftLuminance = luminance(of: ciImage, in: leftRect)
        q.rightLuminance = luminance(of: ciImage, in: rightRect)
        q.sharpness = laplacianScore(of: ciImage, in: faceRect)
        return q
    }

    private func luminance(of image: CIImage, in rect: CGRect) -> CGFloat {
        let clamped = rect.intersection(image.extent)
        guard clamped.width > 0 && clamped.height > 0 else { return 0 }
        let cropped = image.cropped(to: clamped)
        guard let filter = CIFilter(name: "CIAreaAverage", parameters: [
            kCIInputImageKey: cropped,
            kCIInputExtentKey: CIVector(cgRect: clamped)
        ]), let output = filter.outputImage else { return 0 }
        var pixel = [UInt8](repeating: 0, count: 4)
        ciCtx.render(output, toBitmap: &pixel, rowBytes: 4,
                     bounds: CGRect(x: 0, y: 0, width: 1, height: 1),
                     format: .RGBA8, colorSpace: nil)
        return 0.299 * CGFloat(pixel[0]) / 255.0 +
               0.587 * CGFloat(pixel[1]) / 255.0 +
               0.114 * CGFloat(pixel[2]) / 255.0
    }

    private func laplacianScore(of image: CIImage, in rect: CGRect) -> CGFloat {
        let clamped = rect.intersection(image.extent)
        guard clamped.width > 0 && clamped.height > 0 else { return 1.0 }
        var crop = image.cropped(to: clamped)
        let scale = min(1.0, 150.0 / max(clamped.width, clamped.height))
        if scale < 1.0 { crop = crop.transformed(by: CGAffineTransform(scaleX: scale, y: scale)) }
        let k: [CGFloat] = [0, -1, 0, -1, 4, -1, 0, -1, 0]
        guard let conv = CIFilter(name: "CIConvolution3X3", parameters: [
            kCIInputImageKey: crop,
            "inputWeights": CIVector(values: k, count: 9),
            "inputBias": NSNumber(value: 0.5)
        ]), let output = conv.outputImage,
        let avg = CIFilter(name: "CIAreaAverage", parameters: [
            kCIInputImageKey: output,
            kCIInputExtentKey: CIVector(cgRect: output.extent)
        ]), let avgOut = avg.outputImage else { return 1.0 }
        var pixel = [UInt8](repeating: 0, count: 4)
        ciCtx.render(avgOut, toBitmap: &pixel, rowBytes: 4,
                     bounds: CGRect(x: 0, y: 0, width: 1, height: 1),
                     format: .RGBA8, colorSpace: nil)
        return abs(CGFloat(pixel[1]) / 255.0 - 0.5) * 2.0
    }

    // MARK: - Emit

    private func emit(rules: [RuleResult], bbox: CGRect) {
        let sorted = rules.sorted { $0.priority < $1.priority }
        let firstFail = sorted.first(where: { !$0.passed })
        let allOK = firstFail == nil

        let failedNames = sorted.filter { !$0.passed }.map { "\($0.priority):\($0.message ?? "")" }
        if !failedNames.isEmpty {
            print("[CoachingEngine] FAIL: \(failedNames.joined(separator: " | "))")
        } else {
            print("[CoachingEngine] ALL PASS ✅")
        }

        let msg: String
        let st: CoachingStatus
        if allOK {
            msg = "완벽합니다! 촬영하세요"
            st = .ready
        } else if let fail = firstFail {
            msg = fail.message ?? ""
            st = fail.priority.isCritical ? .correcting : .almostReady
        } else {
            msg = ""; st = .ready
        }

        internalReadyCount = allOK ? internalReadyCount + 1 : max(internalReadyCount - 1, 0)
        let count = internalReadyCount
        let shouldStart = allOK && count >= Self.autoReadyFrames
        print("[emit] allOK=\(allOK) count=\(count)/\(Self.autoReadyFrames) shouldStart=\(shouldStart) msg=\(msg)")

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            guard self.phase == .positioning else {
                print("[emit] SKIP — phase=\(self.phase)")
                return
            }
            self.faceDetected = !bbox.isEmpty
            self.faceBounds = bbox
            self.message = msg
            self.status = st
            self.allRulesPassed = allOK
            self.readyFrameCount = count

            if shouldStart {
                print("[emit] 🟢 STARTING SEQUENCE")
                self.startSequence()
            }
        }
    }

    // MARK: - Helpers

    private func center(_ pts: [CGPoint]) -> CGPoint {
        guard !pts.isEmpty else { return CGPoint(x: 0.5, y: 0.5) }
        let sx = pts.map(\.x).reduce(0, +)
        let sy = pts.map(\.y).reduce(0, +)
        let n = CGFloat(pts.count)
        return CGPoint(x: sx / n, y: sy / n)
    }

    private func avgY(_ pts: [CGPoint]) -> CGFloat {
        guard !pts.isEmpty else { return 0.5 }
        return pts.map(\.y).reduce(0, +) / CGFloat(pts.count)
    }

    private func eyeAspect(_ pts: [CGPoint]) -> CGFloat {
        guard pts.count >= 6 else { return 1.0 }
        let w = (pts.map(\.x).max() ?? 0) - (pts.map(\.x).min() ?? 0)
        let h = (pts.map(\.y).max() ?? 0) - (pts.map(\.y).min() ?? 0)
        guard w > 0 else { return 1.0 }
        return h / w
    }

    private func areEyesClosed(face: VNFaceObservation) -> Bool {
        guard let lm = face.landmarks,
              let left = lm.leftEye, let right = lm.rightEye else { return false }
        return eyeAspect(left.normalizedPoints) < eyeAspectMin ||
               eyeAspect(right.normalizedPoints) < eyeAspectMin
    }
}
