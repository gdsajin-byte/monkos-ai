import class Foundation.Bundle

extension Foundation.Bundle {
    static let module: Bundle = {
        let mainPath = Bundle.main.bundleURL.appendingPathComponent("MonkosCrop_MonkosCrop.bundle").path
        let buildPath = "/Users/jeong-kyushin/developer/monk_project/apps/MonkosCrop/.build/x86_64-apple-macosx/debug/MonkosCrop_MonkosCrop.bundle"

        let preferredBundle = Bundle(path: mainPath)

        guard let bundle = preferredBundle ?? Bundle(path: buildPath) else {
            fatalError("could not load resource bundle: from \(mainPath) or \(buildPath)")
        }

        return bundle
    }()
}