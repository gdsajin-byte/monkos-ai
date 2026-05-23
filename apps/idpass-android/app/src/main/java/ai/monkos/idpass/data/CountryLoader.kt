package ai.monkos.idpass.data

import android.content.Context
import org.json.JSONObject

/**
 * Loads countries from countries.jsonl bundled in assets.
 * Each line is a JSON object with: id, ko, en, ja, continent, docs[].
 */
object CountryLoader {

    private var cached: List<Country>? = null

    fun load(context: Context): List<Country> {
        cached?.let { return it }

        val lines = context.assets.open("countries.jsonl")
            .bufferedReader()
            .readLines()

        val countries = lines.mapNotNull { line ->
            val trimmed = line.trim()
            if (trimmed.isEmpty()) return@mapNotNull null
            try {
                parseCountry(trimmed)
            } catch (_: Exception) {
                null
            }
        }

        cached = countries
        return countries
    }

    private fun parseCountry(jsonStr: String): Country? {
        val obj = JSONObject(jsonStr)
        val id = obj.optString("id", "") .ifEmpty { return null }
        val ko = obj.optString("ko", id)
        val en = obj.optString("en", id)
        val ja = obj.optString("ja", id)
        val continent = obj.optString("continent", "asia")

        val flag = flagEmoji(id)
        val names = mapOf("ko" to ko, "en" to en, "ja" to ja)

        val docsArray = obj.optJSONArray("docs")
        var docs = mutableListOf<DocSpec>()

        if (docsArray != null && docsArray.length() > 0) {
            for (i in 0 until docsArray.length()) {
                val d = docsArray.optJSONObject(i) ?: continue
                parseDoc(d)?.let { docs.add(it) }
            }
        }

        // Fallback to ICAO default if no docs parsed
        if (docs.isEmpty()) {
            docs = icaoDefault(id).toMutableList()
        }

        return Country(
            id = id,
            flag = flag,
            names = names,
            continent = continent,
            docs = docs
        )
    }

    private fun parseDoc(d: JSONObject): DocSpec? {
        val id = d.optString("id", "").ifEmpty { return null }
        val type = d.optString("type", "").ifEmpty { return null }
        val ko = d.optString("ko", type)
        val en = d.optString("en", type)
        val ja = d.optString("ja", type)

        // size: "35x45" -> parse w,h
        val sizeRaw = d.optString("size", "35x45")
        val sizeParts = sizeRaw.split("x")
        val w = sizeParts.firstOrNull()?.trim() ?: "35"
        val h = sizeParts.lastOrNull()?.trim() ?: "45"
        val wVal = w.toDoubleOrNull() ?: 35.0
        val hVal = h.toDoubleOrNull() ?: 45.0

        // px: "413x531" -> format
        val pxRaw = d.optString("px", "${(wVal / 25.4 * 300).toInt()}x${(hVal / 25.4 * 300).toInt()}")
        val pxParts = pxRaw.split("x")
        val pw = pxParts.firstOrNull()?.trim() ?: "413"
        val ph = pxParts.lastOrNull()?.trim() ?: "531"

        // head: "32-36" or "34" or ""
        val headRaw = d.optString("head", "")
        val headStr = if (headRaw.isEmpty()) "—" else "$headRaw mm".replace("-", "–")

        val std = d.optString("std", "ICAO 9303")

        // group classification
        val group = when {
            wVal == hVal -> "C"
            hVal >= 60 -> "D"
            wVal <= 30 -> "B"
            else -> "A"
        }

        // warning (optional nested object with ko/en/ja)
        val warn: Map<String, String>? = if (d.has("warning")) {
            val wObj = d.optJSONObject("warning")
            if (wObj != null) {
                val m = mutableMapOf<String, String>()
                wObj.keys().forEach { key -> m[key] = wObj.optString(key, "") }
                m
            } else null
        } else null

        val dpiVal = d.optDouble("dpi", 300.0)
        val ftVal = if (d.has("faceTarget")) d.optDouble("faceTarget") else null

        val sizeStr = "$w × $h mm"
        val pxStr = "$pw × $ph px"

        return DocSpec(
            id = id,
            type = type,
            names = mapOf("ko" to ko, "en" to en, "ja" to ja),
            size = sizeStr,
            px = pxStr,
            group = group,
            headHeight = headStr,
            standard = std,
            warning = warn,
            docDpi = dpiVal,
            explicitFaceTarget = ftVal
        )
    }

    private fun icaoDefault(countryId: String): List<DocSpec> = listOf(
        DocSpec(
            id = "$countryId-passport", type = "passport",
            names = mapOf("ko" to "여권", "en" to "Passport", "ja" to "パスポート"),
            size = "35 × 45 mm", px = "413 × 531 px", group = "A",
            headHeight = "32–36 mm", standard = "ICAO 9303"
        ),
        DocSpec(
            id = "$countryId-visa", type = "visa",
            names = mapOf("ko" to "비자", "en" to "Visa", "ja" to "ビザ"),
            size = "35 × 45 mm", px = "413 × 531 px", group = "A",
            headHeight = "32–36 mm", standard = "ICAO 9303"
        )
    )

    /**
     * Convert 2-letter country code to flag emoji.
     * e.g. "kr" -> 🇰🇷
     */
    private fun flagEmoji(code: String): String {
        val base = 0x1F1E6
        return code.uppercase().map { ch ->
            val cp = base + (ch.code - 'A'.code)
            String(Character.toChars(cp))
        }.joinToString("")
    }
}
