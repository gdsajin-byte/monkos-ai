package ai.monkos.idpass.data

/**
 * Simple i18n lookup with fallback chain: lang -> "ko" -> key.
 */
fun tr(key: String, lang: String): String {
    return i18nStrings[lang]?.get(key)
        ?: i18nStrings["ko"]?.get(key)
        ?: key
}

/**
 * Object wrapper for backward compatibility.
 */
object I18n {
    fun tr(key: String, lang: String = "ko"): String = ai.monkos.idpass.data.tr(key, lang)
}

private val i18nStrings: Map<String, Map<String, String>> = mapOf(
    "ko" to mapOf(
        // Navigation / Steps
        "select_country" to "국가 선택",
        "upload_photo" to "사진 업로드",
        "bg_remove" to "배경 제거",
        "crop_adjust" to "규격 조정",
        "done" to "완료",
        "download" to "다운로드",
        "next" to "다음",
        "back" to "이전",
        "start_over" to "처음으로",
        "search" to "검색...",

        // Document types
        "passport" to "여권",
        "visa" to "비자",
        "license" to "면허",
        "custom" to "커스텀",

        // Spec / Face labels
        "face_note" to "얼굴 크기",
        "spec_guide" to "규격 가이드",
        "photo_tips" to "촬영 가이드",

        // Tips
        "tip_1" to "정면을 바라보세요",
        "tip_2" to "자연스러운 표정",
        "tip_3" to "어깨까지 보이게",
        "tip_4" to "배경이 단색일수록 좋아요",
        "tip_5" to "안경 벗기 권장",
        "tip_6" to "그림자 없는 조명",

        // Status
        "save_success" to "사진이 저장되었습니다",
        "no_face" to "얼굴을 찾을 수 없습니다",
        "processing" to "처리 중...",
        "ready" to "규격 적합",
        "adjust" to "조정 필요",

        // Metric labels
        "eye" to "눈",
        "face" to "얼굴",
        "top" to "상단",
        "bottom" to "하단",

        // Coaching messages
        "coach_ok" to "규격에 적합합니다! 다운로드하세요.",
        "coach_small" to "얼굴이 작습니다. 확대하세요.",
        "coach_large" to "얼굴이 큽니다. 축소하세요.",
        "coach_eye_low" to "눈 위치가 낮습니다.",
        "coach_eye_high" to "눈 위치가 높습니다.",
        "coach_center" to "얼굴을 중앙에 맞추세요.",
        "coach_coverage" to "사진이 프레임을 다 채우지 못합니다.",

        // Crop buttons
        "reset_crop" to "↻ 초기화",
        "crop_confirm" to "이대로 크롭",

        // Hero / Landing
        "hero_title" to "AI 증명사진",
        "hero_sub" to "글로벌 규격 · 무료 · 광고 없음",

        // Result screen
        "select_bg" to "배경색 선택",
        "crop_another" to "다른 사진 크롭",
        "result_title" to "완성!",
        "before_after" to "비포 / 애프터",

        // Legacy keys for backward compatibility
        "app_title" to "IDPASS",
        "hero_subtitle" to "글로벌 규격 · 무료 · 광고 없음",
        "select_doc" to "서류 선택",
        "bg_color" to "배경색",
        "save_gallery" to "갤러리에 저장",
        "dimensions" to "크기",
        "pixels" to "픽셀",
        "standard" to "표준",
        "face_size" to "얼굴 크기",
        "tip1" to "정면을 바라보세요",
        "tip2" to "자연스러운 표정",
        "tip3" to "균일한 조명",
        "tip4" to "흰 배경 권장",
        "tip5" to "안경 반사 주의",
        "tip6" to "최근 6개월 이내 촬영",
        "powered_by" to "MONKOS AI",
        "asia" to "아시아",
        "europe" to "유럽",
        "americas" to "아메리카",
        "africa" to "아프리카",
        "oceania" to "오세아니아",
        "middleeast" to "중동",
        "eye_pct" to "눈높이",
        "face_mm" to "얼굴",
        "top_mm" to "상단",
        "btm_mm" to "하단",
        "custom_w" to "가로(mm)",
        "custom_h" to "세로(mm)",
        "custom_dpi" to "DPI",
        "warning" to "주의사항",
        "success_saved" to "저장되었습니다",
        "landing_tagline" to "증명사진, ",
        "landing_tagline_accent" to "다 통과.",
        "landing_sub" to "글로벌 규격 · 서버 전송 없음 · 완전 무료",
        "select_desc" to "증명사진 규격을 선택하세요",
        "upload_desc" to "아래 규격을 참고하여 정면 사진을 올려주세요",
        "choose_gallery" to "갤러리에서 선택",
        "use_spec" to "이 규격으로 시작",
        "width" to "가로",
        "height" to "세로",
        "output" to "출력",
        "ratio" to "비율",
        "free" to "무료",
        "size" to "사이즈",
        "bg_desc" to "배경색을 선택하세요",
        "saved" to "저장됐어요.",
        "background" to "배경",
        "slider_drag" to "밀어서, ",
        "slider_accent" to "차이를 보세요.",
        "slider_sub" to "전문 스튜디오 수준의 AI 포토그래피",
        "slider_compare" to "← DRAG TO COMPARE",
        "slider_cta" to "monkos.ai 보기",
    ),
    "en" to mapOf(
        // Navigation / Steps
        "select_country" to "Select Country",
        "upload_photo" to "Upload Photo",
        "bg_remove" to "Background",
        "crop_adjust" to "Adjust",
        "done" to "Done",
        "download" to "Download",
        "next" to "Next",
        "back" to "Back",
        "start_over" to "Start Over",
        "search" to "Search...",

        // Document types
        "passport" to "Passport",
        "visa" to "Visa",
        "license" to "License",
        "custom" to "Custom",

        // Spec / Face labels
        "face_note" to "Face size",
        "spec_guide" to "Spec Guide",
        "photo_tips" to "Photo Tips",

        // Tips
        "tip_1" to "Face the camera directly",
        "tip_2" to "Natural expression",
        "tip_3" to "Show shoulders",
        "tip_4" to "Solid background preferred",
        "tip_5" to "Remove glasses if possible",
        "tip_6" to "Even lighting, no shadows",

        // Status
        "save_success" to "Photo saved",
        "no_face" to "No face detected",
        "processing" to "Processing...",
        "ready" to "READY",
        "adjust" to "ADJUST",

        // Metric labels
        "eye" to "EYE",
        "face" to "FACE",
        "top" to "TOP",
        "bottom" to "BTM",

        // Coaching messages
        "coach_ok" to "Meets specs! Download now.",
        "coach_small" to "Face too small. Zoom in.",
        "coach_large" to "Face too large. Zoom out.",
        "coach_eye_low" to "Eyes too low.",
        "coach_eye_high" to "Eyes too high.",
        "coach_center" to "Center the face.",
        "coach_coverage" to "Photo does not fill the frame.",

        // Crop buttons
        "reset_crop" to "↻ Reset",
        "crop_confirm" to "Crop this",

        // Hero / Landing
        "hero_title" to "AI ID Photo",
        "hero_sub" to "Global specs · Free · No ads",

        // Result screen
        "select_bg" to "Select Background",
        "crop_another" to "Crop Another",
        "result_title" to "Done!",
        "before_after" to "Before / After",

        // Legacy keys
        "app_title" to "IDPASS",
        "hero_subtitle" to "Global Specs · Free · No Ads",
        "select_doc" to "Select Document",
        "bg_color" to "Background",
        "save_gallery" to "Save to Gallery",
        "dimensions" to "Dimensions",
        "pixels" to "Pixels",
        "standard" to "Standard",
        "face_size" to "Face Size",
        "tip1" to "Look straight ahead",
        "tip2" to "Natural expression",
        "tip3" to "Even lighting",
        "tip4" to "White background preferred",
        "tip5" to "Avoid glare on glasses",
        "tip6" to "Taken within 6 months",
        "powered_by" to "MONKOS AI",
        "asia" to "Asia",
        "europe" to "Europe",
        "americas" to "Americas",
        "africa" to "Africa",
        "oceania" to "Oceania",
        "middleeast" to "Middle East",
        "eye_pct" to "EYE%",
        "face_mm" to "FACE",
        "top_mm" to "TOP",
        "btm_mm" to "BTM",
        "custom_w" to "Width(mm)",
        "custom_h" to "Height(mm)",
        "custom_dpi" to "DPI",
        "warning" to "Warning",
        "success_saved" to "Saved successfully",
        "landing_tagline" to "ID photos, ",
        "landing_tagline_accent" to "all pass.",
        "landing_sub" to "Global specs · No server upload · 100% free",
        "select_desc" to "Choose your ID photo specification",
        "upload_desc" to "Refer to the spec guide below and upload a front-facing photo",
        "choose_gallery" to "Choose from Gallery",
        "use_spec" to "Use this spec",
        "width" to "Width",
        "height" to "Height",
        "output" to "Output",
        "ratio" to "ratio",
        "free" to "FREE",
        "size" to "Size",
        "bg_desc" to "Pick a background color",
        "saved" to "It's saved.",
        "background" to "Background",
        "slider_drag" to "Swipe to ",
        "slider_accent" to "see the difference.",
        "slider_sub" to "Studio-quality AI photography",
        "slider_compare" to "← DRAG TO COMPARE",
        "slider_cta" to "Visit monkos.ai",
    ),
    "ja" to mapOf(
        // Navigation / Steps
        "select_country" to "国を選択",
        "upload_photo" to "写真アップロード",
        "bg_remove" to "背景除去",
        "crop_adjust" to "規格調整",
        "done" to "完了",
        "download" to "ダウンロード",
        "next" to "次へ",
        "back" to "戻る",
        "start_over" to "最初から",
        "search" to "検索...",

        // Document types
        "passport" to "パスポート",
        "visa" to "ビザ",
        "license" to "免許",
        "custom" to "カスタム",

        // Spec / Face labels
        "face_note" to "顔サイズ",
        "spec_guide" to "規格ガイド",
        "photo_tips" to "撮影ガイド",

        // Tips
        "tip_1" to "正面を向いてください",
        "tip_2" to "自然な表情",
        "tip_3" to "肩まで見えるように",
        "tip_4" to "無地の背景がベスト",
        "tip_5" to "メガネを外すことを推奨",
        "tip_6" to "影のない均一な照明",

        // Status
        "save_success" to "写真が保存されました",
        "no_face" to "顔が検出されません",
        "processing" to "処理中...",
        "ready" to "規格適合",
        "adjust" to "調整必要",

        // Metric labels
        "eye" to "目",
        "face" to "顔",
        "top" to "上部",
        "bottom" to "下部",

        // Coaching messages
        "coach_ok" to "規格に適合！ダウンロードしてください。",
        "coach_small" to "顔が小さすぎます。拡大してください。",
        "coach_large" to "顔が大きすぎます。縮小してください。",
        "coach_eye_low" to "目の位置が低い。",
        "coach_eye_high" to "目の位置が高い。",
        "coach_center" to "顔を中央に合わせてください。",
        "coach_coverage" to "写真がフレームを埋めていません。",

        // Crop buttons
        "reset_crop" to "↻ リセット",
        "crop_confirm" to "このままクロップ",

        // Hero / Landing
        "hero_title" to "AI証明写真",
        "hero_sub" to "グローバル規格・無料・広告なし",

        // Result screen
        "select_bg" to "背景色を選択",
        "crop_another" to "別の写真をクロップ",
        "result_title" to "完成！",
        "before_after" to "ビフォー / アフター",

        // Legacy keys
        "app_title" to "IDPASS",
        "hero_subtitle" to "グローバル規格 · 無料 · 広告なし",
        "select_doc" to "書類を選択",
        "bg_color" to "背景色",
        "save_gallery" to "ギャラリーに保存",
        "dimensions" to "サイズ",
        "pixels" to "ピクセル",
        "standard" to "規格",
        "face_size" to "顔サイズ",
        "tip1" to "正面を向いてください",
        "tip2" to "自然な表情",
        "tip3" to "均一な照明",
        "tip4" to "白背景推奨",
        "tip5" to "メガネの反射に注意",
        "tip6" to "6ヶ月以内に撮影",
        "powered_by" to "MONKOS AI",
        "asia" to "アジア",
        "europe" to "ヨーロッパ",
        "americas" to "アメリカ",
        "africa" to "アフリカ",
        "oceania" to "オセアニア",
        "middleeast" to "中東",
        "eye_pct" to "目の高さ",
        "face_mm" to "顔",
        "top_mm" to "上部",
        "btm_mm" to "下部",
        "custom_w" to "幅(mm)",
        "custom_h" to "高さ(mm)",
        "custom_dpi" to "DPI",
        "warning" to "注意",
        "success_saved" to "保存されました",
        "landing_tagline" to "証明写真、",
        "landing_tagline_accent" to "全部通過。",
        "landing_sub" to "グローバル規格 · サーバー送信なし · 完全無料",
        "select_desc" to "証明写真の規格を選択してください",
        "upload_desc" to "下の規格を参考に正面写真をアップロードしてください",
        "choose_gallery" to "ギャラリーから選択",
        "use_spec" to "この規格で開始",
        "width" to "幅",
        "height" to "高さ",
        "output" to "出力",
        "ratio" to "比率",
        "free" to "無料",
        "size" to "サイズ",
        "bg_desc" to "背景色を選択してください",
        "saved" to "保存しました。",
        "background" to "背景",
        "slider_drag" to "スワイプして、",
        "slider_accent" to "違いを確認。",
        "slider_sub" to "スタジオ品質のAIフォトグラフィー",
        "slider_compare" to "← DRAG TO COMPARE",
        "slider_cta" to "monkos.ai を見る",
    )
)
