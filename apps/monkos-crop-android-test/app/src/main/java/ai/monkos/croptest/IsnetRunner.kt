package ai.monkos.croptest

import android.content.Context
import android.graphics.*
import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import java.nio.FloatBuffer

class IsnetRunner(private val context: Context) {

    companion object {
        private const val MODEL_FILE = "models/isnet_general_use.onnx"
        private const val EXTERNAL_MODEL = "isnet_general_use.onnx"
        private const val INPUT_SIZE = 1024
    }

    fun segment(bitmap: Bitmap): Bitmap? {
        val env = OrtEnvironment.getEnvironment()

        // Try external files dir first (pushed via adb), then assets
        val externalFile = java.io.File(context.getExternalFilesDir(null), EXTERNAL_MODEL)
        val session = if (externalFile.exists()) {
            env.createSession(externalFile.absolutePath, OrtSession.SessionOptions())
        } else {
            val modelBytes = try {
                context.assets.open(MODEL_FILE).use { it.readBytes() }
            } catch (e: Exception) {
                throw RuntimeException("ISNet model not found. Push via: adb push isnet_general_use.onnx /sdcard/Android/data/ai.monkos.croptest/files/")
            }
            env.createSession(modelBytes, OrtSession.SessionOptions())
        }

        val resized = Bitmap.createScaledBitmap(bitmap, INPUT_SIZE, INPUT_SIZE, true)
        val inputTensor = preprocessBitmap(resized, env)

        val inputName = session.inputNames.first()
        val output = session.run(mapOf(inputName to inputTensor))

        val outputTensor = output[0] as OnnxTensor
        val outputData = outputTensor.floatBuffer

        val mask = postprocessMask(outputData, INPUT_SIZE, INPUT_SIZE)
        val result = applyMaskToBitmap(bitmap, mask, INPUT_SIZE, INPUT_SIZE)

        session.close()
        inputTensor.close()

        return result
    }

    private fun preprocessBitmap(bitmap: Bitmap, env: OrtEnvironment): OnnxTensor {
        val pixels = IntArray(INPUT_SIZE * INPUT_SIZE)
        bitmap.getPixels(pixels, 0, INPUT_SIZE, 0, 0, INPUT_SIZE, INPUT_SIZE)

        val floatArray = FloatArray(3 * INPUT_SIZE * INPUT_SIZE)
        for (i in pixels.indices) {
            val pixel = pixels[i]
            floatArray[i] = (Color.red(pixel) / 255.0f)
            floatArray[INPUT_SIZE * INPUT_SIZE + i] = (Color.green(pixel) / 255.0f)
            floatArray[2 * INPUT_SIZE * INPUT_SIZE + i] = (Color.blue(pixel) / 255.0f)
        }

        val shape = longArrayOf(1, 3, INPUT_SIZE.toLong(), INPUT_SIZE.toLong())
        return OnnxTensor.createTensor(env, FloatBuffer.wrap(floatArray), shape)
    }

    private fun postprocessMask(buffer: FloatBuffer, width: Int, height: Int): FloatArray {
        buffer.rewind()
        val mask = FloatArray(width * height)
        for (i in mask.indices) {
            val v = buffer.get()
            mask[i] = 1.0f / (1.0f + kotlin.math.exp(-v)) // sigmoid
        }
        return mask
    }

    private fun applyMaskToBitmap(
        original: Bitmap,
        mask: FloatArray,
        maskW: Int,
        maskH: Int
    ): Bitmap {
        val scaledOriginal = Bitmap.createScaledBitmap(original, maskW, maskH, true)
        val output = Bitmap.createBitmap(maskW, maskH, Bitmap.Config.ARGB_8888)

        for (y in 0 until maskH) {
            for (x in 0 until maskW) {
                val idx = y * maskW + x
                val alpha = (mask[idx] * 255).toInt().coerceIn(0, 255)
                val pixel = scaledOriginal.getPixel(x, y)
                output.setPixel(
                    x, y,
                    Color.argb(alpha, Color.red(pixel), Color.green(pixel), Color.blue(pixel))
                )
            }
        }

        val whiteBg = Bitmap.createBitmap(maskW, maskH, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(whiteBg)
        canvas.drawColor(Color.WHITE)
        canvas.drawBitmap(output, 0f, 0f, null)

        return whiteBg
    }
}
