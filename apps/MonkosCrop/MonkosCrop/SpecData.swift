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
    let faceMin: Double
    let faceMax: Double
    let faceTarget: Double
    let pxW: Double
    let pxH: Double
    var aspectRatio: Double { widthMM / heightMM }
    var displaySize: String { "\(Int(widthMM))×\(Int(heightMM))mm" }
}

// MARK: - Country / DocSpec

struct Country: Identifiable, Hashable {
    let id: String
    let flag: String
    let names: [String: String]
    var continent: String = "asia"
    let docs: [DocSpec]
    func name(_ l: String) -> String { names[l] ?? names["ko"] ?? id }
}

struct ContinentGroup: Identifiable {
    let id: String
    let names: [String: String]
    let icon: String
    let countries: [Country]
    var gradA: String = "1A1A2A"
    var gradB: String = "2A2A3A"
    var dot: String = "00D4AA"
    var image: String = ""
    func name(_ l: String) -> String { names[l] ?? names["ko"] ?? id }
}

let continentOrder = ["asia", "europe", "americas", "oceania", "africa", "middleeast"]

let continentMeta: [String: (names: [String: String], icon: String, colors: (String, String), dot: String, image: String)] = [
    "asia":       (["ko": "아시아", "en": "Asia", "ja": "アジア"], "🌏", ("1A3A2A", "2D5A3A"), "00D4AA", "cont_asia"),
    "europe":     (["ko": "유럽", "en": "Europe", "ja": "ヨーロッパ"], "🌍", ("1A1A3A", "3A2A5A"), "A78BFA", "cont_europe"),
    "americas":   (["ko": "아메리카", "en": "Americas", "ja": "アメリカ大陸"], "🌎", ("1A2A3A", "2A3A5A"), "3B82F6", "cont_americas"),
    "africa":     (["ko": "아프리카", "en": "Africa", "ja": "アフリカ"], "🌍", ("3A2A1A", "5A3A1A"), "FFB020", "cont_africa"),
    "oceania":    (["ko": "오세아니아", "en": "Oceania", "ja": "オセアニア"], "🌊", ("1A2A2A", "1A3A4A"), "FF6B9D", "cont_oceania"),
    "middleeast": (["ko": "중동", "en": "Middle East", "ja": "中東"], "🕌", ("2A2A1A", "4A3A1A"), "F59E0B", "cont_middleeast"),
]

func groupedByContinent(_ countries: [Country]) -> [ContinentGroup] {
    var dict: [String: [Country]] = [:]
    for c in countries {
        dict[c.continent, default: []].append(c)
    }
    return continentOrder.compactMap { key in
        guard let list = dict[key], !list.isEmpty,
              let meta = continentMeta[key] else { return nil }
        return ContinentGroup(id: key, names: meta.names, icon: meta.icon, countries: list,
                              gradA: meta.colors.0, gradB: meta.colors.1, dot: meta.dot, image: meta.image)
    }
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
    var warning: [String: String]? = nil

    func name(_ l: String) -> String { names[l] ?? names["ko"] ?? id }

    var photoSpec: PhotoSpec {
        let n = size.replacingOccurrences(of: " mm", with: "").components(separatedBy: " × ")
        let w = Double(n.first ?? "35") ?? 35
        let h = Double(n.last ?? "45") ?? 45
        let p = px.replacingOccurrences(of: " px", with: "").components(separatedBy: " × ")
        let pw = Double(p.first ?? "413") ?? 413
        let ph = Double(p.last ?? "531") ?? 531
        let hh = headHeight.replacingOccurrences(of: " mm", with: "").replacingOccurrences(of: "–", with: "-")
        let parts = hh.components(separatedBy: "-")
        let fMin: Double, fMax: Double
        if parts.count == 2,
           let a = Double(parts[0].trimmingCharacters(in: .whitespaces)),
           let b = Double(parts[1].trimmingCharacters(in: .whitespaces)) {
            fMin = a; fMax = b
        } else {
            fMin = h * 0.6; fMax = h * 0.8
        }
        return PhotoSpec(
            id: id, name: names["ko"] ?? id,
            widthMM: w, heightMM: h,
            faceRatioMin: 0.50, faceRatioMax: 0.70,
            backgroundColor: "#FFFFFF",
            faceMin: fMin, faceMax: fMax,
            faceTarget: {
                let range = fMax - fMin
                let base = h >= 60 ? fMax - 1 : h >= 40 ? max(33.0, fMin + 1) : h * 0.70
                return min(max(base, fMin + 1), fMax - 1)
            }(),
            pxW: pw, pxH: ph
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
        "inspect": "IDPASS 검수",
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
        "countries_unit": "개국",
        "purpose": "문서 유형",
        "width": "가로",
        "height": "세로",
        "size": "사이즈",
        "output": "출력",
        "background": "배경",
        "standard": "표준",
        "processing": "얼굴 분석 중…",
        "no_face": "얼굴을 찾을 수 없습니다.\n정면 사진을 사용해 주세요.",
        "tip1": "균일한 조명", "tip2": "단색 배경 권장",
        "tip3": "안경·모자 금지", "tip4": "정면, 무표정",
        "tip5": "그림자 없이", "tip6": "어깨까지 보이게",
        "coach_ok": "모든 항목이 규격 범위 내입니다.",
        "coach_small": "얼굴 크기 {v}mm — 범위 미달. 확대하세요.",
        "coach_large": "얼굴 크기 {v}mm — 범위 초과. 축소하세요.",
        "coach_eye_low": "눈 위치 {v}% — 허용(40~48%) 미달. 아래로 이동하세요.",
        "coach_eye_high": "눈 위치 {v}% — 허용(40~48%) 초과. 위로 이동하세요.",
        "coach_coverage": "어깨/팔 부위가 부족합니다. 하단 슬라이더를 +로 조정하세요.",
        "coach_center": "좌우 중심 {v}mm 이탈. 반대쪽으로 이동하세요.",
        "reset_crop": "↻ 초기화",
        "crop_confirm": "이대로 크롭",
        "landing_tagline": "증명사진, ",
        "landing_tagline_accent": "다 통과.",
        "landing_sub": "200개국 규격 · 서버 전송 없음 · 완전 무료",
        "landing_transform_title": "셀카 한 장이\n증명사진이 됩니다",
        "landing_process_title": "사진 한 장이면\n끝납니다",
        "landing_p1": "국가 · 규격 선택",
        "landing_p1_desc": "200개국 여권 / 비자 / 면허 규격 내장",
        "landing_p2": "사진 업로드",
        "landing_p2_desc": "갤러리에서 선택 · 서버 전송 없음",
        "landing_p3": "배경 제거 + 자동 크롭",
        "landing_p3_desc": "AI 누끼 처리 · ICAO 규격 자동 맞춤",
        "landing_p4": "IDPASS 검수 → PASS",
        "landing_p4_desc": "6단계 자동 검수 · 통과 시 즉시 저장",
        "landing_why_title": "왜 무료인가요?",
        "landing_trust1": "사진이 서버에 전송되지 않습니다",
        "landing_trust2": "광고 없음 · 인앱결제 없음 · 진짜 무료",
        "landing_trust3": "MONKOS AI가 만든 글로벌 증명사진 도구",
        "landing_cta": "시작하기 →",
        "landing_cta_sub": "로그인 불필요 · 완전 무료",
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
        "inspect": "IDPASS Inspect",
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
        "countries_unit": " countries",
        "purpose": "Document Type",
        "width": "Width",
        "height": "Height",
        "size": "Size",
        "output": "Output",
        "background": "Background",
        "standard": "Standard",
        "processing": "Analyzing face…",
        "no_face": "No face detected.\nPlease use a front-facing photo.",
        "tip1": "Even lighting", "tip2": "Plain background",
        "tip3": "No glasses or hats", "tip4": "Face forward, neutral",
        "tip5": "No shadows on face", "tip6": "Shoulders visible",
        "coach_ok": "All metrics are within spec.",
        "coach_small": "Face size {v}mm — below range. Zoom in.",
        "coach_large": "Face size {v}mm — above range. Zoom out.",
        "coach_eye_low": "Eye position {v}% — below 40~48%. Move down.",
        "coach_eye_high": "Eye position {v}% — above 40~48%. Move up.",
        "coach_coverage": "Shoulders/arms not fully visible. Use the slider (+) below.",
        "coach_center": "Center offset {v}mm. Move to opposite side.",
        "reset_crop": "↻ Reset",
        "crop_confirm": "Crop this",
        "landing_tagline": "ID photos, ",
        "landing_tagline_accent": "all pass.",
        "landing_sub": "200+ countries · No server upload · 100% free",
        "landing_transform_title": "One selfie becomes\nan ID photo",
        "landing_process_title": "One photo.\nThat's it.",
        "landing_p1": "Select country & spec",
        "landing_p1_desc": "200+ passport / visa / license specs built-in",
        "landing_p2": "Upload photo",
        "landing_p2_desc": "From gallery · No server transfer",
        "landing_p3": "BG remove + auto crop",
        "landing_p3_desc": "AI segmentation · ICAO auto-fit",
        "landing_p4": "IDPASS inspect → PASS",
        "landing_p4_desc": "6-step auto inspection · Instant save",
        "landing_why_title": "Why free?",
        "landing_trust1": "Photos never leave your device",
        "landing_trust2": "No ads · No IAP · Truly free",
        "landing_trust3": "Built by MONKOS AI — global ID photo tool",
        "landing_cta": "Start →",
        "landing_cta_sub": "No login · 100% free",
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
        "inspect": "IDPASS 検査",
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
        "countries_unit": "ヶ国",
        "purpose": "書類の種類",
        "width": "幅",
        "height": "高さ",
        "size": "サイズ",
        "output": "出力",
        "background": "背景",
        "standard": "標準",
        "processing": "顔分析中…",
        "no_face": "顔が見つかりません。\n正面の写真を使用してください。",
        "tip1": "均一な照明", "tip2": "単色の背景",
        "tip3": "眼鏡・帽子なし", "tip4": "正面、無表情",
        "tip5": "影なし", "tip6": "肩まで写る",
        "coach_ok": "すべての項目が規格範囲内です。",
        "coach_small": "顔サイズ {v}mm — 範囲未満。拡大してください。",
        "coach_large": "顔サイズ {v}mm — 範囲超過。縮小してください。",
        "coach_eye_low": "目の位置 {v}% — 許容(40~48%)未満。下へ移動。",
        "coach_eye_high": "目の位置 {v}% — 許容(40~48%)超過。上へ移動。",
        "coach_coverage": "肩・腕が不足しています。下のスライダーを+へ調整してください。",
        "coach_center": "左右中心 {v}mm 逸脱。反対側へ移動。",
        "reset_crop": "↻ リセット",
        "crop_confirm": "このままクロップ",
        "landing_tagline": "証明写真、",
        "landing_tagline_accent": "全部通過。",
        "landing_sub": "200ヶ国規格 · サーバー送信なし · 完全無料",
        "landing_transform_title": "セルフィー1枚が\n証明写真になります",
        "landing_process_title": "写真1枚で\n完了です",
        "landing_p1": "国 · 規格選択",
        "landing_p1_desc": "200ヶ国 パスポート / ビザ / 免許規格内蔵",
        "landing_p2": "写真アップロード",
        "landing_p2_desc": "ギャラリーから · サーバー送信なし",
        "landing_p3": "背景除去 + 自動クロップ",
        "landing_p3_desc": "AI切り抜き · ICAO規格自動適用",
        "landing_p4": "IDPASS検査 → PASS",
        "landing_p4_desc": "6段階自動検査 · 合格時即保存",
        "landing_why_title": "なぜ無料？",
        "landing_trust1": "写真はサーバーに送信されません",
        "landing_trust2": "広告なし · アプリ内課金なし · 本当に無料",
        "landing_trust3": "MONKOS AIが作ったグローバル証明写真ツール",
        "landing_cta": "始める →",
        "landing_cta_sub": "ログイン不要 · 完全無料",
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
    (3, ["ko": "배경", "en": "BG", "ja": "背景"]),
    (4, ["ko": "크롭", "en": "CROP", "ja": "クロップ"]),
    (5, ["ko": "완료", "en": "DONE", "ja": "完了"]),
]

let purposeList: [(id: String, icon: String, names: [String: String])] = [
    ("passport", "🛂", ["ko": "여권", "en": "Passport", "ja": "パスポート"]),
    ("visa",     "📋", ["ko": "비자", "en": "Visa", "ja": "ビザ"]),
    ("license",  "🚗", ["ko": "면허", "en": "License", "ja": "免許"]),
    ("custom",   "⚙️", ["ko": "기타", "en": "Custom", "ja": "カスタム"]),
]

let bgOptions: [BgOption] = [
    BgOption(id: "white", hex: "FFFFFF", names: ["ko": "백색", "en": "White", "ja": "白"]),
    BgOption(id: "offw",  hex: "F5F5F5", names: ["ko": "오프화이트", "en": "Off-white", "ja": "オフホワイト"]),
    BgOption(id: "ivory", hex: "FFFFF0", names: ["ko": "미색", "en": "Ivory", "ja": "アイボリー"]),
    BgOption(id: "grey",  hex: "E0E0E0", names: ["ko": "회색", "en": "Grey", "ja": "グレー"]),
    BgOption(id: "ltblue", hex: "D6EAF8", names: ["ko": "연파랑", "en": "Light Blue", "ja": "淡い青"]),
    BgOption(id: "blue",  hex: "7BA3C9", names: ["ko": "블루", "en": "Blue", "ja": "ブルー"]),
]

// MARK: - JSONL → Country loader

private func flagEmoji(_ code: String) -> String {
    let base: UInt32 = 0x1F1E6
    return code.uppercased().unicodeScalars.compactMap {
        Unicode.Scalar(base + $0.value - Unicode.Scalar("A").value)
    }.map { String($0) }.joined()
}

private func icaoDefault(id: String, ko: String, en: String, ja: String) -> [DocSpec] {
    [DocSpec(id: "\(id)-passport", type: "passport",
             names: ["ko": "여권", "en": "Passport", "ja": "パスポート"],
             size: "35 × 45 mm", px: "413 × 531 px", group: "A",
             headHeight: "32–36 mm", standard: "ICAO 9303"),
     DocSpec(id: "\(id)-visa", type: "visa",
             names: ["ko": "비자", "en": "Visa", "ja": "ビザ"],
             size: "35 × 45 mm", px: "413 × 531 px", group: "A",
             headHeight: "32–36 mm", standard: "ICAO 9303")]
}

private func parseDoc(_ d: [String: Any]) -> DocSpec? {
    guard let id = d["id"] as? String,
          let type = d["type"] as? String else { return nil }
    let ko = d["ko"] as? String ?? type
    let en = d["en"] as? String ?? type
    let ja = d["ja"] as? String ?? type
    let sz = (d["size"] as? String ?? "35x45").components(separatedBy: "x")
    let px = (d["px"] as? String ?? "413x531").components(separatedBy: "x")
    let head = d["head"] as? String ?? ""
    let std = d["std"] as? String ?? "ICAO 9303"
    let w = sz.first ?? "35", h = sz.last ?? "45"
    let pw = px.first ?? "413", ph = px.last ?? "531"
    let headStr = head.isEmpty ? "—" : "\(head) mm".replacingOccurrences(of: "-", with: "–")
    let sizeStr = "\(w) × \(h) mm"
    let pxStr = "\(pw) × \(ph) px"
    let wv = Double(w) ?? 35, hv = Double(h) ?? 45
    let group = wv == hv ? "C" : hv >= 60 ? "D" : wv <= 30 ? "B" : "A"

    var warn: [String: String]? = nil
    if let w = d["warning"] as? [String: String] { warn = w }

    return DocSpec(id: id, type: type,
                   names: ["ko": ko, "en": en, "ja": ja],
                   size: sizeStr, px: pxStr, group: group,
                   headHeight: headStr, standard: std, warning: warn)
}

let appCountries: [Country] = {
    #if canImport(UIKit)
    let bundle = Bundle.main
    #else
    let bundle = Bundle.module
    #endif
    guard let url = bundle.url(forResource: "countries", withExtension: "jsonl"),
          let data = try? String(contentsOf: url, encoding: .utf8) else { return [] }
    return data.components(separatedBy: .newlines).compactMap { line -> Country? in
        let trimmed = line.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty,
              let jsonData = trimmed.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any],
              let id = obj["id"] as? String,
              let ko = obj["ko"] as? String,
              let en = obj["en"] as? String,
              let ja = obj["ja"] as? String,
              let continent = obj["continent"] as? String else { return nil }

        let flag = flagEmoji(id)
        var docs: [DocSpec] = []
        if let rawDocs = obj["docs"] as? [[String: Any]], !rawDocs.isEmpty {
            docs = rawDocs.compactMap { parseDoc($0) }
        }
        if docs.isEmpty {
            docs = icaoDefault(id: id, ko: ko, en: en, ja: ja)
        }
        return Country(id: id, flag: flag,
                       names: ["ko": ko, "en": en, "ja": ja],
                       continent: continent, docs: docs)
    }
}()

// MARK: - CropState (웹 crop.js pts + imgPos + imgScale 이식)

struct CropState {
    var crown: CGPoint = .zero
    var chin: CGPoint = .zero
    var leftPupil: CGPoint = .zero
    var rightPupil: CGPoint = .zero
    var noseTip: CGPoint = .zero
    var mouthCenter: CGPoint = .zero
    var imgOffset: CGSize = .zero
    var imgScale: CGFloat = 1.0
    var natW: CGFloat = 1
    var natH: CGFloat = 1

    var faceCenterX: CGFloat {
        let eyeMid = (leftPupil.x + rightPupil.x) / 2
        return (eyeMid + noseTip.x + mouthCenter.x) / 3
    }

    mutating func moveAll(dx: CGFloat, dy: CGFloat) {
        crown.x += dx; crown.y += dy
        chin.x += dx; chin.y += dy
        leftPupil.x += dx; leftPupil.y += dy
        rightPupil.x += dx; rightPupil.y += dy
        noseTip.x += dx; noseTip.y += dy
        mouthCenter.x += dx; mouthCenter.y += dy
    }

    mutating func rescaleAll(newScale: CGFloat, oldScale: CGFloat, cx: CGFloat, cy: CGFloat) {
        let r = newScale / oldScale
        func rs(_ pt: CGPoint) -> CGPoint { CGPoint(x: cx + (pt.x - cx) * r, y: cy + (pt.y - cy) * r) }
        crown = rs(crown); chin = rs(chin)
        leftPupil = rs(leftPupil); rightPupil = rs(rightPupil)
        noseTip = rs(noseTip); mouthCenter = rs(mouthCenter)
        imgScale = newScale
    }
}

struct CropMetrics {
    let faceMm: CGFloat
    let topMm: CGFloat
    let bottomMm: CGFloat
    let eyeRatio: CGFloat
    let eyePct: CGFloat
    let centerOffsetMm: CGFloat
    let faceSignal: Signal
    let eyeSignal: Signal
    let topSignal: Signal
    let btmSignal: Signal
    let centerSignal: Signal
    let isBlocked: Bool
    var coverageShort: Bool = false
}

func computeMetrics(state: CropState, frameH: CGFloat, spec: PhotoSpec) -> CropMetrics {
    let MM = frameH / spec.heightMM
    let frameW = frameH * spec.widthMM / spec.heightMM
    let faceMm = (state.chin.y - state.crown.y) / MM
    let topMm = state.crown.y / MM
    let bottomMm = spec.heightMM - topMm - faceMm
    let eyeY = (state.leftPupil.y + state.rightPupil.y) / 2
    let eyeRatio = eyeY / frameH
    let centerOffMm = abs(state.faceCenterX - frameW / 2) / MM

    let fRange = spec.faceMax - spec.faceMin
    let fSweetMin = spec.faceMin + fRange * 0.2
    let fSweetMax = spec.faceMax - fRange * 0.2
    let fs: Signal = faceMm >= fSweetMin && faceMm <= fSweetMax ? .pass : faceMm >= spec.faceMin && faceMm <= spec.faceMax ? .warn : .fail
    let tall = spec.heightMM >= 60
    let es: Signal = tall
        ? (eyeRatio >= 0.40 && eyeRatio <= 0.48 ? .pass : eyeRatio >= 0.38 && eyeRatio <= 0.50 ? .warn : .fail)
        : (eyeRatio >= 0.43 && eyeRatio <= 0.45 ? .pass : eyeRatio >= 0.40 && eyeRatio <= 0.48 ? .warn : .fail)
    let ts: Signal = tall
        ? (topMm >= 10 && topMm <= 20 ? .pass : topMm >= 5 && topMm <= 25 ? .warn : .fail)
        : (topMm >= 3 && topMm <= 7 ? .pass : topMm >= 2 && topMm <= 10 ? .warn : .fail)
    let bs: Signal = tall
        ? (bottomMm >= 10 && bottomMm <= 25 ? .pass : bottomMm >= 5 && bottomMm <= 30 ? .warn : .fail)
        : (bottomMm >= 4 && bottomMm <= 10 ? .pass : bottomMm >= 2 && bottomMm <= 12 ? .warn : .fail)
    let cs: Signal = centerOffMm < 1 ? .pass : centerOffMm < 2 ? .warn : .fail
    let blocked = faceMm < spec.faceMin || faceMm > spec.faceMax || eyeRatio < 0.40 || eyeRatio > 0.48

    return CropMetrics(faceMm: faceMm, topMm: topMm, bottomMm: bottomMm,
                       eyeRatio: eyeRatio, eyePct: eyeRatio * 100,
                       centerOffsetMm: centerOffMm,
                       faceSignal: fs, eyeSignal: es, topSignal: ts, btmSignal: bs,
                       centerSignal: cs, isBlocked: blocked)
}

func cropAutoPlace(face: FaceDetectionResult, frameW: CGFloat, frameH: CGFloat, spec: PhotoSpec) -> CropState {
    let MM = frameH / spec.heightMM
    let natW = face.imageWidth, natH = face.imageHeight
    let covS = max(frameW / natW, frameH / natH)
    let baseW = natW * covS, baseH = natH * covS
    let offX = (baseW - frameW) / 2, offY = (baseH - frameH) / 2

    func toC(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: x * covS - offX, y: y * covS - offY) }

    let crownY = face.eyeCenterY - (face.chinY - face.eyeCenterY)
    let crC = toC(face.eyeCenterX, crownY)
    let chC = toC(face.eyeCenterX, face.chinY)
    let elC = toC(face.leftEyeX, face.leftEyeY)
    let erC = toC(face.rightEyeX, face.rightEyeY)

    let faceHC = chC.y - crC.y
    let targetPx = spec.faceTarget * MM
    let sc = targetPx / faceHC

    let eyeYC = (elC.y + erC.y) / 2
    let eyeTarget: CGFloat = spec.heightMM >= 60 ? 0.42 : 0.43
    let posY = eyeTarget * frameH - frameH / 2 - (eyeYC - frameH / 2) * sc
    let faceCXC = (elC.x + erC.x) / 2
    let posX = -(faceCXC - frameW / 2) * sc

    func toF(_ cp: CGPoint) -> CGPoint {
        CGPoint(x: frameW / 2 + (cp.x - frameW / 2) * sc + posX,
                y: frameH / 2 + (cp.y - frameH / 2) * sc + posY)
    }

    // 코/입 좌표 (landmarks 있으면 사용, 없으면 눈-턱 사이 추정)
    let noseImg: CGPoint
    let mouthImg: CGPoint
    if let lm = face.landmarks, !lm.nose.isEmpty, !lm.outerLips.isEmpty {
        let nosePt = lm.nose[lm.nose.count / 2]
        noseImg = nosePt
        let mx = lm.outerLips.map(\.x).reduce(0, +) / CGFloat(lm.outerLips.count)
        let my = lm.outerLips.map(\.y).reduce(0, +) / CGFloat(lm.outerLips.count)
        mouthImg = CGPoint(x: mx, y: my)
    } else {
        let midX = face.eyeCenterX
        noseImg = CGPoint(x: midX, y: face.eyeCenterY + (face.chinY - face.eyeCenterY) * 0.45)
        mouthImg = CGPoint(x: midX, y: face.eyeCenterY + (face.chinY - face.eyeCenterY) * 0.75)
    }
    let noseC = toC(noseImg.x, noseImg.y)
    let mouthC = toC(mouthImg.x, mouthImg.y)

    return CropState(crown: toF(crC), chin: toF(chC),
                     leftPupil: toF(elC), rightPupil: toF(erC),
                     noseTip: toF(noseC), mouthCenter: toF(mouthC),
                     imgOffset: CGSize(width: posX, height: posY),
                     imgScale: sc, natW: natW, natH: natH)
}

func cropCoachingMessage(m: CropMetrics, spec: PhotoSpec, lang: String) -> String? {
    if m.coverageShort {
        return tr("coach_coverage", lang)
    }
    if m.faceMm < spec.faceMin {
        return tr("coach_small", lang).replacingOccurrences(of: "{v}", with: String(format: "%.1f", m.faceMm))
    }
    if m.faceMm > spec.faceMax {
        return tr("coach_large", lang).replacingOccurrences(of: "{v}", with: String(format: "%.1f", m.faceMm))
    }
    if m.eyeRatio < 0.40 {
        return tr("coach_eye_low", lang).replacingOccurrences(of: "{v}", with: String(format: "%.0f", m.eyePct))
    }
    if m.eyeRatio > 0.48 {
        return tr("coach_eye_high", lang).replacingOccurrences(of: "{v}", with: String(format: "%.0f", m.eyePct))
    }
    if m.centerOffsetMm >= 1.5 {
        return tr("coach_center", lang).replacingOccurrences(of: "{v}", with: String(format: "%.1f", m.centerOffsetMm))
    }
    return nil
}

struct SpecData {
    static let specs: [PhotoSpec] = appCountries.flatMap { $0.docs.map { $0.photoSpec } }
}
