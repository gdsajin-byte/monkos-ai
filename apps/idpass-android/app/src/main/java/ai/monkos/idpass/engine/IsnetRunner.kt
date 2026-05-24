package ai.monkos.idpass.engine

import android.content.Context
import android.graphics.*
import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import java.nio.FloatBuffer

class IsnetRunner(private val context: Context) {

    companion object {
        private const val MODEL_FILE = "models/isnet_medium.onnx"
        private const val EXTERNAL_MODEL = "isnet_medium.onnx"
        private const val INPUT_SIZE = 512
    }

    private var cachedMask: FloatArray? = null
    private var cachedOriginal: Bitmap? = null

    fun isModelAvailable(): Boolean {
        return try {
            context.assets.open(MODEL_FILE).use { it.available() > 0 }
        } catch (_: Exception) {
            val ext = java.io.File(context.getExternalFilesDir(null), EXTERNAL_MODEL)
            ext.exists()
        }
    }

    fun segment(bitmap: Bitmap, bgColorHex: String): Bitmap? {
        val isSame = cachedOriginal === bitmap && cachedMask != null
        val mask: FloatArray

        if (!isSame) {
            val env = OrtEnvironment.getEnvironment()
            val extFile = java.io.File(context.getExternalFilesDir(null), EXTERNAL_MODEL)
            val opts = OrtSession.SessionOptions().apply {
                try { addNnapi() } catch (_: Exception) { }
            }
            val session = if (extFile.exists()) {
                env.createSession(extFile.absolutePath, opts)
            } else {
                val bytes = context.assets.open(MODEL_FILE).use { it.readBytes() }
                env.createSession(bytes, opts)
            }

            val resized = Bitmap.createScaledBitmap(bitmap, INPUT_SIZE, INPUT_SIZE, true)
            val inputTensor = preprocessBitmap(resized, env)
            val inputName = session.inputNames.first()
            val output = session.run(mapOf(inputName to inputTensor))
            val outputTensor = output[0] as OnnxTensor
            val outputData = outputTensor.floatBuffer

            mask = postprocessMask(outputData)
            cachedMask = mask
            cachedOriginal = bitmap

            session.close()
            inputTensor.close()
        } else {
            mask = cachedMask!!
        }

        return compositeOnBackground(bitmap, mask, bgColorHex)
    }

    fun clearCache() {
        cachedMask = null
        cachedOriginal = null
    }

    private fun preprocessBitmap(bitmap: Bitmap, env: OrtEnvironment): OnnxTensor {
        val pixels = IntArray(INPUT_SIZE * INPUT_SIZE)
        bitmap.getPixels(pixels, 0, INPUT_SIZE, 0, 0, INPUT_SIZE, INPUT_SIZE)

        val floatArray = FloatArray(3 * INPUT_SIZE * INPUT_SIZE)
        for (i in pixels.indices) {
            val pixel = pixels[i]
            floatArray[i] = Color.red(pixel) / 255.0f
            floatArray[INPUT_SIZE * INPUT_SIZE + i] = Color.green(pixel) / 255.0f
            floatArray[2 * INPUT_SIZE * INPUT_SIZE + i] = Color.blue(pixel) / 255.0f
        }

        val shape = longArrayOf(1, 3, INPUT_SIZE.toLong(), INPUT_SIZE.toLong())
        return OnnxTensor.createTensor(env, FloatBuffer.wrap(floatArray), shape)
    }

    private fun postprocessMask(buffer: FloatBuffer): FloatArray {
        buffer.rewind()
        val mask = FloatArray(INPUT_SIZE * INPUT_SIZE)
        for (i in mask.indices) {
            val v = buffer.get()
            mask[i] = 1.0f / (1.0f + kotlin.math.exp(-v))
        }
        return mask
    }

    private fun compositeOnBackground(original: Bitmap, mask: FloatArray, bgHex: String): Bitmap {
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
                val mx = (x.toFloat() / w * INPUT_SIZE).toInt().coerceIn(0, INPUT_SIZE - 1)
                val my = (y.toFloat() / h * INPUT_SIZE).toInt().coerceIn(0, INPUT_SIZE - 1)
                val alpha = mask[my * INPUT_SIZE + mx]

                val px = pixels[y * w + x]
                val r = (Color.red(px) * alpha + bgR * (1f - alpha)).toInt().coerceIn(0, 255)
                val g = (Color.green(px) * alpha + bgG * (1f - alpha)).toInt().coerceIn(0, 255)
                val b = (Color.blue(px) * alpha + bgB * (1f - alpha)).toInt().coerceIn(0, 255)
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
