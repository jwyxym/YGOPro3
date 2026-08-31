<h1>对于自定义脚本</h1>
<p>
脚本必须放在游戏根目录的plugin文件夹下
<br/>
必须具有一个入口函数
</p>

```javascript
function main () {}
```
<h3>关于入口函数的描述</h3>
<table>
	<tr>
		<th>脚本</th>
		<th>文件名</th>
		<th>参数数量</th>
		<th>参数类型</th>
		<th>参数描述</th>
		<th>返回值类型</th>
		<th>返回描述</th>
	</tr>
	<tr>
		<td>DGLAB 自定义脚本</td>
		<td>dglab.js</td>
		<td>2</td>
		<td>number,<br/>string[]</td>
		<td>失去的基本分,<br/>
			<a target = '_blank' href = 'https://github.com/dungeonlab-open/dglab-kit/blob/main/src/waveform/ovc.ts'>默认波形列表</a>
		</td>
		<td>[number,<br/>number,<br/>string[] | number]</td>
		<td>[强度(0-200),<br/>时间(秒),<br/>自定义波形/下标(选填)]</td>
	</tr>
</table>

<h3>YGOPro3 JS API</h3>
<span>你可以在js脚本中调用全局对象YGOPro3的方法</span>

```javascript
try {
	YGOPro3.log('hello world')
} catch (e) {
	// ......
}
```

<table>
	<tr>
		<th>方法</th>
		<th>默认启用</th>
		<th>方法解释</th>
		<th>参数数量</th>
		<th>参数类型</th>
		<th>返回值</th>
	</tr>
	<tr>
		<td>log</td>
		<td>是</td>
		<td>在error.log写入string</td>
		<th>1</th>
		<th>string</th>
		<th>void</th>
	</tr>
</table>