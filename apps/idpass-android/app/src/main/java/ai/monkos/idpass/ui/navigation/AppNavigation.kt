package ai.monkos.idpass.ui.navigation

import android.graphics.Bitmap
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import ai.monkos.idpass.data.Country
import ai.monkos.idpass.data.CropState
import ai.monkos.idpass.data.DocSpec
import ai.monkos.idpass.data.FaceDetectionResult
import ai.monkos.idpass.ui.landing.LandingScreen
import ai.monkos.idpass.ui.step1.Step1Screen
import ai.monkos.idpass.ui.step2.Step2Screen
import ai.monkos.idpass.ui.step3.Step3Screen
import ai.monkos.idpass.ui.step4.Step4Screen
import ai.monkos.idpass.ui.step5.Step5Screen
import ai.monkos.idpass.ui.thanks.ThanksScreen

// ─── Screen Routes ───

sealed class Screen(val route: String) {
    data object Landing : Screen("landing")
    data object Step1   : Screen("step1")
    data object Step2   : Screen("step2")
    data object Step3   : Screen("step3")
    data object Step4   : Screen("step4")
    data object Step5   : Screen("step5")
    data object Thanks  : Screen("thanks")
}

// ─── Shared Flow State ───

class CropFlowState {
    var selectedCountry: Country? by mutableStateOf(null)
    var selectedDoc: DocSpec? by mutableStateOf(null)
    var purpose: String by mutableStateOf("passport")
    var lang: String by mutableStateOf("ko")

    var inputBitmap: Bitmap? by mutableStateOf(null)
    var bgRemovedBitmap: Bitmap? by mutableStateOf(null)
    var croppedBitmap: Bitmap? by mutableStateOf(null)

    var faceResult: FaceDetectionResult? by mutableStateOf(null)
    var cropState: CropState? by mutableStateOf(null)

    var bgColorHex: String by mutableStateOf("FFFFFF")

    fun reset() {
        inputBitmap?.recycle()
        bgRemovedBitmap?.recycle()
        croppedBitmap?.recycle()
        inputBitmap = null
        bgRemovedBitmap = null
        croppedBitmap = null
        faceResult = null
        cropState = null
        bgColorHex = "FFFFFF"
    }
}

class CropFlowViewModel : ViewModel() {
    val flow = CropFlowState()

    override fun onCleared() {
        flow.reset()
        super.onCleared()
    }
}

// ─── Navigation Host ───

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val vm: CropFlowViewModel = viewModel()

    NavHost(
        navController = navController,
        startDestination = Screen.Landing.route,
    ) {
        composable(Screen.Landing.route) {
            LandingScreen(
                vm = vm,
                onStart = { purpose ->
                    vm.flow.purpose = purpose
                    navController.navigate(Screen.Step1.route)
                },
            )
        }

        composable(Screen.Step1.route) {
            Step1Screen(
                vm = vm,
                onDocSelected = {
                    navController.navigate(Screen.Step2.route)
                },
                onBack = { navController.popBackStack() },
                onHome = {
                    navController.popBackStack(Screen.Landing.route, false)
                },
            )
        }

        composable(Screen.Step2.route) {
            Step2Screen(
                vm = vm,
                onPhotoReady = { skipBg ->
                    if (skipBg) {
                        navController.navigate(Screen.Step4.route)
                    } else {
                        navController.navigate(Screen.Step3.route)
                    }
                },
                onBack = { navController.popBackStack() },
                onHome = {
                    navController.popBackStack(Screen.Landing.route, false)
                },
            )
        }

        composable(Screen.Step3.route) {
            Step3Screen(
                vm = vm,
                onNext = {
                    navController.navigate(Screen.Step4.route)
                },
                onBack = { navController.popBackStack() },
                onHome = {
                    navController.popBackStack(Screen.Landing.route, false)
                },
            )
        }

        composable(Screen.Step4.route) {
            Step4Screen(
                vm = vm,
                onCropDone = {
                    navController.navigate(Screen.Step5.route)
                },
                onBack = { navController.popBackStack() },
                onHome = {
                    navController.popBackStack(Screen.Landing.route, false)
                },
            )
        }

        composable(Screen.Step5.route) {
            Step5Screen(
                vm = vm,
                onCropAnother = {
                    vm.flow.reset()
                    navController.popBackStack(Screen.Step1.route, false)
                },
                onStartOver = {
                    vm.flow.reset()
                    navController.popBackStack(Screen.Landing.route, false)
                },
                onBack = { navController.popBackStack() },
                onHome = {
                    navController.popBackStack(Screen.Landing.route, false)
                },
            )
        }

        composable(Screen.Thanks.route) {
            ThanksScreen(
                onStartOver = {
                    vm.flow.reset()
                    navController.popBackStack(Screen.Landing.route, false)
                },
            )
        }
    }
}
