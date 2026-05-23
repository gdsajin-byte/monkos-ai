package ai.monkos.croptest

import android.graphics.Bitmap
import android.graphics.PointF

data class TestResult(
    val sampleName: String,
    val originalBitmap: Bitmap?,
    val mlKitBitmap: Bitmap?,
    val mlKitTimeMs: Long,
    val mlKitError: String?,
    val isnetBitmap: Bitmap?,
    val isnetTimeMs: Long,
    val isnetError: String?
)

data class FaceTestResult(
    val sampleName: String,
    val faceCount: Int,
    val contourPointCount: Int,
    val landmarkCount: Int,
    val timeMs: Long,
    val eyeLeft: PointF?,
    val eyeRight: PointF?,
    val noseBase: PointF?,
    val chinBottom: PointF?,
    val contourDump: String?,
    val error: String?
)
