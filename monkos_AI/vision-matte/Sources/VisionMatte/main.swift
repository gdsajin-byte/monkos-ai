// vision-matte — 애플 비전 매팅 서버 (ORDER_20261022 1단계)
// 계약 정본: monkos_AI/matte-server/server.py (4060 BiRefNet). 포털 코드 변경 0이 목표다.
//   GET  /health                     인증 제외 → {status:"ok", …}
//   POST /matte · /api/matte         {image: base64, bgColor:"#RRGGBB"} → {success, image(JPEG q95 base64), meta.elapsedSec}
//   X-Matte-Secret 불일치 403 (MATTE_SECRET 미설정 시 검사 생략 — 4060과 동일)
//   포화 시 대기 없이 즉시 503 + Retry-After: 1 (대기열을 만들지 않는다)
// 엔진: apps/crop-app/benchmark/poc-20260707/apple-vision-poc.swift와 동일
//   VNGeneratePersonSegmentationRequest(.accurate) + CIBlendWithMask(bgColor 단색)
import Foundation
import Network
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers

let env = ProcessInfo.processInfo.environment
let PORT = UInt16(env["PORT"] ?? "8000") ?? 8000
// 기본 루프백 — 외부 노출은 cloudflared 터널이 맡는다(2단계). 바꿀 때만 MATTE_HOST=0.0.0.0.
let HOST = env["MATTE_HOST"] ?? "127.0.0.1"
let MATTE_SECRET = env["MATTE_SECRET"] ?? ""
// 4060은 MATTE_MAX_CONCURRENT(기본 1). 지시서는 MAX_CONCURRENT(기본 2) — 둘 다 받는다(앞쪽 우선).
let MAX_CONCURRENT = max(1, Int(env["MATTE_MAX_CONCURRENT"] ?? env["MAX_CONCURRENT"] ?? "2") ?? 2)
let MAX_BODY = 64 * 1024 * 1024
// 흰 테두리 보정 (ORDER_20261022 Vision전환 §1). 원인 가설: 2016×1512 고정 마스크의 비등방·업스케일 소프트 띠에
// 원본 배경색이 섞여 남는다. 처방 2종 — 둘 다 0이면 1단계와 같은 출력.
//   기본값 수축 2 + 오염 제거 4 = 10-22 실측 채택(파란 배경 경계 ±3px 흰빛 픽셀 비율 s5 0.141→0.054·s1 0.098→0.055,
//   흰 배경 출력 변화 MAE ≤1.2% — COMPLETION_20261022 막내10 Vision전환 §1).
//   MATTE_EDGE_ERODE_PX : 알파 수축 반경(px, 출력 해상도 기준)
//   MATTE_DECONTAM_PX   : 전경 색 오염 제거 반경 — 경계 픽셀 색을 주변 전경 평균(알파 가중)으로 치환. 0=끔
let EDGE_ERODE_PX = Double(env["MATTE_EDGE_ERODE_PX"] ?? "") ?? 2
let DECONTAM_PX = Double(env["MATTE_DECONTAM_PX"] ?? "") ?? 4

let log = { (s: String) in
    let ts = ISO8601DateFormatter().string(from: Date())
    FileHandle.standardError.write("\(ts) \(s)\n".data(using: .utf8)!)
}

// --- 동시성 가드 · 포화 신호 (server.py _acquire_slot/_saturation_snapshot 대응) -------
final class State {
    private let lock = NSLock()
    private var inflight: [Int: Date] = [:]
    private var seq = 0
    private var recentMs: [Double] = []
    private var lastDoneAt: Date?
    private(set) var rejected503 = 0

    func acquire() -> Int? {
        lock.lock(); defer { lock.unlock() }
        guard inflight.count < MAX_CONCURRENT else { rejected503 += 1; return nil }
        seq += 1
        inflight[seq] = Date()
        return seq
    }

    func release(_ s: Int, elapsedMs: Double?) {
        lock.lock(); defer { lock.unlock() }
        inflight.removeValue(forKey: s)
        if let ms = elapsedMs {
            recentMs.append((ms * 10).rounded() / 10)
            if recentMs.count > 5 { recentMs.removeFirst() }
            lastDoneAt = Date()
        }
    }

    func snapshot() -> [String: Any] {
        lock.lock(); defer { lock.unlock() }
        let now = Date()
        let oldest = inflight.values.map { now.timeIntervalSince($0) }.max() ?? 0
        return [
            "inflight": inflight.count,
            "max_concurrent": MAX_CONCURRENT,
            "oldest_inflight_sec": (oldest * 10).rounded() / 10,
            "recent_matte_ms": recentMs,
            "last_matte_ms": recentMs.last as Any? ?? NSNull(),
            "last_completed_age_sec": lastDoneAt.map { (now.timeIntervalSince($0) * 10).rounded() / 10 } as Any? ?? NSNull(),
            "rejected_503_total": rejected503,
        ]
    }
}
let state = State()

// --- 엔진 -----------------------------------------------------------------------
enum MatteError: Error { case decode, segment, encode }

let ciContext = CIContext()

// f = mix(주변 전경 평균, 원본, a²) — 알파가 낮은 경계일수록 배경이 섞인 원본 대신 안쪽 전경 색을 쓴다.
let decontamKernel = CIColorKernel(source: """
kernel vec4 decontam(__sample c, __sample p, __sample ba, __sample m) {
    float a = m.r;
    vec3 fe = p.rgb / max(ba.r, 0.0001);
    return vec4(mix(fe, c.rgb, a * a), 1.0);
}
""")!

func hexToCIColor(_ hex: String) -> CIColor {
    // server.py hex_to_rgb와 동일: 6자리가 아니면 흰색
    var h = hex
    while h.hasPrefix("#") { h.removeFirst() }
    guard h.count == 6, let v = UInt32(h, radix: 16) else { return CIColor(red: 1, green: 1, blue: 1) }
    return CIColor(red: CGFloat((v >> 16) & 0xFF) / 255, green: CGFloat((v >> 8) & 0xFF) / 255, blue: CGFloat(v & 0xFF) / 255)
}

/// 반환: (JPEG 바이트, 추론 ms, 폭, 높이, 마스크 폭, 마스크 높이). EXIF 회전은 적용하지 않는다 — 4060(PIL Image.open)과 같다.
/// 마스크 크기는 Vision이 낸 원 해상도(업스케일 전) — 2단계 §5 흰 테두리 원인 판정용으로 meta·로그에 싣는다.
func runMatte(_ data: Data, bgColor: String) throws -> (Data, Double, Int, Int, Int, Int) {
    guard let src = CGImageSourceCreateWithData(data as CFData, nil),
          let cg = CGImageSourceCreateImageAtIndex(src, 0, nil) else { throw MatteError.decode }

    let t0 = DispatchTime.now()
    let req = VNGeneratePersonSegmentationRequest()
    req.qualityLevel = .accurate
    try VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
    guard let obs = req.results?.first else { throw MatteError.segment }
    let inferMs = Double(DispatchTime.now().uptimeNanoseconds - t0.uptimeNanoseconds) / 1e6

    let maskCI = CIImage(cvPixelBuffer: obs.pixelBuffer)
    let origCI = CIImage(cgImage: cg)
    let ext = origCI.extent
    var mask = maskCI.transformed(by: CGAffineTransform(
        scaleX: ext.width / maskCI.extent.width,
        y: ext.height / maskCI.extent.height))
    if EDGE_ERODE_PX > 0 {
        mask = mask.clampedToExtent().applyingFilter("CIMorphologyMinimum", parameters: ["inputRadius": EDGE_ERODE_PX]).cropped(to: ext)
    }
    var fg = origCI
    if DECONTAM_PX > 0 {
        let black = CIImage(color: CIColor(red: 0, green: 0, blue: 0)).cropped(to: ext)
        let premult = origCI.applyingFilter("CIBlendWithMask", parameters: ["inputBackgroundImage": black, "inputMaskImage": mask])
        let blurP = premult.clampedToExtent().applyingFilter("CIGaussianBlur", parameters: ["inputRadius": DECONTAM_PX]).cropped(to: ext)
        let blurA = mask.clampedToExtent().applyingFilter("CIGaussianBlur", parameters: ["inputRadius": DECONTAM_PX]).cropped(to: ext)
        if let out = decontamKernel.apply(extent: ext, arguments: [origCI, blurP, blurA, mask]) { fg = out }
    }
    let bg = CIImage(color: hexToCIColor(bgColor)).cropped(to: ext)
    let blended = fg.applyingFilter("CIBlendWithMask", parameters: [
        "inputBackgroundImage": bg,
        "inputMaskImage": mask,
    ])
    guard let outCG = ciContext.createCGImage(blended, from: origCI.extent,
                                              format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)) else { throw MatteError.encode }

    let out = NSMutableData()
    guard let dest = CGImageDestinationCreateWithData(out, UTType.jpeg.identifier as CFString, 1, nil) else { throw MatteError.encode }
    CGImageDestinationAddImage(dest, outCG, [kCGImageDestinationLossyCompressionQuality: 0.95] as CFDictionary)
    guard CGImageDestinationFinalize(dest) else { throw MatteError.encode }
    return (out as Data, inferMs, cg.width, cg.height,
            CVPixelBufferGetWidth(obs.pixelBuffer), CVPixelBufferGetHeight(obs.pixelBuffer))
}

// --- HTTP/1.1 최소 구현 (Connection: close, Content-Length 본문만) ----------------
struct Request {
    let method: String
    let path: String
    let headers: [String: String]   // 소문자 키
    let body: Data
}

struct Response {
    var status: Int
    var json: [String: Any]
    var extraHeaders: [String: String] = [:]
}

let reasons = [200: "OK", 400: "Bad Request", 403: "Forbidden", 404: "Not Found", 405: "Method Not Allowed",
               413: "Payload Too Large", 422: "Unprocessable Entity", 500: "Internal Server Error", 503: "Service Unavailable"]

func send(_ conn: NWConnection, _ r: Response) {
    let body = (try? JSONSerialization.data(withJSONObject: r.json)) ?? Data("{}".utf8)
    var head = "HTTP/1.1 \(r.status) \(reasons[r.status] ?? "Status")\r\n"
    head += "Content-Type: application/json\r\nContent-Length: \(body.count)\r\nConnection: close\r\n"
    for (k, v) in r.extraHeaders { head += "\(k): \(v)\r\n" }
    head += "\r\n"
    conn.send(content: Data(head.utf8) + body, completion: .contentProcessed { _ in conn.cancel() })
}

let headerEnd = Data("\r\n\r\n".utf8)

func parseHead(_ buf: Data) -> (String, String, [String: String], Int)? {
    guard let r = buf.range(of: headerEnd),
          let text = String(data: buf[buf.startIndex..<r.lowerBound], encoding: .utf8) else { return nil }
    let lines = text.components(separatedBy: "\r\n")
    let parts = lines[0].split(separator: " ")
    guard parts.count >= 2 else { return nil }
    var headers: [String: String] = [:]
    for l in lines.dropFirst() {
        guard let c = l.firstIndex(of: ":") else { continue }
        headers[l[..<c].trimmingCharacters(in: .whitespaces).lowercased()] = l[l.index(after: c)...].trimmingCharacters(in: .whitespaces)
    }
    let path = String(parts[1].split(separator: "?", maxSplits: 1).first ?? "")
    return (String(parts[0]), path, headers, r.upperBound - buf.startIndex)
}

func receive(_ conn: NWConnection, _ buf: Data) {
    conn.receive(minimumIncompleteLength: 1, maximumLength: 1 << 20) { chunk, _, done, err in
        var buf = buf
        if let c = chunk { buf.append(c) }
        if err != nil { conn.cancel(); return }
        if let (m, p, h, bodyStart) = parseHead(buf) {
            let len = Int(h["content-length"] ?? "0") ?? 0
            if len > MAX_BODY { send(conn, Response(status: 413, json: ["detail": "Payload too large"])); return }
            if buf.count - bodyStart >= len {
                let body = buf.subdata(in: bodyStart..<(bodyStart + len))
                workQueue.async { send(conn, route(Request(method: m, path: p, headers: h, body: body))) }
                return
            }
        } else if buf.count > 64 * 1024 && buf.range(of: headerEnd) == nil {
            send(conn, Response(status: 400, json: ["detail": "Bad request"])); return
        }
        if done { conn.cancel(); return }
        receive(conn, buf)
    }
}

let workQueue = DispatchQueue(label: "vision-matte.work", attributes: .concurrent)

// --- 라우팅 ----------------------------------------------------------------------
func route(_ req: Request) -> Response {
    if req.path == "/health" {
        guard req.method == "GET" else { return Response(status: 405, json: ["detail": "Method Not Allowed"]) }
        var body: [String: Any] = [
            "status": "ok",
            "engine": "apple-vision",
            "model": "VNGeneratePersonSegmentationRequest.accurate",
            "gpu": "N/A",
            "host_os": ProcessInfo.processInfo.operatingSystemVersionString,
        ]
        #if arch(arm64)
        body["arch"] = "arm64"
        #else
        body["arch"] = "x86_64"
        #endif
        body.merge(state.snapshot()) { _, n in n }
        return Response(status: 200, json: body)
    }

    // 인증 미들웨어 — /health 이외 전 경로 (server.py auth_middleware와 같은 순서: 404보다 먼저)
    if !MATTE_SECRET.isEmpty && req.headers["x-matte-secret"] != MATTE_SECRET {
        return Response(status: 403, json: ["error": "Forbidden"])
    }

    guard req.path == "/matte" || req.path == "/api/matte" else { return Response(status: 404, json: ["detail": "Not Found"]) }
    guard req.method == "POST" else { return Response(status: 405, json: ["detail": "Method Not Allowed"]) }

    guard let obj = try? JSONSerialization.jsonObject(with: req.body) as? [String: Any],
          let image = obj["image"] as? String else {
        return Response(status: 422, json: ["detail": "image (string) required"])
    }
    let bgColor = obj["bgColor"] as? String ?? "#FFFFFF"

    guard let seq = state.acquire() else {
        log("Matte 503 busy (max_concurrent=\(MAX_CONCURRENT), rejected_total=\(state.rejected503))")
        return Response(status: 503, json: ["success": false, "error": "Matte server busy", "maxConcurrent": MAX_CONCURRENT],
                        extraHeaders: ["Retry-After": "1"])
    }
    let tStart = DispatchTime.now()
    var elapsedForState: Double?
    defer { state.release(seq, elapsedMs: elapsedForState) }

    guard let bytes = Data(base64Encoded: image, options: .ignoreUnknownCharacters), !bytes.isEmpty else {
        return Response(status: 400, json: ["detail": "Invalid base64 image"])
    }
    do {
        let (jpeg, inferMs, w, h, mw, mh) = try runMatte(bytes, bgColor: bgColor)
        let totalMs = Double(DispatchTime.now().uptimeNanoseconds - tStart.uptimeNanoseconds) / 1e6
        elapsedForState = totalMs
        log("Matte \(w)x\(h) mask=\(mw)x\(mh) bg=\(bgColor) in \(Int(inferMs))ms (total \(Int(totalMs))ms)")
        return Response(status: 200, json: [
            "success": true,
            "image": jpeg.base64EncodedString(),
            "meta": ["elapsedSec": (inferMs).rounded() / 1000, "maskSize": [mw, mh], "inputSize": [w, h]],
        ])
    } catch MatteError.decode {
        return Response(status: 400, json: ["detail": "Invalid base64 image"])
    } catch {
        log("Matte 실패: \(error)")
        return Response(status: 500, json: ["success": false, "error": "Matte failed: \(error)"])
    }
}

// --- 기동 ------------------------------------------------------------------------
let params = NWParameters.tcp
params.requiredLocalEndpoint = NWEndpoint.hostPort(host: NWEndpoint.Host(HOST), port: NWEndpoint.Port(rawValue: PORT)!)
params.allowLocalEndpointReuse = true
let listener: NWListener
do { listener = try NWListener(using: params) } catch {
    log("❌ vision-matte: 리스너 생성 실패 \(HOST):\(PORT) — \(error)"); exit(1)
}
listener.newConnectionHandler = { conn in
    conn.start(queue: .global())
    receive(conn, Data())
}
listener.stateUpdateHandler = { st in
    switch st {
    case .ready: log("vision-matte listening on \(HOST):\(PORT) (max_concurrent=\(MAX_CONCURRENT), secret=\(MATTE_SECRET.isEmpty ? "off" : "on"), erode=\(EDGE_ERODE_PX)px, decontam=\(DECONTAM_PX)px)")
    case .failed(let e): log("❌ vision-matte: 리스너 실패 — \(e)"); exit(1)
    default: break
    }
}
listener.start(queue: .global())
dispatchMain()
