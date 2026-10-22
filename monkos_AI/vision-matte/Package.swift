// swift-tools-version:5.7
// vision-matte — 4060 matte-server(BiRefNet)와 같은 계약을 애플 비전으로 서빙한다.
// 외부 의존성 0 (Foundation·Network·Vision·CoreImage·ImageIO만).
import PackageDescription

let package = Package(
    name: "vision-matte",
    platforms: [.macOS(.v12)],   // VNGeneratePersonSegmentationRequest = macOS 12+
    targets: [
        .executableTarget(name: "VisionMatte", path: "Sources/VisionMatte"),
    ]
)
