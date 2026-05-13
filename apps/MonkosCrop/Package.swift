// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MonkosCrop",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "MonkosCrop",
            path: "MonkosCrop",
            exclude: ["Preview Content", "Info.plist", "Assets.xcassets"]
        )
    ]
)
