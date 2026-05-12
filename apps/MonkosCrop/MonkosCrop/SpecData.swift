import Foundation

struct PhotoSpec: Identifiable, Hashable {
    let id: String
    let name: String
    let widthMM: Double
    let heightMM: Double
    let faceRatioMin: Double
    let faceRatioMax: Double
    let backgroundColor: String

    var aspectRatio: Double { widthMM / heightMM }
    var displaySize: String { "\(Int(widthMM))×\(Int(heightMM))mm" }
}

struct SpecData {
    static let specs: [PhotoSpec] = [
        PhotoSpec(id: "korea-passport", name: "한국 여권", widthMM: 35, heightMM: 45, faceRatioMin: 0.50, faceRatioMax: 0.70, backgroundColor: "#FFFFFF"),
        PhotoSpec(id: "korea-resume", name: "한국 반명함", widthMM: 30, heightMM: 40, faceRatioMin: 0.50, faceRatioMax: 0.70, backgroundColor: "#FFFFFF"),
        PhotoSpec(id: "korea-drivers", name: "한국 운전면허", widthMM: 35, heightMM: 45, faceRatioMin: 0.50, faceRatioMax: 0.70, backgroundColor: "#FFFFFF"),
        PhotoSpec(id: "japan-passport", name: "日本 パスポート", widthMM: 35, heightMM: 45, faceRatioMin: 0.50, faceRatioMax: 0.70, backgroundColor: "#FFFFFF"),
        PhotoSpec(id: "us-passport", name: "US Passport", widthMM: 51, heightMM: 51, faceRatioMin: 0.50, faceRatioMax: 0.69, backgroundColor: "#FFFFFF"),
        PhotoSpec(id: "us-visa", name: "US Visa", widthMM: 51, heightMM: 51, faceRatioMin: 0.50, faceRatioMax: 0.69, backgroundColor: "#FFFFFF"),
        PhotoSpec(id: "eu-passport", name: "EU Passport", widthMM: 35, heightMM: 45, faceRatioMin: 0.50, faceRatioMax: 0.70, backgroundColor: "#FFFFFF"),
        PhotoSpec(id: "china-passport", name: "中国 护照", widthMM: 33, heightMM: 48, faceRatioMin: 0.50, faceRatioMax: 0.70, backgroundColor: "#FFFFFF"),
        PhotoSpec(id: "canada-passport", name: "Canada Passport", widthMM: 50, heightMM: 70, faceRatioMin: 0.50, faceRatioMax: 0.70, backgroundColor: "#FFFFFF"),
    ]
}
