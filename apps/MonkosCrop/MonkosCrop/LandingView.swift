import SwiftUI

// MARK: - Landing View

struct LandingView: View {
    let lang: String
    let onStart: () -> Void
    let onSelectType: (String) -> Void
    @StateObject private var demo = LandingDemoState()

    var body: some View {
        VStack(spacing: 0) {
            heroSection
            serviceCardsSection
            Spacer(minLength: 0)
            landingFooter
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
            .padding(.top, 12)

            (Text(tr("landing_tagline", lang)) +
             Text(tr("landing_tagline_accent", lang)).foregroundColor(V1.accent))
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(V1.text)
                .padding(.top, 8)

            Text(tr("landing_sub", lang))
                .font(.system(size: 11))
                .foregroundStyle(V1.muted)
                .padding(.top, 3)

            PhoneDemoView(demo: demo).padding(.top, 16).padding(.bottom, 12)
        }
        .frame(maxWidth: .infinity)
        .background(
            RadialGradient(colors: [V1.accent.opacity(0.05), .clear],
                           center: .init(x: 0.5, y: 0.2), startRadius: 0, endRadius: 300)
        )
    }

    // MARK: Service Cards

    private var serviceCardsSection: some View {
        let cards: [(type: String, ko: String, en: String, sub: String, img: String)] = [
            ("passport", "여권", "Passport", "PASSPORT", "card_passport"),
            ("visa", "비자", "Visa", "VISA", "card_visa"),
            ("license", "면허증", "License", "LICENSE", "card_license"),
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
        .padding(.top, 24)
    }

    private func serviceCard(_ card: (type: String, ko: String, en: String, sub: String, img: String)) -> some View {
        Button {
            onSelectType(card.type)
        } label: {
            ZStack {
                bundleImage(card.img)
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

    // MARK: Landing Footer

    private var landingFooter: some View {
        VStack(spacing: 6) {
            HStack(spacing: 6) {
                monkosIconView(size: 20)
                Text("powered by")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundStyle(V1.dim)
                Text("MONKOS AI")
                    .font(.system(size: 10, weight: .black))
                    .foregroundStyle(V1.purple)
            }
            Text("© 2026 MONK STUDIO · Terms · Privacy")
                .font(.system(size: 8, weight: .medium, design: .monospaced))
                .foregroundStyle(V1.dim)
                .tracking(0.5)
        }
        .padding(.top, 16).padding(.bottom, 20)
    }

    @ViewBuilder
    private func monkosIconView(size: CGFloat) -> some View {
        #if canImport(UIKit)
        if let path = Bundle.main.path(forResource: "monkos-icon", ofType: "png"),
           let img = UIImage(contentsOfFile: path) {
            Image(uiImage: img)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
                .clipShape(RoundedRectangle(cornerRadius: size * 0.2))
        }
        #else
        if let url = Bundle.module.url(forResource: "monkos-icon", withExtension: "png"),
           let img = NSImage(contentsOf: url) {
            Image(nsImage: img)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: size, height: size)
                .clipShape(RoundedRectangle(cornerRadius: size * 0.2))
        }
        #endif
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
