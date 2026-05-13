import UIKit
import Vision
import CoreImage

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
    let eyeCenterX: CGFloat     // 양눈 중심 X (픽셀)
    let eyeCenterY: CGFloat     // 양눈 중심 Y (픽셀, UIKit 좌표: top=0)
    let chinY: CGFloat          // 턱 최하단 Y (픽셀)
    let imageWidth: CGFloat
    let imageHeight: CGFloat
    let visionUsed: Bool        // Vision 사용 여부 (디버그용)
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
        let w = image.size.width
        let h = image.size.height

        // Vision (76포인트 랜드마크) 시도
        if let result = detectFaceVision(cgImage: cgImage, imageW: w, imageH: h) {
            return result
        }

        // fallback: CIDetector (시뮬레이터 등 Vision 불가 환경)
        return detectFaceCIDetector(image: image)
    }

    private static func detectFaceVision(cgImage: CGImage, imageW: CGFloat, imageH: CGFloat) -> FaceDetectionResult? {
        let request = VNDetectFaceLandmarksRequest()
        request.revision = VNDetectFaceLandmarksRequestRevision3 // 76포인트
        let handler = VNImageRequestHandler(cgImage: cgImage, orientation: .up, options: [:])
        do { try handler.perform([request]) } catch { return nil }

        guard let face = request.results?.first,
              let landmarks = face.landmarks else { return nil }

        let bounds = face.boundingBox // normalized, origin=bottom-left

        // 눈: pupil이 있으면 pupil, 없으면 eye region 평균
        let leftEyePt: CGPoint
        let rightEyePt: CGPoint

        if let lp = landmarks.leftPupil?.normalizedPoints.first {
            leftEyePt = CGPoint(
                x: (bounds.origin.x + lp.x * bounds.width) * imageW,
                y: (1 - (bounds.origin.y + lp.y * bounds.height)) * imageH
            )
        } else if let le = landmarks.leftEye {
            let pts = le.normalizedPoints
            let avgX = pts.map(\.x).reduce(0, +) / CGFloat(pts.count)
            let avgY = pts.map(\.y).reduce(0, +) / CGFloat(pts.count)
            leftEyePt = CGPoint(
                x: (bounds.origin.x + avgX * bounds.width) * imageW,
                y: (1 - (bounds.origin.y + avgY * bounds.height)) * imageH
            )
        } else { return nil }

        if let rp = landmarks.rightPupil?.normalizedPoints.first {
            rightEyePt = CGPoint(
                x: (bounds.origin.x + rp.x * bounds.width) * imageW,
                y: (1 - (bounds.origin.y + rp.y * bounds.height)) * imageH
            )
        } else if let re = landmarks.rightEye {
            let pts = re.normalizedPoints
            let avgX = pts.map(\.x).reduce(0, +) / CGFloat(pts.count)
            let avgY = pts.map(\.y).reduce(0, +) / CGFloat(pts.count)
            rightEyePt = CGPoint(
                x: (bounds.origin.x + avgX * bounds.width) * imageW,
                y: (1 - (bounds.origin.y + avgY * bounds.height)) * imageH
            )
        } else { return nil }

        // 턱: faceContour 최하단 (UIKit 좌표에서 Y가 가장 큰 점)
        var chinY: CGFloat = 0
        if let contour = landmarks.faceContour {
            for pt in contour.normalizedPoints {
                let pixelY = (1 - (bounds.origin.y + pt.y * bounds.height)) * imageH
                if pixelY > chinY { chinY = pixelY }
            }
        } else {
            // faceContour 없으면 boundingBox 하단
            chinY = (1 - bounds.origin.y) * imageH
        }

        let eyeCenterX = (leftEyePt.x + rightEyePt.x) / 2
        let eyeCenterY = (leftEyePt.y + rightEyePt.y) / 2

        return FaceDetectionResult(
            eyeCenterX: eyeCenterX,
            eyeCenterY: eyeCenterY,
            chinY: chinY,
            imageWidth: imageW,
            imageHeight: imageH,
            visionUsed: true
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

        // CIDetector 좌표: origin=bottom-left → UIKit: origin=top-left
        let eyeCenterX: CGFloat
        let eyeCenterY: CGFloat

        if face.hasLeftEyePosition && face.hasRightEyePosition {
            eyeCenterX = (face.leftEyePosition.x + face.rightEyePosition.x) / 2
            eyeCenterY = h - (face.leftEyePosition.y + face.rightEyePosition.y) / 2
        } else {
            eyeCenterX = face.bounds.midX
            eyeCenterY = h - face.bounds.midY - face.bounds.height * 0.1
        }

        // 턱 = faceBounds 하단 (CIDetector 좌표 → UIKit)
        let chinY = h - face.bounds.origin.y

        return FaceDetectionResult(
            eyeCenterX: eyeCenterX,
            eyeCenterY: eyeCenterY,
            chinY: chinY,
            imageWidth: w,
            imageHeight: h,
            visionUsed: false
        )
    }

    // MARK: - Crop (웹 엔진 v2 이식)

    static func crop(image: UIImage, spec: PhotoSpec, face: FaceDetectionResult) -> UIImage? {
        let imageW = face.imageWidth
        let imageH = face.imageHeight

        let eyeCenterX = face.eyeCenterX
        let eyeCenterY = face.eyeCenterY
        let chinY = face.chinY

        // ─── 1. 정수리 추산 (해부학: 눈~정수리 ≈ 눈~턱) ───
        let eyeToChin = chinY - eyeCenterY
        let crownY = eyeCenterY - eyeToChin
        let fullFaceH = eyeToChin * 2

        // 헤어탑 (정수리 위 볼륨)
        let hairTopY = crownY - fullFaceH * HAIR_VOLUME_RATIO

        // ─── 2. 스케일 결정 ───
        let frameAspect = spec.aspectRatio
        let frameH_v: CGFloat = 1000
        let frameW_v = frameH_v * frameAspect

        let targetFaceH = frameH_v * FACE_TARGET_RATIO
        var scale = targetFaceH / fullFaceH

        // ─── 3. 눈 위치 앵커로 수직 배치 ───
        let targetEyeY = frameH_v * EYE_POSITION_RATIO
        var extractTop = eyeCenterY * scale - targetEyeY

        // ─── 4. 헤어탑 안전장치 ───
        let scaledHairTopY = hairTopY * scale
        let hairTopInFrame = scaledHairTopY - extractTop

        if hairTopInFrame < 0 {
            let minHairMarginPx = frameH_v * HAIR_MARGIN_MIN
            extractTop = scaledHairTopY - minHairMarginPx

            let scaledChinY = chinY * scale
            let chinInFrame = scaledChinY - extractTop
            let bottomMargin = frameH_v - chinInFrame
            let minBottomPx = frameH_v * BOTTOM_MIN_RATIO

            if bottomMargin < minBottomPx {
                let minTargetFaceH = frameH_v * FACE_MIN_RATIO
                var newScale = scale
                while newScale * fullFaceH > minTargetFaceH {
                    newScale *= 0.995
                    let newExtractTop = eyeCenterY * newScale - targetEyeY
                    let newChinInFrame = chinY * newScale - newExtractTop
                    let newBottomMargin = frameH_v - newChinInFrame
                    if newBottomMargin >= minBottomPx {
                        scale = newScale
                        extractTop = newExtractTop
                        break
                    }
                }
            }
        }

        // ─── 5. 좌우 배치 ───
        let scaledEyeCenterX = eyeCenterX * scale
        var extractLeft = scaledEyeCenterX - frameW_v / 2

        // ─── 6. 경계 보정 ───
        let scaledW = imageW * scale
        let scaledH = imageH * scale
        extractTop = max(0, min(extractTop, scaledH - frameH_v))
        extractLeft = max(0, min(extractLeft, scaledW - frameW_v))

        // ─── 7. 렌더링 ───
        let outputW: CGFloat = 600
        let outputH = outputW / frameAspect
        let outputSize = CGSize(width: outputW, height: outputH)

        let cropX = extractLeft / scale
        let cropY = extractTop / scale
        let cropW = frameW_v / scale
        let cropH = frameH_v / scale

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
