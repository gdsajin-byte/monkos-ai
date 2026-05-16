import SwiftUI
import PhotosUI

// MARK: - Screen Routing

enum Screen: Equatable {
    case landing, step(Int), thanks
}

// MARK: - ContentView (V1 Router)

struct ContentView: View {
    @State private var screen: Screen = .landing
    @State private var country: Country = appCountries[0]
    @State private var doc: DocSpec = appCountries[0].docs[0]
    @State private var purpose = "passport"
    @State private var search = ""
    @State private var customW = "35"
    @State private var customH = "45"
    @State private var customDPI = 300
    @State private var bgColor: BgOption = bgOptions[0]
    @State private var inputImage: PlatformImage?
    @State private var normalizedImage: PlatformImage?
    @State private var croppedImage: PlatformImage?
    @State private var faceResult: FaceDetectionResult?
    @State private var isProcessing = false
    @State private var errorMsg: String?
    @State private var saved = false
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var cropState = CropState()
    @State private var cropStateReady = false
    @State private var step4FrameSize: CGSize = CGSize(width: 300, height: 400)
    @State private var lastDragT: CGSize = .zero
    @State private var crownDragBase: CGFloat? = nil
    @StateObject private var inspection = InspectionState()
    @State private var selectedContinent: String? = nil

    private var lang: String {
        let l = Locale.current.language.languageCode?.identifier ?? "en"
        return ["ko", "ja"].contains(l) ? l : "en"
    }

    var body: some View {
        ZStack {
            V1.bg.ignoresSafeArea()

            switch screen {
            case .landing:
                LandingView(lang: lang, onStart: { screen = .step(1) }, onSelectType: { type in
                    purpose = type
                    screen = .step(1)
                })

            case .step(let n):
                VStack(spacing: 0) {
                    V1TopBar(lang: lang, step: n, onStep: { screen = .step($0) }, onHome: { screen = .landing })

                    ZStack {
                        switch n {
                        case 1: step1
                        case 2: step2
                        case 3: step3
                        case 4: step4
                        case 5: step5
                        default: EmptyView()
                        }
                    }
                    .frame(maxHeight: .infinity)
                }

            case .thanks:
                thanksView
            }
        }
        .preferredColorScheme(.dark)
        .animation(.easeInOut(duration: 0.25), value: screen)
        #if os(macOS)
        .buttonStyle(.plain)
        .frame(width: 393, height: 852)
        .onAppear {
            NSApplication.shared.windows.forEach { w in
                w.backgroundColor = NSColor(red: 0.02, green: 0.03, blue: 0.055, alpha: 1)
                w.isOpaque = true
                w.setContentSize(NSSize(width: 393, height: 852))
                w.styleMask.remove(.resizable)
            }
        }
        #endif
    }

    // MARK: - Step 1 — Select

    private var step1: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 3) {
                Text(tr("select_country", lang))
                    .font(.system(size: 24, weight: .heavy))
                    .foregroundStyle(V1.text)
                Text(tr("select_desc", lang))
                    .font(.system(size: 12))
                    .foregroundStyle(V1.muted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20).padding(.bottom, 12)


            if purpose == "custom" {
                // 기타: 직접 입력
                VStack(spacing: 12) {
                    HStack(spacing: 10) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(tr("width", lang)).font(.system(size: 10, weight: .bold)).foregroundStyle(V1.muted)
                            HStack(spacing: 4) {
                                TextField("35", text: $customW)
                                    .font(.system(size: 16, weight: .heavy, design: .monospaced))
                                    .foregroundStyle(V1.text)
                                    .textFieldStyle(.plain)
                                    .frame(width: 50)
                                Text("mm").font(.system(size: 10)).foregroundStyle(V1.dim)
                            }
                            .padding(.horizontal, 10).padding(.vertical, 8)
                            .background(RoundedRectangle(cornerRadius: 8).fill(V1.card))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(V1.border, lineWidth: 1))
                        }
                        Text("×").font(.system(size: 20, weight: .bold)).foregroundStyle(V1.dim)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(tr("height", lang)).font(.system(size: 10, weight: .bold)).foregroundStyle(V1.muted)
                            HStack(spacing: 4) {
                                TextField("45", text: $customH)
                                    .font(.system(size: 16, weight: .heavy, design: .monospaced))
                                    .foregroundStyle(V1.text)
                                    .textFieldStyle(.plain)
                                    .frame(width: 50)
                                Text("mm").font(.system(size: 10)).foregroundStyle(V1.dim)
                            }
                            .padding(.horizontal, 10).padding(.vertical, 8)
                            .background(RoundedRectangle(cornerRadius: 8).fill(V1.card))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(V1.border, lineWidth: 1))
                        }
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("DPI").font(.system(size: 10, weight: .bold)).foregroundStyle(V1.muted)
                        HStack(spacing: 6) {
                            ForEach([72, 300, 600], id: \.self) { dpi in
                                let sel = customDPI == dpi
                                Button { customDPI = dpi } label: {
                                    Text("\(dpi)")
                                        .font(.system(size: 13, weight: .heavy, design: .monospaced))
                                        .foregroundStyle(sel ? Color(hex: "05080E") : V1.muted)
                                        .frame(maxWidth: .infinity).frame(height: 36)
                                        .background(RoundedRectangle(cornerRadius: 8).fill(sel ? V1.accent : V1.card))
                                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(sel ? V1.accent : V1.border, lineWidth: 1))
                                }
                            }
                        }
                    }

                    let cw = Double(customW) ?? 35, ch = Double(customH) ?? 45
                    let cpx = Int(cw / 25.4 * Double(customDPI)), cpy = Int(ch / 25.4 * Double(customDPI))
                    HStack {
                        Text(tr("output", lang)).font(.system(size: 10)).foregroundStyle(V1.muted)
                        Spacer()
                        Text("\(cpx) × \(cpy) px")
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .foregroundStyle(V1.accent)
                    }
                    .padding(10)
                    .background(RoundedRectangle(cornerRadius: 8).fill(V1.card))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(V1.border, lineWidth: 1))
                }
                .padding(.horizontal, 20)

                Spacer()

                AccentButton(title: "\(tr("use_spec", lang)) →") {
                    let cw = Double(customW) ?? 35, ch = Double(customH) ?? 45
                    let cpx = cw / 25.4 * Double(customDPI), cpy = ch / 25.4 * Double(customDPI)
                    doc = DocSpec(id: "custom", type: "custom",
                                 names: ["ko": "커스텀", "en": "Custom", "ja": "カスタム"],
                                 size: "\(Int(cw)) × \(Int(ch)) mm", px: "\(Int(cpx)) × \(Int(cpy)) px",
                                 group: "X", headHeight: "32–36 mm", standard: "Custom")
                    country = Country(id: "custom", flag: "🌐",
                                      names: ["ko": "커스텀", "en": "Custom", "ja": "カスタム"],
                                      docs: [doc])
                    screen = .step(2)
                }
                .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 12)

            } else {
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 14))
                        .foregroundStyle(V1.dim)
                    TextField(tr("search", lang), text: $search)
                        .font(.system(size: 12))
                        .foregroundStyle(V1.text)
                        .textFieldStyle(.plain)
                }
                .padding(.horizontal, 12).padding(.vertical, 9)
                .background(RoundedRectangle(cornerRadius: 8).fill(V1.card))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(V1.border, lineWidth: 1))
                .padding(.horizontal, 20).padding(.bottom, 10)

                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 12) {
                        if !search.isEmpty {
                            let cols = [GridItem(.flexible(), spacing: 6), GridItem(.flexible(), spacing: 6)]
                            LazyVGrid(columns: cols, spacing: 6) {
                                ForEach(filteredCountries) { c in
                                    let matchDocs = c.docs.filter { $0.type == purpose || (purpose == "passport" && $0.type == "id") }
                                    if !matchDocs.isEmpty { countryCard(c) }
                                }
                            }
                        } else if let selCont = selectedContinent {
                            let groups = groupedByContinent(filteredCountries)
                            if let group = groups.first(where: { $0.id == selCont }) {
                                let groupCountries = group.countries.filter { c in
                                    c.docs.contains { $0.type == purpose || (purpose == "passport" && $0.type == "id") }
                                }

                                Button {
                                    withAnimation(.easeInOut(duration: 0.25)) { selectedContinent = nil }
                                } label: {
                                    HStack(spacing: 6) {
                                        Image(systemName: "chevron.left")
                                            .font(.system(size: 10, weight: .bold))
                                        Text(group.name(lang))
                                            .font(.system(size: 13, weight: .bold))
                                        Text("· \(groupCountries.count)\(tr("countries_unit", lang))")
                                            .font(.system(size: 11))
                                            .foregroundStyle(V1.dim)
                                        Spacer()
                                    }
                                    .foregroundStyle(V1.text)
                                }

                                let cols = [GridItem(.flexible(), spacing: 6), GridItem(.flexible(), spacing: 6)]
                                LazyVGrid(columns: cols, spacing: 6) {
                                    ForEach(groupCountries) { c in
                                        countryCard(c)
                                    }
                                }
                            }
                        } else {
                            let groups = groupedByContinent(filteredCountries)
                            let cols = [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)]
                            LazyVGrid(columns: cols, spacing: 8) {
                                ForEach(groups) { group in
                                    let cnt = group.countries.filter { c in
                                        c.docs.contains { $0.type == purpose || (purpose == "passport" && $0.type == "id") }
                                    }.count
                                    if cnt > 0 {
                                        Button {
                                            withAnimation(.easeInOut(duration: 0.25)) { selectedContinent = group.id }
                                        } label: {
                                            ZStack(alignment: .topTrailing) {
                                                VStack(alignment: .leading, spacing: 2) {
                                                    Spacer()
                                                    Text(group.names["en"] ?? "")
                                                        .font(.system(size: 8, weight: .heavy, design: .monospaced))
                                                        .foregroundStyle(Color(hex: group.dot).opacity(0.8))
                                                        .textCase(.uppercase)
                                                    Text(group.name(lang))
                                                        .font(.system(size: 18, weight: .heavy))
                                                        .foregroundStyle(.white)
                                                    Text("\(cnt)\(tr("countries_unit", lang))")
                                                        .font(.system(size: 11))
                                                        .foregroundStyle(.white.opacity(0.6))
                                                }
                                                .frame(maxWidth: .infinity, alignment: .leading)
                                                .padding(12)

                                                Circle()
                                                    .fill(Color(hex: group.dot))
                                                    .frame(width: 10, height: 10)
                                                    .padding(10)
                                            }
                                            .frame(height: 110)
                                            .background(
                                                LinearGradient(
                                                    colors: [Color(hex: group.gradA), Color(hex: group.gradB)],
                                                    startPoint: .topLeading, endPoint: .bottomTrailing
                                                )
                                            )
                                            .clipShape(RoundedRectangle(cornerRadius: 12))
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                }
                .scrollContentBackground(.hidden)

                if let warn = doc.warning?[lang] ?? doc.warning?["en"] {
                    Text(warn)
                        .font(.system(size: 10))
                        .foregroundStyle(Color(hex: "FFB020"))
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(RoundedRectangle(cornerRadius: 8).fill(Color(hex: "FFB020").opacity(0.08)))
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "FFB020").opacity(0.3), lineWidth: 1))
                        .padding(.horizontal, 20)
                }

                AccentButton(title: "\(tr("use_spec", lang)) →") { screen = .step(2) }
                    .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 12)
            }
        }
    }

    private var filteredCountries: [Country] {
        let base = appCountries.filter { c in
            c.docs.contains { $0.type == purpose || (purpose == "passport" && $0.type == "id") }
        }
        guard !search.isEmpty else { return base }
        let q = search.lowercased()
        return base.filter {
            $0.name(lang).lowercased().contains(q) ||
            $0.name("en").lowercased().contains(q)
        }
    }

    @ViewBuilder
    private func countryRow(_ c: Country) -> some View {
        let matchDocs = c.docs.filter { $0.type == purpose || (purpose == "passport" && $0.type == "id") }
        if let firstDoc = matchDocs.first {
            let sel = country.id == c.id && matchDocs.contains(where: { $0.id == doc.id })
            Button {
                country = c
                doc = firstDoc
            } label: {
                HStack(spacing: 10) {
                    Text(c.flag).font(.system(size: 22))
                    VStack(alignment: .leading, spacing: 1) {
                        Text(c.name(lang))
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(V1.text)
                        Text("\(firstDoc.name(lang)) · \(firstDoc.size.replacingOccurrences(of: " mm", with: ""))")
                            .font(.system(size: 9, design: .monospaced))
                            .foregroundStyle(V1.dim)
                    }
                    Spacer()
                    Text(firstDoc.size.replacingOccurrences(of: " mm", with: ""))
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundStyle(sel ? V1.accent : V1.muted)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(RoundedRectangle(cornerRadius: 3).fill(sel ? V1.accent.opacity(0.08) : .clear))
                        .overlay(RoundedRectangle(cornerRadius: 3).stroke(sel ? V1.accent.opacity(0.26) : V1.border, lineWidth: 1))
                }
                .padding(.horizontal, 12).padding(.vertical, 10)
                .background(RoundedRectangle(cornerRadius: 10).fill(sel ? V1.accent.opacity(0.06) : V1.card))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(sel ? V1.accent.opacity(0.4) : V1.border, lineWidth: 1))
            }
        }
    }

    @ViewBuilder
    private func countryCard(_ c: Country) -> some View {
        let matchDocs = c.docs.filter { $0.type == purpose || (purpose == "passport" && $0.type == "id") }
        if let firstDoc = matchDocs.first {
            let sel = country.id == c.id && matchDocs.contains(where: { $0.id == doc.id })
            Button {
                country = c
                doc = firstDoc
            } label: {
                HStack(spacing: 8) {
                    Text(c.flag).font(.system(size: 24))
                    VStack(alignment: .leading, spacing: 1) {
                        Text(c.name(lang))
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(V1.text)
                            .lineLimit(1)
                        Text("\(firstDoc.name(lang)) · \(firstDoc.size.replacingOccurrences(of: " mm", with: ""))")
                            .font(.system(size: 8, design: .monospaced))
                            .foregroundStyle(V1.dim)
                    }
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 10).padding(.vertical, 10)
                .background(RoundedRectangle(cornerRadius: 10).fill(sel ? V1.accent.opacity(0.06) : V1.card))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(sel ? V1.accent.opacity(0.4) : V1.border, lineWidth: 1))
            }
        }
    }

    // MARK: - Step 2 — Upload

    private var step2: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                BackButton { screen = .step(1) }
                SpecBadge(country: country, doc: doc, lang: lang)
                Spacer()
            }
            .padding(.horizontal, 20).padding(.bottom, 10)

            VStack(alignment: .leading, spacing: 3) {
                Text(tr("upload_photo", lang))
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundStyle(V1.text)
                Text(tr("upload_desc", lang))
                    .font(.system(size: 12))
                    .foregroundStyle(V1.muted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20).padding(.bottom, 14)

            // Upload area
            VStack(spacing: 4) {
                Image(systemName: "person.crop.rectangle")
                    .font(.system(size: 60, weight: .ultraLight))
                    .foregroundStyle(V1.accent.opacity(0.5))
                Text("FACE • EYE LINE • SHOULDER")
                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                    .foregroundStyle(V1.muted)
                    .tracking(0.5)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(V1.card)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .strokeBorder(V1.accent.opacity(0.2), style: StrokeStyle(lineWidth: 1.5, dash: [8, 5]))
                    )
            )
            .padding(.horizontal, 20)

            // Tips
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Text("💡")
                    Text(tr("photo_tips", lang).uppercased())
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundStyle(V1.accent)
                        .tracking(0.5)
                }
                let tips = ["tip1", "tip2", "tip3", "tip4", "tip5", "tip6"].map { tr($0, lang) }
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 3) {
                    ForEach(tips, id: \.self) { tip in
                        HStack(spacing: 4) {
                            Text("›").font(.system(size: 11, weight: .bold)).foregroundStyle(V1.accent)
                            Text(tip).font(.system(size: 10)).foregroundStyle(V1.muted)
                            Spacer()
                        }
                    }
                }
            }
            .padding(12)
            .background(RoundedRectangle(cornerRadius: 12).fill(V1.card))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(V1.border, lineWidth: 1))
            .padding(.horizontal, 20).padding(.top, 10)

            // Buttons
            HStack(spacing: 6) {
                Button {} label: {
                    HStack(spacing: 4) {
                        Text("📸")
                        Text(tr("take_photo", lang))
                    }
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(V1.text)
                    .frame(maxWidth: .infinity).frame(height: 46)
                    .background(RoundedRectangle(cornerRadius: 12).fill(V1.card))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(V1.border, lineWidth: 1))
                }

                PhotosPicker(selection: $selectedPhoto, matching: .images) {
                    HStack(spacing: 4) {
                        Text("🖼")
                        Text(tr("choose_gallery", lang))
                    }
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(Color(hex: "05080E"))
                    .frame(maxWidth: .infinity).frame(height: 46)
                    .background(RoundedRectangle(cornerRadius: 12).fill(V1.accent))
                    .shadow(color: V1.accent.opacity(0.2), radius: 7)
                }
            }
            .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 12)
        }
        .overlay {
            if isProcessing {
                ZStack {
                    V1.bg.opacity(0.85).ignoresSafeArea()
                    VStack(spacing: 12) {
                        ProgressView()
                            .tint(V1.accent)
                            .scaleEffect(1.5)
                        Text(tr("processing", lang))
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .foregroundStyle(V1.accent)
                    }
                }
            }
        }
        .onChange(of: selectedPhoto) { item in
            guard let item else { return }
            Task { await loadPhoto(item) }
            selectedPhoto = nil
        }
        .alert(tr("no_face", lang), isPresented: Binding(
            get: { errorMsg != nil },
            set: { if !$0 { errorMsg = nil } }
        )) {
            Button("OK") { errorMsg = nil }
        }
    }

    private func loadPhoto(_ item: PhotosPickerItem) async {
        guard let data = try? await item.loadTransferable(type: Data.self),
              let loadedImage = PlatformImage(data: data) else { return }

        inputImage = loadedImage
        isProcessing = true

        let normalized = loadedImage.normalizedImage()
        normalizedImage = normalized
        guard let face = await CropEngine.detectFace(in: normalized) else {
            isProcessing = false
            errorMsg = tr("no_face", lang)
            return
        }
        faceResult = face
        isProcessing = false
        saved = false
        screen = .step(3)
    }

    private func runBgRemoval() {
        guard let img = normalizedImage, faceResult != nil else { return }
        bgProcessing = true
        Task {
            let mask = await CropEngine.generatePersonMask(from: img)
            personMask = mask
            if let mask {
                bgRemovedImage = CropEngine.compositeBackground(original: img, mask: mask, bgHex: bgColor.hex)
            } else {
                bgRemovedImage = img
            }
            cropStateReady = false
            bgProcessing = false
            screen = .step(4)
        }
    }

    // MARK: - Step 3 — Background

    private var step3: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                BackButton { screen = .step(2) }
                SpecBadge(country: country, doc: doc, lang: lang)
                Spacer()
            }
            .padding(.horizontal, 20).padding(.bottom, 10)

            VStack(alignment: .leading, spacing: 3) {
                Text(tr("bg_remove", lang))
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundStyle(V1.text)
                Text(tr("bg_desc", lang))
                    .font(.system(size: 12))
                    .foregroundStyle(V1.muted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20).padding(.bottom, 14)

            // Preview (original photo)
            ZStack {
                bgColor.color
                if let img = normalizedImage {
                    Image(platformImage: img)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(V1.border, lineWidth: 1))
            .padding(.horizontal, 20)

            // Color picker
            HStack(spacing: 0) {
                ForEach(bgOptions) { c in
                    let sel = bgColor.id == c.id
                    VStack(spacing: 4) {
                        Circle()
                            .fill(c.color)
                            .frame(width: 32, height: 32)
                            .overlay(Circle().stroke(sel ? V1.accent : V1.border, lineWidth: 2))
                            .shadow(color: sel ? V1.accent.opacity(0.3) : .clear, radius: 5)
                        Text(c.name(lang))
                            .font(.system(size: 8, design: .monospaced))
                            .foregroundStyle(sel ? V1.accent : V1.muted)
                    }
                    .frame(maxWidth: .infinity)
                    .onTapGesture { bgColor = c }
                }
            }
            .padding(.vertical, 10).padding(.horizontal, 8)
            .background(RoundedRectangle(cornerRadius: 12).fill(V1.card))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(V1.border, lineWidth: 1))
            .padding(.horizontal, 20).padding(.top, 12)

            AccentButton(title: "\(tr("bg_remove", lang)) →") {
                runBgRemoval()
            }
            .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 12)
        }
        .overlay {
            if bgProcessing {
                ZStack {
                    V1.bg.opacity(0.85).ignoresSafeArea()
                    VStack(spacing: 12) {
                        ProgressView()
                            .tint(V1.accent)
                            .scaleEffect(1.5)
                        Text("VISION · SEGMENTING…")
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .foregroundStyle(V1.accent)
                            .tracking(1)
                    }
                }
            }
        }
    }

    // MARK: - Step 4 — Frame-fixed + Image-movable (웹 crop.js 이식)

    private var curMetrics: CropMetrics {
        guard cropStateReady, step4FrameSize.height > 10 else {
            return CropMetrics(faceMm: 34, topMm: 5, bottomMm: 6, eyeRatio: 0.43, eyePct: 43, centerOffsetMm: 0, faceSignal: .pass, eyeSignal: .pass, topSignal: .pass, btmSignal: .pass, centerSignal: .pass, isBlocked: false)
        }
        var m = computeMetrics(state: cropState, frameH: step4FrameSize.height, spec: doc.photoSpec)
        if let img = bgRemovedImage {
            let fw = step4FrameSize.width, fh = step4FrameSize.height
            let nw = CGFloat(img.platformCGImage?.width ?? 1)
            let nh = CGFloat(img.platformCGImage?.height ?? 1)
            let cs = max(fw / nw, fh / nh)
            let dispW = nw * cs * cropState.imgScale
            let dispH = nh * cs * cropState.imgScale
            if dispW < fw - 2 || dispH < fh - 2 {
                m.coverageShort = true
            }
        }
        return m
    }

    private var step4: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                BackButton { screen = .step(3) }
                SpecBadge(country: country, doc: doc, lang: lang)
                Spacer()
            }
            .padding(.horizontal, 14).padding(.bottom, 4)

            if doc.type != "custom" {
                if let msg = cropCoachingMessage(m: curMetrics, spec: doc.photoSpec, lang: lang) {
                    Text(msg)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(Color(hex: "FFB020"))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 20).padding(.vertical, 6)
                } else {
                    Text(tr("coach_ok", lang))
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(V1.accent)
                        .padding(.horizontal, 20).padding(.vertical, 6)
                }
            }

            ZStack {
                bgColor.color

                if let img = bgRemovedImage {
                    GeometryReader { geo in
                        let fw = geo.size.width, fh = geo.size.height
                        let nw = CGFloat(img.platformCGImage?.width ?? 1)
                        let nh = CGFloat(img.platformCGImage?.height ?? 1)
                        let cs = max(fw / nw, fh / nh)
                        let bw = nw * cs, bh = nh * cs

                        Image(platformImage: img)
                            .resizable()
                            .frame(width: bw * cropState.imgScale, height: bh * cropState.imgScale)
                            .position(x: fw / 2 + cropState.imgOffset.width,
                                      y: fh / 2 + cropState.imgOffset.height)
                            .allowsHitTesting(false)
                            .onAppear {
                                step4FrameSize = geo.size
                                if !cropStateReady, let face = faceResult {
                                    cropState = cropAutoPlace(face: face, frameW: fw, frameH: fh, spec: doc.photoSpec)
                                    cropStateReady = true
                                }
                            }
                            .onChange(of: geo.size) { newSize in
                                step4FrameSize = newSize
                            }
                    }
                }

                if cropStateReady && doc.type != "custom" {
                    GuideOverlay(state: $cropState, metrics: curMetrics, spec: doc.photoSpec)
                        .allowsHitTesting(false)

                    GeometryReader { geo in
                        let h = geo.size.height
                        Color.clear
                            .frame(height: h / 4)
                            .contentShape(Rectangle())
                            #if os(macOS)
                            .onHover { hovering in
                                if hovering { NSCursor.resizeUpDown.push() } else { NSCursor.pop() }
                            }
                            #endif
                            .gesture(DragGesture()
                                .onChanged { v in
                                    if crownDragBase == nil { crownDragBase = cropState.crown.y }
                                    cropState.crown.y = max(2, min(cropState.chin.y - 20, crownDragBase! + v.translation.height))
                                }
                                .onEnded { _ in crownDragBase = nil })
                    }
                }

                CornerBrackets()
                    .allowsHitTesting(false)

                VStack {
                    HStack {
                        if doc.type != "custom" {
                            Text(curMetrics.isBlocked ? "ADJUST" : "READY")
                                .font(.system(size: 8, weight: .bold, design: .monospaced)).tracking(1)
                                .foregroundStyle(curMetrics.isBlocked ? Color(hex: "FFB020") : V1.accent)
                                .padding(.horizontal, 7).padding(.vertical, 3)
                                .background(RoundedRectangle(cornerRadius: 4).fill(.black.opacity(0.6)))
                        }
                        Spacer()
                        Text(doc.size.replacingOccurrences(of: " mm", with: "mm"))
                            .font(.system(size: 8, design: .monospaced)).foregroundStyle(V1.muted)
                            .padding(.horizontal, 7).padding(.vertical, 3)
                            .background(RoundedRectangle(cornerRadius: 4).fill(.black.opacity(0.6)))
                    }
                    .padding(8)
                    Spacer()
                }
            }
            .aspectRatio(doc.photoSpec.widthMM / doc.photoSpec.heightMM, contentMode: .fit)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .contentShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(V1.accent, lineWidth: 1.5))
            .shadow(color: V1.accent.opacity(0.2), radius: 10)
            .gesture(DragGesture()
                .onChanged { v in
                    let dx = v.translation.width - lastDragT.width
                    let dy = v.translation.height - lastDragT.height
                    cropState.imgOffset.width += dx
                    cropState.imgOffset.height += dy
                    cropState.moveAll(dx: dx, dy: dy)
                    lastDragT = v.translation

                    if doc.type != "custom" {
                        let MM = step4FrameSize.height / doc.photoSpec.heightMM
                        let frameCX = step4FrameSize.width / 2
                        let offMm = abs(cropState.faceCenterX - frameCX) / MM
                        if offMm < 0.3 {
                            let snap = frameCX - cropState.faceCenterX
                            cropState.imgOffset.width += snap
                            cropState.moveAll(dx: snap, dy: 0)
                        }
                    }
                }
                .onEnded { _ in lastDragT = .zero })
            #if os(macOS)
            .onHover { hovering in
                if hovering { NSCursor.openHand.push() } else { NSCursor.pop() }
            }
            #endif
            .padding(.horizontal, 14)

            if doc.type != "custom" {
                HStack(spacing: 4) {
                    MetricBox(label: "EYE", value: String(format: "%.1f", curMetrics.eyePct), unit: "%", active: cropStateReady, signal: curMetrics.eyeSignal)
                    MetricBox(label: "FACE", value: String(format: "%.1f", curMetrics.faceMm), unit: "mm", active: cropStateReady, signal: curMetrics.faceSignal)
                    MetricBox(label: "TOP", value: String(format: "%.1f", curMetrics.topMm), unit: "mm", active: cropStateReady, signal: curMetrics.topSignal)
                    MetricBox(label: "BTM", value: String(format: "%.1f", curMetrics.bottomMm), unit: "mm", active: cropStateReady, signal: curMetrics.btmSignal)
                }
                .padding(.horizontal, 14).padding(.top, 8)
            }

            HStack(spacing: 8) {
                Text("−").font(.system(size: 14, weight: .bold, design: .monospaced)).foregroundStyle(V1.muted)
                Slider(value: Binding(
                    get: { cropState.imgScale },
                    set: { nv in
                        let old = cropState.imgScale
                        cropState.rescaleAll(newScale: nv, oldScale: old, cx: step4FrameSize.width / 2, cy: step4FrameSize.height / 2)
                    }
                ), in: 0.3...4.0, step: 0.01).tint(V1.accent)
                Text("+").font(.system(size: 14, weight: .bold, design: .monospaced)).foregroundStyle(V1.muted)
                Text(String(format: "×%.2f", cropState.imgScale))
                    .font(.system(size: 10, weight: .bold, design: .monospaced)).foregroundStyle(V1.accent)
                    .frame(width: 44)
            }
            .padding(.horizontal, 14).padding(.top, 8)

            HStack(spacing: 6) {
                Button {
                    if let face = faceResult {
                        cropState = cropAutoPlace(face: face, frameW: step4FrameSize.width, frameH: step4FrameSize.height, spec: doc.photoSpec)
                    }
                } label: {
                    Text(tr("reset_crop", lang))
                        .font(.system(size: 12, weight: .heavy)).foregroundStyle(V1.accent)
                        .padding(.horizontal, 14).padding(.vertical, 11)
                        .background(RoundedRectangle(cornerRadius: 10).fill(V1.accent.opacity(0.08)))
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(V1.accent, lineWidth: 1.5))
                }
                AccentButton(title: "\(tr("crop_confirm", lang)) →", enabled: doc.type == "custom" || !curMetrics.isBlocked) {
                    performFinalCrop()
                    screen = .step(5)
                }
            }
            .padding(.horizontal, 14).padding(.top, 8).padding(.bottom, 12)
        }
    }

    private func performFinalCrop() {
        guard let img = bgRemovedImage, let cgImage = img.platformCGImage else { return }
        let spec = doc.photoSpec
        let fw = step4FrameSize.width, fh = step4FrameSize.height
        let natW = cropState.natW, natH = cropState.natH
        let covS = max(fw / natW, fh / natH)
        let displayW = natW * covS
        let displayH = natH * covS
        let s = cropState.imgScale

        // Step4에서 이미지는 .position(fw/2 + off.w, fh/2 + off.h) + .frame(displayW*s, displayH*s)
        // 이미지 좌상 화면좌표 = (fw/2 + off.w - displayW*s/2, fh/2 + off.h - displayH*s/2)
        // 프레임 (0,0)의 이미지 원본 좌표:
        //   imgX = (0 - imgLeftScreen) / (covS * s)
        //   imgY = (0 - imgTopScreen) / (covS * s)
        let imgLeft = fw / 2 + cropState.imgOffset.width - displayW * s / 2
        let imgTop = fh / 2 + cropState.imgOffset.height - displayH * s / 2
        let pixelScale = covS * s

        let cropX = (0 - imgLeft) / pixelScale
        let cropY = (0 - imgTop) / pixelScale
        let cropW = fw / pixelScale
        let cropH = fh / pixelScale

        let cx = max(0, cropX)
        let cy = max(0, cropY)
        let cw = min(cropW, natW - cx)
        let ch = min(cropH, natH - cy)

        let outputW = spec.pxW
        let outputH = spec.pxH

        let ciImg = CIImage(cgImage: cgImage)
        // CIImage: bottom-left origin
        let ciY = natH - cy - ch
        let cropped = ciImg.cropped(to: CGRect(x: cx, y: ciY, width: cw, height: ch))

        let sx = outputW / cw
        let sy = outputH / ch
        let scaled = cropped
            .transformed(by: CGAffineTransform(translationX: -cx, y: -ciY))
            .transformed(by: CGAffineTransform(scaleX: sx, y: sy))

        let ciCtx = CIContext()
        let outRect = CGRect(x: 0, y: 0, width: Int(outputW), height: Int(outputH))
        guard let finalCG = ciCtx.createCGImage(scaled, from: outRect) else { return }

        #if canImport(UIKit)
        croppedImage = UIImage(cgImage: finalCG)
        #else
        croppedImage = NSImage(cgImage: finalCG, size: NSSize(width: Int(outputW), height: Int(outputH)))
        #endif
    }

    @State private var bgProcessing = false
    @State private var bgRemovedImage: PlatformImage?
    @State private var personMask: CIImage?

    private func recompositeBackground() {
        guard let img = normalizedImage, let mask = personMask, let face = faceResult,
              let fullComposite = CropEngine.compositeBackground(original: img, mask: mask, bgHex: bgColor.hex),
              let recropped = CropEngine.crop(image: fullComposite, spec: doc.photoSpec, face: face) else { return }
        croppedImage = recropped
        bgRemovedImage = recropped
    }

    // MARK: - Step 5 — Done

    private var step5: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                BackButton { screen = .step(4) }
                Text("STEP 5 / 5")
                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                    .foregroundStyle(V1.muted)
                    .tracking(1)
                Spacer()
            }
            .padding(.horizontal, 20).padding(.bottom, 10)

            // Check icon
            VStack(spacing: 10) {
                ZStack {
                    Circle()
                        .fill(V1.accent.opacity(0.13))
                        .frame(width: 52, height: 52)
                    Circle()
                        .stroke(V1.accent, lineWidth: 2)
                        .frame(width: 52, height: 52)
                    Text("✓").font(.system(size: 28)).foregroundStyle(V1.accent)
                }
                Text(tr("done", lang))
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundStyle(V1.text)
                SpecBadge(country: country, doc: doc, lang: lang)
            }

            // Result preview
            if let img = croppedImage ?? bgRemovedImage {
                ZStack {
                    bgColor.color
                    Image(platformImage: img)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                    VStack {
                        HStack {
                            Text("IDPASS · VERIFIED")
                                .font(.system(size: 7, weight: .bold, design: .monospaced))
                                .foregroundStyle(Color(hex: "05080E"))
                                .tracking(1)
                                .padding(.horizontal, 5).padding(.vertical, 2)
                                .background(RoundedRectangle(cornerRadius: 2).fill(V1.accent))
                            Spacer()
                        }
                        .padding(4)
                        Spacer()
                    }
                }
                .frame(width: 180, height: 180 / doc.photoSpec.aspectRatio)
                .clipShape(RoundedRectangle(cornerRadius: 6))
                .overlay(RoundedRectangle(cornerRadius: 6).stroke(V1.accent, lineWidth: 2))
                .shadow(color: V1.accent.opacity(0.2), radius: 15)
                .padding(.top, 14)
            }

            // Spec details
            VStack(spacing: 0) {
                ForEach(Array(specDetails.enumerated()), id: \.offset) { i, pair in
                    if i > 0 { Divider().background(V1.border) }
                    HStack {
                        Text(pair.0).font(.system(size: 10)).foregroundStyle(V1.muted)
                        Spacer()
                        Text(pair.1)
                            .font(.system(size: 11, weight: .bold, design: .monospaced))
                            .foregroundStyle(V1.text)
                    }
                    .padding(.vertical, 4)
                }
            }
            .padding(12)
            .background(RoundedRectangle(cornerRadius: 10).fill(V1.card))
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(V1.border, lineWidth: 1))
            .padding(.horizontal, 20).padding(.top, 12)

            Spacer()

            AccentButton(title: "↓ \(tr("download", lang)) · \(tr("free", lang))") {
                if let img = croppedImage ?? bgRemovedImage {
                    saveToDisk(img)
                    saved = true
                }
                screen = .thanks
            }
            .padding(.horizontal, 20)

            Button {
                resetFlow()
                screen = .step(1)
            } label: {
                Text("↻ \(tr("crop_another", lang))")
                    .font(.system(size: 12))
                    .foregroundStyle(V1.muted)
                    .frame(maxWidth: .infinity).frame(height: 44)
                    .background(RoundedRectangle(cornerRadius: 12).stroke(V1.border, lineWidth: 1))
            }
            .padding(.horizontal, 20).padding(.top, 6).padding(.bottom, 12)
        }
    }

    private var specDetails: [(String, String)] {
        [
            (tr("size", lang), doc.size),
            (tr("output", lang), doc.px),
            (tr("background", lang), bgColor.name(lang)),
            (tr("standard", lang), doc.standard),
        ]
    }

    // MARK: - Thanks (Ad page)

    private var thanksView: some View {
        VStack(spacing: 0) {
            // Top bar
            HStack {
                HStack(spacing: 0) {
                    Text("ID")
                        .font(.system(size: 16, weight: .black))
                        .foregroundStyle(V1.text)
                    Text("PASS")
                        .font(.system(size: 16, weight: .black))
                        .foregroundStyle(V1.accent)
                }
                Spacer()
                Text("SAVED ✓")
                    .font(.system(size: 9, weight: .heavy, design: .monospaced))
                    .foregroundStyle(V1.accent)
                    .tracking(1.2)
                    .padding(.horizontal, 7).padding(.vertical, 3)
                    .background(V1.accent.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 3))
            }
            .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 14)

            // Saved header
            HStack(spacing: 12) {
                if let img = croppedImage ?? bgRemovedImage {
                    ZStack {
                        bgColor.color
                        Image(platformImage: img)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    }
                    .frame(width: 70, height: 90)
                    .clipShape(RoundedRectangle(cornerRadius: 4))
                    .overlay(RoundedRectangle(cornerRadius: 4).stroke(V1.accent, lineWidth: 1.5))
                    .shadow(color: V1.accent.opacity(0.2), radius: 6)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(tr("saved", lang))
                        .font(.system(size: 22, weight: .black))
                        .foregroundStyle(V1.text)
                    Text("\(country.flag) \(doc.size.replacingOccurrences(of: " mm", with: "mm")) · \(doc.standard)")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundStyle(V1.muted)
                        .tracking(0.3)
                }
                Spacer()
            }
            .padding(.horizontal, 20)

            // AI Studio Promo
            VStack(alignment: .leading, spacing: 0) {
                Text(tr("ai_tag", lang))
                    .font(.system(size: 9, weight: .heavy, design: .monospaced))
                    .foregroundStyle(V1.purple)
                    .tracking(1.5)
                    .padding(.horizontal, 7).padding(.vertical, 2)
                    .background(V1.purple.opacity(0.14))
                    .clipShape(RoundedRectangle(cornerRadius: 3))

                HStack(spacing: 0) {
                    Text(tr("ai_h1", lang) + "\n" + tr("ai_h2", lang))
                        .font(.system(size: 22, weight: .black))
                        .foregroundStyle(V1.text)
                    Text(tr("ai_price", lang))
                        .font(.system(size: 22, weight: .black))
                        .foregroundStyle(V1.purple)
                }
                .padding(.top, 10)

                Text(tr("ai_desc", lang))
                    .font(.system(size: 11))
                    .foregroundStyle(Color(hex: "A4B0C8"))
                    .padding(.top, 8)

                Button {} label: {
                    HStack(spacing: 6) {
                        Text(tr("ai_cta", lang))
                        Text("→")
                    }
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(Color(hex: "0A0F18"))
                    .padding(.horizontal, 14).padding(.vertical, 10)
                    .background(RoundedRectangle(cornerRadius: 8).fill(V1.purple))
                }
                .padding(.top, 12)
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(LinearGradient(
                        colors: [Color(hex: "1C1736"), Color(hex: "0F1224"), Color(hex: "0A0F18")],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    ))
            )
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(V1.purple.opacity(0.35), lineWidth: 1))
            .padding(.horizontal, 20).padding(.top, 18)

            Spacer()

            Button {
                resetFlow()
                screen = .step(1)
            } label: {
                Text("↻ \(tr("crop_another", lang))")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(V1.text)
                    .frame(maxWidth: .infinity).frame(height: 48)
                    .background(RoundedRectangle(cornerRadius: 12).stroke(V1.border, lineWidth: 1))
            }
            .padding(.horizontal, 20)

            HStack {
                Text("© 2026 IDPASS")
                Spacer()
                Text("idpass by monkos.ai · TERMS")
            }
            .font(.system(size: 8, design: .monospaced))
            .foregroundStyle(V1.dim)
            .tracking(0.5)
            .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 14)
        }
    }

    private func saveToDisk(_ image: PlatformImage) {
        #if canImport(UIKit)
        UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
        #else
        guard let cgImage = image.platformCGImage else { return }
        let desktop = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Desktop")
        let url = desktop.appendingPathComponent("MonkosCrop_\(Int(Date().timeIntervalSince1970)).jpg")
        guard let dest = CGImageDestinationCreateWithURL(url as CFURL, "public.jpeg" as CFString, 1, nil) else { return }
        CGImageDestinationAddImage(dest, cgImage, [kCGImageDestinationLossyCompressionQuality: 0.9] as CFDictionary)
        CGImageDestinationFinalize(dest)
        NSWorkspace.shared.selectFile(url.path, inFileViewerRootedAtPath: desktop.path)
        #endif
    }

    private func resetFlow() {
        inputImage = nil
        normalizedImage = nil
        croppedImage = nil
        bgRemovedImage = nil
        personMask = nil
        cropState = CropState()
        cropStateReady = false
        lastDragT = .zero
        faceResult = nil
        saved = false
        inspection.reset()
    }
}

// MARK: - Landing Demo State

class LandingDemoState: ObservableObject {
    @Published var showBrackets = false
    @Published var showScanLine = false
    @Published var scanY: CGFloat = 0.1
    @Published var showEyeDots = false
    @Published var showEyeGuide = false
    @Published var showBgFlash = false
    @Published var showAfterImage = false
    @Published var showChinGuide = false
    @Published var showCoach1 = false
    @Published var showCrownGuide = false
    @Published var showHeadMeasure = false
    @Published var showStamp = false
    @Published var showPassport = false
    @Published var cropScale: CGFloat = 1.0
    @Published var cropOffsetY: CGFloat = 0
    @Published var statusText = "READY"
    @Published var statusMode = 0
    @Published var stepText = ""
    @Published var showStep = false
    @Published var fadeBlack = false
    @Published var showBlur = false
    @Published var showEndCard = false

    private var workItems: [DispatchWorkItem] = []

    func start() {
        reset()
        // 1. Scan
        at(0.5) { self.showBrackets = true; self.statusText = "SCANNING"; self.statusMode = 1 }
        at(0.8) {
            self.showScanLine = true; self.scanY = 0.05
            withAnimation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true)) { self.scanY = 0.90 }
        }
        // 2. BG Remove
        at(2.5) {
            self.showScanLine = false
            self.statusText = "BG REMOVE"; self.showBgFlash = true
        }
        at(2.8) { withAnimation(.easeOut(duration: 0.8)) { self.showAfterImage = true }; self.showBgFlash = false }
        // 3. Crop — zoom into face
        at(3.8) {
            self.statusText = "CROP"
            withAnimation(.easeInOut(duration: 1.2)) { self.cropScale = 1.44; self.cropOffsetY = 0.136 }
        }
        // 4. Eye guide + EYE coach
        at(5.2) {
            self.statusText = "INSPECT"; self.statusMode = 1
            withAnimation(.easeOut(duration: 0.3)) { self.showEyeDots = true }
            withAnimation(.easeOut(duration: 0.4)) { self.showEyeGuide = true }
        }
        at(5.6) { withAnimation(.easeOut(duration: 0.3)) { self.showCoach1 = true } }
        // 5. Chin guide
        at(6.2) { self.showChinGuide = true }
        // 6. Crown guide
        at(6.8) { self.showCrownGuide = true }
        // 7. HEAD measure (crown→chin vertical line + label)
        at(7.4) { withAnimation(.easeOut(duration: 0.5)) { self.showHeadMeasure = true } }
        // 7. Passport appear (1초 여유 후)
        at(9.0) {
            self.showEyeDots = false; self.showEyeGuide = false
            self.showChinGuide = false; self.showCrownGuide = false
            self.showCoach1 = false; self.showHeadMeasure = false
            self.showBrackets = false
            withAnimation(.easeOut(duration: 0.7)) { self.showPassport = true }
        }
        // 8. PASS stamp on passport
        at(10.2) {
            self.statusText = "PASS"; self.statusMode = 2
            self.showStamp = true
        }
        // 9. Blur passport + remove stamp
        at(12.5) {
            self.showStamp = false
            withAnimation(.easeOut(duration: 0.8)) { self.showBlur = true }
        }
        // 10. Brand overlay on blurred passport
        at(13.3) {
            withAnimation(.easeIn(duration: 0.6)) { self.showEndCard = true }
        }
        // 11. Fade out → reset
        at(16.5) { withAnimation(.easeIn(duration: 0.8)) { self.fadeBlack = true } }
        at(17.3) { self.reset() }
        at(18.3) { self.start() }
    }

    func reset() {
        workItems.forEach { $0.cancel() }
        workItems.removeAll()
        showBrackets = false; showScanLine = false; scanY = 0.1
        showEyeDots = false; showEyeGuide = false
        showBgFlash = false; showAfterImage = false
        showChinGuide = false; showCoach1 = false
        showCrownGuide = false; showHeadMeasure = false
        showStamp = false; showPassport = false; showStep = false
        cropScale = 1.0; cropOffsetY = 0
        statusText = "READY"; statusMode = 0; stepText = ""
        fadeBlack = false; showBlur = false; showEndCard = false
    }

    private func at(_ seconds: Double, action: @escaping () -> Void) {
        let item = DispatchWorkItem { [weak self] in
            guard self != nil else { return }
            action()
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds, execute: item)
        workItems.append(item)
    }

    deinit { workItems.forEach { $0.cancel() } }

    // Debug: step-by-step mode
    @Published var debugStep = -1
    private let debugSteps: [(String, (LandingDemoState) -> Void)] = [
        ("READY", { s in s.reset() }),
        ("1 Scan", { s in
            s.showBrackets = true; s.statusText = "SCANNING"; s.statusMode = 1
            s.showScanLine = true; s.scanY = 0.05
            withAnimation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true)) { s.scanY = 0.90 }
        }),
        ("2 BG Remove", { s in
            s.showScanLine = false; s.statusText = "BG REMOVE"; s.statusMode = 1; s.showBgFlash = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                withAnimation(.easeOut(duration: 0.8)) { s.showAfterImage = true }; s.showBgFlash = false
            }
        }),
        ("3 Crop zoom", { s in
            s.statusText = "CROP"
            withAnimation(.easeInOut(duration: 1.2)) { s.cropScale = 1.44; s.cropOffsetY = 0.136 }
        }),
        ("4 Eye guide", { s in
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.3) {
                s.statusText = "INSPECT"; s.statusMode = 1
                withAnimation(.easeOut(duration: 0.3)) { s.showEyeDots = true }
                withAnimation(.easeOut(duration: 0.4)) { s.showEyeGuide = true }
            }
        }),
        ("4b Coach EYE", { s in withAnimation(.easeOut(duration: 0.3)) { s.showCoach1 = true } }),
        ("5 Chin guide", { s in s.showChinGuide = true }),
        ("6 Crown guide", { s in s.showCrownGuide = true }),
        ("7 HEAD measure", { s in withAnimation(.easeOut(duration: 0.5)) { s.showHeadMeasure = true } }),
        ("8 Passport", { s in
            s.showEyeDots = false; s.showEyeGuide = false
            s.showChinGuide = false; s.showCrownGuide = false
            s.showCoach1 = false; s.showHeadMeasure = false
            s.showBrackets = false
            withAnimation(.easeOut(duration: 0.7)) { s.showPassport = true }
        }),
        ("9 PASS stamp", { s in
            s.statusText = "PASS"; s.statusMode = 2
            s.showStamp = true
        }),
        ("10 Blur + remove stamp", { s in
            s.showStamp = false
            withAnimation(.easeOut(duration: 0.8)) { s.showBlur = true }
        }),
        ("11 Brand", { s in
            withAnimation(.easeIn(duration: 0.6)) { s.showEndCard = true }
        }),
        ("12 Fade out", { s in
            withAnimation(.easeIn(duration: 0.8)) { s.fadeBlack = true }
        }),
    ]

    var debugStepName: String {
        guard debugStep >= 0, debugStep < debugSteps.count else { return "—" }
        return "[\(debugStep)/\(debugSteps.count-1)] \(debugSteps[debugStep].0)"
    }

    func nextStep() {
        debugStep += 1
        if debugStep >= debugSteps.count { debugStep = 0; reset() }
        debugSteps[debugStep].1(self)
    }
}

// MARK: - Landing View

struct LandingView: View {
    let lang: String
    let onStart: () -> Void
    let onSelectType: (String) -> Void
    @StateObject private var demo = LandingDemoState()

    var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: 0) {
                heroSection
                serviceCardsSection
                ctaSection
                footerSection
            }
        }
        .overlay(alignment: .bottom) {
            if demo.debugStep >= 0 {
                Text(demo.debugStepName)
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundStyle(V1.accent)
                    .padding(6)
                    .background(.black.opacity(0.8))
                    .cornerRadius(4)
                    .padding(.bottom, 50)
            }
        }
        .onTapGesture(count: 2) { demo.reset(); demo.debugStep = -1 }
        .onTapGesture { demo.nextStep() }
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) { demo.start() }
        }
        .onDisappear { demo.reset() }
    }

    // MARK: Hero

    private var heroSection: some View {
        VStack(spacing: 0) {
            HStack(spacing: 6) {
                Circle().fill(V1.accent).frame(width: 6, height: 6)
                Text("FREE · NO ADS · NO LOGIN")
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundStyle(V1.accent)
                    .tracking(2)
            }
            .padding(.horizontal, 14).padding(.vertical, 5)
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(V1.accent.opacity(0.25), lineWidth: 1))
            .padding(.top, 50)

            HStack(spacing: 0) {
                Text("ID").font(.system(size: 54, weight: .black)).foregroundStyle(V1.text)
                Text("PASS").font(.system(size: 54, weight: .black)).foregroundStyle(V1.accent)
            }
            .tracking(3)
            .padding(.top, 24)

            Text("powered by MONKOS AI")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(V1.dim)
                .tracking(1.5)
                .padding(.top, 8)

            (Text(tr("landing_tagline", lang)) +
             Text(tr("landing_tagline_accent", lang)).foregroundColor(V1.accent))
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(V1.text)
                .padding(.top, 16)

            Text(tr("landing_sub", lang))
                .font(.system(size: 12))
                .foregroundStyle(V1.muted)
                .padding(.top, 6)

            phoneDemo.padding(.top, 28).padding(.bottom, 40)
        }
        .frame(maxWidth: .infinity)
        .background(
            RadialGradient(colors: [V1.accent.opacity(0.05), .clear],
                           center: .init(x: 0.5, y: 0.2), startRadius: 0, endRadius: 300)
        )
    }

    // MARK: Phone Demo

    private var phoneDemo: some View {
        ZStack {
            Color.black

            demoImage("be_f_1")
                .opacity(demo.showAfterImage ? 0 : 1)

            GeometryReader { geo in
                demoImage("bg_f_1")
                    .scaleEffect(demo.cropScale)
                    .offset(y: geo.size.height * demo.cropOffsetY)
            }
            .clipped()
            .opacity(demo.showAfterImage ? 1 : 0)

            Color.white.opacity(demo.showBgFlash ? 0.7 : 0)

            if demo.showScanLine {
                GeometryReader { geo in
                    Rectangle()
                        .fill(LinearGradient(colors: [.clear, V1.accent.opacity(0.8), V1.accent, V1.accent.opacity(0.8), .clear],
                                             startPoint: .leading, endPoint: .trailing))
                        .frame(height: 2)
                        .shadow(color: V1.accent.opacity(0.6), radius: 8, y: 0)
                        .offset(y: geo.size.height * demo.scanY)
                }
            }

            if demo.showBrackets { demoBrackets }
            if demo.showEyeDots { demoEyeDots }
            demoGuideLines
            demoCoachLabels

            VStack {
                HStack {
                    Text(demo.statusText)
                        .font(.system(size: 8, weight: .heavy, design: .monospaced))
                        .tracking(1.5)
                        .foregroundStyle(demo.statusMode == 2 ? Color(hex: "05080E") : V1.accent)
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(RoundedRectangle(cornerRadius: 4)
                            .fill(demo.statusMode == 2 ? V1.accent : .black.opacity(0.7)))
                    Spacer()
                }
                .padding(8)
                Spacer()
            }

            if demo.showPassport {
                demoImage("PASSPORTUSA")
                    .transition(.opacity)
            }

            if demo.showStamp {
                demoPassStamp
                    .transition(.scale(scale: 3.0).combined(with: .opacity))
                    .animation(.spring(response: 0.35, dampingFraction: 0.55), value: demo.showStamp)
            }

            if demo.showBlur {
                Rectangle()
                    .fill(.ultraThinMaterial)
                    .environment(\.colorScheme, .dark)
                    .opacity(0.85)
            }

            if demo.showEndCard {
                VStack(spacing: 8) {
                    HStack(spacing: 0) {
                        Text("ID").font(.system(size: 38, weight: .black)).foregroundStyle(V1.text)
                        Text("PASS").font(.system(size: 38, weight: .black)).foregroundStyle(V1.accent)
                    }
                    Text("powered by MONKOS AI")
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .foregroundStyle(V1.text.opacity(0.5))
                        .tracking(1)
                }
            }

            V1.bg.opacity(demo.fadeBlack ? 1 : 0)
        }
        .aspectRatio(1.0, contentMode: .fit)
        .frame(maxWidth: 260)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(V1.accent.opacity(0.3), lineWidth: 2))
        .shadow(color: V1.accent.opacity(0.12), radius: 40)
        .shadow(color: .black.opacity(0.6), radius: 30, y: 24)
    }

    @ViewBuilder
    private func demoImage(_ name: String) -> some View {
        #if canImport(UIKit)
        if let path = Bundle.main.path(forResource: name, ofType: "jpg"),
           let img = UIImage(contentsOfFile: path) {
            Image(uiImage: img).resizable().aspectRatio(contentMode: .fill)
        } else {
            Image(systemName: "person.fill").font(.system(size: 80)).foregroundStyle(V1.accent.opacity(0.15))
        }
        #else
        if let url = Bundle.module.url(forResource: name, withExtension: "jpg"),
           let img = NSImage(contentsOf: url) {
            Image(nsImage: img).resizable().aspectRatio(contentMode: .fill)
        } else {
            Image(systemName: "person.fill").font(.system(size: 80)).foregroundStyle(V1.accent.opacity(0.15))
        }
        #endif
    }

    private var sampleImageView: some View { demoImage("be_f_1") }

    private var demoBrackets: some View {
        GeometryReader { geo in
            let inset: CGFloat = 12, len: CGFloat = 22
            ForEach(0..<4, id: \.self) { i in
                let isRight = i % 2 == 1, isBottom = i >= 2
                Path { p in
                    let x = isRight ? geo.size.width - inset : inset
                    let y = isBottom ? geo.size.height - inset : inset
                    let dx: CGFloat = isRight ? -len : len
                    let dy: CGFloat = isBottom ? -len : len
                    p.move(to: CGPoint(x: x, y: y + dy))
                    p.addLine(to: CGPoint(x: x, y: y))
                    p.addLine(to: CGPoint(x: x + dx, y: y))
                }.stroke(V1.accent, lineWidth: 2)
            }
        }
    }

    private var demoEyeDots: some View {
        GeometryReader { geo in
            Circle().fill(V1.accent).frame(width: 7, height: 7)
                .shadow(color: V1.accent, radius: 6)
                .position(x: geo.size.width * 0.44, y: geo.size.height * 0.43)
            Circle().fill(V1.accent).frame(width: 7, height: 7)
                .shadow(color: V1.accent, radius: 6)
                .position(x: geo.size.width * 0.57, y: geo.size.height * 0.43)
        }
    }

    private var demoGuideLines: some View {
        GeometryReader { geo in
            if demo.showEyeGuide {
                demoGuideLine(y: geo.size.height * 0.43, w: geo.size.width, color: V1.accent).opacity(0.6)
                    .transition(.move(edge: .trailing))
            }
            if demo.showChinGuide {
                demoGuideLine(y: geo.size.height * 0.78, w: geo.size.width, color: V1.accent).opacity(0.6)
                    .transition(.move(edge: .trailing))
                demoCoachLabel("CHIN 78% ✓")
                    .position(x: geo.size.width - 50, y: geo.size.height * 0.78)
                    .transition(.move(edge: .trailing))
            }
            if demo.showCrownGuide {
                demoGuideLine(y: geo.size.height * 0.08, w: geo.size.width, color: Color(hex: "FFD700")).opacity(0.5)
                    .transition(.move(edge: .trailing))
                Text("CROWN ✓")
                    .font(.system(size: 8, weight: .bold, design: .monospaced))
                    .foregroundStyle(Color(hex: "FFD700"))
                    .padding(.horizontal, 7).padding(.vertical, 3)
                    .background(RoundedRectangle(cornerRadius: 3).fill(.black.opacity(0.75)))
                    .position(x: geo.size.width - 42, y: geo.size.height * 0.08)
                    .transition(.move(edge: .trailing))
            }
        }
        .animation(.easeOut(duration: 0.5), value: demo.showChinGuide)
        .animation(.easeOut(duration: 0.5), value: demo.showCrownGuide)
    }

    private func demoGuideLine(y: CGFloat, w: CGFloat, color: Color) -> some View {
        Path { p in p.move(to: CGPoint(x: 0, y: y)); p.addLine(to: CGPoint(x: w, y: y)) }
            .stroke(color, style: StrokeStyle(lineWidth: 1, dash: [5, 5]))
    }

    private var demoCoachLabels: some View {
        GeometryReader { geo in
            let crownY = geo.size.height * 0.08
            let chinY = geo.size.height * 0.78

            if demo.showCoach1 {
                demoCoachLabel("EYE 43% ✓")
                    .position(x: geo.size.width - 50, y: geo.size.height * 0.38)
            }
            if demo.showHeadMeasure {
                Path { p in
                    let x = geo.size.width * 0.15
                    p.move(to: CGPoint(x: x, y: crownY))
                    p.addLine(to: CGPoint(x: x, y: chinY))
                }
                .stroke(V1.accent, style: StrokeStyle(lineWidth: 1.5))

                Path { p in
                    let x = geo.size.width * 0.15
                    let arr: CGFloat = 5
                    p.move(to: CGPoint(x: x - arr, y: crownY + arr))
                    p.addLine(to: CGPoint(x: x, y: crownY))
                    p.addLine(to: CGPoint(x: x + arr, y: crownY + arr))
                    p.move(to: CGPoint(x: x - arr, y: chinY - arr))
                    p.addLine(to: CGPoint(x: x, y: chinY))
                    p.addLine(to: CGPoint(x: x + arr, y: chinY - arr))
                }
                .stroke(V1.accent, lineWidth: 1.5)

                demoCoachLabel("HEAD 34mm ✓")
                    .position(x: geo.size.width * 0.15, y: (crownY + chinY) / 2)
            }
        }
    }

    private func demoCoachLabel(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 8, weight: .bold, design: .monospaced))
            .foregroundStyle(V1.accent)
            .padding(.horizontal, 7).padding(.vertical, 3)
            .background(RoundedRectangle(cornerRadius: 3).fill(.black.opacity(0.75)))
    }

    private var demoPassStamp: some View {
        GeometryReader { geo in
            ZStack {
                Circle()
                    .stroke(V1.accent.opacity(0.9), lineWidth: 3.5)
                Circle()
                    .stroke(V1.accent.opacity(0.7), lineWidth: 1.5)
                    .padding(6)
                VStack(spacing: 1) {
                    Text("IDPASS").font(.system(size: 7, weight: .black, design: .monospaced)).tracking(2.5)
                    Text("PASS").font(.system(size: 26, weight: .black))
                    Text("VERIFIED").font(.system(size: 7, weight: .black, design: .monospaced)).tracking(2.5)
                }
                .foregroundStyle(V1.accent.opacity(0.9))
            }
            .frame(width: 95, height: 95)
            .rotationEffect(.degrees(-18))
            .position(x: geo.size.width - 58, y: geo.size.height - 58)
        }
    }

    // MARK: Service Cards

    private var serviceCardsSection: some View {
        let cards: [(type: String, ko: String, en: String, sub: String, img: String)] = [
            ("passport", "여권", "Passport", "200 COUNTRIES", "card_passport"),
            ("visa", "비자", "Visa", "VISA · 50+", "card_visa"),
            ("license", "면허증", "License", "LICENSE · 30+", "card_license"),
            ("custom", "커스텀", "Custom", "CUSTOM SIZE", "card_custom"),
        ]

        return VStack(spacing: 8) {
            HStack(spacing: 8) {
                ForEach(0..<2, id: \.self) { i in
                    serviceCard(cards[i])
                }
            }
            HStack(spacing: 8) {
                ForEach(2..<4, id: \.self) { i in
                    serviceCard(cards[i])
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 16)
    }

    private func serviceCard(_ card: (type: String, ko: String, en: String, sub: String, img: String)) -> some View {
        Button {
            onSelectType(card.type)
        } label: {
            ZStack {
                demoImage(card.img)
                    .frame(height: 90)
                    .clipped()
                    .overlay(
                        LinearGradient(colors: [.black.opacity(0.6), .black.opacity(0.3)],
                                       startPoint: .bottom, endPoint: .top)
                    )

                VStack(spacing: 2) {
                    Text(lang == "en" ? card.en : card.ko)
                        .font(.system(size: 18, weight: .black))
                        .foregroundStyle(V1.text)
                    Text(card.sub)
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundStyle(V1.accent)
                        .tracking(1)
                }
            }
            .frame(height: 90)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(V1.border, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    // MARK: Transformation Strip

    private var transformSection: some View {
        VStack(spacing: 14) {
            landingSectionLabel("TRANSFORMATION")
            Text(tr("landing_transform_title", lang))
                .font(.system(size: 22, weight: .black))
                .foregroundStyle(V1.text)
                .multilineTextAlignment(.center)
            HStack(spacing: 8) {
                transformCard(tag: "ORIGINAL", highlight: false)
                Text("→").font(.system(size: 16, weight: .bold)).foregroundStyle(V1.dim)
                transformCard(tag: "BG REMOVE", highlight: false)
                Text("→").font(.system(size: 16, weight: .bold)).foregroundStyle(V1.dim)
                transformCard(tag: "PASS ✓", highlight: true)
            }
        }
        .padding(.horizontal, 24).padding(.vertical, 48)
    }

    private func transformCard(tag: String, highlight: Bool) -> some View {
        VStack(spacing: 0) {
            RoundedRectangle(cornerRadius: 6).fill(V1.card)
                .overlay(RoundedRectangle(cornerRadius: 6)
                    .stroke(highlight ? V1.accent.opacity(0.25) : V1.border, lineWidth: 1))
                .frame(height: 80)
            Text(tag)
                .font(.system(size: 7, weight: .bold, design: .monospaced))
                .foregroundStyle(highlight ? V1.accent : V1.muted)
                .tracking(0.5)
                .padding(.top, 6)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: Process

    private var processSection: some View {
        VStack(spacing: 16) {
            landingSectionLabel("HOW IT WORKS")
            Text(tr("landing_process_title", lang))
                .font(.system(size: 22, weight: .black))
                .foregroundStyle(V1.text)
                .multilineTextAlignment(.center)
            VStack(spacing: 0) {
                processStep(num: "01", title: tr("landing_p1", lang), desc: tr("landing_p1_desc", lang))
                processArrow
                processStep(num: "02", title: tr("landing_p2", lang), desc: tr("landing_p2_desc", lang))
                processArrow
                processStep(num: "03", title: tr("landing_p3", lang), desc: tr("landing_p3_desc", lang))
                processArrow
                processStep(num: "04", title: tr("landing_p4", lang), desc: tr("landing_p4_desc", lang), accent: true)
            }
        }
        .padding(.horizontal, 24).padding(.vertical, 48)
    }

    private func processStep(num: String, title: String, desc: String, accent: Bool = false) -> some View {
        HStack(spacing: 12) {
            Text(accent ? "✓" : num)
                .font(.system(size: accent ? 15 : 13, weight: .black, design: .monospaced))
                .foregroundStyle(accent ? V1.accent : V1.text)
                .frame(width: 36, height: 36)
                .background(RoundedRectangle(cornerRadius: 8).fill(accent ? V1.accent.opacity(0.15) : V1.card))
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 14, weight: .bold)).foregroundStyle(accent ? V1.accent : V1.text)
                Text(desc).font(.system(size: 11)).foregroundStyle(V1.muted)
            }
            Spacer()
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 10)
            .stroke(accent ? V1.accent.opacity(0.15) : V1.border, lineWidth: 1))
    }

    private var processArrow: some View {
        Text("↓").font(.system(size: 14, weight: .bold)).foregroundStyle(V1.dim).padding(.vertical, 4)
    }

    // MARK: Features

    private var featuresSection: some View {
        VStack(spacing: 14) {
            landingSectionLabel("WHY IDPASS")
            Text(lang == "ko" ? "다른 앱과\n비교해보세요" :
                 lang == "ja" ? "他のアプリと\n比べてください" : "Compare with\nother apps")
                .font(.system(size: 22, weight: .black))
                .foregroundStyle(V1.text)
                .multilineTextAlignment(.center)
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                featureTile(value: "200", label: "COUNTRIES")
                featureTile(value: "₩0", label: "FOREVER")
                featureTile(value: "0", label: "SERVER")
                featureTile(value: "~1s", label: "CROP")
                featureTile(value: "0", label: "ADS")
                featureTile(value: "6", label: "CHECKS")
            }
        }
        .padding(.horizontal, 24).padding(.vertical, 40)
    }

    private func featureTile(value: String, label: String) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(size: 22, weight: .heavy, design: .monospaced)).foregroundStyle(V1.accent)
            Text(label).font(.system(size: 8, weight: .bold, design: .monospaced)).foregroundStyle(V1.muted).tracking(1)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 14)
        .background(RoundedRectangle(cornerRadius: 10).fill(V1.card))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(V1.border, lineWidth: 1))
    }

    // MARK: Trust

    private var trustSection: some View {
        VStack(spacing: 14) {
            landingSectionLabel("TRUST")
            Text(tr("landing_why_title", lang))
                .font(.system(size: 22, weight: .black))
                .foregroundStyle(V1.text)
            VStack(spacing: 8) {
                trustRow(icon: "lock.fill", text: tr("landing_trust1", lang))
                trustRow(icon: "xmark.circle", text: tr("landing_trust2", lang))
                trustRow(icon: "sparkle", text: tr("landing_trust3", lang))
            }
        }
        .padding(.horizontal, 24).padding(.vertical, 40)
    }

    private func trustRow(icon: String, text: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 16)).foregroundStyle(V1.accent).frame(width: 32)
            Text(text).font(.system(size: 13)).foregroundStyle(V1.text)
            Spacer()
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 10).fill(V1.card))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(V1.border, lineWidth: 1))
    }

    // MARK: CTA + Footer

    private var ctaSection: some View {
        VStack(spacing: 10) {
            AccentButton(title: tr("landing_cta", lang), action: onStart)
            Text(tr("landing_cta_sub", lang))
                .font(.system(size: 11)).foregroundStyle(V1.muted)
        }
        .padding(.horizontal, 24).padding(.vertical, 40)
    }

    private var footerSection: some View {
        VStack(spacing: 4) {
            HStack(spacing: 0) {
                Text("ID").font(.system(size: 14, weight: .black)).foregroundStyle(V1.text)
                Text("PASS").font(.system(size: 14, weight: .black)).foregroundStyle(V1.accent)
            }
            Text("powered by MONKOS AI")
                .font(.system(size: 9, weight: .medium)).foregroundStyle(V1.dim)
            Text("© 2026 IDPASS · idpass by monkos.ai · TERMS · PRIVACY")
                .font(.system(size: 8, design: .monospaced)).foregroundStyle(V1.dim).tracking(0.5)
                .padding(.top, 4)
        }
        .padding(.vertical, 24)
    }

    private func landingSectionLabel(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 10, weight: .bold, design: .monospaced))
            .foregroundStyle(V1.accent)
            .tracking(2)
    }
}

#if swift(>=5.9)
#Preview { ContentView() }
#endif
