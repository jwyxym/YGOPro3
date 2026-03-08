<div align = 'center'>
	<img width = '15%' src = './src-tauri/icons/icon.jpg' alt = 'logo'>
	<h1>YGOPro3</h1>

[![Rust](https://img.shields.io/badge/Rust-1.91-orange.svg)](https://www.rust-lang.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-brightgreen.svg)](https://vuejs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-v2.0-blue.svg)](https://tauri.app/)
[![Java](https://img.shields.io/badge/Java-21+-yellow.svg)](https://www.oracle.com/java/)
[![ndk](https://img.shields.io/badge/ndk-27-darkgreen.svg)](https://developer.android.com/ndk/downloads/)
</div>

<div>
	<p>
	本项目是一款基于 Tauri v2.0 框架的游戏王开源线上对战平台。通讯协议基于 YGOPro 标准，可以与任何其他基于此标准的客户端进行联机对战。
	</p>
</div>

<div>
	<h3>开发环境</h3>
	<ul>
		<li>Node.js v22</li>
		<li>Rust 1.91</li>
		<li>Java 21（Android开发）</li>
		<li>NDK 27（Android开发）</li>
	</ul>
</div>

<h3>运行项目</h3>
<h5>Clone 仓库</h5>

```bash
git clone https://github.com/jwyxym/tauri-ygo.git
cd tauri-ygo
```
<h5>初始化tauri项目所需的config文件</h5>

```bash
# dev模式或
npm run json:dev
# 编译android
npm run json:android
# 编译windows
npm run json:windows
```

<h5>安装依赖</h5>

```bash
npm install
```
<h5>如果是安卓则需要初始化 kt 代码</h5>

```bash
npm run tauri:android:init
# Linux
npm run copy:sh
# Windows cmd
npm run copy:cmd
```
<h5>Dev 模式</h5>

```bash
#调试Windows
npm run tauri:dev
#调试Android 需以管理员权限运行
npm run tauri:android:dev
```
<h5>编译项目</h5>

```bash
#Android 的icon图标需要重新设置， 其他平台不用
npm run icon

#编译Windows
npm run tauri:build
#编译Android
npm run tauri:android:build
```
