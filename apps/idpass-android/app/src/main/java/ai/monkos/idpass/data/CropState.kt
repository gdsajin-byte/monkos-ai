package ai.monkos.idpass.data

import android.graphics.PointF
import kotlin.math.atan2

// ─── Signal ───

enum class Signal(val color: Long) {
    NEUTRAL(0xFF6B7D9A),
    PASS(0xFF00D4AA),
    WARN(0xFFFFB020),
    FAIL(0xFFFF4444);
}

// ─── CropState ───

data class CropState(
    var crown: PointF = PointF(0f, 0f),
    var chin: PointF = PointF(0f, 0f),
    var leftPupil: PointF = PointF(0f, 0f),
    var rightPupil: PointF = PointF(0f, 0f),
    var noseTip: PointF = PointF(0f, 0f),
    var mouthCenter: PointF = PointF(0f, 0f),
    var imgOffsetX: Float = 0f,
    var imgOffsetY: Float = 0f,
    var imgScale: Float = 1f,
    var natW: Float = 1f,
    var natH: Float = 1f
) {
    val faceCenterX: Float
        get() {
            val eyeMidX = (leftPupil.x + rightPupil.x) / 2f
            return (eyeMidX + noseTip.x + mouthCenter.x) / 3f
        }

    fun moveAll(dx: Float, dy: Float) {
        crown.offset(dx, dy)
        chin.offset(dx, dy)
        leftPupil.offset(dx, dy)
        rightPupil.offset(dx, dy)
        noseTip.offset(dx, dy)
        mouthCenter.offset(dx, dy)
    }

    fun rescaleAll(newScale: Float, centerX: Float, centerY: Float) {
        val r = newScale / imgScale
        fun rs(pt: PointF): PointF = PointF(
            centerX + (pt.x - centerX) * r,
            centerY + (pt.y - centerY) * r
        )
        crown = rs(crown)
        chin = rs(chin)
        leftPupil = rs(leftPupil)
        rightPupil = rs(rightPupil)
        noseTip = rs(noseTip)
        mouthCenter = rs(mouthCenter)
        imgScale = newScale
    }

    fun copy(): CropState = CropState(
        crown = PointF(crown.x, crown.y),
        chin = PointF(chin.x, chin.y),
        leftPupil = PointF(leftPupil.x, leftPupil.y),
        rightPupil = PointF(rightPupil.x, rightPupil.y),
        noseTip = PointF(noseTip.x, noseTip.y),
        mouthCenter = PointF(mouthCenter.x, mouthCenter.y),
        imgOffsetX = imgOffsetX,
        imgOffsetY = imgOffsetY,
        imgScale = imgScale,
        natW = natW,
        natH = natH
    )
}

// ─── CropMetrics ───

data class CropMetrics(
    val faceMm: Float,
    val topMm: Float,
    val bottomMm: Float,
    val eyeRatio: Float,
    val eyePct: Float,
    val centerOffsetMm: Float,
    val faceSignal: Signal,
    val eyeSignal: Signal,
    val topSignal: Signal,
    val btmSignal: Signal,
    val centerSignal: Signal,
    val isBlocked: Boolean,
    val coverageShort: Boolean = false
)

// ─── FaceDetectionResult ───

data class FaceDetectionResult(
    val eyeCenterX: Float,
    val eyeCenterY: Float,
    val chinY: Float,
    val imageWidth: Float,
    val imageHeight: Float,
    val leftEyeX: Float,
    val leftEyeY: Float,
    val rightEyeX: Float,
    val rightEyeY: Float,
    val rollDeg: Float,
    val yawDeg: Float
) {
    val tiltDeg: Float
        get() = Math.toDegrees(
            atan2(
                (rightEyeY - leftEyeY).toDouble(),
                (rightEyeX - leftEyeX).toDouble()
            )
        ).toFloat()
}
