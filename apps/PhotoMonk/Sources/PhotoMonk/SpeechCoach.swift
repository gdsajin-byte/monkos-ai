import AVFoundation

class SpeechCoach: ObservableObject {

    @Published var enabled: Bool = true

    private let synth = AVSpeechSynthesizer()
    private var lastMessage: String = ""
    private var lastSpoke: CFAbsoluteTime = 0
    private let cooldown: CFTimeInterval = 3.0
    var locale: String = "ko-KR"

    func speak(_ message: String, force: Bool = false) {
        guard enabled else { return }

        let now = CFAbsoluteTimeGetCurrent()
        if !force && message == lastMessage && now - lastSpoke < cooldown { return }

        if synth.isSpeaking { synth.stopSpeaking(at: .word) }

        let utterance = AVSpeechUtterance(string: message)
        utterance.voice = AVSpeechSynthesisVoice(language: locale)
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 1.1
        utterance.pitchMultiplier = 1.0
        synth.speak(utterance)

        lastMessage = message
        lastSpoke = now
    }

    func stop() {
        if synth.isSpeaking { synth.stopSpeaking(at: .immediate) }
    }

    // MARK: - Sequence TTS (i18n)

    private var ttsTable: [String: [Int: String]] {
        [
            "ko-KR": [
                0: "좋아요, 촬영합니다",
                1: "그대로 표정 부드럽게",
                2: "카메라 봐주세요",
                3: "삼", 4: "이", 5: "일",
                -1: "앗, 다시 한번 준비해주세요",
            ],
            "ja-JP": [
                0: "いいですね、撮影します",
                1: "そのまま、表情を柔らかく",
                2: "カメラを見てください",
                3: "さん", 4: "に", 5: "いち",
                -1: "もう一度準備してください",
            ],
            "en-US": [
                0: "Great, taking the photo",
                1: "Hold still, relax your expression",
                2: "Look at the camera",
                3: "three", 4: "two", 5: "one",
                -1: "Let's try again",
            ],
        ]
    }

    func sequenceMessage(_ step: Int) -> String {
        ttsTable[locale]?[step] ?? ttsTable["ko-KR"]?[step] ?? ""
    }
}
