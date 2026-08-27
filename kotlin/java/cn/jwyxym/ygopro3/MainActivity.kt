package cn.jwyxym.ygopro3

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.OpenableColumns
import android.view.View
import androidx.activity.enableEdgeToEdge
import java.io.*

class MainActivity : TauriActivity() {
	override fun onCreate(savedInstanceState: Bundle?) {
		enableEdgeToEdge()
		super.onCreate(savedInstanceState)

		copyAssets()
		screen()
		handleOpenIntent(intent)
	}

	override fun onNewIntent(intent: Intent) {
		super.onNewIntent(intent)
		setIntent(intent)
		handleOpenIntent(intent)
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

	private fun handleOpenIntent(intent: Intent?) {
		if (intent?.action != Intent.ACTION_VIEW) return

		val uri = intent.data ?: return
		copyOpenedFile(uri)
	}

	private fun copyOpenedFile(uri: Uri): String? {
		val name = getDisplayName(uri)
			?: uri.lastPathSegment
			?: return null

		val targetDir = when {
			name.endsWith(".ypk", ignoreCase = true) -> "expansions"
			name.endsWith(".yrp3d", ignoreCase = true) -> "replay"
			else -> return null
		}

		val dir = File(getExternalFilesDir(null), targetDir)
		dir.mkdirs()

		val target = File(dir, File(name).name)
		return try {
			contentResolver.openInputStream(uri)?.use { input ->
				FileOutputStream(target).use { output ->
					input.copyTo(output)
				}
			} ?: return null
			target.absolutePath
		} catch (e: Exception) {
			e.printStackTrace()
			null
		}
	}

	private fun getDisplayName(uri: Uri): String? {
		return contentResolver.query(uri, null, null, null, null)?.use { cursor ->
			val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
			if (index >= 0 && cursor.moveToFirst()) cursor.getString(index) else null
		}
	}
}
