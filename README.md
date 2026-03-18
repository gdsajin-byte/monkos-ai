# MONKOS AI

> AI-Powered Professional Photo Platform — Identity-Preserving AI for Passport, Profile & Beauty Photos

## What is MONKOS?

MONKOS is an AI photo platform that generates **ICAO-compliant passport photos**, professional profile photos, and beauty retouching — with a strict commitment to **identity preservation**.

Unlike generic AI photo tools, MONKOS ensures your AI-generated photo looks like *you*, not an idealized version. Our identity-preservation technology maintains facial features, proportions, and natural characteristics while meeting international photo standards.

## Core Principles

### Identity Preservation First

> "The first principle is identity. If that breaks, everything breaks."

Every AI transformation preserves the subject's authentic identity. We reject the "beautification at all costs" approach common in AI photo apps.

### Anti-Deepfake by Design

MONKOS is built with **anti-deepfake safeguards** at its core:

- Real-time selfie verification required
- Identity matching between input and output
- No face-swapping, no identity manipulation
- Ethical AI retouching only (lighting, background, minor blemishes)

We believe AI photo technology must be used responsibly. MONKOS will never generate a photo that misrepresents who you are.

## Features

- 📸 **AI Passport Photos** — ICAO international standard, accepted worldwide
- 💼 **AI Profile Photos** — Professional headshots for resumes, LinkedIn, corporate use
- 💄 **AI Beauty Retouching** — Hair, makeup, lighting enhancement while preserving identity
- ✂️ **Free Crop Tool** — ICAO-compliant passport crop, runs entirely in browser, zero server cost
- 🌏 **Multi-language** — Korean, English, Japanese
- ⚡ **Instant Generation** — Results in seconds, not hours

## MONKOS Crop

> Client-side ICAO-compliant passport photo cropping — zero server, zero cost, zero privacy risk.

**[monkos.ai/crop](https://monkos.ai/crop)** · Free · No signup · No upload

MONKOS Crop produces pixel-perfect ICAO-compliant passport crops entirely in the browser. Your photo never leaves your device.

| | Competitor crop apps | MONKOS Crop |
|---|---|---|
| Price | Paid | **Free** |
| Server | Photo uploaded | **None — device only** |
| Privacy | Photo transmitted | **Never leaves device** |
| Validation | Basic guides | **Real-time compliance feedback** |
| Precision | Manual alignment | **AI face detection + auto-placement** |

### How we got here — 3 pivots in 8 days

The final architecture wasn't the first attempt. We went through three fundamentally different approaches before landing on the right one.

**Attempt 1 — LLM-based crop (Mar 10)**: Asked a large language model for facial coordinates, then reverse-calculated the crop. Turned out LLMs give *approximate* positions — useless when millimeter precision determines pass or fail. More importantly, this approach was structurally backwards.

**Attempt 2 — Server-side face detection (Mar 11)**: Replaced LLM with proper face detection (478 landmarks). Accurate, but server-side processing meant cold-start delays, ongoing cost, and photos leaving the user's device.

**Attempt 3 — Browser-only (Mar 12, shipped)**: Moved everything to the browser. Face detection runs client-side via CDN. Crop output via Canvas API. The server disappears entirely — and with it, all three problems.

### The photo studio insight

The key design breakthrough came from real-world photo studio workflow: studios don't extract a frame from a photo — they fit the photo into a fixed frame. The frame comes first. We digitized this exact workflow with interactive guides and real-time compliance feedback.

### Development metrics

| Metric | Value |
|--------|-------|
| Total development | 8 days (Mar 10–17) |
| Core session | 8h 40min single-day intensive (Mar 12) |
| Architecture iterations | 3 |
| UX iterations | 3 cycles |
| Server cost | **Zero** |
| External dependencies | **1** (face detection CDN) |
| JP localization | Same day as v2 launch |

### Roadmap

All future tiers (background removal, background replacement, spec database expansion) will remain **client-only** — zero server calls at any scale.

## Architecture

- **Multi-Agent Orchestration System** — Coordinated AI agents for quality control
- **Real-time AI Retouching Pipeline** — End-to-end image processing in <10s
- **Cloud-native Infrastructure** — Google Cloud Run (serverless), Firestore (real-time DB), GCS (image storage)
- **ICAO Compliance Engine** — Automated validation against international photo standards
- **Client-side Crop Engine** — Browser-based face detection + Canvas crop (zero server)
- **Credit-based Billing** — Flexible pay-per-use pricing model

## Standards & Compliance

| Standard | Status |
|----------|--------|
| ICAO 9303 (Passport) | ✅ Compliant |
| Korean ID Photo (3.5×4.5cm) | ✅ Compliant |
| Japanese 証明写真 (Various sizes) | ✅ Compliant |
| US Passport (2×2 inch) | ✅ Compliant |

## Links

- 🌐 [monkos.ai](https://monkos.ai) — AI Photo Platform
- 📸 [monk.kr](https://monk.kr) — Desktop Portal
- ✂️ [Free Crop Tool](https://monkos.ai/crop) — Browser-based ICAO passport crop
- 📝 [Blog](https://monkos.ai/blog) — Tech articles & guides
- ❓ [FAQ](https://monkos.ai/faq) — Frequently asked questions
- 📧 info@monkos.ai

## License

Service and brand © MONKOS. All rights reserved.
Technical articles in Issues are shared for educational purposes.
