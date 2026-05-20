//
//  MonkosCropApp.swift
//  MonkosCrop
//
//  Created by Jeong-Kyu Shin on 2026/05/12.
//

import SwiftUI
import AppKit

@main
struct MonkosCropApp: App {

    init() {
        if CommandLine.arguments.contains("--export-guides") {
            Task {
                await GuideExporter.run()
                exit(0)
            }
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct GuideExporter {
    static func run() async {
        let args = CommandLine.arguments
        let inputIdx = args.firstIndex(of: "--input").map { args.index(after: $0) }
        let outputIdx = args.firstIndex(of: "--output").map { args.index(after: $0) }

        let inputPath = inputIdx.flatMap { $0 < args.count ? args[$0] : nil }
            ?? NSString(string: "~/Desktop/CROP APP/ref.jpg").expandingTildeInPath
        let outputDir = outputIdx.flatMap { $0 < args.count ? args[$0] : nil }
            ?? NSString(string: "~/Desktop/CROP APP/guides").expandingTildeInPath

        try? FileManager.default.createDirectory(atPath: outputDir, withIntermediateDirectories: true)

        guard let nsImg = NSImage(contentsOfFile: inputPath) else {
            print("ERROR: Cannot load image: \(inputPath)")
            return
        }

        print("Detecting face in \(inputPath)...")
        guard let face = await CropEngine.detectFace(in: nsImg) else {
            print("ERROR: No face detected")
            return
        }
        print("Face detected: eye=(\(Int(face.eyeCenterX)),\(Int(face.eyeCenterY))) chin=\(Int(face.chinY))")

        let sizes = collectUniqueSizes()
        print("Generating \(sizes.count) guide images...")

        var success = 0
        for s in sizes {
            let fMin = s.headMin ?? s.h * 0.7
            let fMax = s.headMax ?? s.h * 0.8
            let spec = PhotoSpec(
                id: s.key, name: s.key,
                widthMM: s.w, heightMM: s.h,
                faceRatioMin: fMin / s.h,
                faceRatioMax: fMax / s.h,
                backgroundColor: "#FFFFFF",
                faceMin: fMin,
                faceMax: fMax,
                faceTarget: (fMin + fMax) / 2,
                pxW: 600, pxH: 600 / s.w * s.h
            )

            guard let cropped = CropEngine.crop(image: nsImg, spec: spec, face: face) else {
                print("SKIP: \(s.key) — crop failed")
                continue
            }

            guard let withOverlay = drawGuideOverlay(
                on: cropped, spec: spec, face: face,
                cropX: CropEngine.lastCropX, cropY: CropEngine.lastCropY,
                cropW: CropEngine.lastCropW, cropH: CropEngine.lastCropH
            ) else {
                print("SKIP: \(s.key) — overlay failed")
                continue
            }

            let outPath = (outputDir as NSString).appendingPathComponent("\(s.key).png")
            if savePNG(image: withOverlay, to: outPath) {
                success += 1
            }
        }
        print("Done: \(success)/\(sizes.count) generated in \(outputDir)")
    }

    struct SizeEntry {
        let key: String
        let w: Double
        let h: Double
        let headMin: Double?
        let headMax: Double?
        let standard: String?
    }

    static func collectUniqueSizes() -> [SizeEntry] {
        var seen = Set<String>()
        var results: [SizeEntry] = []

        for country in appCountries {
            for doc in country.docs {
                let ps = doc.photoSpec
                let key = "\(Int(ps.widthMM))x\(Int(ps.heightMM))"
                if seen.contains(key) { continue }
                seen.insert(key)
                results.append(SizeEntry(
                    key: key, w: ps.widthMM, h: ps.heightMM,
                    headMin: ps.faceMin > 0 ? ps.faceMin : nil,
                    headMax: ps.faceMax > 0 ? ps.faceMax : nil,
                    standard: doc.standard.isEmpty ? nil : doc.standard
                ))
            }
        }
        return results
    }

    static func drawGuideOverlay(
        on image: PlatformImage, spec: PhotoSpec, face: FaceDetectionResult,
        cropX: CGFloat, cropY: CGFloat, cropW: CGFloat, cropH: CGFloat
    ) -> PlatformImage? {
        guard let cgImage = image.platformCGImage else { return nil }
        let w = CGFloat(cgImage.width)
        let h = CGFloat(cgImage.height)

        let mapY: (CGFloat) -> CGFloat = { srcY in (srcY - cropY) / cropH * h }
        let eyeY = mapY(face.eyeCenterY)
        let chinY = mapY(face.chinY)
        let eyeToChin = chinY - eyeY
        let crownY = eyeY - eyeToChin

        let accentR: CGFloat = 0.0, accentG: CGFloat = 0.831, accentB: CGFloat = 0.667

        let nsImage = NSImage(size: NSSize(width: w, height: h))
        nsImage.lockFocus()

        guard let gc = NSGraphicsContext.current?.cgContext else {
            nsImage.unlockFocus()
            return nil
        }

        gc.draw(cgImage, in: CGRect(x: 0, y: 0, width: w, height: h))

        // NSImage lockFocus uses bottom-left origin — Y increases upward
        // mapY returns top-down Y, so flip: flippedY = h - topDownY
        let fCrownY = h - crownY
        let fChinY = h - chinY

        func drawDashedLine(y: CGFloat) {
            gc.setStrokeColor(CGColor(red: accentR, green: accentG, blue: accentB, alpha: 0.45))
            gc.setLineWidth(2)
            gc.setLineDash(phase: 0, lengths: [10, 6])
            gc.move(to: CGPoint(x: 16, y: y))
            gc.addLine(to: CGPoint(x: w - 16, y: y))
            gc.strokePath()
            gc.setLineDash(phase: 0, lengths: [])
        }

        func drawText(_ text: String, x: CGFloat, y: CGFloat, fontSize: CGFloat = 16, mono: Bool = false) {
            let font = mono
                ? NSFont.monospacedSystemFont(ofSize: fontSize, weight: .bold)
                : NSFont.systemFont(ofSize: fontSize, weight: .bold)
            let attrs: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: NSColor(red: accentR, green: accentG, blue: accentB, alpha: 1.0)
            ]
            let str = NSAttributedString(string: text, attributes: attrs)
            let size = str.size()

            gc.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.88))
            gc.fill(CGRect(x: x - 4, y: y - 3, width: size.width + 8, height: size.height + 6))
            str.draw(at: NSPoint(x: x, y: y))
        }

        // 정수리 라인 + 라벨 (영어 통일 — 글로벌 서비스)
        drawDashedLine(y: fCrownY)
        drawText("CROWN", x: 18, y: fCrownY + 4)

        // 턱 라인
        drawDashedLine(y: fChinY)
        drawText("CHIN", x: 18, y: fChinY - 24)

        // 프레임 테두리
        gc.setStrokeColor(CGColor(red: accentR, green: accentG, blue: accentB, alpha: 1.0))
        gc.setLineWidth(2)
        gc.stroke(CGRect(x: 1, y: 1, width: w - 2, height: h - 2))

        nsImage.unlockFocus()
        return nsImage
    }

    static func savePNG(image: PlatformImage, to path: String) -> Bool {
        guard let cgImage = image.platformCGImage else { return false }
        let rep = NSBitmapImageRep(cgImage: cgImage)
        guard let data = rep.representation(using: .png, properties: [:]) else { return false }
        do {
            try data.write(to: URL(fileURLWithPath: path))
            return true
        } catch {
            print("WRITE ERROR: \(path) — \(error)")
            return false
        }
    }
}
