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
                                 group: "X", headHeight: "32–36 mm", standard: "Custom",
                                 docDpi: Double(customDPI))
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
                                            GeometryReader { geo in
                                                ZStack(alignment: .bottomLeading) {
                                                    BundleImage(name: group.image)
                                                        .frame(width: geo.size.width, height: geo.size.width)
                                                        .clipped()
                                                        .overlay(
                                                            LinearGradient(
                                                                colors: [.black.opacity(0.7), .black.opacity(0.2), .black.opacity(0.4)],
                                                                startPoint: .bottom, endPoint: .top
                                                            )
                                                        )

                                                    VStack(alignment: .leading, spacing: 4) {
                                                        Text(group.names["en"] ?? "")
                                                            .font(.system(size: 20, weight: .black))
                                                            .foregroundStyle(.white)
                                                            .textCase(.uppercase)
                                                        Text("\(cnt) countries")
                                                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                                                            .foregroundStyle(V1.accent.opacity(0.9))
                                                            .tracking(1)
                                                    }
                                                    .padding(12)
                                                }
                                            }
                                            .aspectRatio(1, contentMode: .fit)
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

    // MARK: - Helpers

    private func gcd(_ a: Double, _ b: Double) -> Double {
        let ia = Int(a), ib = Int(b)
        var x = ia, y = ib
        while y != 0 { let t = y; y = x % y; x = t }
        return Double(x == 0 ? 1 : x)
    }

    // MARK: - Guide Image Helper

    @ViewBuilder
    private func guideImageView(for doc: DocSpec) -> some View {
        let w = Int(doc.photoSpec.widthMM)
        let h = Int(doc.photoSpec.heightMM)
        let filename = "\(w)x\(h)"

        if let path = Bundle.main.path(forResource: filename, ofType: "jpg", inDirectory: "guides"),
           let img = loadImage(from: path) {
            img.resizable().aspectRatio(contentMode: .fit)
        } else {
            Image(systemName: "person.crop.rectangle")
                .font(.system(size: 60, weight: .ultraLight))
                .foregroundStyle(V1.accent.opacity(0.3))
        }
    }

    private func loadImage(from path: String) -> Image? {
        #if canImport(UIKit)
        guard let img = UIImage(contentsOfFile: path) else { return nil }
        return Image(uiImage: img)
        #else
        guard let img = NSImage(contentsOfFile: path) else { return nil }
        return Image(nsImage: img)
        #endif
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

            if let warn = doc.warning?[lang] ?? doc.warning?["en"] {
                Text(warn)
                    .font(.system(size: 10))
                    .foregroundStyle(V1.orange)
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 8).fill(V1.orange.opacity(0.08)))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(V1.orange.opacity(0.3), lineWidth: 1))
                    .padding(.horizontal, 20).padding(.bottom, 6)
            }

            // Upload area — Guide (철창이 디자인)
            VStack(spacing: 10) {
                Spacer()

                HStack(spacing: 4) {
                    Text("📐")
                    Text(tr("spec_guide", lang))
                        .font(.system(size: 11, weight: .medium, design: .monospaced))
                        .foregroundStyle(V1.muted)
                }

                // 이미지 + 좌측 높이 + 우측 얼굴범위
                HStack(alignment: .center, spacing: 0) {
                    // 좌측 — 세로 높이
                    VStack(spacing: 4) {
                        Rectangle().fill(V1.accent.opacity(0.4)).frame(width: 1).frame(maxHeight: .infinity)
                        Text(String(format: "%.1fcm", doc.photoSpec.heightMM / 10))
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .foregroundStyle(V1.accent)
                        Rectangle().fill(V1.accent.opacity(0.4)).frame(width: 1).frame(maxHeight: .infinity)
                    }
                    .frame(width: 32)

                    // 가이드 이미지 + 하단 배지
                    ZStack(alignment: .bottom) {
                        guideImageView(for: doc)
                            .clipShape(RoundedRectangle(cornerRadius: 4))
                            .shadow(color: .black.opacity(0.35), radius: 10, y: 4)

                        Text(doc.standard.isEmpty
                             ? "\(Int(doc.photoSpec.widthMM))×\(Int(doc.photoSpec.heightMM))mm"
                             : "\(Int(doc.photoSpec.widthMM))×\(Int(doc.photoSpec.heightMM))mm · \(doc.standard)")
                            .font(.system(size: 9, weight: .heavy, design: .monospaced))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 10).padding(.vertical, 4)
                            .background(Capsule().fill(V1.accent))
                            .padding(.bottom, 8)
                    }

                    // 우측 — 얼굴 범위 (정수리~턱 비율에 맞게)
                    let faceRatio = doc.photoSpec.faceTarget / doc.photoSpec.heightMM
                    let topPad = 0.05  // 정수리 위 여백
                    VStack(spacing: 0) {
                        Spacer().frame(maxHeight: .infinity).layoutPriority(topPad * 100)
                        VStack(spacing: 4) {
                            Rectangle().fill(V1.accent.opacity(0.5)).frame(width: 6, height: 1)
                            Rectangle().fill(V1.accent.opacity(0.4)).frame(width: 1)
                                .frame(maxHeight: .infinity)
                            Text("\(Int(doc.photoSpec.faceMin))~\(Int(doc.photoSpec.faceMax))mm")
                                .font(.system(size: 10, weight: .bold, design: .monospaced))
                                .foregroundStyle(V1.accent)
                                .rotationEffect(.degrees(-90))
                                .fixedSize()
                            Rectangle().fill(V1.accent.opacity(0.4)).frame(width: 1)
                                .frame(maxHeight: .infinity)
                            Rectangle().fill(V1.accent.opacity(0.5)).frame(width: 6, height: 1)
                        }
                        .frame(maxHeight: .infinity).layoutPriority(faceRatio * 100)
                        Spacer().frame(maxHeight: .infinity).layoutPriority((1 - topPad - faceRatio) * 100)
                    }
                    .frame(width: 36)
                }
                .padding(.horizontal, 20)

                // 하단 텍스트
                VStack(spacing: 2) {
                    let spec = doc.photoSpec
                    let ratio = Int(spec.widthMM) == Int(spec.heightMM)
                        ? "1:1"
                        : "\(Int(spec.widthMM / gcd(spec.widthMM, spec.heightMM))):\(Int(spec.heightMM / gcd(spec.widthMM, spec.heightMM)))"
                    Text("\(doc.size) · \(tr("face_size", lang)) \(Int(spec.faceMin))–\(Int(spec.faceMax))mm")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(V1.accent)
                    Text(doc.standard.isEmpty
                         ? "\(ratio) \(tr("ratio", lang))"
                         : "\(doc.standard) · \(ratio) \(tr("ratio", lang))")
                        .font(.system(size: 10))
                        .foregroundStyle(V1.dim)
                }

                Text(tr("face_note", lang))
                    .font(.system(size: 9))
                    .foregroundStyle(V1.orange)
                    .padding(.horizontal, 30)
                    .padding(.top, 2)

                Spacer()
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
            PhotosPicker(selection: $selectedPhoto, matching: .images) {
                HStack(spacing: 6) {
                    Text("🖼")
                    Text(tr("choose_gallery", lang))
                }
                .font(.system(size: 14, weight: .heavy))
                .foregroundStyle(Color(hex: "05080E"))
                .frame(maxWidth: .infinity).frame(height: 50)
                .background(RoundedRectangle(cornerRadius: 12).fill(V1.accent))
                .shadow(color: V1.accent.opacity(0.25), radius: 10)
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
                        Text("MONKOS WORKING")
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
                        Text("MONKOS WORKING")
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
            let coverageThreshold: CGFloat = doc.photoSpec.heightMM >= 60 ? 0.80 : 0.95
            if dispW < fw * coverageThreshold || dispH < fh * coverageThreshold {
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
            (tr("output", lang), "\(Int(doc.photoSpec.pxW)) × \(Int(doc.photoSpec.pxH)) px"),
            (tr("background", lang), bgColor.name(lang)),
            (tr("standard", lang), doc.standard),
        ]
    }

    // MARK: - Thanks (C3 — Before/After Slider + SNS)

    private var thanksView: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: 0) {
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

                VStack(spacing: 12) {
                    if let img = croppedImage ?? bgRemovedImage {
                        ZStack {
                            bgColor.color
                            Image(platformImage: img)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                        }
                        .frame(width: 160, height: 160 / doc.photoSpec.aspectRatio)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                        .overlay(RoundedRectangle(cornerRadius: 6).stroke(V1.accent, lineWidth: 2))
                        .shadow(color: V1.accent.opacity(0.25), radius: 12)
                    }
                    Text(tr("saved", lang))
                        .font(.system(size: 22, weight: .black))
                        .foregroundStyle(V1.text)
                    Text("\(country.flag) \(doc.size.replacingOccurrences(of: " mm", with: "mm")) · \(doc.standard)")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundStyle(V1.muted)
                        .tracking(0.3)
                }
                .padding(.horizontal, 20)

                BeforeAfterSlider(lang: lang)
                    .padding(.horizontal, 20).padding(.top, 18)

                // Contact info
                VStack(spacing: 8) {
                    contactRow(icon: "paperplane", label: "Telegram", value: "@monkos_support_bot", url: "https://t.me/monkos_support_bot")
                    contactRow(icon: "envelope", label: "Email", value: "info@monkos.ai", url: "mailto:info@monkos.ai")
                }
                .padding(.horizontal, 20).padding(.top, 14)

                // Print service (Korean only)
                if lang == "ko" {
                    Button {
                        if let url = URL(string: "https://smartstore.naver.com/market_kku/products/13535954098") {
                            #if canImport(UIKit)
                            UIApplication.shared.open(url)
                            #else
                            NSWorkspace.shared.open(url)
                            #endif
                        }
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "printer")
                                .font(.system(size: 14))
                            Text("증명사진 인화하기")
                                .font(.system(size: 13, weight: .bold))
                            Spacer()
                            Text("→")
                                .font(.system(size: 14, weight: .bold))
                        }
                        .foregroundStyle(V1.text)
                        .padding(.horizontal, 16).padding(.vertical, 14)
                        .background(RoundedRectangle(cornerRadius: 12).fill(V1.card))
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(V1.border, lineWidth: 1))
                    }
                    .padding(.horizontal, 20).padding(.top, 10)
                }

                Button {
                    resetFlow()
                    screen = .landing
                } label: {
                    Text("↻ \(tr("crop_another", lang))")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(V1.text)
                        .frame(maxWidth: .infinity).frame(height: 48)
                        .background(RoundedRectangle(cornerRadius: 12).stroke(V1.border, lineWidth: 1))
                }
                .padding(.horizontal, 20).padding(.top, 14)

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
        .scrollContentBackground(.hidden)
    }

    @ViewBuilder
    private func contactRow(icon: String, label: String, value: String, url: String) -> some View {
        Button {
            if let u = URL(string: url) {
                #if canImport(UIKit)
                UIApplication.shared.open(u)
                #else
                NSWorkspace.shared.open(u)
                #endif
            }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 13))
                    .foregroundStyle(V1.accent)
                    .frame(width: 20)
                Text(label)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(V1.muted)
                Spacer()
                Text(value)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(V1.text)
            }
            .padding(.horizontal, 14).padding(.vertical, 10)
            .background(RoundedRectangle(cornerRadius: 10).fill(V1.card))
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(V1.border, lineWidth: 1))
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

#if swift(>=5.9)
#Preview { ContentView() }
#endif
