# [Dev Log] MONKOS Crop — Client-side ICAO passport crop in 8 days, 3 architecture pivots

## TL;DR

Built a free, zero-server passport photo cropper that runs entirely in the browser. MediaPipe FaceMesh (478 landmarks) + Canvas 2D + ICAO 3-tier validation. No photo ever leaves the user's device.

**Live**: [monkos.ai/crop](https://monkos.ai/crop)

---

## The problem

Passport photo cropping apps charge money for what is essentially basic math: fit a face into a 35×45mm frame with the eyes at 43% height and the face between 32–36mm. Most apps upload your photo to a server, apply loose guidelines, and call it done.

We needed something precise enough for actual government submissions, private enough that no photo touches a server, and free enough to serve as an entry point to our AI photo service.

## Architecture journey

### Attempt 1: Ask an LLM (failed)

Sent photos to Gemini 2.0 Flash, asked for facial coordinates, reverse-calculated the crop. LLMs give *approximate* positions — useless when 1mm means pass/fail. Also, building a crop region from coordinates is backwards. Photo studios fit photos to frames, not frames to photos.

### Attempt 2: Server-side FaceMesh (worked, but wrong)

TensorFlow.js FaceMesh on Cloud Run. 478 landmarks, 742ms/image on CPU backend. Accurate, but cold-start (10-30s), server cost, and photo-leaves-device were dealbreakers.

Fun tfjs finding: `tfjs-node` broken on Node 20+ (removed `util.isNullOrUndefined`), WASM backend can't do BatchMatMul on non-float32. Pure JS CPU backend was the only one that worked.

### Attempt 3: Browser-only (shipped)

MediaPipe FaceMesh loads from CDN directly into the browser. Canvas 2D handles the crop output. Server disappears. Cost drops to zero. Privacy becomes absolute.

```
Photo → MediaPipe FaceMesh (478 landmarks) → Auto-placement (eye@43%)
→ SVG overlay + real-time metrics → User fine-tune → Canvas 2D → JPEG 300dpi
```

## Key technical decisions

**Crown estimation**: FaceMesh can't detect the crown of the head. We use anatomical approximation: `crownY = eyeY - (chinY - eyeY)`. Eye-to-crown ≈ eye-to-chin for most adults. Manual pin override handles edge cases.

**3-tier color judgment**: Not just pass/fail. Green (optimal) → Yellow (acceptable but borderline) → Red (out of spec). Because "32.5mm showing red" confuses users — it's in spec, just barely.

**Download blocking**: Red metric = download button disabled + specific fix instruction ("Face 31.2mm — below 32mm minimum. Scale up."). Users can't accidentally submit non-compliant photos.

**Canvas transform replication**: The crop output must exactly match what the user sees on screen. CSS `object-fit: cover` + translate/scale transforms are replicated mathematically in Canvas 2D context.

**iOS Safari download**: `canvas.toBlob()` async callback loses user-gesture context → popup blocked. Fixed with `<a download>` fallback.

## Numbers

- **977 LOC** JS + 380 CSS + 217 HTML
- **1 external dependency** (MediaPipe CDN)
- **8 days** total, core session **8h 40min** on day 3
- **Zero** build tools, bundlers, transpilers
- **Zero** server cost at any scale

## What's next

- Tier 2: Background removal (Transformers.js + RMBG-1.4, in-browser)
- Tier 3: Background replacement (Canvas compositing)
- Country/visa spec database expansion

All client-only. The architecture scales to a million users at zero marginal cost.

---

*Built by a photographer who became an AI developer. The studio workflow informed every UX decision — frame first, then fit the photo. That's how it's always been done.*
