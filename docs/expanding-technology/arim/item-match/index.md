---
title: 物品匹配工具
sidebar_position: 5
description: 强大的物品检测系统，提供灵活的公式写法来匹配物品的各种属性
---

# 物品匹配工具

物品匹配工具（ItemMatch）提供了一种公式写法，让物品检测变得简单高效。

## 基础用法

```kotlin
import top.maplex.arim.Arim

val item = player.inventory.itemInMainHand

// 匹配物品名称以 "&c机械" 开头，且包含 "靴" 字
val matched = Arim.itemMatch.match(
    item,
    "name:all(startswith(&c机械),c(靴))"
)

// 安全匹配（捕获异常）
val matched = Arim.itemMatch.matchTry(item, "name:c(剑)")
```

## 语法规则

### 基本格式

```
<处理器>:<条件>;<处理器2>:<条件2>;...
```

**示例：**

```kotlin
// 单个处理器
"name:startswith(&c机械)"

// 多个处理器（使用分号分隔）
"name:c(剑);material:DIAMOND_SWORD;amount:>1"

// 复杂条件
"name:all(startswith(&c机械),c(靴));enchant:any(protection>3,thorns>=2)"
```

## 处理器类型

### 内置处理器

| 处理器 | 说明 | 示例 |
|-------|------|------|
| `name` | 匹配物品名称 | `name:c(剑)` |
| `lore` | 匹配物品描述 | `lore:c(传说)` |
| `nbt` | 匹配物品 NBT 数据 | `nbt:\{SX-Item.ItemKey=Default-2}` |
| `enchant` | 匹配物品附魔 | `enchant:luck>=5` |
| `flag` | 匹配物品标志 | `flag:HIDE_ENCHANTS` |
| `material` | 匹配物品材质 | `material:DIAMOND_SWORD` |
| `amount` | 匹配物品数量 | `amount:>=10` |
| `durability` | 匹配物品耐久度 | `durability:>100` |
| `unbreakable` | 匹配是否不可破坏 | `unbreakable:true` |

### 自定义处理器

```kotlin
class CustomHandler : ItemHandler {
    override fun check(itemStack: ItemStack, condition: String): Boolean {
        // 自定义匹配逻辑
        return true
    }
}

// 注册
Arim.itemMatch.registerHandler("custom", CustomHandler())

// 注销
Arim.itemMatch.unregisterHandler("custom")
```

## 表达式系统

### 逻辑组合条件

| 关键字 | 说明 | 示例 |
|-------|------|------|
| `any` | 满足任意一个子条件 | `any(c(剑),c(斧))` |
| `all` | 必须全部满足 | `all(startswith(&c),c(靴))` |
| `none` / `not` | 全都不满足 | `none(c(垃圾),c(废弃))` |

**格式：**

```
<逻辑组合>(子条件1,子条件2,...)
```

**示例：**

```kotlin
// 任意满足
"name:any(c(剑),c(斧))"

// 全部满足
"name:all(startswith(&c机械),c(靴))"

// 全都不满足
"name:none(c(垃圾),c(废弃))"
```

### 内容匹配条件

格式： `<匹配规则>[可选项](匹配内容)`

#### 匹配规则

| 规则 | 关键字 | 说明 | 示例 |
|-----|-------|------|------|
| 精准匹配 | 无 | 直接写参数 | `name:&a枫溪` |
| 正则匹配 | `regex`, `reg`, `r` | 正则表达式 | `name:regex(^Sword.*Axe$)` |
| 包含匹配 | `contains`, `con`, `c` | 字符串包含 | `name:c(靴)` |
| 开头匹配 | `startswith`, `start`, `s` | 以...开头 | `name:s(&c机械)` |
| 结尾匹配 | `endswith`, `end`, `e` | 以...结尾 | `name:e(靴子)` |

#### 可选项

- `uncolored`, `uc` - 去除颜色：`name:c[uc](靴)`
- `lowercase` - 转换为小写：`name:c[lowercase](sword)`

### 算数匹配条件

支持的符号：`>`, `>=`, `<`, `<=`, `=`

```kotlin
// 物品数量
"amount:>=5"

// 耐久度
"durability:>100"

// 附魔等级
"enchant:luck>=5"
```

## 处理器详解

### name - 名称匹配

```kotlin
// 精准匹配
"name:&c传说之剑"

// 包含匹配
"name:c(剑)"

// 开头匹配
"name:startswith(&a机械)"

// 组合条件
"name:all(startswith(&c),c(靴子))"

// 忽略颜色
"name:c[uc](剑)"
```

### lore - 描述匹配

```kotlin
// 包含特定文本
"lore:c(传说)"

// Lore 中包含 "伤害" 或 "防御"
"lore:any(c(伤害),c(防御))"
```

### nbt - NBT 匹配

```kotlin
// 单个 NBT 键值对
"nbt:\{SX-Item.ItemKey=Default-2}"

// 多个条件（使用 && 连接）
"nbt:\{SX-Item.ItemKey=Default-2&&SX-Item.HashCode=12345678}"
```

### enchant - 附魔匹配

```kotlin
// 单个附魔等级
"enchant:luck>=5"

// 组合条件
"enchant:any(luck>=5,oxygen<4)"
"enchant:all(protection>=3,thorns>=2)"
```

**附魔名称：** 使用 `Enchantment.getByName()` 的参数

**常见附魔：** `protection`, `sharpness`, `luck`, `unbreaking`, `thorns`, `oxygen`

### flag - 标志匹配

```kotlin
// 单个标志
"flag:HIDE_ENCHANTS"

// 多个标志
"flag:any(HIDE_ENCHANTS,HIDE_DYE)"
```

**常见 ItemFlag：** `HIDE_ENCHANTS`, `HIDE_ATTRIBUTES`, `HIDE_UNBREAKABLE`, `HIDE_DYE`

### material - 材质匹配

```kotlin
// 精准匹配
"material:DIAMOND_SWORD"

// 包含匹配（所有门）
"material:c(DOOR)"

// 正则匹配（所有剑）
"material:regex(.*_SWORD)"
```

### amount / durability / unbreakable

```kotlin
// 数量匹配
"amount:>5"
"amount:=64"

// 耐久度匹配
"durability:>5"

// 不可破坏
"unbreakable:true"
```

## 实际应用示例

### 装备检测

```kotlin
fun checkArmor(player: Player): Boolean {
    val helmet = player.inventory.helmet ?: return false

    return Arim.itemMatch.match(
        helmet,
        "material:DIAMOND_HELMET;enchant:protection>=3"
    )
}
```

### 配置文件物品要求

```yaml
quest_requirements:
  special_sword:
    condition: "material:DIAMOND_SWORD;enchant:sharpness>=4;name:startswith(&c传说)"
```

```kotlin
fun checkQuestItem(player: Player, condition: String): Boolean {
    val item = player.inventory.itemInMainHand
    return Arim.itemMatch.matchTry(item, condition)
}
```

### 商店物品过滤

```kotlin
object ShopFilter {
    private val sellableConditions = listOf(
        "material:c(DIAMOND)",
        "enchant:any(sharpness>0,protection>0)",
        "name:not(c(垃圾))"
    )

    fun canSell(item: ItemStack): Boolean {
        return sellableConditions.any {
            Arim.itemMatch.matchTry(item, it)
        }
    }
}
```

## 常见问题

### 如何匹配多个不同的物品？

```kotlin
// 使用 any 逻辑组合
"material:any(DIAMOND_SWORD,IRON_SWORD,GOLD_SWORD)"

// 使用正则表达式
"material:regex(.*_SWORD)"
```

### 如何忽略颜色代码？

```kotlin
// 使用 [uc] 可选项
"name:c[uc](剑)"
```

### NBT 匹配支持嵌套吗？

支持，使用点号 `.` 分隔：

```kotlin
"nbt:\{SX-Item.Data.Level=10}"
```

### 条件格式错误会抛出异常吗？

`match()` 可能抛出异常，建议使用 `matchTry()`：

```kotlin
// matchTry() - 自动捕获异常
val matched = Arim.itemMatch.matchTry(item, condition)
```
