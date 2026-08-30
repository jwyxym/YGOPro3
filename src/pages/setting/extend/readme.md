<h1>对于自定义脚本</h1>
<h3>必须具有一个入口函数</h3>

```javascript
function main () {}
```
<h3>关于入口函数的描述</h3>
<table>
	<tr>
		<th>脚本</th>
		<th>参数数量</th>
		<th>参数类型</th>
		<th>参数描述</th>
		<th>返回值类型</th>
		<th>返回描述</th>
	</tr>
	<tr>
		<td>DGLAB 自定义脚本</td>
		<td>2</td>
		<td>number,<br/>string[]</td>
		<td>失去的基本分,<br/>
			<a target = '_blank' href = 'https://github.com/dungeonlab-open/dglab-kit/blob/main/src/waveform/ovc.ts'>默认波形列表</a>
		</td>
		<td>[number,<br/>number,<br/>string[] | number]</td>
		<td>[强度(0-200),<br/>时间(秒),<br/>自定义波形/下标(选填)]</td>
	</tr>
</table>