---
title: 菜单快速构建工具
sidebar_position: 11
description: 基于 TabooLib 的声明式 UI 配置工具，支持变量替换、Kether 脚本集成和动态内容更新
---

# 菜单快速构建工具

菜单快速构建工具（UIConfigHelper）提供声明式配置方式构建 Minecraft 箱子 UI，支持变量替换、Kether 脚本集成和动态内容更新。

## 核心概念

### 配置结构

```yaml
<rootPath>:           # 配置根路径
  layout: []          # UI 布局定义
  button: {}          # 静态按钮配置（自动加载）
  <custom_icon>: {}   # 自定义图标配置
```

### 初始化

```kotlin
import top.maplex.arim.tools.menuhelper.UIConfigHelper

// 标准方式
val helper = UIConfigHelper(
    configFile = File,   // 配置文件
    rootPath = String,   // 配置根路径
    player = Player      // 目标玩家（用于 Kether 上下文）
)

// 快捷方式
UIConfigHelper.helper(player, file, "ui_root") { player ->
    // 在此上下文中 this 为 UIConfigHelper 实例
}
```

## 变量替换系统

UIConfigHelper 提供强大的变量替换功能，支持简单字符串和列表类型的占位符。

### 占位符格式

占位符使用 `<key>` 格式（**注意：使用尖括号，不是花括号**）：

```yaml
icon_name:
  name: "&e<player_name>"
  lore:
    - "&7等级: &f<level>"
    - "&7经验: &f<exp>"
```

### 变量类型

#### 字符串类型

字符串类型的变量会直接替换占位符：

```kotlin
buildIcon("icon_name", mapOf(
    "player_name" to player.name,
    "level" to "10",
    "exp" to "100"
))
```

#### 列表类型（lore 专用）

列表类型的变量在 `lore` 字段中会自动展开为多行：

```yaml
icon_name:
  lore:
    - "&7玩家信息:"
    - "<player_info>"  # 这一行会被展开为多行
    - "&7---"
```

```kotlin
buildIcon("icon_name", mapOf(
    "player_info" to listOf(
        "&7名称: Player1",
        "&7等级: 10",
        "&7金币: 1000"
    )
))
```

**展开后的 lore：**
```
&7玩家信息:
&7名称: Player1
&7等级: 10
&7金币: 1000
&7---
```

:::warning[重要]

列表类型的占位符在非 `lore` 字段（如 `name`、`material`）中会自动取第一个值。

:::

### 替换优先级

变量替换按照**键长度降序**进行，避免短键影响长键匹配：

```kotlin
// 正确：先替换 player_full_name，再替换 player
mapOf(
    "player_full_name" to "Steve Johnson",
    "player" to "Steve"
)
```

如果配置为 `<player_full_name>`，会正确替换为 "Steve Johnson"，而不会被错误替换为 "Steve_full_name"。

### 实际应用示例

#### 动态玩家信息

```yaml
player_status:
  material: PLAYER_HEAD
  name: "&e<player>"
  lore:
    - "&7等级: &f<level>"
    - "&7经验: &f<exp>"
    - "&7金币: &f<money>"
```

```kotlin
buildIcon("player_status", mapOf(
    "player" to player.name,
    "level" to player.level.toString(),
    "exp" to player.exp.toString(),
    "money" to economy.getBalance(player).toString()
))
```

#### 列表展开（团队成员）

```yaml
team_info:
  material: PAPER
  name: "&e团队信息"
  lore:
    - "&7团队名称: <team_name>"
    - "&7成员列表:"
    - "<members>"
    - "&7---"
    - "&7总人数: <count>"
```

```kotlin
val members = team.getMembers().map { "&8- &f$it" }
buildIcon("team_info", mapOf(
    "team_name" to team.name,
    "members" to members,
    "count" to members.size.toString()
))
```

**展开后：**
```
&7团队名称: RedTeam
&7成员列表:
&8- &fPlayer1
&8- &fPlayer2
&8- &fPlayer3
&7---
&7总人数: 3
```

### Kether 脚本中的变量

占位符也会注入到 Kether 脚本的变量上下文中：

```yaml
icon_name:
  action:
    left_click: "tell '你的等级是 <level>' colored"
```

```kotlin
buildIconAction("icon_name", mapOf("level" to "10"))
```

点击后会显示：`你的等级是 10`

## 配置读取方法

所有 `path` 参数均相对于 `rootPath`，自动拼接为 `rootPath.path`。

| 方法 | 返回值 | 说明 |
|-----|--------|------|
| `getString(path, default?, placeholders?)` | `String?` | 获取字符串，支持颜色代码和变量替换 |
| `getChar(path, default?)` | `Char?` | 获取字符（常用于槽位标识） |
| `getStringList(path, default?)` | `List<String>` | 获取字符串列表，自动着色 |
| `getInt(path, default?)` | `Int` | 获取整数 |
| `getBoolean(path, default?)` | `Boolean` | 获取布尔值 |
| `getMaterial(path, default?)` | `XMaterial` | 获取材料，非法值返回默认值 |
| `getConfigurationSection(path)` | `ConfigurationSection?` | 获取配置节 |
| `getLayout()` | `List<String>` | 获取布局配置 |
| `getIconSlot(sectionPath)` | `Char?` | 获取图标的槽位标识字符 |

## UI 构建方法

### 初始化菜单

```kotlin
player.openMenu<Chest>("标题") {
    initMenu()  // 必须调用：绑定 Chest、应用布局、加载 button 节点
}
```

**执行流程：**
1. 绑定 `Chest` 实例到 `helper.chest`
2. 应用 `layout` 配置
3. 自动加载 `button` 节点下所有按钮

### 构建图标

```kotlin
// 基础用法
val icon = buildIcon(
    sectionPath = "icon_name",
    placeholders = mapOf("key" to "value"),
    customizer = { config ->  // ItemBuilder 上下文
        name = config.getString("custom_name")
    }
)

// 自动绑定点击事件
buildIconAction(
    sectionPath = "icon_name",
    placeholders = emptyMap(),
    clickEvent = { section ->  // ClickEvent 上下文
        val custom = section.getString("custom")
        // 自定义处理逻辑
    }
)
```

**特性：**
- 支持 XItemStack 完整配置
- `shiny: true` 启用附魔光效
- 自动执行变量替换（`<key>` → `value`）
- 自动触发 `action` 配置的 Kether 脚本

### 翻页按钮

```kotlin
player.openMenu<PageableChest<T>>("标题") {
    initMenu()
    putPagination(this)  // 自动创建上/下页按钮
    elements { /* 数据源 */ }
}
```

**配置要求：**

```yaml
<root>:
  next_page:
    slot: "N"
    has:                       # 有下一页时的样式
      material: "SPECTRAL_ARROW"
      name: "&e&l下一页 ▶"
      lore:
        - "&7当前: &a<current_page>&7/&a<total_page>"
    normal:                    # 无下一页时的样式
      material: "ARROW"
      name: "&7下一页 ▶"
      lore:
        - "&c已经是最后一页"

  previous_page:
    slot: "P"
    has:
      material: "SPECTRAL_ARROW"
      name: "&e&l◀ 上一页"
      lore:
        - "&7当前: &a<current_page>&7/&a<total_page>"
    normal:
      material: "ARROW"
      name: "&7◀ 上一页"
      lore:
        - "&c已经是第一页"
```

## 动态更新方法

页面创建后通过 `Inventory` 扩展方法更新内容（仅用于 `onBuild` / `onClick` / `onClose` 回调）：

```kotlin
onBuild { player, inventory ->
    // 更新图标
    inventory.updateIcon(
        sectionPath = "player_status",
        placeholders = mapOf("level" to "99"),
        customizer = { config -> /* 自定义调整 */ }
    )

    // 获取槽位物品
    val item = inventory.getSlotItem('B')         // 首个非空物品
    val items = inventory.getSlotItems('C')       // 所有非空物品
    val first = inventory.getSlotItemsFirst('D')  // 首个槽位物品（可能为空气）

    // 返还物品
    inventory.returnItems(listOf('B', 'C'))  // 返还指定槽位物品到玩家背包
}
```

## 槽位交互规则

用于控制槽位的物品放入/取出行为，作为 `ClickEvent` 的扩展方法调用：

```kotlin
onClick { event, element ->
    // 条件槽位 - 只允许钻石放入
    event.ruleConditionSlot('I', { put, out ->
        put == null || put.type == Material.DIAMOND
    }) {
        clicker.sendMessage("§c只能放入钻石!")
        isCancelled = true
    }

    // 限制堆叠数量
    event.ruleLimitAmount('I', 16) {
        clicker.sendMessage("§c最多只能放 16 个!")
    }

    // 锁定槽位（禁止交互）
    event.ruleLockSlots(listOf('A', 'B'), reverse = false)
}
```

**方法说明：**

| 方法 | 返回值 | 说明 |
|-----|--------|------|
| `ruleConditionSlot(slotChar, condition, onFailed?)` | `Boolean` | 条件槽位：验证物品放入 |
| `ruleLimitAmount(slotChar, maxAmount, onFailed?)` | `Boolean` | 限制槽位最大堆叠数量 |
| `ruleLockSlots(slotChars, reverse?)` | `Unit` | 锁定/解锁槽位交互 |
| `returnItems(slotChars, delete?)` | `Unit` | 返还槽位物品到玩家背包 |

## 配置详解

### 布局配置 (layout)

字符映射系统，每个字符代表一个槽位类型：

```yaml
layout:
  - "AAAAAAAAA"  # 第 1 行（索引 0-8）
  - "ABBBBBBBA"  # 第 2 行（索引 9-17）
  - "AAAAAAAAA"  # 第 3 行（索引 18-26）
```

**规则：**
- 9 列 × N 行（普通箱子 3 行、大箱子 6 行）
- 字符与图标的 `slot` 属性对应
- 同一字符映射到多个槽位

### 图标配置 (XItemStack)

基于 TabooLib XItemStack 标准：

```yaml
icon_name:
  slot: 'X'                        # 槽位标识（对应 layout）
  material: DIAMOND                # 材料（XMaterial 枚举）
  amount: 1                        # 数量
  damage: 0                        # 耐久损失
  name: "&e名称"                    # 显示名称
  lore: ["行 1", "行 2"]            # 物品描述
  enchants: ["DAMAGE_ALL:5"]       # 附魔（格式：附魔 ID:等级）
  flags: ["HIDE_ENCHANTS"]         # 物品标记
  custom-model-data: 10001         # 自定义模型数据
  color: "255,0,0"                 # 皮革装备颜色 (R,G,B)
  shiny: false                     # 附魔光效
  custom: "自定义数据"              # 扩展字段（需代码读取）
```

### 点击事件 (action)

使用 Kether 脚本处理点击事件：

```yaml
action:
  left_click: "tell '左键点击' colored"
  right_click: "actionbar '右键点击' colored"
  shift_left_click: "give diamond 1"
  shift_right_click: "command 'help'"
  middle_click: "tell '中键点击'"
  other_click: "tell '其他点击'"
```

**可用点击类型：** `left_click`, `right_click`, `shift_left_click`, `shift_right_click`, `middle_click`, `other_click`

**变量注入：**
- 配置中的 `{key}` 会被 `placeholders` 替换
- Kether 脚本接收 `player` 作为 `sender`
- Placeholders 注入到 Kether 变量上下文

### 按钮自动加载 (button)

`button` 节点下的所有子节点会被 `initMenu()` 自动加载：

```yaml
button:
  close_btn: { slot: 'C', material: BARRIER }
  info_btn: { slot: 'I', material: BOOK }
```

等价代码：

```kotlin
for (key in ["close_btn", "info_btn"]) {
    buildIconAction("button.$key")
}
```

## 实际应用示例

### 静态箱子 UI

```kotlin
UIConfigHelper.helper(player, configFile, "shop_ui") {
    player.openMenu<Chest>("商店") {
        initMenu()  // 自动加载 button 节点的所有商品按钮
    }
}
```

### 分页列表

```kotlin
UIConfigHelper.helper(player, configFile, "list_ui") {
    player.openMenu<PageableChest<Item>>("物品列表") {
        initMenu()
        putPagination(this)
        elements { itemList }
        onGenerate { _, item, _, _ -> item.toItemStack() }
    }
}
```

### 动态内容更新

```kotlin
UIConfigHelper.helper(player, configFile, "status_ui") {
    player.openMenu<Chest>("状态") {
        initMenu()

        buildIconAction("refresh_btn") {
            isCancelled = true
            clicker.closeInventory()
        }

        onBuild { _, inv ->
            inv.updateIcon("player_stats", mapOf(
                "level" to player.level.toString(),
                "exp" to player.exp.toString()
            ))
        }
    }
}
```

## 注意事项

### 初始化顺序

必须先调用 `initMenu()` 才能使用 `buildIconAction` 等方法。

### 动态更新限制

`updateIcon` 等方法仅在页面创建后可用（`onBuild` / `onClick` / `onClose`）。

### 变量替换时机

在 `buildIcon` 和 `updateIcon` 时执行，不影响原始配置。

### Kether 脚本错误

脚本执行失败不会抛出异常，检查服务器日志。
