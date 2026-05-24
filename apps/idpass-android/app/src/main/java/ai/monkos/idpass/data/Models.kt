package ai.monkos.idpass.data

import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

// ─── PhotoSpec ───

data class PhotoSpec(
    val id: String,
    val name: String,
    val widthMM: Double,
    val heightMM: Double,
    val faceRatioMin: Double,
    val faceRatioMax: Double,
    val backgroundColor: String,
    val faceMin: Double,
    val faceMax: Double,
    val faceTarget: Double,
    val dpi: Double = 300.0
) {
    val pxW: Double get() = (widthMM / 25.4 * dpi).roundToInt().toDouble()
    val pxH: Double get() = (heightMM / 25.4 * dpi).roundToInt().toDouble()
    val aspectRatio: Double get() = widthMM / heightMM
    val displaySize: String get() = "${widthMM.toInt()}×${heightMM.toInt()}mm"
}

// ─── Country ───

data class Country(
    val id: String,
    val flag: String,
    val names: Map<String, String>,
    val continent: String = "asia",
    val docs: List<DocSpec>
) {
    fun name(lang: String): String = names[lang] ?: names["ko"] ?: id
}

// ─── DocSpec ───

data class DocSpec(
    val id: String,
    val type: String,
    val names: Map<String, String>,
    val size: String,
    val px: String,
    val group: String,
    val headHeight: String,
    val standard: String,
    val warning: Map<String, String>? = null,
    val docDpi: Double = 300.0,
    val explicitFaceTarget: Double? = null
) {
    fun name(lang: String): String = names[lang] ?: names["ko"] ?: id

    fun toPhotoSpec(): PhotoSpec {
        // Parse size: "35x45" or "35 × 45 mm"
        val cleaned = size.replace(" mm", "").replace(" ", "")
        val sizeParts = cleaned.split("×", "x")
        val w = sizeParts.firstOrNull()?.trim()?.toDoubleOrNull() ?: 35.0
        val h = sizeParts.lastOrNull()?.trim()?.toDoubleOrNull() ?: 45.0

        // Parse headHeight: "32-36" or "32–36 mm" or "34" or "—"
        val hh = headHeight.replace(" mm", "").replace("–", "-").trim()
        val headParts = hh.split("-")
        val fMin: Double
        val fMax: Double
        val parsedExplicit: Double?

        if (headParts.size == 2) {
            val a = headParts[0].trim().toDoubleOrNull()
            val b = headParts[1].trim().toDoubleOrNull()
            if (a != null && b != null) {
                fMin = a; fMax = b; parsedExplicit = null
            } else {
                fMin = h * 0.6; fMax = h * 0.8; parsedExplicit = null
            }
        } else if (headParts.size == 1) {
            val v = headParts[0].trim().toDoubleOrNull()
            if (v != null && v > 0) {
                fMin = v - 2; fMax = v + 2; parsedExplicit = v
            } else {
                fMin = h * 0.6; fMax = h * 0.8; parsedExplicit = null
            }
        } else {
            fMin = h * 0.6; fMax = h * 0.8; parsedExplicit = null
        }

        // Compute faceTarget
        val target = explicitFaceTarget ?: parsedExplicit ?: run {
            val base = when {
                h >= 60 -> fMax - 1
                h >= 40 -> max(33.0, fMin + 1)
                else -> h * 0.70
            }
            min(max(base, fMin + 1), fMax - 1)
        }

        return PhotoSpec(
            id = id,
            name = names["ko"] ?: id,
            widthMM = w,
            heightMM = h,
            faceRatioMin = 0.50,
            faceRatioMax = 0.70,
            backgroundColor = "#FFFFFF",
            faceMin = fMin,
            faceMax = fMax,
            faceTarget = target,
            dpi = docDpi
        )
    }

    val aspectRatio: Float
        get() {
            val cleaned = size.replace(" mm", "").replace(" ", "")
            val parts = cleaned.split("×", "x")
            val w = parts.firstOrNull()?.trim()?.toFloatOrNull() ?: 35f
            val h = parts.lastOrNull()?.trim()?.toFloatOrNull() ?: 45f
            return w / h
        }
}

// ─── ContinentGroup ───

data class ContinentGroup(
    val id: String,
    val names: Map<String, String>,
    val icon: String,
    val countries: List<Country>,
    val gradA: String = "1A1A2A",
    val gradB: String = "2A2A3A",
    val dot: String = "00D4AA",
    val image: String = ""
) {
    fun name(lang: String): String = names[lang] ?: names["ko"] ?: id
}

// ─── BgOption ───

data class BgOption(
    val id: String,
    val hex: String,
    val names: Map<String, String>
) {
    fun name(lang: String): String = names[lang] ?: names["ko"] ?: id
}

// ─── Static data ───

val bgOptions: List<BgOption> = listOf(
    BgOption("white", "FFFFFF", mapOf("ko" to "백색", "en" to "White", "ja" to "白")),
    BgOption("offw", "F5F5F5", mapOf("ko" to "오프화이트", "en" to "Off-white", "ja" to "オフホワイト")),
    BgOption("ivory", "FFFFF0", mapOf("ko" to "미색", "en" to "Ivory", "ja" to "アイボリー")),
    BgOption("grey", "E0E0E0", mapOf("ko" to "회색", "en" to "Grey", "ja" to "グレー")),
    BgOption("ltblue", "D6EAF8", mapOf("ko" to "연파랑", "en" to "Light Blue", "ja" to "淡い青")),
    BgOption("blue", "7BA3C9", mapOf("ko" to "블루", "en" to "Blue", "ja" to "ブルー")),
)

val continentOrder: List<String> = listOf(
    "asia", "europe", "americas", "oceania", "africa", "middleeast"
)

data class ContinentMeta(
    val names: Map<String, String>,
    val icon: String,
    val gradA: String,
    val gradB: String,
    val dot: String,
    val image: String
)

val continentMeta: Map<String, ContinentMeta> = mapOf(
    "asia" to ContinentMeta(
        mapOf("ko" to "아시아", "en" to "Asia", "ja" to "アジア"),
        "🌏", "1A3A2A", "2D5A3A", "00D4AA", "cont_asia"
    ),
    "europe" to ContinentMeta(
        mapOf("ko" to "유럽", "en" to "Europe", "ja" to "ヨーロッパ"),
        "🌍", "1A1A3A", "3A2A5A", "A78BFA", "cont_europe"
    ),
    "americas" to ContinentMeta(
        mapOf("ko" to "아메리카", "en" to "Americas", "ja" to "アメリカ大陸"),
        "🌎", "1A2A3A", "2A3A5A", "3B82F6", "cont_americas"
    ),
    "africa" to ContinentMeta(
        mapOf("ko" to "아프리카", "en" to "Africa", "ja" to "アフリカ"),
        "🌍", "3A2A1A", "5A3A1A", "FFB020", "cont_africa"
    ),
    "oceania" to ContinentMeta(
        mapOf("ko" to "오세아니아", "en" to "Oceania", "ja" to "オセアニア"),
        "🌊", "1A2A2A", "1A3A4A", "FF6B9D", "cont_oceania"
    ),
    "middleeast" to ContinentMeta(
        mapOf("ko" to "중동", "en" to "Middle East", "ja" to "中東"),
        "🕌", "2A2A1A", "4A3A1A", "F59E0B", "cont_middleeast"
    ),
)

fun groupedByContinent(countries: List<Country>): List<ContinentGroup> {
    val dict = mutableMapOf<String, MutableList<Country>>()
    for (c in countries) {
        dict.getOrPut(c.continent) { mutableListOf() }.add(c)
    }
    return continentOrder.mapNotNull { key ->
        val list = dict[key] ?: return@mapNotNull null
        if (list.isEmpty()) return@mapNotNull null
        val meta = continentMeta[key] ?: return@mapNotNull null
        ContinentGroup(
            id = key,
            names = meta.names,
            icon = meta.icon,
            countries = list,
            gradA = meta.gradA,
            gradB = meta.gradB,
            dot = meta.dot,
            image = meta.image
        )
    }
}

val purposeList: List<String> = listOf("passport", "visa", "license", "custom")
