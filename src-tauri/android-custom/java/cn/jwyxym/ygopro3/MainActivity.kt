package cn.jwyxym.ygopro3

import android.os.Bundle
import android.view.View
import androidx.activity.enableEdgeToEdge
import java.io.*

class MainActivity : TauriActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        Thread {
            copyAssets()
        }.start()

        setSimpleFullScreen()
    }
`
    private fun copyAssets() {

        val targetDir = getExternalFilesDir(null) ?: return
        val targetFile = File(targetDir, "assets")

        if (targetFile.exists()) return

        try {
            assets.open("assets").use { inputStream ->

                targetFile.parentFile?.mkdirs()
                FileOutputStream(targetFile).use { outputStream ->
                    inputStream.copyTo(outputStream)
                }
            }

        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun setSimpleFullScreen() {
        supportActionBar?.hide()

        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
            View.SYSTEM_UI_FLAG_FULLSCREEN or
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        )
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            setSimpleFullScreen()
        }
    }
}
