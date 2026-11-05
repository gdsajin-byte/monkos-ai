plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}
// 빌드물은 레포 밖(~/.monkos/go_android/gradle-build) — APK·중간물 커밋 금지(ORDER_20261106 2항)
allprojects {
    layout.buildDirectory.set(file(System.getProperty("user.home") + "/.monkos/go_android/gradle-build/" + project.name))
}
