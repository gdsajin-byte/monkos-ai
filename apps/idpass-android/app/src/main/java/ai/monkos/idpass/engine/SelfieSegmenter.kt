package ai.monkos.idpass.engine

import android.graphics.Bitmap
import android.graphics.Color
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.Segmentation
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions
import kotlinx.coroutines.suspendCancellableCoroutine
import java.nio.ByteBuffer
import kotlin.coroutines.resume

class SelfieSegmenter {

    private val segmenter = Segmentation.getClient(
        SelfieSegmenterOptions.Builder()
            .setDetectorMode(SelfieSegmenterOptions.SINGLE_IMAGE_MODE)
            .enableRawSizeMask()
            .build()
    )

    private var cachedMask: FloatArray? = null
    private var cachedMaskW = 0
    private var cachedMaskH = 0
    private var cachedOriginal: Bitmap? = null

    suspend fun removeBackground(bitmap: Bitmap, bgColorHex: String): Bitmap? {
        val isSame = cachedOriginal === bitmap && cachedMask != null

        if (!isSame) {
            val inputImage = InputImage.fromBitmap(bitmap, 0)
            val result = suspendCancellableCoroutine { cont ->
                segmenter.process(inputImage)
                    .addOnSuccessListener { mask ->
                        val buf = mask.buffer
                        buf.rewind()
                        val w = mask.width
                        val h = mask.height
                        val floats = FloatArray(w * h)
                        for (i in 0 until w * h) {
                            floats[i] = buf.float
                        }
                        cachedMask = floats
                        cachedMaskW = w
                        cachedMaskH = h
                        cachedOriginal = bitmap
                        cont.resume(true)
                    }
                    .addOnFailureListener { cont.resume(false) }
            }
            if (!result) return null
        }

        val mask = cachedMask ?: return null
        return compositeOnBackground(bitmap, mask, cachedMaskW, cachedMaskH, bgColorHex)
    }

    fun clearCache() {
        cachedMask = null
        cachedOriginal = null
    }

    private fun compositeOnBackground(
        original: Bitmap,
        mask: FloatArray,
        maskW: Int,
        maskH: Int,
        bgHex: String,
    ): Bitmap {
        val bgColor = parseHex(bgHex)
        val bgR = Color.red(bgColor)
        val bgG = Color.green(bgColor)
        val bgB = Color.blue(bgColor)

        val w = original.width
        val h = original.height
        val pixels = IntArray(w * h)
        original.getPixels(pixels, 0, w, 0, 0, w, h)

        val result = IntArray(w * h)
        for (y in 0 until h) {
            for (x in 0 until w) {
                val mx = (x.toFloat() / w * maskW).toInt().coerceIn(0, maskW - 1)
                val my = (y.toFloat() / h * maskH).toInt().coerceIn(0, maskH - 1)
                val confidence = mask[my * maskW + mx].coerceIn(0f, 1f)

                val px = pixels[y * w + x]
                val r = (Color.red(px) * confidence + bgR * (1f - confidence)).toInt().coerceIn(0, 255)
                val g = (Color.green(px) * confidence + bgG * (1f - confidence)).toInt().coerceIn(0, 255)
                val b = (Color.blue(px) * confidence + bgB * (1f - confidence)).toInt().coerceIn(0, 255)
                result[y * w + x] = Color.argb(255, r, g, b)
            }
        }

        val output = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        output.setPixels(result, 0, w, 0, 0, w, h)
        return output
    }

    private fun parseHex(hex: String): Int {
        val clean = hex.trimStart('#')
        return try { Color.parseColor("#$clean") } catch (_: Exception) { Color.WHITE }
    }
}
