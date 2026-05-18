#if canImport(UIKit)
import UIKit
#else
import AppKit
#endif
import Vision
import CoreImage

#if canImport(UIKit)
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
#endif

struct LandmarkPoints {
    let faceContour: [CGPoint]
    let leftEye: [CGPoint]
    let rightEye: [CGPoint]
    let nose: [CGPoint]
    let medianLine: [CGPoint]
    let outerLips: [CGPoint]
}

struct FaceDetectionResult {
    let eyeCenterX: CGFloat
    let eyeCenterY: CGFloat
    let chinY: CGFloat
    let imageWidth: CGFloat
    let imageHeight: CGFloat
    let visionUsed: Bool
    let leftEyeX: CGFloat
    let leftEyeY: CGFloat
    let rightEyeX: CGFloat
    let rightEyeY: CGFloat
    let rollDeg: CGFloat
    let yawDeg: CGFloat
    let landmarks: LandmarkPoints?

    var tiltDeg: CGFloat {
        atan2(rightEyeY - leftEyeY, rightEyeX - leftEyeX) * 180 / .pi
    }
}

// ─── 배치 상수 (웹 크롭 엔진 v2 이식) ───
private let EYE_POSITION_RATIO: CGFloat = 0.43
private let HAIR_MARGIN_MIN: CGFloat = 0.044
private let HAIR_VOLUME_RATIO: CGFloat = 0.08
private let FACE_TARGET_RATIO: CGFloat = 33.0 / 45.0
private let FACE_MIN_RATIO: CGFloat = 32.0 / 45.0
private let BOTTOM_MIN_RATIO: CGFloat = 0.12

class CropEngine {

    static var lastCropX: CGFloat = 0
    static var lastCropY: CGFloat = 0
    static var lastCropW: CGFloat = 1
    static var lastCropH: CGFloat = 1

    // MARK: - Background Removal (Apple Vision PersonSegmentation)

    // 마스크 생성 (1회, 비용 큼)
    static func generatePersonMask(from image: PlatformImage) async -> CIImage? {
        guard let cgImage = image.platformCGImage else { return nil }
        let request = VNGeneratePersonSegmentationRequest()
        request.qualityLevel = .accurate
        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        do { try handler.perform([request]) } catch { return nil }
        guard let obs = request.results?.first as? VNPixelBufferObservation else { return nil }

        let maskCI = CIImage(cvPixelBuffer: obs.pixelBuffer)
        let origCI = CIImage(cgImage: cgImage)
        let sx = origCI.extent.width / maskCI.extent.width
        let sy = origCI.extent.height / maskCI.extent.height
        return maskCI.transformed(by: CGAffineTransform(scaleX: sx, y: sy))
    }

    // 배경색 합성 (즉시, 마스크 재사용)
    static func compositeBackground(original: PlatformImage, mask: CIImage, bgHex: String) -> PlatformImage? {
        guard let cgImage = original.platformCGImage else { return nil }
        let origCI = CIImage(cgImage: cgImage)

        let hex = bgHex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var rgb: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&rgb)
        let bgCI = CIImage(color: CIColor(
            red: CGFloat((rgb >> 16) & 0xFF) / 255,
            green: CGFloat((rgb >> 8) & 0xFF) / 255,
            blue: CGFloat(rgb & 0xFF) / 255
        )).cropped(to: origCI.extent)

        let blended = origCI.applyingFilter("CIBlendWithMask", parameters: [
            "inputBackgroundImage": bgCI,
            "inputMaskImage": mask
        ])

        let ctx = CIContext()
        guard let resultCG = ctx.createCGImage(blended, from: origCI.extent) else { return nil }
        #if canImport(UIKit)
        return UIImage(cgImage: resultCG)
        #else
        return NSImage(cgImage: resultCG)
        #endif
    }

    // MARK: - Face Detection

    static func detectFace(in image: PlatformImage) async -> FaceDetectionResult? {
        guard let cgImage = image.platformCGImage else { return nil }
        let w = image.pxWidth
        let h = image.pxHeight

        if let result = detectFaceVision(cgImage: cgImage, imageW: w, imageH: h) {
            return result
        }
        return detectFaceCIDetector(cgImage: cgImage, imageW: w, imageH: h)
    }

    private static func detectFaceVision(cgImage: CGImage, imageW: CGFloat, imageH: CGFloat) -> FaceDetectionResult? {
        let request = VNDetectFaceLandmarksRequest()
        request.revision = VNDetectFaceLandmarksRequestRevision3
        let handler = VNImageRequestHandler(cgImage: cgImage, orientation: .up, options: [:])
        do { try handler.perform([request]) } catch { return nil }

        guard let face = request.results?.first,
              let landmarks = face.landmarks else { return nil }

        let bounds = face.boundingBox

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

        var chinY: CGFloat = 0
        if let contour = landmarks.faceContour {
            for pt in contour.normalizedPoints {
                let pixelY = (1 - (bounds.origin.y + pt.y * bounds.height)) * imageH
                if pixelY > chinY { chinY = pixelY }
            }
        } else {
            chinY = (1 - bounds.origin.y) * imageH
        }

        let eyeCenterX = (leftEyePt.x + rightEyePt.x) / 2
        let eyeCenterY = (leftEyePt.y + rightEyePt.y) / 2

        let rollDeg = (face.roll?.doubleValue ?? 0) * 180 / .pi
        let yawDeg = (face.yaw?.doubleValue ?? 0) * 180 / .pi

        func pts(_ region: VNFaceLandmarkRegion2D?) -> [CGPoint] {
            guard let r = region else { return [] }
            return r.normalizedPoints.map { pt in
                CGPoint(
                    x: (bounds.origin.x + pt.x * bounds.width) * imageW,
                    y: (1 - (bounds.origin.y + pt.y * bounds.height)) * imageH
                )
            }
        }
        let lm = LandmarkPoints(
            faceContour: pts(landmarks.faceContour),
            leftEye: pts(landmarks.leftEye),
            rightEye: pts(landmarks.rightEye),
            nose: pts(landmarks.nose),
            medianLine: pts(landmarks.medianLine),
            outerLips: pts(landmarks.outerLips)
        )

        return FaceDetectionResult(
            eyeCenterX: eyeCenterX, eyeCenterY: eyeCenterY,
            chinY: chinY, imageWidth: imageW, imageHeight: imageH,
            visionUsed: true,
            leftEyeX: leftEyePt.x, leftEyeY: leftEyePt.y,
            rightEyeX: rightEyePt.x, rightEyeY: rightEyePt.y,
            rollDeg: CGFloat(rollDeg), yawDeg: CGFloat(yawDeg),
            landmarks: lm
        )
    }

    private static func detectFaceCIDetector(cgImage: CGImage, imageW: CGFloat, imageH: CGFloat) -> FaceDetectionResult? {
        let ciImage = CIImage(cgImage: cgImage)
        let detector = CIDetector(ofType: CIDetectorTypeFace, context: nil,
                                  options: [CIDetectorAccuracy: CIDetectorAccuracyHigh])
        guard let features = detector?.features(in: ciImage, options: [CIDetectorImageOrientation: 1]) as? [CIFaceFeature],
              let face = features.first else { return nil }

        let eyeCenterX: CGFloat
        let eyeCenterY: CGFloat

        if face.hasLeftEyePosition && face.hasRightEyePosition {
            eyeCenterX = (face.leftEyePosition.x + face.rightEyePosition.x) / 2
            eyeCenterY = imageH - (face.leftEyePosition.y + face.rightEyePosition.y) / 2
        } else {
            eyeCenterX = face.bounds.midX
            eyeCenterY = imageH - face.bounds.midY - face.bounds.height * 0.1
        }

        let chinY = imageH - face.bounds.origin.y

        return FaceDetectionResult(
            eyeCenterX: eyeCenterX, eyeCenterY: eyeCenterY,
            chinY: chinY, imageWidth: imageW, imageHeight: imageH,
            visionUsed: false,
            leftEyeX: eyeCenterX - 30, leftEyeY: eyeCenterY,
            rightEyeX: eyeCenterX + 30, rightEyeY: eyeCenterY,
            rollDeg: 0, yawDeg: 0, landmarks: nil
        )
    }

    // MARK: - Crop (웹 엔진 v2 이식)

    static func crop(image: PlatformImage, spec: PhotoSpec, face: FaceDetectionResult) -> PlatformImage? {
        let imageW = face.imageWidth
        let imageH = face.imageHeight
        let eyeCenterX = face.eyeCenterX
        let eyeCenterY = face.eyeCenterY
        let chinY = face.chinY

        let eyeToChin = chinY - eyeCenterY
        let crownY = eyeCenterY - eyeToChin
        let fullFaceH = eyeToChin * 2
        let hairTopY = crownY - fullFaceH * HAIR_VOLUME_RATIO

        let frameAspect = spec.aspectRatio
        let frameH_v: CGFloat = 1000
        let frameW_v = frameH_v * frameAspect

        let targetFaceH = frameH_v * FACE_TARGET_RATIO
        var scale = targetFaceH / fullFaceH

        let targetEyeY = frameH_v * EYE_POSITION_RATIO
        var extractTop = eyeCenterY * scale - targetEyeY

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

        let scaledEyeCenterX = eyeCenterX * scale
        var extractLeft = scaledEyeCenterX - frameW_v / 2
        let scaledW = imageW * scale
        let scaledH = imageH * scale
        extractTop = max(0, min(extractTop, scaledH - frameH_v))
        extractLeft = max(0, min(extractLeft, scaledW - frameW_v))

        let outputW: CGFloat = 600
        let outputH = outputW / frameAspect

        let cropX = extractLeft / scale
        let cropY = extractTop / scale
        let cropW = frameW_v / scale
        let cropH = frameH_v / scale

        let scaleX = outputW / cropW
        let scaleY = outputH / cropH
        let drawRect = CGRect(
            x: -cropX * scaleX, y: -cropY * scaleY,
            width: imageW * scaleX, height: imageH * scaleY
        )

        lastCropX = cropX; lastCropY = cropY
        lastCropW = cropW; lastCropH = cropH

        guard let cgImage = image.platformCGImage else { return nil }

        #if canImport(UIKit)
        let outputSize = CGSize(width: outputW, height: outputH)
        UIGraphicsBeginImageContextWithOptions(outputSize, true, 1.0)
        let ctx = UIGraphicsGetCurrentContext()!
        ctx.setFillColor(UIColor.white.cgColor)
        ctx.fill(CGRect(origin: .zero, size: outputSize))
        UIImage(cgImage: cgImage).draw(in: drawRect)
        let result = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        return result
        #else
        // macOS: CIImage 기반 crop — 좌표 변환 자동 처리
        let ciImage = CIImage(cgImage: cgImage)
        // cropY(top-left) → CIImage Y(bottom-left)
        let ciCropY = CGFloat(cgImage.height) - cropY - cropH
        let ciCropRect = CGRect(x: cropX, y: ciCropY, width: cropW, height: cropH)
        let cropped = ciImage.cropped(to: ciCropRect)

        let resetOrigin = cropped.transformed(by: CGAffineTransform(
            translationX: -cropped.extent.origin.x,
            y: -cropped.extent.origin.y
        ))
        let sx = outputW / resetOrigin.extent.width
        let sy = outputH / resetOrigin.extent.height
        let resized = resetOrigin.transformed(by: CGAffineTransform(scaleX: sx, y: sy))

        let bg = CIImage(color: CIColor.white).cropped(to: CGRect(x: 0, y: 0, width: outputW, height: outputH))
        let composited = resized.composited(over: bg)

        let ciCtx = CIContext()
        guard let resultCG = ciCtx.createCGImage(composited, from: CGRect(x: 0, y: 0, width: outputW, height: outputH)) else { return nil }
        return NSImage(cgImage: resultCG)
        #endif
    }
}
