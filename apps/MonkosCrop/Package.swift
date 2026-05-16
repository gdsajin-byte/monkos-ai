// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MonkosCrop",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "MonkosCrop",
            path: "MonkosCrop",
            exclude: ["Preview Content", "Info.plist", "Assets.xcassets"],
            resources: [
                .copy("Resources/countries.jsonl"),
                .copy("Resources/ID_Photosample.jpg"),
                .copy("Resources/be_f_1.jpg"),
                .copy("Resources/bg_f_1.jpg"),
                .copy("Resources/bg_cr_f_1.jpg"),
                .copy("Resources/pass_f_1.jpg"),
                .copy("Resources/PASSPORTUSA.jpg"),
                .copy("Resources/card_passport.jpg"),
                .copy("Resources/card_visa.jpg"),
                .copy("Resources/card_license.jpg"),
                .copy("Resources/card_custom.jpg"),
            ]
        )
    ]
)
