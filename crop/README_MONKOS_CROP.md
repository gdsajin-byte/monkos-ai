# MONKOS Crop

> Client-side ICAO-compliant passport photo cropping — zero server, zero cost, zero privacy risk.

**[monkos.ai/crop](https://monkos.ai/crop)** · Free · No signup · No upload

---

## What it does

MONKOS Crop takes any portrait photo and produces a pixel-perfect ICAO-compliant passport crop (35×45mm, 413×531px, 300dpi). Everything runs in the browser. Your photo never leaves your device.

| | Competitor crop apps | MONKOS Crop |
|---|---|---|
| Price | Paid | **Free** |
| Server | Photo uploaded | **None — device only** |
| Privacy | Photo transmitted | **Never leaves device** |
| Validation | Basic guides | **3-tier real-time ICAO judgment** |
| Precision | Manual eye-match | **FaceMesh 478 landmarks + auto-placement** |

---

## Architecture evolution — 3 versions in 8 days

The final architecture wasn't the first attempt. The journey through three fundamentally different approaches is the real story.

### v0 — Server LLM crop (Mar 10)

Asked Gemini 2.0 Flash for 4 facial coordinates (forehead, chin, left eye, right eye), then reverse-calculated the crop region with `cropToSpec` + `sharp`.

**Problem**: LLMs give *approximate* positions. Passport cropping requires sub-millimeter precision — 1mm off means rejection. Also, reverse-calculating a crop region from coordinates is structurally fragile: when `cropH > srcH`, the chin gets clipped.

**Key insight**: This approach was *backwards*. Real photo studios don't extract a frame from a photo — they fit the photo into a fixed frame. The frame comes first.

### v1 — Server FaceMesh engine (Mar 11)

Replaced LLM coordinates with TensorFlow.js FaceMesh (478 landmarks). Designed as a Cloud Run microservice.

**Eye-anchor placement**: Pin the eye position at 43% from the top of the frame. Target face size: 34mm. Crown position estimated via anatomical approximation: `crownY = eyeY - (chinY - eyeY)`.

**tfjs backend selection**:

| Backend | Result |
|---------|--------|
| `tfjs-node` | `util.isNullOrUndefined` removed in Node 20+ → **broken** |
| `tfjs-backend-wasm` | BatchMatMul non-float32 unsupported → **broken** |
| `tfjs CPU` (pure JS) | **Works, 742ms/image** |

**Problem**: Server-side crop doesn't solve cold-start (10-30s on Cloud Run), cost, or privacy.

### v2 — Client-complete (Mar 12)

After confirming v1 works, the question became: "Can this run in the browser?" MediaPipe FaceMesh loads via CDN. Canvas 2D handles crop output. The server disappears entirely.

```
[Browser] Photo upload → MediaPipe FaceMesh (CDN) → 478 landmarks
        → Auto-placement (eye anchor 43%) → SVG guide overlay
        → User fine-tuning → Canvas 2D crop → JPEG download
```

**8h 40min intensive session** (10:30–19:16 on Mar 12). JP clone completed same day.

---

## Technical deep-dive

### Face detection — MediaPipe FaceMesh

5 key landmarks extracted from 478:

| Purpose | Landmark index | Description |
|---------|---------------|-------------|
| Left pupil center | `#159` | Eye position anchor (L) |
| Right pupil center | `#386` | Eye position anchor (R) |
| Chin bottom | `#152` | Face bottom reference |
| Left contour | `#234` | Face width |
| Right contour | `#454` | Face width |

Crown position is not directly detectable — estimated via anatomical ratio:

```javascript
crownY = eyeCenterY - (chinY - eyeCenterY)  // eye-to-crown ≈ eye-to-chin
```

### Auto-placement algorithm

```
1. Detect eye position (midpoint of #159, #386)
2. Estimate crown: crownY = eyeY - (chinY - eyeY)
3. Scale: fit face (crown→chin) to faceTarget mm
4. Position: anchor eyes at 43% from frame top
5. Center: align face center to frame horizontal center
```

### Specification system

```javascript
const SPECS = {
  passport: {
    wMm: 35, hMm: 45,           // Physical size
    faceMin: 32, faceMax: 36,     // ICAO face range (mm)
    faceTarget: 34,               // Auto-placement target
    pxW: 413, pxH: 531           // 300dpi pixel output
  },
  id: {
    wMm: 30, hMm: 40,
    faceMin: 24, faceMax: 32, faceTarget: 28,
    pxW: 354, pxH: 472
  }
};
```

### Core calculations

```javascript
getMM()  = FH / spec.hMm          // px-per-mm conversion factor
getFW()  = FH × spec.wMm / spec.hMm  // proportional frame width
faceMm   = (chin.y - crown.y) / MM    // actual face length in mm
eyeRatio = eyeY / FH                  // eye position as ratio (target: 0.43)
outScale = spec.pxH / FH              // frame → output pixel scale
```

### 3-tier ICAO color judgment

Real-time visual feedback with three states:

**Face size (crown→chin)**:

| Range | Color | Meaning |
|-------|-------|---------|
| 33–35mm | Green | Optimal |
| 32–33mm, 35–36mm | Yellow | Acceptable (borderline) |
| <32mm, >36mm | Red | Out of spec |

**Eye position (from frame top)**:

| Range | Color | Meaning |
|-------|-------|---------|
| 43–45% | Green | Optimal |
| 40–43%, 45–48% | Yellow | Acceptable |
| <40%, >48% | Red | Out of spec |

**Download blocking**: Red in any metric → download button disabled + specific remediation message.

### Canvas crop pipeline

CSS transforms (translate + scale) and `object-fit: cover` are precisely replicated in Canvas 2D for the final output:

```javascript
// Reproduce CSS transform in Canvas
ctx.translate(FW/2 + imgPos.x, FH/2 + imgPos.y);
ctx.scale(imgScale, imgScale);
ctx.translate(-FW/2, -FH/2);

// Reproduce object-fit: cover
const coverScale = Math.max(FW/natW, FH/natH);
ctx.drawImage(loadedImg, (FW-dw)/2, (FH-dh)/2, dw, dh);
```

Output: `MONKOS_crop_passport_413x531.jpg` (JPEG 95%)

---

## Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Face detection | MediaPipe FaceMesh (CDN) | 478 landmarks, real-time |
| Crop engine | Canvas 2D API | Native resolution + 300dpi |
| UI | Vanilla HTML + JS + CSS | Zero build tools |
| Validation | ICAO 3-tier color system | Green / Yellow / Red |
| Hosting | Static CDN | Zero server cost |

**Total codebase**: crop.js (977 LOC) + crop.css (380 LOC) + index.html (217 LOC)

**External dependency**: MediaPipe FaceMesh CDN — **one**.

---

## Development metrics

| Metric | Value |
|--------|-------|
| Total development | 8 days (Mar 10–17) |
| Core session | **8h 40min** single-day intensive (Mar 12) |
| Architecture iterations | 3 (LLM → Server FaceMesh → Client FaceMesh) |
| UX iterations | 3 cycles (4 + 4 + polish) |
| Server cost | **Zero** |
| JP localization | Same day as v2 launch |
| Portal integration | `/crop` route + service card (Mar 17) |

---

## Roadmap

| Tier | Feature | Tech |
|------|---------|------|
| **Current** | ICAO crop + validation | MediaPipe + Canvas 2D |
| **Tier 2** | Background removal | Transformers.js + RMBG-1.4 (in-browser) |
| **Tier 3** | Background replacement | Canvas compositing |
| **Expand** | Country/visa-specific spec DB | — |

All tiers: client-only. Zero server calls. Zero API keys. A million users costs the same as one.

---

## Lessons learned

1. **LLMs can't do pixel-precision work.** Gemini Flash gives approximate coordinates. FaceMesh gives 478 sub-pixel landmarks. Different tools for different jobs.

2. **No server is the best server.** Cold-start, cost, privacy — all solved by removing the server entirely.

3. **Photo studios had the right UX all along.** Fixed frame first, fit the photo to it. Not the other way around.

4. **Anatomical ratios have limits.** Eye-to-crown ≈ eye-to-chin works for most adults. For unusual proportions, the manual crown pin handles the rest. Auto-placement is a starting point, not a final answer.

5. **iOS Safari blocks async downloads.** `canvas.toBlob()` callback loses user-gesture context. Solution: `<a download>` fallback.

---

## Try it

No install. No signup. No upload.

**→ [monkos.ai/crop](https://monkos.ai/crop)**

---

*Built by MONKOS — where a photographer architects AI.*
