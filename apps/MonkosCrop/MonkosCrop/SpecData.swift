import SwiftUI
#if canImport(UIKit)
import UIKit
#else
import AppKit
#endif

// MARK: - Cross-platform Image

#if canImport(UIKit)
typealias PlatformImage = UIImage
#else
typealias PlatformImage = NSImage

extension NSImage {
    func normalizedImage() -> NSImage { self }

    convenience init?(cgImage: CGImage) {
        self.init(cgImage: cgImage, size: NSSize(width: cgImage.width, height: cgImage.height))
    }
}
#endif

extension PlatformImage {
    var platformCGImage: CGImage? {
        #if canImport(UIKit)
        return cgImage
        #else
        return cgImage(forProposedRect: nil, context: nil, hints: nil)
        #endif
    }

    var pxWidth: CGFloat {
        guard let cg = platformCGImage else { return 0 }
        return CGFloat(cg.width)
    }

    var pxHeight: CGFloat {
        guard let cg = platformCGImage else { return 0 }
        return CGFloat(cg.height)
    }
}

extension Image {
    init(platformImage: PlatformImage) {
        #if canImport(UIKit)
        self.init(uiImage: platformImage)
        #else
        self.init(nsImage: platformImage)
        #endif
    }
}

// MARK: - Color(hex:)

extension Color {
    init(hex: String) {
        let h = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var rgb: UInt64 = 0
        Scanner(string: h).scanHexInt64(&rgb)
        self.init(
            red: Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >> 8) & 0xFF) / 255,
            blue: Double(rgb & 0xFF) / 255
        )
    }
}

// MARK: - V1 Dark HUD Theme

enum V1 {
    static let bg     = Color(hex: "05080E")
    static let card   = Color(hex: "0D1320")
    static let border = Color(hex: "162035")
    static let text   = Color(hex: "E8EDF5")
    static let muted  = Color(hex: "6B7D9A")
    static let dim    = Color(hex: "3A4B65")
    static let accent = Color(hex: "00D4AA")
    static let orange = Color(hex: "FFB020")
    static let blue   = Color(hex: "3B82F6")
    static let purple = Color(hex: "A78BFA")
}

// MARK: - PhotoSpec (CropEngine compatible)

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

// MARK: - Country / DocSpec

struct Country: Identifiable, Hashable {
    let id: String
    let flag: String
    let names: [String: String]
    let docs: [DocSpec]
    func name(_ l: String) -> String { names[l] ?? names["ko"] ?? id }
}

struct DocSpec: Identifiable, Hashable {
    let id: String
    let type: String
    let names: [String: String]
    let size: String
    let px: String
    let group: String
    let headHeight: String
    let standard: String

    func name(_ l: String) -> String { names[l] ?? names["ko"] ?? id }

    var photoSpec: PhotoSpec {
        let n = size.replacingOccurrences(of: " mm", with: "").components(separatedBy: " × ")
        return PhotoSpec(
            id: id, name: names["ko"] ?? id,
            widthMM: Double(n.first ?? "35") ?? 35,
            heightMM: Double(n.last ?? "45") ?? 45,
            faceRatioMin: 0.50, faceRatioMax: 0.70,
            backgroundColor: "#FFFFFF"
        )
    }

    var aspectRatio: CGFloat {
        let n = size.replacingOccurrences(of: " mm", with: "").components(separatedBy: " × ")
        return CGFloat(Double(n.first ?? "35") ?? 35) / CGFloat(Double(n.last ?? "45") ?? 45)
    }
}

struct BgOption: Identifiable, Hashable {
    let id: String
    let hex: String
    let names: [String: String]
    func name(_ l: String) -> String { names[l] ?? names["ko"] ?? id }
    var color: Color { Color(hex: hex) }
}

// MARK: - InspectionState

// phase: 0=idle, 1=측정시작, 2=눈, 3=턱, 4=정수리측정중, 5=정수리확인(정지), 6=분석, 7=결과(정지), 8=완료
class InspectionState: ObservableObject {
    @Published var phase = 0
    private var timer: Timer?

    var isDone: Bool { phase == 8 }
    var isAtCrownConfirm: Bool { phase == 5 }
    var isAtResult: Bool { phase == 7 }

    func start() {
        reset()
        phase = 1
        scheduleNext()
    }

    private func scheduleNext() {
        let delays: [Int: TimeInterval] = [1: 1.2, 2: 1.0, 3: 1.0, 4: 1.0, 6: 1.5]
        guard let delay = delays[phase] else { return }
        timer = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { [weak self] _ in
            guard let self else { return }
            self.phase += 1
            self.scheduleNext()
        }
    }

    func confirmCrown() {
        guard phase == 5 else { return }
        phase = 6
        scheduleNext()
    }

    func finalize() {
        guard phase == 7 else { return }
        phase = 8
    }

    func reset() {
        timer?.invalidate()
        timer = nil
        phase = 0
    }

    deinit { timer?.invalidate() }
}

// MARK: - i18n

func tr(_ key: String, _ lang: String) -> String {
    i18n[lang]?[key] ?? i18n["ko"]?[key] ?? key
}

private let i18n: [String: [String: String]] = [
    "ko": [
        "select_country": "국가 선택",
        "select_desc": "증명사진 규격을 선택하세요",
        "use_spec": "이 규격으로 시작",
        "upload_photo": "사진 업로드",
        "upload_desc": "정면을 향한 사진을 올려주세요",
        "take_photo": "카메라로 촬영",
        "choose_gallery": "갤러리에서 선택",
        "photo_tips": "촬영 팁",
        "inspect": "MONKOS 검수",
        "bg_remove": "배경",
        "bg_desc": "배경색을 선택하세요",
        "done": "완료",
        "download": "다운로드",
        "crop_another": "다른 규격으로 또 만들기",
        "free": "무료",
        "next": "다음",
        "crown_y": "정수리",
        "eye_height": "눈 높이",
        "chin_y": "턱 위치",
        "face_size": "얼굴",
        "icao_range": "ICAO 허용범위",
        "start": "시작하기 →",
        "hero1": "여권 사진,",
        "hero2": "규격대로 ",
        "hero_accent": "1초.",
        "hero_sub": "기기 내부에서 처리. 서버 업로드 없음.",
        "saved": "저장됐어요.",
        "ai_tag": "NEXT · MONKOS AI STUDIO",
        "ai_h1": "스튜디오 품질의",
        "ai_h2": "AI 증명사진도 한 장 ",
        "ai_price": "$1.",
        "ai_desc": "실시간 보정 · 26국 표준 · 30초 출력",
        "ai_cta": "monkos.ai 보기",
        "countries": "국가",
        "server": "서버",
        "crop_lbl": "크롭",
        "search": "국가 검색…",
        "purpose": "문서 유형",
        "size": "사이즈",
        "output": "출력",
        "background": "배경",
        "standard": "표준",
        "processing": "얼굴 분석 중…",
        "no_face": "얼굴을 찾을 수 없습니다.\n정면 사진을 사용해 주세요.",
        "tip1": "균일한 조명", "tip2": "단색 배경 권장",
        "tip3": "안경·모자 금지", "tip4": "정면, 무표정",
        "tip5": "그림자 없이", "tip6": "어깨까지 보이게",
    ],
    "en": [
        "select_country": "Select Country",
        "select_desc": "Choose your ID photo specification",
        "use_spec": "Use this spec",
        "upload_photo": "Upload Photo",
        "upload_desc": "Provide a front-facing photo",
        "take_photo": "Take Photo",
        "choose_gallery": "Choose from Gallery",
        "photo_tips": "Photo Tips",
        "inspect": "MONKOS Inspect",
        "bg_remove": "Background",
        "bg_desc": "Pick a background color",
        "done": "Complete",
        "download": "Download",
        "crop_another": "Crop Another Spec",
        "free": "FREE",
        "next": "Next",
        "crown_y": "Crown",
        "eye_height": "Eye Y",
        "chin_y": "Chin Y",
        "face_size": "Face",
        "icao_range": "ICAO range",
        "start": "Start →",
        "hero1": "ID photos,",
        "hero2": "by the ",
        "hero_accent": "spec.",
        "hero_sub": "On-device · No upload · No login · Free forever",
        "saved": "It's saved.",
        "ai_tag": "NEXT · MONKOS AI STUDIO",
        "ai_h1": "Studio-quality AI",
        "ai_h2": "portrait, ",
        "ai_price": "$1.",
        "ai_desc": "Pro retouch · 26 specs · 30s render",
        "ai_cta": "Try monkos.ai",
        "countries": "COUNTRIES",
        "server": "SERVER",
        "crop_lbl": "CROP",
        "search": "Search country…",
        "purpose": "Document Type",
        "size": "Size",
        "output": "Output",
        "background": "Background",
        "standard": "Standard",
        "processing": "Analyzing face…",
        "no_face": "No face detected.\nPlease use a front-facing photo.",
        "tip1": "Even lighting", "tip2": "Plain background",
        "tip3": "No glasses or hats", "tip4": "Face forward, neutral",
        "tip5": "No shadows on face", "tip6": "Shoulders visible",
    ],
    "ja": [
        "select_country": "国を選択",
        "select_desc": "証明写真の規格を選択",
        "use_spec": "この規格で始める",
        "upload_photo": "写真をアップロード",
        "upload_desc": "正面を向いた写真を",
        "take_photo": "カメラで撮影",
        "choose_gallery": "ギャラリーから",
        "photo_tips": "撮影のコツ",
        "inspect": "MONKOS 検査",
        "bg_remove": "背景処理",
        "bg_desc": "背景色を選択",
        "done": "完了",
        "download": "ダウンロード",
        "crop_another": "別の規格でもう一枚",
        "free": "無料",
        "next": "次へ",
        "crown_y": "頭頂",
        "eye_height": "目Y",
        "chin_y": "顎Y",
        "face_size": "顔",
        "icao_range": "ICAO 許容",
        "start": "始める →",
        "hero1": "証明写真、",
        "hero2": "規格通り ",
        "hero_accent": "1秒。",
        "hero_sub": "デバイス内処理。アップロードなし。",
        "saved": "保存しました。",
        "ai_tag": "NEXT · MONKOS AI STUDIO",
        "ai_h1": "スタジオ品質の",
        "ai_h2": "AI証明写真も ",
        "ai_price": "$1.",
        "ai_desc": "即時補正 · 26カ国規格 · 30秒で完成",
        "ai_cta": "monkos.aiへ",
        "countries": "国",
        "server": "サーバー",
        "crop_lbl": "クロップ",
        "search": "国を検索…",
        "purpose": "書類の種類",
        "size": "サイズ",
        "output": "出力",
        "background": "背景",
        "standard": "標準",
        "processing": "顔分析中…",
        "no_face": "顔が見つかりません。\n正面の写真を使用してください。",
        "tip1": "均一な照明", "tip2": "単色の背景",
        "tip3": "眼鏡・帽子なし", "tip4": "正面、無表情",
        "tip5": "影なし", "tip6": "肩まで写る",
    ],
]

var phaseToasts: [Int: [String: String]] = [
    2: ["ko": "눈 검출 · 기울기 측정", "en": "Eyes · Tilt measured", "ja": "目検出 · 傾き測定"],
    3: ["ko": "정면 판정 · 시선축 확인", "en": "Front-facing check", "ja": "正面判定 · 視線確認"],
    4: ["ko": "얼굴 크기 측정", "en": "Face size measured", "ja": "顔サイズ測定"],
    5: ["ko": "ICAO 규격 확인", "en": "ICAO spec check", "ja": "ICAO規格確認"],
    6: ["ko": "검수 완료", "en": "Inspection done", "ja": "検査完了"],
]

// MARK: - Static Data

let stepLabels: [(id: Int, names: [String: String])] = [
    (1, ["ko": "선택", "en": "SELECT", "ja": "選択"]),
    (2, ["ko": "업로드", "en": "UPLOAD", "ja": "アップ"]),
    (3, ["ko": "크롭", "en": "CROP", "ja": "クロップ"]),
    (4, ["ko": "배경", "en": "BG", "ja": "背景"]),
    (5, ["ko": "완료", "en": "DONE", "ja": "完了"]),
]

let purposeList: [(id: String, icon: String, names: [String: String])] = [
    ("passport", "🛂", ["ko": "여권", "en": "Passport", "ja": "パスポート"]),
    ("visa",     "📋", ["ko": "비자", "en": "Visa", "ja": "ビザ"]),
    ("id",       "🪪", ["ko": "신분증", "en": "ID", "ja": "身分証"]),
    ("resume",   "📄", ["ko": "이력서", "en": "Resume", "ja": "履歴書"]),
]

let bgOptions: [BgOption] = [
    BgOption(id: "white", hex: "FFFFFF", names: ["ko": "백색", "en": "White", "ja": "白"]),
    BgOption(id: "offw",  hex: "F5F5F5", names: ["ko": "오프화이트", "en": "Off-white", "ja": "オフホワイト"]),
    BgOption(id: "grey",  hex: "E0E0E0", names: ["ko": "회색", "en": "Grey", "ja": "グレー"]),
    BgOption(id: "blue",  hex: "D6EAF8", names: ["ko": "연파랑", "en": "Light Blue", "ja": "淡い青"]),
    BgOption(id: "navy",  hex: "1E3A5F", names: ["ko": "네이비", "en": "Navy", "ja": "ネイビー"]),
    BgOption(id: "red",   hex: "E74C3C", names: ["ko": "빨강", "en": "Red", "ja": "赤"]),
]

let appCountries: [Country] = [
    Country(id: "korea", flag: "🇰🇷",
            names: ["ko": "대한민국", "en": "South Korea", "ja": "韓国"],
            docs: [
                DocSpec(id: "kr-passport", type: "passport",
                        names: ["ko": "여권", "en": "Passport", "ja": "パスポート"],
                        size: "35 × 45 mm", px: "413 × 531 px", group: "A",
                        headHeight: "32–36 mm", standard: "ICAO 9303"),
                DocSpec(id: "kr-id", type: "id",
                        names: ["ko": "주민등록증", "en": "Resident ID", "ja": "住民登録証"],
                        size: "35 × 45 mm", px: "413 × 531 px", group: "A",
                        headHeight: "32–36 mm", standard: "KR-MOIS"),
                DocSpec(id: "kr-resume", type: "resume",
                        names: ["ko": "반명함", "en": "Resume", "ja": "半名刺"],
                        size: "30 × 40 mm", px: "354 × 472 px", group: "B",
                        headHeight: "—", standard: "—"),
            ]),
    Country(id: "japan", flag: "🇯🇵",
            names: ["ko": "일본", "en": "Japan", "ja": "日本"],
            docs: [
                DocSpec(id: "jp-passport", type: "passport",
                        names: ["ko": "여권", "en": "Passport", "ja": "パスポート"],
                        size: "35 × 45 mm", px: "413 × 531 px", group: "A",
                        headHeight: "32–36 mm", standard: "ICAO 9303"),
                DocSpec(id: "jp-mynumber", type: "id",
                        names: ["ko": "마이넘버", "en": "My Number", "ja": "マイナンバー"],
                        size: "35 × 45 mm", px: "480 × 480 px", group: "A",
                        headHeight: "32–36 mm", standard: "J-LIS"),
            ]),
    Country(id: "usa", flag: "🇺🇸",
            names: ["ko": "미국", "en": "United States", "ja": "アメリカ"],
            docs: [
                DocSpec(id: "us-passport", type: "passport",
                        names: ["ko": "여권", "en": "Passport", "ja": "パスポート"],
                        size: "51 × 51 mm", px: "600 × 600 px", group: "C",
                        headHeight: "25–35 mm", standard: "22 CFR 51"),
            ]),
    Country(id: "eu", flag: "🇪🇺",
            names: ["ko": "EU (쉥겐)", "en": "EU (Schengen)", "ja": "EU (シェンゲン)"],
            docs: [
                DocSpec(id: "eu-passport", type: "passport",
                        names: ["ko": "여권/비자", "en": "Passport / Visa", "ja": "パスポート"],
                        size: "35 × 45 mm", px: "413 × 531 px", group: "A",
                        headHeight: "32–36 mm", standard: "ICAO 9303"),
            ]),
    Country(id: "china", flag: "🇨🇳",
            names: ["ko": "중국", "en": "China", "ja": "中国"],
            docs: [
                DocSpec(id: "cn-passport", type: "passport",
                        names: ["ko": "여권", "en": "Passport", "ja": "パスポート"],
                        size: "33 × 48 mm", px: "390 × 567 px", group: "B",
                        headHeight: "28–33 mm", standard: "GA 461"),
                DocSpec(id: "cn-visa", type: "visa",
                        names: ["ko": "비자", "en": "Visa", "ja": "ビザ"],
                        size: "33 × 48 mm", px: "354 × 472 px", group: "B",
                        headHeight: "15–22 mm", standard: "GA 461"),
            ]),
    Country(id: "canada", flag: "🇨🇦",
            names: ["ko": "캐나다", "en": "Canada", "ja": "カナダ"],
            docs: [
                DocSpec(id: "ca-passport", type: "passport",
                        names: ["ko": "여권", "en": "Passport", "ja": "パスポート"],
                        size: "50 × 70 mm", px: "590 × 826 px", group: "D",
                        headHeight: "31–36 mm", standard: "PPTC-203"),
            ]),
]

struct SpecData {
    static let specs: [PhotoSpec] = appCountries.flatMap { $0.docs.map { $0.photoSpec } }
}
