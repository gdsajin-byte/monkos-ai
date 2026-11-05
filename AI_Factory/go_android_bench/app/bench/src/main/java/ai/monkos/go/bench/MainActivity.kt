package ai.monkos.go.bench

// MONK Go Bench — KataGo(Eigen CPU) 온디바이스 벤치 + Firebase Test Lab Game Loop 래퍼 (PF_GO, ORDER_20261106 안드로이드빌드)
// Game Loop 인텐트(com.google.intent.action.TEST_LOOP)로 시작되면: 벤치 → logFile(JSON) 기록 → 캡처 3장 → 종료.
// 손으로 열면 같은 벤치를 버튼으로 돌린다.
// 벤치 = iOS 벤치와 같은 표본 대국: 빈 판·100수·200수 × (1500 visits, 2초 자동).

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.util.concurrent.CountDownLatch

class MainActivity : Activity() {
    private lateinit var status: TextView
    private lateinit var body: TextView
    private lateinit var root: View
    private val ui = Handler(Looper.getMainLooper())
    private val shots = JSONArray()
    private var gameLoop = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val lay = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(32, 48, 32, 32); setBackgroundColor(Color.WHITE) }
        status = TextView(this).apply { textSize = 18f; setTextColor(Color.BLACK) }
        body = TextView(this).apply { textSize = 13f; setTextColor(Color.DKGRAY); typeface = android.graphics.Typeface.MONOSPACE }
        val btn = Button(this).apply { text = "벤치 실행"; setOnClickListener { isEnabled = false; startBench(null) } }
        lay.addView(status); lay.addView(btn); lay.addView(ScrollView(this).apply { addView(body) })
        setContentView(lay)
        root = lay
        status.text = "${deviceLine()}\n대기"
        if (intent?.action == "com.google.intent.action.TEST_LOOP") {
            gameLoop = true
            btn.isEnabled = false
            startBench(intent)
        }
    }

    private fun deviceLine() = "${Build.MANUFACTURER} ${Build.MODEL} · Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT}) · ${Build.SUPPORTED_ABIS.firstOrNull()} · ${Runtime.getRuntime().availableProcessors()}코어"

    private fun setStage(s: String, extra: String? = null) {
        val l = CountDownLatch(1)
        ui.post {
            status.text = "${deviceLine()}\n단계: $s"
            if (extra != null) body.append(extra + "\n")
            l.countDown()
        }
        l.await()
        Thread.sleep(300)
    }

    /** 화면 캡처(앱 화면을 비트맵으로) → 외부 앱 폴더 PNG + 로그용 축소 JPEG(base64) */
    private fun capture(tag: String) {
        val l = CountDownLatch(1)
        ui.post {
            try {
                val bmp = Bitmap.createBitmap(root.width.coerceAtLeast(1), root.height.coerceAtLeast(1), Bitmap.Config.ARGB_8888)
                root.draw(Canvas(bmp))
                val dir = File(getExternalFilesDir(null), "screenshots").apply { mkdirs() }
                FileOutputStream(File(dir, "$tag.png")).use { bmp.compress(Bitmap.CompressFormat.PNG, 100, it) }
                val small = Bitmap.createScaledBitmap(bmp, bmp.width / 2, bmp.height / 2, true)
                val bo = ByteArrayOutputStream(); small.compress(Bitmap.CompressFormat.JPEG, 60, bo)
                shots.put(JSONObject().put("tag", tag).put("file", "screenshots/$tag.png").put("jpeg_b64", Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP)))
            } catch (e: Exception) {
                shots.put(JSONObject().put("tag", tag).put("error", e.toString()))
            }
            l.countDown()
        }
        l.await()
    }

    private fun startBench(loopIntent: Intent?) {
        Thread {
            val res = JSONObject()
            try {
                res.put("device", JSONObject().put("manufacturer", Build.MANUFACTURER).put("model", Build.MODEL).put("device", Build.DEVICE)
                    .put("android", Build.VERSION.RELEASE).put("sdk", Build.VERSION.SDK_INT).put("abi", Build.SUPPORTED_ABIS.firstOrNull())
                    .put("cores", Runtime.getRuntime().availableProcessors()).put("hardware", Build.HARDWARE).put("soc", if (Build.VERSION.SDK_INT >= 31) Build.SOC_MODEL else ""))
                setStage("시작")
                capture("1_start")
                runBench(res)
                res.put("ok", true)
            } catch (e: Throwable) {
                res.put("ok", false).put("error", e.toString())
                setStage("실패", e.toString())
            }
            setStage("종료")
            capture("3_end")
            res.put("screenshots", shots)
            val js = res.toString(1)
            File(getExternalFilesDir(null), "result.json").writeText(js)
            if (loopIntent?.data != null) {
                try {
                    contentResolver.openAssetFileDescriptor(loopIntent.data!!, "w")!!.use { fd ->
                        FileOutputStream(fd.fileDescriptor).use { it.write(js.toByteArray()) }
                    }
                } catch (e: Exception) {
                    File(getExternalFilesDir(null), "logfile_error.txt").writeText(e.toString())
                }
            }
            if (gameLoop) ui.postDelayed({ finish() }, 500)
        }.start()
    }

    private fun copyAsset(name: String, dst: File) {
        dst.parentFile?.mkdirs()
        assets.open(name).use { i -> FileOutputStream(dst).use { o -> i.copyTo(o) } }
    }

    private fun runBench(res: JSONObject) {
        val work = filesDir
        copyAsset("model_bin_gz.dat", File(work, "model.bin.gz"))
        for (n in listOf("gtp.cfg", "bench.json")) copyAsset(n, File(work, n))
        val bench = JSONObject(File(work, "bench.json").readText())
        val moves = bench.getJSONArray("moves")
        val threads = Runtime.getRuntime().availableProcessors()
        val exe = File(applicationInfo.nativeLibraryDir, "libkatago.so")
        res.put("exe", exe.path).put("threads", threads).put("model", bench.optString("model"))
        val over = listOf("numSearchThreads=$threads", "numEigenThreadsPerModel=$threads", "nnMaxBatchSize=$threads", "numNNServerThreadsPerModel=1",
            "maxVisits=1500", "maxTime=60", "rules=korean", "ponderingEnabled=false", "allowResignation=false", "logDir=${File(work, "logs").path}", "logToStderr=false").joinToString(",")
        val pb = ProcessBuilder(exe.path, "gtp", "-model", File(work, "model.bin.gz").path, "-config", File(work, "gtp.cfg").path, "-override-config", over).directory(work)
        val t0 = System.nanoTime()
        val proc = pb.start()
        val err = StringBuilder()
        Thread { BufferedReader(InputStreamReader(proc.errorStream)).forEachLine { synchronized(err) { if (err.length < 20000) err.append(it).append('\n') } } }.start()
        val inp = BufferedReader(InputStreamReader(proc.inputStream))
        val out = OutputStreamWriter(proc.outputStream)
        fun gtp(c: String): String {
            out.write(c + "\n"); out.flush()
            val sb = StringBuilder()
            while (true) {
                val line = inp.readLine() ?: throw RuntimeException("KataGo 종료됨 — stderr: " + synchronized(err) { err.takeLast(1500) })
                if (line.isEmpty() && sb.isNotEmpty()) break
                if (line.isNotEmpty()) sb.append(line).append('\n')
            }
            val r = sb.toString()
            if (r.startsWith("?")) throw RuntimeException("GTP 오류 [$c]: $r")
            return r
        }
        setStage("모델 적재")
        gtp("name")
        val loadSec = (System.nanoTime() - t0) / 1e9
        res.put("load_seconds", loadSec)
        setStage("모델 적재 완료", "load ${"%.1f".format(loadSec)}s · threads $threads")
        gtp("boardsize 19"); gtp("komi ${bench.optDouble("komi", 6.5)}")
        val rows = JSONArray()
        var shot2 = false
        for (pi in 0 until bench.getJSONArray("positions").length()) {
            val p = bench.getJSONArray("positions").getInt(pi)
            gtp("clear_board")
            for (i in 0 until p) { val m = moves.getJSONArray(i); gtp("play ${m.getString(0)} ${m.getString(1)}") }
            val side = if (p % 2 == 0) "B" else "W"
            for (mode in listOf("v1500", "auto2s")) {
                gtp("clear_cache")
                if (mode == "v1500") { gtp("kata-set-param maxVisits ${bench.optInt("visits", 1500)}"); gtp("kata-set-param maxTime 60") }
                else { gtp("kata-set-param maxVisits 10000000"); gtp("kata-set-param maxTime ${bench.optDouble("auto_seconds", 2.0)}") }
                setStage("${p}수 · $mode 계산 중")
                val a = System.nanoTime()
                val r = gtp("kata-genmove_analyze $side interval 20 rootInfo true")
                val sec = (System.nanoTime() - a) / 1e9
                val rv = Regex("rootInfo visits (\\d+)").findAll(r).lastOrNull()?.groupValues?.get(1)?.toInt()
                val lastInfo = r.lines().lastOrNull { it.startsWith("info") } ?: ""
                val sumV = Regex("visits (\\d+)").findAll(lastInfo.substringBefore("rootInfo")).sumOf { it.groupValues[1].toInt() }
                val visits = rv ?: sumV
                // 착점 = 'play X'로 시작하는 줄(11-06 가상 스모크: 본문 중간 정규식이 엉뚱한 수치를 잡음)
                val mv = r.lines().lastOrNull { it.trim().startsWith("play ") }?.trim()?.removePrefix("play ")?.trim() ?: "?"
                gtp("undo")
                val row = JSONObject().put("moves", p).put("mode", mode).put("seconds", sec).put("visits", visits).put("visits_per_sec", if (sec > 0) visits / sec else 0.0).put("move", mv).put("raw_tail", r.takeLast(160))
                rows.put(row)
                setStage("${p}수 · $mode 완료", "${p}수 $mode: ${"%.2f".format(sec)}s · ${visits}v · ${"%.0f".format(visits / sec)}v/s · $mv")
                if (mode == "v1500" && !shot2) { capture("2_after_1500v"); shot2 = true }
            }
        }
        res.put("bench", rows)
        try { gtp("quit") } catch (_: Exception) {}
        proc.waitFor()
        res.put("stderr_tail", synchronized(err) { err.takeLast(3000).toString() })
    }
}
