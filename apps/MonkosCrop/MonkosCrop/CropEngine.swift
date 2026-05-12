import UIKit
import Vision

struct FaceDetectionResult {
    let faceBounds: CGRect
    let leftEye: CGPoint?
    let rightEye: CGPoint?
    let noseTip: CGPoint?
}

class CropEngine {

    static func detectFace(in image: UIImage) async -> FaceDetectionResult? {
        guard let cgImage = image.cgImage else { return nil }

        return await withCheckedContinuation { continuation in
            let request = VNDetectFaceLandmarksRequest { request, error in
                guard let observations = request.results as? [VNFaceObservation],
                      let face = observations.first else {
                    continuation.resume(returning: nil)
                    return
                }

                let bounds = face.boundingBox
                let landmarks = face.landmarks

                let leftEye = landmarks?.leftEye?.normalizedPoints.first
                let rightEye = landmarks?.rightEye?.normalizedPoints.first
                let nose = landmarks?.nose?.normalizedPoints.first

                func toImagePoint(_ p: CGPoint?) -> CGPoint? {
                    guard let p = p else { return nil }
                    return CGPoint(
                        x: bounds.origin.x + p.x * bounds.width,
                        y: bounds.origin.y + p.y * bounds.height
                    )
                }

                let result = FaceDetectionResult(
                    faceBounds: bounds,
                    leftEye: toImagePoint(leftEye),
                    rightEye: toImagePoint(rightEye),
                    noseTip: toImagePoint(nose)
                )
                continuation.resume(returning: result)
            }

            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
            try? handler.perform([request])
        }
    }

    static func crop(image: UIImage, spec: PhotoSpec, face: FaceDetectionResult) -> UIImage? {
        guard let cgImage = image.cgImage else { return nil }

        let imageW = CGFloat(cgImage.width)
        let imageH = CGFloat(cgImage.height)

        let faceCenterX = (face.faceBounds.midX) * imageW
        let faceCenterY = (1 - face.faceBounds.midY) * imageH
        let faceH = face.faceBounds.height * imageH

        let targetFaceRatio = (spec.faceRatioMin + spec.faceRatioMax) / 2.0
        let cropH = faceH / targetFaceRatio
        let cropW = cropH * spec.aspectRatio

        let headTopEstimate = faceCenterY - faceH * 0.65
        let topPadding = cropH * 0.12
        let cropY = headTopEstimate - topPadding
        let cropX = faceCenterX - cropW / 2.0

        var cropRect = CGRect(x: cropX, y: cropY, width: cropW, height: cropH)

        cropRect.origin.x = max(0, cropRect.origin.x)
        cropRect.origin.y = max(0, cropRect.origin.y)
        if cropRect.maxX > imageW { cropRect.origin.x = imageW - cropRect.width }
        if cropRect.maxY > imageH { cropRect.origin.y = imageH - cropRect.height }
        cropRect.origin.x = max(0, cropRect.origin.x)
        cropRect.origin.y = max(0, cropRect.origin.y)
        cropRect.size.width = min(cropRect.size.width, imageW)
        cropRect.size.height = min(cropRect.size.height, imageH)

        guard let cropped = cgImage.cropping(to: cropRect) else { return nil }

        let outputW = 600.0
        let outputH = outputW / spec.aspectRatio
        let outputSize = CGSize(width: outputW, height: outputH)

        UIGraphicsBeginImageContextWithOptions(outputSize, true, 1.0)
        guard let context = UIGraphicsGetCurrentContext() else { return nil }

        context.setFillColor(UIColor.white.cgColor)
        context.fill(CGRect(origin: .zero, size: outputSize))

        let drawRect = CGRect(origin: .zero, size: outputSize)
        context.draw(cropped, in: drawRect)

        let result = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()

        return result
    }
}
