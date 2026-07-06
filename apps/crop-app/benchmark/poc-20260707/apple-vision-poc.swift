// 애플 비전 배경제거 PoC — IDPASS와 동일 API (PersonSegmentation .accurate + CIBlendWithMask)
// 사용: ./apple-vision-poc <입력> <출력.png>
import Foundation
import Vision
import CoreImage
import AppKit

guard CommandLine.arguments.count == 3 else { print("usage: poc <in> <out>"); exit(1) }
let inURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outURL = URL(fileURLWithPath: CommandLine.arguments[2])

guard let img = NSImage(contentsOf: inURL),
      let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("이미지 로드 실패"); exit(1)
}

let req = VNGeneratePersonSegmentationRequest()
req.qualityLevel = .accurate
let handler = VNImageRequestHandler(cgImage: cg, options: [:])
try handler.perform([req])
guard let obs = req.results?.first else { print("세그먼테이션 실패"); exit(1) }

let maskCI = CIImage(cvPixelBuffer: obs.pixelBuffer)
let origCI = CIImage(cgImage: cg)
let sx = origCI.extent.width / maskCI.extent.width
let sy = origCI.extent.height / maskCI.extent.height
let mask = maskCI.transformed(by: CGAffineTransform(scaleX: sx, y: sy))

let bg = CIImage(color: CIColor.white).cropped(to: origCI.extent)
let blended = origCI.applyingFilter("CIBlendWithMask", parameters: [
    "inputBackgroundImage": bg,
    "inputMaskImage": mask,
])

let ctx = CIContext()
guard let outCG = ctx.createCGImage(blended, from: origCI.extent) else { print("합성 실패"); exit(1) }
let rep = NSBitmapImageRep(cgImage: outCG)
try rep.representation(using: .png, properties: [:])!.write(to: outURL)
print("OK \(outCG.width)x\(outCG.height)")
