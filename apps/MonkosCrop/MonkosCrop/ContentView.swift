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
    @State private var bgColor: BgOption = bgOptions[0]
    @State private var inputImage: PlatformImage?
    @State private var croppedImage: PlatformImage?
    @State private var faceResult: FaceDetectionResult?
    @State private var isProcessing = false
    @State private var errorMsg: String?
    @State private var saved = false
    @State private var selectedPhoto: PhotosPickerItem?
    @StateObject private var inspection = InspectionState()

    private var lang: String {
        let l = Locale.current.language.languageCode?.identifier ?? "en"
        return ["ko", "ja"].contains(l) ? l : "en"
    }

    var body: some View {
        ZStack {
            V1.bg.ignoresSafeArea()

            switch screen {
            case .landing:
                LandingView(lang: lang) { screen = .step(1) }

            case .step(let n):
                VStack(spacing: 0) {
                    V1TopBar(lang: lang, step: n, onStep: { screen = .step($0) })

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

            // Purpose pills
            HStack(spacing: 5) {
                ForEach(purposeList, id: \.id) { p in
                    let sel = purpose == p.id
                    Button {
                        purpose = p.id
                    } label: {
                        VStack(spacing: 2) {
                            Text(p.icon).font(.system(size: 14))
                            Text(p.names[lang] ?? p.names["en"] ?? "")
                                .font(.system(size: 10, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(RoundedRectangle(cornerRadius: 8).fill(sel ? V1.accent.opacity(0.08) : V1.card))
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(sel ? V1.accent : V1.border, lineWidth: 1))
                        .foregroundStyle(sel ? V1.accent : V1.muted)
                    }
                }
            }
            .padding(.horizontal, 20).padding(.bottom, 10)

            // Search
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 14))
                    .foregroundStyle(V1.dim)
                TextField(tr("search", lang), text: $search)
                    .font(.system(size: 12))
                    .foregroundStyle(V1.text)
            }
            .padding(.horizontal, 12).padding(.vertical, 9)
            .background(RoundedRectangle(cornerRadius: 8).fill(V1.card))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(V1.border, lineWidth: 1))
            .padding(.horizontal, 20).padding(.bottom, 10)

            // Country list
            ScrollView(.vertical, showsIndicators: false) {
                LazyVStack(spacing: 5) {
                    ForEach(filteredCountries) { c in
                        let sel = country.id == c.id
                        Button {
                            country = c
                            doc = c.docs[0]
                        } label: {
                            HStack(spacing: 10) {
                                Text(c.flag).font(.system(size: 22))
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(c.name(lang))
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundStyle(V1.text)
                                    Text("\(c.docs.count) doc · \(c.docs[0].size.replacingOccurrences(of: " mm", with: ""))")
                                        .font(.system(size: 9, design: .monospaced))
                                        .foregroundStyle(V1.dim)
                                }
                                Spacer()
                                Text(c.docs[0].group)
                                    .font(.system(size: 9, weight: .bold, design: .monospaced))
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

                    // Doc cards for selected country
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(tr("purpose", lang).uppercased()) · \(country.name(lang))")
                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                            .foregroundStyle(V1.muted)
                            .tracking(1)
                            .padding(.top, 8).padding(.bottom, 2)

                        ForEach(country.docs) { d in
                            let sel = doc.id == d.id
                            Button { doc = d } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(d.name(lang))
                                            .font(.system(size: 12, weight: .bold))
                                            .foregroundStyle(V1.text)
                                        Text(d.standard)
                                            .font(.system(size: 9, design: .monospaced))
                                            .foregroundStyle(V1.dim)
                                    }
                                    Spacer()
                                    VStack(alignment: .trailing, spacing: 2) {
                                        Text(d.size.replacingOccurrences(of: " mm", with: ""))
                                            .font(.system(size: 11, weight: .bold, design: .monospaced))
                                            .foregroundStyle(sel ? V1.accent : V1.text)
                                        Text(d.px.replacingOccurrences(of: " px", with: ""))
                                            .font(.system(size: 9, design: .monospaced))
                                            .foregroundStyle(V1.dim)
                                    }
                                }
                                .padding(.horizontal, 12).padding(.vertical, 9)
                                .background(RoundedRectangle(cornerRadius: 8).fill(sel ? V1.accent.opacity(0.06) : Color(hex: "0A0F18")))
                                .overlay(RoundedRectangle(cornerRadius: 8).stroke(sel ? V1.accent.opacity(0.33) : V1.border, lineWidth: 1))
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)
            }

            AccentButton(title: "\(tr("use_spec", lang)) →") { screen = .step(2) }
                .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 12)
        }
    }

    private var filteredCountries: [Country] {
        guard !search.isEmpty else { return appCountries }
        let q = search.lowercased()
        return appCountries.filter {
            $0.name(lang).lowercased().contains(q) ||
            $0.name("en").lowercased().contains(q)
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
        guard let face = await CropEngine.detectFace(in: normalized) else {
            isProcessing = false
            errorMsg = tr("no_face", lang)
            return
        }
        faceResult = face

        guard let cropped = CropEngine.crop(image: normalized, spec: doc.photoSpec, face: face) else {
            isProcessing = false
            errorMsg = tr("no_face", lang)
            return
        }
        croppedImage = cropped
        isProcessing = false
        saved = false
        screen = .step(3)
    }

    // MARK: - Step 3 — Crop + Inspect

    private var step3: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                BackButton { screen = .step(2) }
                SpecBadge(country: country, doc: doc, lang: lang)
                Spacer()
                Text(faceResult?.visionUsed == true ? "VISION · 76pt" : "CIDETECTOR")
                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                    .foregroundStyle(V1.muted)
                    .padding(.horizontal, 6).padding(.vertical, 3)
                    .background(RoundedRectangle(cornerRadius: 4).fill(V1.card))
                    .overlay(RoundedRectangle(cornerRadius: 4).stroke(V1.border, lineWidth: 1))
            }
            .padding(.horizontal, 14).padding(.bottom, 8)

            // Crop viewport
            ZStack {
                if let img = croppedImage {
                    Image(platformImage: img)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                }

                CornerBrackets()
                FaceLandmarksOverlay(phase: inspection.phase)

                // Status badge
                VStack {
                    HStack {
                        Text(inspection.isDone ? "PASS" : inspection.phase > 0 ? "SCANNING" : "READY")
                            .font(.system(size: 8, weight: .bold, design: .monospaced))
                            .tracking(1)
                            .foregroundStyle(inspection.isDone ? Color(hex: "05080E") : V1.accent)
                            .padding(.horizontal, 7).padding(.vertical, 3)
                            .background(RoundedRectangle(cornerRadius: 4).fill(inspection.isDone ? V1.accent : .black.opacity(0.6)))

                        Spacer()

                        Text("×1.00 · \(doc.size.replacingOccurrences(of: " mm", with: "mm"))")
                            .font(.system(size: 8, design: .monospaced))
                            .foregroundStyle(V1.muted)
                            .padding(.horizontal, 7).padding(.vertical, 3)
                            .background(RoundedRectangle(cornerRadius: 4).fill(.black.opacity(0.6)))
                    }
                    .padding(8)
                    Spacer()
                }

                // Phase toast
                PhaseToast(phase: inspection.phase, lang: lang)

                // Stamp
                if inspection.isDone {
                    VerifiedStamp()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(V1.accent, lineWidth: 1.5))
            .shadow(color: V1.accent.opacity(0.2), radius: 10)
            .padding(.horizontal, 14)

            // Metrics
            HStack(spacing: 4) {
                MetricBox(label: tr("crown_y", lang), value: "11.2", unit: "%", active: inspection.phase >= 5)
                MetricBox(label: tr("eye_height", lang), value: "43.0", unit: "%", active: inspection.phase >= 2)
                MetricBox(label: tr("chin_y", lang), value: "72.5", unit: "%", active: inspection.phase >= 5)
                MetricBox(label: tr("face_size", lang), value: "34.0", unit: "mm", active: inspection.phase >= 5)
            }
            .padding(.horizontal, 14).padding(.top, 8)

            ICAORangeBar(lang: lang)
                .padding(.horizontal, 14).padding(.top, 10)

            // Actions
            HStack(spacing: 6) {
                Button { inspection.start() } label: {
                    HStack(spacing: 5) {
                        Text("⬢")
                        Text(tr("inspect", lang))
                    }
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(V1.accent)
                    .padding(.horizontal, 14).padding(.vertical, 11)
                    .background(RoundedRectangle(cornerRadius: 10).fill(V1.accent.opacity(0.08)))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(V1.accent, lineWidth: 1.5))
                }

                AccentButton(title: "\(tr("next", lang)) →", enabled: inspection.isDone) {
                    screen = .step(4)
                }
            }
            .padding(.horizontal, 14).padding(.top, 10).padding(.bottom, 12)
        }
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                inspection.start()
            }
        }
        .onDisappear { inspection.reset() }
    }

    // MARK: - Step 4 — Background

    @State private var bgProcessing = true
    @State private var bgRemovedImage: PlatformImage?
    @State private var personMask: CIImage?

    private var step4: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                BackButton { screen = .step(3) }
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

            // Preview
            ZStack {
                bgColor.color
                if let img = bgRemovedImage {
                    Image(platformImage: img)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } else if let img = croppedImage {
                    Image(platformImage: img)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                }
                if bgProcessing {
                    ZStack {
                        Color.black.opacity(0.85)
                        VStack(spacing: 10) {
                            ProgressView()
                                .tint(V1.accent)
                                .scaleEffect(1.3)
                            Text("VISION · SEGMENTING…")
                                .font(.system(size: 10, weight: .bold, design: .monospaced))
                                .foregroundStyle(V1.accent)
                                .tracking(1)
                        }
                    }
                }
                if !bgProcessing && bgRemovedImage != nil {
                    VStack {
                        HStack {
                            Text("BG · \(bgColor.name(lang).uppercased())")
                                .font(.system(size: 8, weight: .bold, design: .monospaced))
                                .foregroundStyle(V1.accent)
                                .tracking(1)
                                .padding(.horizontal, 7).padding(.vertical, 3)
                                .background(RoundedRectangle(cornerRadius: 4).fill(.black.opacity(0.7)))
                            Spacer()
                        }
                        .padding(8)
                        Spacer()
                    }
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
                    .onTapGesture {
                        bgColor = c
                        recompositeBackground()
                    }
                }
            }
            .padding(.vertical, 10).padding(.horizontal, 8)
            .background(RoundedRectangle(cornerRadius: 12).fill(V1.card))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(V1.border, lineWidth: 1))
            .padding(.horizontal, 20).padding(.top, 12)

            AccentButton(title: "\(tr("next", lang)) →", enabled: !bgProcessing) {
                screen = .step(5)
            }
            .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 12)
        }
        .onAppear { runBgRemoval() }
    }

    private func runBgRemoval() {
        guard let img = croppedImage else { return }
        bgProcessing = true
        Task {
            let mask = await CropEngine.generatePersonMask(from: img)
            personMask = mask
            if let mask {
                bgRemovedImage = CropEngine.compositeBackground(original: img, mask: mask, bgHex: bgColor.hex)
            }
            bgProcessing = false
        }
    }

    private func recompositeBackground() {
        guard let img = croppedImage, let mask = personMask else { return }
        bgRemovedImage = CropEngine.compositeBackground(original: img, mask: mask, bgHex: bgColor.hex)
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
            if let img = bgRemovedImage ?? croppedImage {
                ZStack {
                    bgColor.color
                    Image(platformImage: img)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                    VStack {
                        HStack {
                            Text("MONKOS · VERIFIED")
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
                .frame(width: 180, height: 232)
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
                if let img = bgRemovedImage ?? croppedImage {
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
                HStack(spacing: 6) {
                    Text("MONKOS")
                        .font(.system(size: 16, weight: .black))
                        .foregroundStyle(V1.accent)
                        .kerning(-0.5)
                    Text("CROP")
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .foregroundStyle(V1.dim)
                        .tracking(1)
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
                if let img = bgRemovedImage ?? croppedImage {
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
                Text("© 2026 MONKOS")
                Spacer()
                Text("monkos.ai · TERMS")
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
        croppedImage = nil
        bgRemovedImage = nil
        personMask = nil
        faceResult = nil
        saved = false
        inspection.reset()
    }
}

// MARK: - Landing View

struct LandingView: View {
    let lang: String
    let onStart: () -> Void
    @StateObject private var demoInsp = InspectionState()

    var body: some View {
        VStack(spacing: 0) {
            // Brand bar
            HStack {
                HStack(spacing: 6) {
                    Text("MONKOS")
                        .font(.system(size: 16, weight: .black))
                        .foregroundStyle(V1.accent)
                        .kerning(-0.5)
                    Text("CROP")
                        .font(.system(size: 10, weight: .semibold, design: .monospaced))
                        .foregroundStyle(V1.dim)
                        .tracking(1)
                }
                Spacer()
                Text("FREE · NO LOGIN")
                    .font(.system(size: 8, weight: .heavy, design: .monospaced))
                    .foregroundStyle(V1.accent)
                    .tracking(1.2)
                    .padding(.horizontal, 7).padding(.vertical, 3)
                    .background(V1.accent.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 3))
            }
            .padding(.horizontal, 20).padding(.top, 8)

            // Hero text
            VStack(alignment: .leading, spacing: 6) {
                (Text(tr("hero1", lang)) + Text("\n") +
                 Text(tr("hero2", lang)) +
                 Text(tr("hero_accent", lang)).foregroundColor(V1.accent))
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(V1.text)
                    .lineSpacing(2)
                Text(tr("hero_sub", lang))
                    .font(.system(size: 12))
                    .foregroundStyle(V1.muted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20).padding(.top, 14)

            // Demo frame
            ZStack {
                Color.black
                Image(systemName: "person.fill")
                    .font(.system(size: 80, weight: .ultraLight))
                    .foregroundStyle(V1.accent.opacity(0.15))

                CornerBrackets()
                FaceLandmarksOverlay(phase: demoInsp.phase)

                VStack {
                    HStack {
                        Text(demoInsp.isDone ? "PASS" : demoInsp.phase > 0 ? "SCAN" : "READY")
                            .font(.system(size: 7, weight: .bold, design: .monospaced))
                            .tracking(1)
                            .foregroundStyle(demoInsp.isDone ? Color(hex: "05080E") : V1.accent)
                            .padding(.horizontal, 6).padding(.vertical, 2)
                            .background(RoundedRectangle(cornerRadius: 3).fill(demoInsp.isDone ? V1.accent : .black.opacity(0.65)))
                        Spacer()
                    }
                    .padding(5)
                    Spacer()
                }

                if demoInsp.isDone {
                    VerifiedStamp(size: 86)
                }
            }
            .aspectRatio(35.0/45.0, contentMode: .fit)
            .frame(maxWidth: 215)
            .clipShape(RoundedRectangle(cornerRadius: 6))
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(V1.accent, lineWidth: 1.5))
            .shadow(color: V1.accent.opacity(0.24), radius: 13)
            .padding(.top, 14)

            // Stats
            HStack(spacing: 5) {
                StatBadge(value: "26", label: tr("countries", lang))
                StatBadge(value: "0", label: tr("server", lang))
                StatBadge(value: "~1s", label: tr("crop_lbl", lang))
            }
            .padding(.horizontal, 20).padding(.top, 12)

            Spacer()

            AccentButton(title: tr("start", lang), action: onStart)
                .padding(.horizontal, 20)

            HStack {
                Text("© 2026 MONKOS")
                Spacer()
                Text("monkos.ai/crop · TERMS")
            }
            .font(.system(size: 8, design: .monospaced))
            .foregroundStyle(V1.dim)
            .tracking(0.5)
            .padding(.horizontal, 20).padding(.top, 10).padding(.bottom, 14)
        }
        .onAppear { startDemoLoop() }
    }

    private func startDemoLoop() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { demoInsp.start() }
        Timer.scheduledTimer(withTimeInterval: 7, repeats: true) { _ in demoInsp.start() }
    }
}

struct StatBadge: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.system(size: 16, weight: .heavy, design: .monospaced))
                .foregroundStyle(V1.accent)
            Text(label.uppercased())
                .font(.system(size: 7, weight: .bold, design: .monospaced))
                .foregroundStyle(V1.muted)
                .tracking(1)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 7)
        .background(RoundedRectangle(cornerRadius: 8).fill(V1.card))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(V1.border, lineWidth: 1))
    }
}

#if swift(>=5.9)
#Preview { ContentView() }
#endif
