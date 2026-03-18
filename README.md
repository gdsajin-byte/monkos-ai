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

MONKOS Crop takes any portrait photo and produces a pixel-perfect ICAO-compliant passport crop (35×45mm, 413×531px, 300dpi). Everything runs in the browser — your photo never leaves your device.

| | Competitor crop apps | MONKOS Crop |
|---|---|---|
| Price | Paid | **Free** |
| Server | Photo uploaded | **None — device only** |
| Privacy | Photo transmitted | **Never leaves device** |
| Validation | Basic guides | **3-tier real-time ICAO judgment** |
| Precision | Manual eye-match | **FaceMesh 478 landmarks + auto-placement** |

### Architecture evolution — 3 versions in 8 days

| Version | Approach | Outcome |
|---------|----------|---------|
| **v0** (Mar 10) | Gemini 2.0 Flash LLM coordinates → `cropToSpec` | LLMs can't do pixel-precision — 1mm off means rejection |
| **v1** (Mar 11) | TensorFlow.js FaceMesh on Cloud Run (478 landmarks, 742ms/img) | Works, but cold-start + cost + privacy unsolved |
| **v2** (Mar 12) | MediaPipe FaceMesh CDN + Canvas 2D in browser | **Shipped** — zero server, zero cost, zero privacy risk |

### Key technical decisions

- **Crown estimation**: `crownY = eyeY - (chinY - eyeY)` — anatomical approximation, manual pin override for edge cases
- **3-tier color judgment**: Green (optimal) / Yellow (borderline) / Red (out of spec) — not just pass/fail
- **Download blocking**: Red metric → button disabled + specific fix instruction
- **Canvas transform replication**: CSS `object-fit: cover` + translate/scale reproduced in Canvas 2D for pixel-accurate output

### Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Face detection | MediaPipe FaceMesh (CDN) | 478 landmarks, real-time |
| Crop engine | Canvas 2D API | Native resolution + 300dpi |
| UI | Vanilla HTML + JS + CSS | Zero build tools |
| Validation | ICAO 3-tier color system | Green / Yellow / Red |
| Hosting | Static CDN | Zero server cost |

**977 LOC** JS + 380 CSS + 217 HTML · **1 external dependency** (MediaPipe CDN) · 8-day development · All tiers on roadmap (background removal, replacement) are client-only.

## Architecture

- **Multi-Agent Orchestration System** — Coordinated AI agents for quality control
- **Real-time AI Retouching Pipeline** — End-to-end image processing in <10s
- **Cloud-native Infrastructure** — Google Cloud Run (serverless), Firestore (real-time DB), GCS (image storage)
- **ICAO Compliance Engine** — Automated validation against international photo standards
- **Client-side Crop Engine** — MediaPipe FaceMesh + Canvas 2D (zero server)
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
