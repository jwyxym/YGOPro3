# YGOPro3 通讯协议文档

本文档根据当前目录下的 `protocol.ts`、`network.ts`、`msg.ts`、`tcp.ts`、`ws.ts` 和 `connect.ts` 整理，描述客户端与 YGOPro 服务端之间的通讯格式、连接流程、外层协议包以及决斗内 `GAME_MSG` 的处理方式。

## 1. 基础约定

### 1.1 字节序与数据类型

协议中的整数均使用 little-endian。

| 类型 | 长度 | 读写方法 | 说明 |
| --- | ---: | --- | --- |
| `uint8` | 1 | `read.uint8()` / `write.uint8()` | 无符号 8 位整数 |
| `uint16` | 2 | `read.uint16()` / `write.uint16()` | 无符号 16 位整数 |
| `uint32` | 4 | `read.uint32()` / `write.uint32()` | 无符号 32 位整数 |
| `int8` | 1 | `read.int8()` / `write.int8()` | 有符号 8 位整数 |
| `int16` | 2 | `read.int16()` / `write.int16()` | 有符号 16 位整数 |
| `int32` | 4 | `read.int32()` / `write.int32()` | 有符号 32 位整数 |
| `str(len)` | `len` | `read.str(len)` / `write.str(str, len)` | UTF-16LE 字符串，读取时过滤 `<= 0x1F` 的控制字符 |

### 1.2 包格式

每个业务包由协议头和内容组成，完整结构如下：

```text
uint16 length
uint8 head
byte[length - 1] content
```

| 字段 | 长度 | 说明 |
| --- | ---: | --- |
| `length` | 2 | 后续消息体长度，包含 `head` 本身，不包含 `length` 字段 |
| `head` | 1 | 外层协议号，例如 `STOC.GAME_MSG` 或 `CTOS.JOIN_GAME` |
| `content` | `length - 1` | 当前外层协议的内容；无内容时长度为 0 |

`Msg.buffer()` 会自动生成上述结构；`Msg` 写入的第一个 `uint8` 会成为业务包的 `head` 字段。

TCP 和 WebSocket 都使用同样的业务包格式：

| 传输 | 接收处理 |
| --- | --- |
| TCP | 支持粘包/半包；未读完的数据会缓存在 `Tcp.cache` 中 |
| WebSocket | 每次 Binary 消息中可以包含多个 length-prefixed 业务包 |

消息处理通过 `PQueue({ concurrency: 1 })` 串行执行，保证服务端消息按顺序落到客户端状态。

## 2. 协议方向

| 前缀 | 方向 | 含义 |
| --- | --- | --- |
| `CTOS` | Client To Server | 客户端发送给服务端 |
| `STOC` | Server To Client | 服务端发送给客户端 |
| `MSG` | Server To Client，嵌套于 `STOC.GAME_MSG` | 决斗过程中的核心游戏消息 |

`Protocol.read(msg, send)` 收到的是已去掉 `length` 的消息体，入口逻辑如下：

```text
message:
  uint8 stoc_protocol
  byte[] stoc_content
```

当 `stoc_protocol == STOC.GAME_MSG` 时，继续读取一层游戏消息：

```text
message:
  uint8 STOC.GAME_MSG
  uint8 msg_protocol
  ...game_msg_payload
```

除 `MSG.RETRY` 外，客户端会缓存当前 `msg_protocol` 和剩余 payload，用于服务端要求重试时重新弹出选择界面。

## 3. 连接与大厅流程

### 3.1 连接成功后客户端发送

客户端连接成功后按顺序发送以下包：

#### `CTOS.EXTERNAL_ADDRESS` `0x17`

```text
uint8  CTOS.EXTERNAL_ADDRESS
uint32 address_type_or_zero
str    address
```

当前实现中 `address_type_or_zero` 固定写 `0`，随后写入服务器地址字符串。

#### `CTOS.PLAYER_INFO` `0x10`

```text
uint8 CTOS.PLAYER_INFO
str   name, fixed 40 bytes
```

玩家名按 UTF-16LE 写入，固定占 40 字节。

#### `CTOS.JOIN_GAME` `0x12`

```text
uint8  CTOS.JOIN_GAME
uint16 VERSION
uint16 game_id_or_zero
uint32 unknown_or_zero
str    password, fixed 40 bytes
```

当前版本号为 `VERSION = 0x1362`。

### 3.2 大厅常用客户端包

#### `CTOS.UPDATE_DECK` `0x02`

```text
uint8  CTOS.UPDATE_DECK
uint32 main_plus_extra_count
uint32 side_count
uint32 card_code[main + extra + side]
```

卡组顺序为 `main -> extra -> side`。

#### 准备、取消准备与开始

| 协议 | 值 | payload | 用途 |
| --- | ---: | --- | --- |
| `CTOS.HS_TODUELIST` | `0x20` | 无 | 变为决斗者 |
| `CTOS.HS_TOOBSERVER` | `0x21` | 无 | 变为观察者 |
| `CTOS.HS_READY` | `0x22` | 无 | 准备 |
| `CTOS.HS_NOTREADY` | `0x23` | 无 | 取消准备 |
| `CTOS.HS_KICK` | `0x24` | `uint8 player` | 房主踢出玩家 |
| `CTOS.HS_START` | `0x25` | 无 | 房主开始决斗 |

#### `CTOS.CHAT` `0x16`

```text
uint8 CTOS.CHAT
str   message
```

聊天字符串使用 UTF-16LE。

#### `CTOS.SURRENDER` `0x14`

```text
uint8 CTOS.SURRENDER
```

用于投降。

## 4. 外层服务端包 `STOC`

下表列出当前客户端已实现处理的 `STOC` 包。

| 协议 | 值 | payload | 客户端行为 |
| --- | ---: | --- | --- |
| `STOC.GAME_MSG` | `0x01` | `uint8 MSG` + 游戏消息 | 推入录像缓存并分派到 `msg` 表 |
| `STOC.ERROR_MSG` | `0x02` | `uint8 error_type`, `byte[3] reserved`, `int32 code` | 当前主要处理卡组错误 |
| `STOC.SELECT_HAND` | `0x03` | 无 | 显示猜拳，响应 `CTOS.HAND_RESULT` |
| `STOC.SELECT_TP` | `0x04` | 无 | 选择先后攻，响应 `CTOS.TP_RESULT` |
| `STOC.HAND_RESULT` | `0x05` | `uint8 self`, `uint8 opponent` | 显示猜拳结果；胜利时进入先后攻选择 |
| `STOC.CHANGE_SIDE` | `0x07` | 无 | 进入换备状态 |
| `STOC.WAITING_SIDE` | `0x08` | 无 | 等待对方换备 |
| `STOC.DECK_COUNT` | `0x09` | `uint16[6]` | 显示双方主/额外/副卡组数量 |
| `STOC.JOIN_GAME` | `0x12` | 见下文 | 更新房间规则信息 |
| `STOC.TYPE_CHANGE` | `0x13` | `uint8 type` | 高 4 位为房主标记，低 4 位为自身座位 |
| `STOC.DUEL_START` | `0x15` | 无 | 进入决斗状态 |
| `STOC.TIME_LIMIT` | `0x18` | `uint8 player`, `byte[1] reserved`, `uint16 seconds` | 更新时间；轮到自己时回 `CTOS.TIME_CONFIRM` |
| `STOC.CHAT` | `0x19` | `uint16 player`, `str message` | 显示玩家、观察者或脚本错误消息 |
| `STOC.HS_PLAYER_ENTER` | `0x20` | `str name[40]`, `uint8 player` | 更新大厅玩家名 |
| `STOC.HS_PLAYER_CHANGE` | `0x21` | `uint8 packed` | 更新准备、离开、观察或换位状态 |
| `STOC.HS_WATCH_CHANGE` | `0x22` | `uint16 count` | 更新观战人数 |
| `STOC.TEAMMATE_SURRENDER` | `0x23` | 无 | 显示队友投降提示 |

### 4.1 `STOC.JOIN_GAME`

```text
uint32 lflist
uint8  rule
uint8  mode
uint8  duel_rule
uint8  no_check_deck_raw
uint8  no_shuffle_deck_raw
byte[3] reserved
int32  start_lp
uint8  start_hand
uint8  draw_count
uint16 time_limit
```

注意：当前代码中 `no_check_deck` 和 `no_shuffle_deck` 的布尔值为 `raw === 0`。

### 4.2 `STOC.ERROR_MSG`

```text
uint8 error_type
byte[3] reserved
int32 code
```

当前只展开处理 `ERROR.DECKERROR`。`code` 的高 4 位是错误标记，低位是卡片 id 或数量：

| 标记 | 含义 |
| --- | --- |
| `ERROR.LFLIST` | 禁限卡表不允许 |
| `ERROR.OCGONLY` | 仅 OCG |
| `ERROR.TCGONLY` | 仅 TCG |
| `ERROR.UNKNOWNCARD` | 未知卡 |
| `ERROR.CARDCOUNT` | 单卡数量错误 |
| `ERROR.MAINCOUNT` | 主卡组数量错误 |
| `ERROR.EXTRACOUNT` | 额外卡组数量错误 |
| `ERROR.SIDECOUNT` | 副卡组数量错误 |

## 5. 决斗内消息 `MSG`

`MSG` 消息均由 `STOC.GAME_MSG` 包裹。当前客户端实现了以下类型：

```text
STOC.GAME_MSG:
  uint8 0x01
  uint8 MSG_xxx
  ...payload
```

### 5.1 通用坐标结构

很多消息使用同一套卡片坐标：

```text
uint8 controller
uint8 location
uint8 sequence
uint8 overlay_sequence
```

客户端会通过 `to.player()` 把服务端玩家编号映射到本地视角：

```text
本地先攻时: 0 -> 0, 1 -> 1
本地后攻时: 0 -> 1, 1 -> 0
```

常用 `location`：

| 名称 | 值 |
| --- | ---: |
| `LOCATION.DECK` | `0x01` |
| `LOCATION.HAND` | `0x02` |
| `LOCATION.MZONE` | `0x04` |
| `LOCATION.SZONE` | `0x08` |
| `LOCATION.GRAVE` | `0x10` |
| `LOCATION.REMOVED` | `0x20` |
| `LOCATION.EXTRA` | `0x40` |
| `LOCATION.OVERLAY` | `0x80` |

常用 `position`：

| 名称 | 值 |
| --- | ---: |
| `POS.FACEUP_ATTACK` | `0x01` |
| `POS.FACEDOWN_ATTACK` | `0x02` |
| `POS.FACEUP_DEFENSE` | `0x04` |
| `POS.FACEDOWN_DEFENSE` | `0x08` |

### 5.2 客户端响应 `CTOS.RESPONSE`

游戏内选择类消息通常回：

```text
uint8 CTOS.RESPONSE
...response_payload
```

常见响应：

| 来源消息 | 响应 payload |
| --- | --- |
| `MSG.SELECT_BATTLECMD` / `MSG.SELECT_IDLECMD` | `uint32 response` |
| `MSG.SELECT_EFFECTYN` / `MSG.SELECT_YESNO` | `uint32 0_or_1` |
| `MSG.SELECT_OPTION` | `uint32 selected_index` |
| `MSG.SELECT_CARD` / `MSG.SELECT_TRIBUTE` / `MSG.SELECT_SUM` | `uint8 count`, `uint8 selected_index[count]`；取消时写 `uint32 -1` |
| `MSG.SELECT_UNSELECT_CARD` | 多次回 `uint8 action`, `uint8 index`；完成/取消时写 `uint32 -1` |
| `MSG.SELECT_CHAIN` | `uint32 chain_index`；取消时写 `uint32 -1` |
| `MSG.SELECT_PLACE` / `MSG.SELECT_DISFIELD` | 每个位置写 `uint8 player`, `uint8 location`, `uint8 sequence` |
| `MSG.SELECT_POSITION` | `uint32 position` |
| `MSG.SELECT_COUNTER` | `int16 counter_count` |
| `MSG.SORT_CARD` | `uint32 count`，实际排序状态由 UI 维护 |
| `MSG.ANNOUNCE_RACE` / `ATTRIB` / `CARD` / `NUMBER` | `uint32 selected_value` |
| `MSG.ROCK_PAPER_SCISSORS` | 通过猜拳 UI 回 `CTOS.RESPONSE`, `uint8 value` |

`SELECT_BATTLECMD` / `SELECT_IDLECMD` 的 `response` 由 `get.response(index, command)` 计算：

| command | 响应编码 |
| --- | --- |
| `COMMAND.SUMMON` | `index << 16` |
| `COMMAND.ATTACK` / `COMMAND.SPSUMMON` | `(index << 16) + 1` |
| `COMMAND.REPOS` | `(index << 16) + 2` |
| `COMMAND.MSET` | `(index << 16) + 3` |
| `COMMAND.SSET` | `(index << 16) + 4` |
| `COMMAND.ACTIVATE` | 战斗指令中为 `index << 16`，空闲指令中为 `(index << 16) + 5` |
| `COMMAND.PHASE` | 根据阶段按钮映射到阶段响应值 |

## 6. 已实现 `MSG` 说明

### 6.1 控制与提示

#### `MSG.RETRY` `1`

```text
uint8 last_msg
```

服务端要求重新选择。客户端会显示对应错误提示，并使用缓存的 `current_msg` 重新执行上一次协议。

#### `MSG.HINT` `2`

```text
uint8  hint_type
uint8  player
uint32 content
```

已处理的 `hint_type`：

| 类型 | 行为 |
| --- | --- |
| `HINT.EVENT` | 更新当前事件文本 |
| `HINT.MESSAGE` | 推送系统提示 |
| `HINT.SELECTMSG` | 缓存选择提示文本 |
| `HINT.OPSELECTED` | 显示对手选择 |
| `HINT.RACE` / `ATTRIB` / `CODE` / `NUMBER` / `CARD` / `ZONE` | 按类型格式化并显示提示 |
| `HINT.DIALOG` | 显示对话提示 |

#### `MSG.START` `4`

初始化决斗双方、LP、手牌、卡组、额外卡组与是否先攻等状态。payload 中包含玩家类型、双方 LP，以及双方卡组数量。

#### `MSG.WIN` `5`

```text
uint8 player
uint8 win_type
```

显示胜负结果。若之前收到 `MSG.MATCH_KILL`，会使用对应卡名补充特殊胜利信息。

### 6.2 数据同步

#### `MSG.UPDATE_DATA` `6`

```text
uint8  player
uint8  location
repeat:
  uint32 block_length
  ...query_data
```

按区域批量更新卡片数据。处理完成后不会立刻刷新场景，而是设置 `need_update = true`，下一个非 `UPDATE_DATA` 消息到来前统一 `duel.update()`。

#### `MSG.UPDATE_CARD` `7`

```text
uint8  player
uint8  location
uint8  sequence
uint32 block_length
...query_data
```

更新单张卡片数据。

#### `query_data` 格式

`update.card()` 先读取：

```text
int32 query_flag
```

随后根据 `QUERY` 位标记顺序读取字段：

| flag | 字段 |
| --- | --- |
| `QUERY.CODE` | `int32 code` |
| `QUERY.POSITION` | `int32 packed_position_data` |
| `QUERY.ALIAS` | `int32 alias` |
| `QUERY.TYPE` | `int32 type` |
| `QUERY.LEVEL` | `int32 level` |
| `QUERY.RANK` | `int32 rank` |
| `QUERY.ATTRIBUTE` | `int32 attribute` |
| `QUERY.RACE` | `int32 race` |
| `QUERY.ATTACK` | `int32 attack` |
| `QUERY.DEFENSE` | `int32 defense` |
| `QUERY.BASE_ATTACK` / `BASE_DEFENSE` | 各跳过 `int32` |
| `QUERY.REASON` / `REASON_CARD` | 各跳过 `int32` |
| `QUERY.EQUIP_CARD` | `uint8 player`, `uint8 location`, `uint8 sequence`, `byte[1] reserved` |
| `QUERY.TARGET_CARD` | `int32 count`, 跳过 `int32[count]` |
| `QUERY.OVERLAY_CARD` | `int32 count`, `int32 code[count]` |
| `QUERY.COUNTERS` | `int32 count`, 然后 `uint16 counter_type`, `uint16 counter_count` |
| `QUERY.OWNER` | 跳过 `int32` |
| `QUERY.STATUS` | `int32 status` |
| `QUERY.LSCALE` | `int32 left_scale` |
| `QUERY.RSCALE` | 跳过 `int32` |
| `QUERY.LINK` | `int32 link` |

### 6.3 指令选择

#### `MSG.SELECT_BATTLECMD` `10`

payload：

```text
byte[1] reserved
uint8 activatable_count
repeat activatable_count:
  int32  code
  uint8  player
  uint8  location
  uint8  sequence
  uint32 desc
uint8 attackable_count
repeat attackable_count:
  byte[4] reserved
  uint8  player
  uint8  location
  uint8  sequence
  byte[1] reserved
uint8 can_main2
uint8 can_end
```

客户端构造可发动、可攻击、主要阶段 2、结束阶段按钮，选择后回 `CTOS.RESPONSE uint32 response`。

#### `MSG.SELECT_IDLECMD` `11`

payload 包含多组可操作卡片：

```text
byte[1] reserved
uint8 summonable_count
repeat: int32 code, uint8 player, uint8 location, uint8 sequence, int32 desc
uint8 spsummonable_count
repeat: int32 code, uint8 player, uint8 location, uint8 sequence, int32 desc
uint8 reposable_count
repeat: int32 code, uint8 player, uint8 location, uint8 sequence
uint8 msetable_count
repeat: int32 code, uint8 player, uint8 location, uint8 sequence
uint8 ssetable_count
repeat: int32 code, uint8 player, uint8 location, uint8 sequence
uint8 activatable_count
repeat: int32 code, uint8 player, uint8 location, uint8 sequence, int32 desc
uint8 can_battle
uint8 can_end
uint8 shuffle_hint
```

客户端生成召唤、特殊召唤、表示形式变更、盖放、发动、阶段切换等操作。

#### `MSG.SELECT_EFFECTYN` `12`

```text
byte[1] reserved
int32  code
uint8  player
uint8  location
uint8  sequence
byte[1] reserved
uint32 desc
```

询问是否发动/处理效果，回 `uint32 0_or_1`。

#### `MSG.SELECT_YESNO` `13`

```text
byte[1] reserved
uint32 desc
```

回 `uint32 0_or_1`。

#### `MSG.SELECT_OPTION` `14`

```text
byte[1] reserved
uint8 option_count
int32 option_desc[option_count]
```

回 `uint32 selected_index`。

#### `MSG.SELECT_CARD` `15`

```text
byte[1] reserved
uint8 cancelable
uint8 min
uint8 max
uint8 count
repeat count:
  int32 code
  uint8 player
  uint8 location
  uint8 sequence
  uint8 overlay_sequence
```

回 `uint8 selected_count` 加 `uint8 selected_index[]`；取消时回 `uint32 -1`。

#### `MSG.SELECT_UNSELECT_CARD` `26`

```text
byte[1] reserved
uint8 finishable
uint8 cancelable
uint8 min
uint8 max
uint8 selected_count
repeat selected_count: card_ref
uint8 unselected_count
repeat unselected_count: card_ref
```

支持在已选/未选之间切换，完成或取消时回 `uint32 -1`。

#### `MSG.SELECT_CHAIN` `16`

```text
byte[1] reserved
uint8 count
uint8 specount
byte[8] reserved
repeat count:
  uint8 flag
  uint8 forced
  int32 code
  uint8 player
  uint8 location
  uint8 sequence
  uint8 overlay_sequence
  uint32 desc
```

没有可选连锁或取消时回 `uint32 -1`；选择连锁时回 `uint32 selected_index`。

#### `MSG.SELECT_PLACE` `18` / `MSG.SELECT_DISFIELD` `24`

```text
uint8 player
uint8 count
int32 available_mask_inverted
```

客户端根据可用区域选择位置，响应每个位置：

```text
uint8 player
uint8 location
uint8 sequence
```

#### `MSG.SELECT_POSITION` `19`

```text
byte[1] reserved
int32 code
uint8 available_position_mask
```

回 `uint32 position`。

#### `MSG.SELECT_TRIBUTE` `20`

格式与 `SELECT_CARD` 类似，回选择数量和索引，取消时回 `uint32 -1`。

#### `MSG.SELECT_COUNTER` `22`

```text
byte[1] reserved
uint16 counter_type
uint16 required_count
uint8 card_count
repeat card_count:
  byte[4] reserved
  uint8 player
  uint8 location
  uint8 sequence
  uint16 current_counter_count
```

回 `int16 selected_counter_count`。

#### `MSG.SELECT_SUM` `23`

用于选择满足合计条件的一组卡。payload 包含必须选择组和可选组，回选择数量和索引。

#### `MSG.SORT_CARD` `25`

```text
byte[1] reserved
uint8 count
repeat count:
  int32 code
  uint8 player
  uint8 location
  uint8 sequence
```

排序完成后回 `uint32 count`。

### 6.4 确认、洗切与卡组操作

| 消息 | payload 摘要 | 行为 |
| --- | --- | --- |
| `MSG.CONFIRM_DECKTOP` `30` | `uint8 player`, `uint8 count`, 每项 `int32 code`, `byte[3] reserved` | 展示卡组顶若干张 |
| `MSG.CONFIRM_CARDS` `31` | `byte[2] reserved`, `uint8 count`, 每项 `int32 code`, `uint8 player`, `uint8 location`, `uint8 sequence` | 确认一组卡 |
| `MSG.SHUFFLE_DECK` `32` | `uint8 player` | 洗卡组动画 |
| `MSG.SHUFFLE_HAND` `33` | `uint8 player`, `byte[1] reserved`, `int32 code[count]` | 洗手牌并更新可见 code |
| `MSG.REFRESH_DECK` `34` | 当前未实现处理 | 保留 |
| `MSG.SWAP_GRAVE_DECK` `35` | `uint8 player` | 墓地与卡组交换 |
| `MSG.SHUFFLE_SET_CARD` `36` | `uint8 location`, `uint8 count`, 旧坐标组 + 新坐标组 | 洗切盖放卡 |
| `MSG.REVERSE_DECK` `37` | 无 | 设置卡组反转状态 |
| `MSG.DECK_TOP` `38` | `uint8 player`, `uint8 sequence`, `int32 code` | 更新卡组顶信息 |
| `MSG.SHUFFLE_EXTRA` `39` | `uint8 player`, `byte[1] reserved`, `int32 code[count]` | 洗额外卡组并更新可见 code |

### 6.5 回合、阶段与移动

#### `MSG.NEW_TURN` `40`

```text
uint8 player_and_flag
```

更新当前回合玩家与回合计数。

#### `MSG.NEW_PHASE` `41`

```text
uint16 phase
```

更新阶段，阶段值来自 `PHASE`。

#### `MSG.MOVE` `50`

```text
int32 code
uint8 previous_player
uint8 previous_location
uint8 previous_sequence
uint8 previous_overlay_sequence
uint8 current_player
uint8 current_location
uint8 current_sequence
uint8 current_position
int32 reason
```

移动卡片并根据来源、去向和原因写入历史记录。常见处理包括抽卡、送墓、除外、返回手牌/卡组、作为 XYZ 素材、从素材移除等。

#### `MSG.POS_CHANGE` `53`

```text
int32 code
uint8 player
uint8 location
uint8 sequence
uint8 previous_position
uint8 current_position
```

更新表示形式。

#### `MSG.SET` `54`

无 payload，仅播放盖放音效。

#### `MSG.SWAP` `55`

```text
byte[4] reserved
uint8 card_a_player
uint8 card_a_location
uint8 card_a_sequence
byte[5] reserved
uint8 card_b_player
uint8 card_b_location
uint8 card_b_sequence
```

交换两张卡的位置。

#### `MSG.FIELD_DISABLED` `56`

```text
int32 disabled_mask
```

更新禁用区域。

### 6.6 召唤、连锁与选择标记

| 消息 | payload | 行为 |
| --- | --- | --- |
| `MSG.SUMMONING` `60` | `int32 code` | 显示通常召唤中 |
| `MSG.SUMMONED` `61` | 无 | 召唤完成 |
| `MSG.SPSUMMONING` `62` | `int32 code` | 显示特殊召唤中 |
| `MSG.SPSUMMONED` `63` | 无 | 特殊召唤完成 |
| `MSG.FLIPSUMMONING` `64` | `int32 code` | 显示反转召唤中 |
| `MSG.FLIPSUMMONED` `65` | 无 | 反转召唤完成 |
| `MSG.CHAINING` `70` | `int32 code`, `card_ref` | 创建连锁提示，记录连锁卡 |
| `MSG.CHAINED` `71` | 无 | 连锁确认 |
| `MSG.CHAIN_SOLVING` `72` | 当前未实现处理 | 保留 |
| `MSG.CHAIN_SOLVED` `73` | 无 | 当前连锁处理完成 |
| `MSG.CHAIN_END` `74` | 无 | 清空连锁显示 |
| `MSG.CHAIN_NEGATED` `75` | `uint8 chain_index` | 显示连锁被无效 |
| `MSG.CHAIN_DISABLED` `76` | 映射到 `CHAIN_NEGATED` | 同上 |
| `MSG.CARD_SELECTED` `80` | 当前未实现处理 | 保留 |
| `MSG.RANDOM_SELECTED` `81` | `byte[1] reserved`, `uint8 count`, `card_ref[count]` | 随机选中提示 |
| `MSG.BECOME_TARGET` `83` | `uint8 count`, 每项 `uint8 player`, `uint8 location`, `uint8 sequence`, `byte[1] reserved` | 成为对象提示 |

### 6.7 LP、战斗与计数器

| 消息 | payload | 行为 |
| --- | --- | --- |
| `MSG.DRAW` `90` | `uint8 player`, `uint8 count`, `uint32 code[count]` | 抽卡、加载图片、写历史 |
| `MSG.DAMAGE` `91` | `uint8 player`, `int32 value` | 扣 LP |
| `MSG.PAY_LPCOST` `100` | 映射到 `DAMAGE` | 支付 LP |
| `MSG.RECOVER` `92` | `uint8 player`, `int32 value` | 回复 LP |
| `MSG.EQUIP` `93` | `card_ref equip_card`, `card_ref target_card` | 建立装备关系 |
| `MSG.LPUPDATE` `94` | `uint8 player`, `int32 lp` | 直接设置 LP |
| `MSG.UNEQUIP` `95` | `uint8 player`, `uint8 location`, `uint8 sequence` | 解除装备 |
| `MSG.CARD_TARGET` `96` | 当前未实现处理 | 保留 |
| `MSG.CANCEL_TARGET` `97` | 当前未实现处理 | 保留 |
| `MSG.ADD_COUNTER` `101` | `uint16 type`, `uint8 player`, `uint8 location`, `uint8 sequence`, `uint16 count` | 增加指示物 |
| `MSG.REMOVE_COUNTER` `102` | 同上 | 移除指示物 |
| `MSG.ATTACK` `110` | 攻击方坐标 + 被攻击方坐标 | 播放攻击动画 |
| `MSG.BATTLE` `111` | 当前未实现处理 | 保留 |
| `MSG.ATTACK_DISABLED` `112` | 无 | 显示攻击被无效 |
| `MSG.DAMAGE_STEP_START` `113` | 当前未实现处理 | 保留 |
| `MSG.DAMAGE_STEP_END` `114` | 当前未实现处理 | 保留 |

### 6.8 随机、宣言与提示

| 消息 | payload | 行为 |
| --- | --- | --- |
| `MSG.MISSED_EFFECT` `120` | `byte[4] reserved`, `int32 code` | 当前 TODO |
| `MSG.BE_CHAIN_TARGET` `121` | 当前未实现处理 | 保留 |
| `MSG.CREATE_RELATION` `122` | 当前未实现处理 | 保留 |
| `MSG.RELEASE_RELATION` `123` | 当前未实现处理 | 保留 |
| `MSG.TOSS_COIN` `130` | `uint8 count`, `uint8 result[count]` | 显示硬币结果 |
| `MSG.TOSS_DICE` `131` | `uint8 count`, `uint8 result[count]` | 显示骰子结果 |
| `MSG.ROCK_PAPER_SCISSORS` `132` | 无 | 显示猜拳，响应 `CTOS.RESPONSE` |
| `MSG.HAND_RES` `133` | `uint8 packed_result` | 显示猜拳结果 |
| `MSG.ANNOUNCE_RACE` `140` | `byte[1] reserved`, `uint8 count`, `int32 available_mask` | 选择种族 |
| `MSG.ANNOUNCE_ATTRIB` `141` | 同上 | 选择属性 |
| `MSG.ANNOUNCE_CARD` `142` | `byte[1] reserved`, `uint8 count`, `uint32 code_or_opcode[count]` | 从卡库中按表达式筛选并宣言卡名 |
| `MSG.ANNOUNCE_NUMBER` `143` | `byte[1] reserved`, `uint8 count`, `uint32 number[count]` | 宣言数字 |
| `MSG.CARD_HINT` `160` | `uint8 player`, `uint8 location`, `uint8 sequence`, `byte[1] reserved`, `uint8 desc_type`, `int32 key` | 更新卡片提示 |
| `MSG.PLAYER_HINT` `165` | `uint8 player`, `uint8 desc_type`, `int32 key` | 更新玩家提示 |
| `MSG.MATCH_KILL` `170` | `int32 code` | 记录特殊胜利卡 |
| `MSG.CUSTOM_MSG` `180` | 当前未实现处理 | 保留 |
| `MSG.RESET_TIME` `221` | 当前未实现处理 | 保留 |

`MSG.ANNOUNCE_CARD` 支持 `OPCODE` 表达式筛选，例如 `ISCODE`、`ISSETCARD`、`ISTYPE`、`ISRACE`、`ISATTRIBUTE` 以及基础算术/逻辑操作。

### 6.9 Tag 与重载场地

#### `MSG.TAG_SWAP` `161`

```text
uint8 player
uint8 deck_count
uint8 extra_count
uint8 faceup_extra_count
uint8 hand_count
int32 top_deck_code
int32 hand_code[hand_count]
int32 extra_code[extra_count]
```

用于 TAG 决斗换人：清理当前玩家手牌/卡组/额外，切换玩家索引，并重建卡组、手牌、额外卡组。

#### `MSG.RELOAD_FIELD` `162`

用于从服务端完整重载场地。

```text
byte[1] reserved
repeat player in 2:
  int32 lp
  repeat mzone_seq in 7:
    uint8 exists
    if exists:
      uint8 position
      uint8 overlay_count
  repeat szone_seq in 8:
    uint8 exists
    if exists:
      uint8 position
  repeat loc in [DECK, HAND, GRAVE, REMOVED]:
    uint8 count
  uint8 extra_count
  uint8 faceup_extra_count
uint8 chain_count
repeat chain_count:
  int32 code
  uint8 player
  uint8 location
  uint8 sequence
  uint8 overlay_sequence
  byte[7] reserved
```

客户端会重建双方场地、LP、各区域数量、额外卡组明暗状态和当前连锁。

## 7. 枚举速查

### 7.1 `STOC`

| 名称 | 值 |
| --- | ---: |
| `GAME_MSG` | `0x01` |
| `ERROR_MSG` | `0x02` |
| `SELECT_HAND` | `0x03` |
| `SELECT_TP` | `0x04` |
| `HAND_RESULT` | `0x05` |
| `TP_RESULT` | `0x06` |
| `CHANGE_SIDE` | `0x07` |
| `WAITING_SIDE` | `0x08` |
| `DECK_COUNT` | `0x09` |
| `CREATE_GAME` | `0x11` |
| `JOIN_GAME` | `0x12` |
| `TYPE_CHANGE` | `0x13` |
| `LEAVE_GAME` | `0x14` |
| `DUEL_START` | `0x15` |
| `DUEL_END` | `0x16` |
| `REPLAY` | `0x17` |
| `TIME_LIMIT` | `0x18` |
| `CHAT` | `0x19` |
| `HS_PLAYER_ENTER` | `0x20` |
| `HS_PLAYER_CHANGE` | `0x21` |
| `HS_WATCH_CHANGE` | `0x22` |
| `TEAMMATE_SURRENDER` | `0x23` |
| `FIELD_FINISH` | `0x30` |
| `SRVPRO_ROOMLIST` | `0x31` |

### 7.2 `CTOS`

| 名称 | 值 |
| --- | ---: |
| `RESPONSE` | `0x01` |
| `UPDATE_DECK` | `0x02` |
| `HAND_RESULT` | `0x03` |
| `TP_RESULT` | `0x04` |
| `PLAYER_INFO` | `0x10` |
| `CREATE_GAME` | `0x11` |
| `JOIN_GAME` | `0x12` |
| `LEAVE_GAME` | `0x13` |
| `SURRENDER` | `0x14` |
| `TIME_CONFIRM` | `0x15` |
| `CHAT` | `0x16` |
| `EXTERNAL_ADDRESS` | `0x17` |
| `HS_TODUELIST` | `0x20` |
| `HS_TOOBSERVER` | `0x21` |
| `HS_READY` | `0x22` |
| `HS_NOTREADY` | `0x23` |
| `HS_KICK` | `0x24` |
| `HS_START` | `0x25` |
| `REQUEST_FIELD` | `0x30` |

### 7.3 主要 `MSG`

| 范围 | 含义 |
| --- | --- |
| `1 - 5` | 重试、提示、等待、开始、胜负 |
| `6 - 8` | 数据更新与卡组请求 |
| `10 - 26` | 玩家选择与指令 |
| `30 - 39` | 确认、洗切、卡组/额外操作 |
| `40 - 41` | 回合与阶段 |
| `50 - 56` | 移动、表示形式、交换、禁用区域 |
| `60 - 76` | 召唤与连锁 |
| `80 - 83` | 选中与成为对象 |
| `90 - 102` | 抽卡、LP、装备、指示物 |
| `110 - 114` | 攻击与伤害步骤 |
| `120 - 133` | 效果关系、投骰/硬币/猜拳 |
| `140 - 143` | 宣言 |
| `160 - 165` | 卡片/玩家提示 |
| `170 - 221` | 特殊胜利、自定义消息、重置时间 |

## 8. 实现注意事项

1. 读取字段时如果返回 `undefined`，当前处理函数通常直接 `return`，避免半包或异常 payload 继续污染状态。
2. `STOC.GAME_MSG` 的原始剩余内容会写入 `YGOProYrp3d` 录像缓存。
3. `MSG.UPDATE_DATA` 会延迟刷新场景；连续数据包结束后，在下一个非更新包前统一调用 `duel.update()`。
4. 所有需要用户选择的消息都会设置 `connect.response`，UI 完成选择后调用它发送 `CTOS.RESPONSE`。
5. `MSG.SELECT_DISFIELD` 复用 `MSG.SELECT_PLACE` 的处理，`MSG.CHAIN_DISABLED` 复用 `MSG.CHAIN_NEGATED` 的处理，`MSG.PAY_LPCOST` 复用 `MSG.DAMAGE` 的处理。
6. 文档中标记“当前未实现处理”的协议在 `network.ts` 中存在枚举，但 `protocol.ts` 当前没有对应业务逻辑或只有占位。
