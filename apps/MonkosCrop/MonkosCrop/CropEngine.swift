import UIKit
import Vision
import ImageIO
import CoreImage

extension CGImagePropertyOrientation {
    init(_ uiOrientation: UIImage.Orientation) {
        switch uiOrientation {
        case .up: self = .up
        case .down: self = .down
        case .left: self = .left
        case .right: self = .right
        case .upMirrored: self = .upMirrored
        case .downMirrored: self = .downMirrored
        case .leftMirrored: self = .leftMirrored
        case .rightMirrored: self = .rightMirrored
        @unknown default: self = .up
        }
    }
}

extension UIImage {
    func normalizedImage() -> UIImage {
        if imageOrientation == .up { return self }
        UIGraphicsBeginImageContextWithOptions(size, false, scale)
        draw(in: CGRect(origin: .zero, size: size))
        let normalized = UIGraphicsGetImageFromCurrentImageContext()!
        UIGraphicsEndImageContext()
        return normalized
    }
}

struct FaceDetectionResult {
    let faceBounds: CGRect      // normalized (0~1), origin=bottom-left
    let leftEye: CGPoint?       // normalized
    let rightEye: CGPoint?      // normalized
    let noseTip: CGPoint?       // normalized
}

// ─── 배치 상수 (웹 크롭 엔진 v2 이식) ───
private let EYE_POSITION_RATIO: CGFloat = 0.43
private let HAIR_MARGIN_MIN: CGFloat = 0.044
private let HAIR_VOLUME_RATIO: CGFloat = 0.08
private let FACE_TARGET_RATIO: CGFloat = 33.0 / 45.0
private let FACE_MIN_RATIO: CGFloat = 32.0 / 45.0
private let BOTTOM_MIN_RATIO: CGFloat = 0.12

class CropEngine {

    // MARK: - Face Detection

    static func detectFace(in image: UIImage) async -> FaceDetectionResult? {
        guard let cgImage = image.cgImage else { return nil }

        // Vision (CoreML) 시도
        if let result = detectFaceVision(cgImage: cgImage) {
            return result
        }

        // fallback: CIDetector (시뮬레이터 호환)
        return detectFaceCIDetector(image: image)
    }

    private static func detectFaceVision(cgImage: CGImage) -> FaceDetectionResult? {
        let request = VNDetectFaceLandmarksRequest()
        let handler = VNImageRequestHandler(cgImage: cgImage, orientation: .up, options: [:])
        do { try handler.perform([request]) } catch { return nil }

        guard let face = request.results?.first else { return nil }
        let bounds = face.boundingBox
        let lm = face.landmarks

        func toImagePoint(_ p: CGPoint?) -> CGPoint? {
            guard let p = p else { return nil }
            return CGPoint(x: bounds.origin.x + p.x * bounds.width,
                           y: bounds.origin.y + p.y * bounds.height)
        }

        return FaceDetectionResult(
            faceBounds: bounds,
            leftEye: toImagePoint(lm?.leftEye?.normalizedPoints.first),
            rightEye: toImagePoint(lm?.rightEye?.normalizedPoints.first),
            noseTip: toImagePoint(lm?.nose?.normalizedPoints.first)
        )
    }

    private static func detectFaceCIDetector(image: UIImage) -> FaceDetectionResult? {
        guard let ciImage = CIImage(image: image) else { return nil }

        let detector = CIDetector(ofType: CIDetectorTypeFace,
                                  context: nil,
                                  options: [CIDetectorAccuracy: CIDetectorAccuracyHigh])

        guard let features = detector?.features(in: ciImage, options: [CIDetectorImageOrientation: 1]) as? [CIFaceFeature],
              let face = features.first else { return nil }

        let w = image.size.width
        let h = image.size.height

        // CIDetector bounds → normalized (0~1, origin=bottom-left, same as Vision)
        let normBounds = CGRect(
            x: face.bounds.origin.x / w,
            y: face.bounds.origin.y / h,
            width: face.bounds.width / w,
            height: face.bounds.height / h
        )

        var leftEye: CGPoint?
        var rightEye: CGPoint?
        var mouth: CGPoint?

        if face.hasLeftEyePosition {
            leftEye = CGPoint(x: face.leftEyePosition.x / w, y: face.leftEyePosition.y / h)
        }
        if face.hasRightEyePosition {
            rightEye = CGPoint(x: face.rightEyePosition.x / w, y: face.rightEyePosition.y / h)
        }
        if face.hasMouthPosition {
            mouth = CGPoint(x: face.mouthPosition.x / w, y: face.mouthPosition.y / h)
        }

        return FaceDetectionResult(faceBounds: normBounds, leftEye: leftEye, rightEye: rightEye, noseTip: mouth)
    }

    // MARK: - Crop (웹 엔진 v2 이식)

    static func crop(image: UIImage, spec: PhotoSpec, face: FaceDetectionResult) -> UIImage? {
        let imageW = image.size.width
        let imageH = image.size.height

        // ─── 1. 주요 좌표 계산 (UIKit 좌표계: origin=top-left) ───
        // faceBounds는 normalized, origin=bottom-left → UIKit으로 변환
        let faceTop = (1 - face.faceBounds.maxY) * imageH
        let faceBottom = (1 - face.faceBounds.minY) * imageH
        let faceCenterX = face.faceBounds.midX * imageW
        let faceH = faceBottom - faceTop

        // 눈 위치 추산 (눈은 faceBounds 상단에서 ~30% 지점)
        let eyeY: CGFloat
        if let le = face.leftEye, let re = face.rightEye {
            eyeY = (1 - (le.y + re.y) / 2) * imageH
        } else {
            eyeY = faceTop + faceH * 0.30
        }

        // 턱 = faceBounds 하단
        let chinY = faceBottom

        // ─── 2. 정수리 추산 (해부학: 눈~정수리 ≈ 눈~턱) ───
        let eyeToChin = chinY - eyeY
        let crownY = eyeY - eyeToChin
        let fullFaceH = eyeToChin * 2

        // 헤어탑 (정수리 위 볼륨)
        let hairTopY = crownY - fullFaceH * HAIR_VOLUME_RATIO

        // ─── 3. 스케일 결정 ───
        let frameAspect = spec.aspectRatio  // width / height
        let frameH_virtual: CGFloat = 1000  // 가상 프레임 높이 (계산용)
        let frameW_virtual = frameH_virtual * frameAspect

        let targetFaceH = frameH_virtual * FACE_TARGET_RATIO
        var scale = targetFaceH / fullFaceH

        // ─── 4. 눈 위치 앵커로 수직 배치 ───
        var scaledEyeY = eyeY * scale
        let targetEyeY = frameH_virtual * EYE_POSITION_RATIO
        var extractTop = scaledEyeY - targetEyeY

        // ─── 5. 헤어탑 안전장치 ───
        let scaledHairTopY = hairTopY * scale
        let hairTopInFrame = scaledHairTopY - extractTop

        if hairTopInFrame < 0 {
            let minHairMarginPx = frameH_virtual * HAIR_MARGIN_MIN
            extractTop = scaledHairTopY - minHairMarginPx

            // 하단 부족 시 스케일 축소
            let scaledChinY = chinY * scale
            let chinInFrame = scaledChinY - extractTop
            let bottomMargin = frameH_virtual - chinInFrame
            let minBottomPx = frameH_virtual * BOTTOM_MIN_RATIO

            if bottomMargin < minBottomPx {
                let minTargetFaceH = frameH_virtual * FACE_MIN_RATIO
                var newScale = scale
                while newScale * fullFaceH > minTargetFaceH {
                    newScale *= 0.995
                    let newScaledEyeY = eyeY * newScale
                    let newExtractTop = newScaledEyeY - targetEyeY
                    let newScaledChinY = chinY * newScale
                    let newChinInFrame = newScaledChinY - newExtractTop
                    let newBottomMargin = frameH_virtual - newChinInFrame

                    if newBottomMargin >= minBottomPx {
                        scale = newScale
                        scaledEyeY = newScaledEyeY
                        extractTop = newExtractTop
                        break
                    }
                }
            }
        }

        // ─── 6. 좌우 배치 (눈 중심 = 프레임 중앙) ───
        let eyeCenterX: CGFloat
        if let le = face.leftEye, let re = face.rightEye {
            eyeCenterX = ((le.x + re.x) / 2) * imageW
        } else {
            eyeCenterX = faceCenterX
        }
        let scaledEyeCenterX = eyeCenterX * scale
        var extractLeft = scaledEyeCenterX - frameW_virtual / 2

        // ─── 7. 경계 보정 ───
        let scaledW = imageW * scale
        let scaledH = imageH * scale
        extractTop = max(0, min(extractTop, scaledH - frameH_virtual))
        extractLeft = max(0, min(extractLeft, scaledW - frameW_virtual))

        // ─── 8. 실제 크롭 (UIKit 좌표계) ───
        let outputW: CGFloat = 600
        let outputH = outputW / frameAspect
        let outputSize = CGSize(width: outputW, height: outputH)

        // 원본 좌표에서의 크롭 영역 역산
        let cropX = extractLeft / scale
        let cropY = extractTop / scale
        let cropW = frameW_virtual / scale
        let cropH = frameH_virtual / scale

        UIGraphicsBeginImageContextWithOptions(outputSize, true, 1.0)
        let ctx = UIGraphicsGetCurrentContext()!
        ctx.setFillColor(UIColor.white.cgColor)
        ctx.fill(CGRect(origin: .zero, size: outputSize))

        let scaleX = outputW / cropW
        let scaleY = outputH / cropH
        let drawRect = CGRect(
            x: -cropX * scaleX,
            y: -cropY * scaleY,
            width: imageW * scaleX,
            height: imageH * scaleY
        )
        image.draw(in: drawRect)

        let result = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()

        return result
    }
}
