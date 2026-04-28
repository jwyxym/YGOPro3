package cn.jwyxym.ygopro3

import android.os.Bundle
import android.os.Environment
import android.view.View
import androidx.activity.enableEdgeToEdge
import java.io.*

class MainActivity : TauriActivity() {

	override fun onCreate(savedInstanceState: Bundle?) {
		enableEdgeToEdge()
		super.onCreate(savedInstanceState)

		copyAssets()
		screen()
	}

	private fun copyAssets() {

		val targetDir = getExternalFilesDir(null) ?: return
		val targetFile = File(targetDir, "assets")

		val localVersion = readVersion(targetFile)

		try {
			assets.open("assets").use { inputStream ->

				val header = ByteArray(3)
				if (inputStream.read(header) != 3) return

				val assetVersion = header.map { it.toInt() and 0xFF }

				if (localVersion == assetVersion) return

				targetFile.parentFile?.mkdirs()

				FileOutputStream(targetFile).use { outputStream ->
					outputStream.write(header)
					inputStream.copyTo(outputStream)
				}
			}

		} catch (e: Exception) {
			e.printStackTrace()
		}
	}

	private fun readVersion(file: File): List<Int>? {
		if (!file.exists()) return null

		return try {
			FileInputStream(file).use {
				val header = ByteArray(3)
				if (it.read(header) == 3)
					header.map { b -> b.toInt() and 0xFF }
				else
					null
			}
		} catch (e: Exception) {
			null
		}
	}

	private fun screen() {
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
			screen()
		}
	}
}