---
title: 物品管理器
sidebar_position: 9
description: 统一的多插件物品系统集成工具，支持 ItemsAdder、NeigeItems、MMOItems、Oraxen、Zaphkiel、MythicMobs 等主流物品插件
---

# 物品管理器

物品管理器（ItemManager）提供统一的物品获取接口，自动适配多种主流物品插件，简化跨插件物品系统开发。

## 支持的物品插件

Arim 内置了以下物品源的支持：

| 物品源 | 插件名 | 别名 |
|-------|--------|------|
| `minecraft` | Minecraft 原版 | `mc`, `vanilla` |
| `itemsadder` | ItemsAdder | `ia` |
| `neigeitems` | NeigeItems | `ni` |
| `mmoitems` | MMOItems | `mmo`, `mi` |
| `oraxen` | Oraxen | `ox` |
| `zaphkiel` | Zaphkiel | `zp` |
| `mythicmobs` | MythicMobs | `mm`, `mythic` |
| `sxitem` | SX-Item | `sx` |
| `craftengine` | CraftEngine | `ce` |
| `azureflow` | AzureFlow | `af` |
| `pxrpg` | PxRpg | `px` |

:::info[自动检测]

ItemManager 会在启动时自动检测服务器上安装的物品插件并注册对应的物品源。

:::

## 基础用法

### 获取物品

```kotlin
import top.maplex.arim.Arim

// 格式: "物品源:物品ID"
val item = Arim.itemManager.parse2ItemStack("itemsadder:ruby")

// 使用别名
val item2 = Arim.itemManager.parse2ItemStack("ia:ruby")

// 原版物品
val item3 = Arim.itemManager.parse2ItemStack("minecraft:diamond_sword")

// 省略物品源（默认使用 minecraft）
val item4 = Arim.itemManager.parse2ItemStack("diamond")
```

### 为玩家构建物品

某些物品插件支持玩家相关的物品属性（如绑定、变量替换等）：

```kotlin
val player = // 玩家对象

// 为特定玩家构建物品
val item = Arim.itemManager.parse2ItemStack("neigeitems:custom_sword", player)
```

## API 方法

### parse2ItemStack - 解析物品

```kotlin
fun parse2ItemStack(id: String, player: Player? = null): BuildSourceItem
```

**参数：**
- `id`: 物品 ID，格式为 `"物品源:物品ID"`
- `player`: 目标玩家（可选）

**返回：** `BuildSourceItem` 对象，包含物品堆叠和元信息

### getSource - 获取物品源

```kotlin
fun getSource(source: String): ItemSource
```

**参数：** 物品源名称或别名

**返回：** 对应的 `ItemSource` 实例，若不存在则返回 `minecraft` 物品源并输出警告

### register - 注册自定义物品源

```kotlin
fun register(instance: ItemSource)
```

**参数：** 自定义的 `ItemSource` 实现

## BuildSourceItem 数据类

```kotlin
data class BuildSourceItem(
    val player: Player?,    // 目标玩家
    val id: String,         // 物品 ID
    val itemStack: ItemStack,  // 物品堆叠
    val source: String      // 物品源名称
)
```

**示例：**

```kotlin
val result = Arim.itemManager.parse2ItemStack("ia:ruby")
println("物品源: ${result.source}")      // ItemsAdder
println("物品 ID: ${result.id}")         // ruby
println("ItemStack: ${result.itemStack}")
```

## 自定义物品源

### 实现 ItemSource 接口

```kotlin
import top.maplex.arim.tools.itemmanager.ItemSource

class SourceMyCustomItem : ItemSource {

    override val name: String
        get() = "mycustom"

    override val alias: List<String>
        get() = listOf("mc", "custom")

    override val pluginName: String
        get() = "MyCustomPlugin"

    override val isLoaded: Boolean
        get() = ItemSource.getPluginLoaded(pluginName)

    override fun build(id: String, player: Player?): ItemStack {
        // 调用自定义插件 API 获取物品
        return MyCustomAPI.getItem(id) ?: warnItemNotFound(id)
    }
}
```

### 注册自定义物品源

```kotlin
import top.maplex.arim.Arim

// 在插件启动时注册
Arim.itemManager.register(SourceMyCustomItem())
```

## 实际应用示例

### 配置文件物品解析

```yaml
rewards:
  daily_login:
    - "minecraft:diamond 5"
    - "itemsadder:ruby 10"
    - "mmoitems:SWORD:EXCALIBUR 1"
```

```kotlin
object RewardSystem {
    fun giveRewards(player: Player, rewardList: List<String>) {
        rewardList.forEach { reward ->
            val parts = reward.split(" ")
            val itemId = parts[0]
            val amount = parts.getOrNull(1)?.toIntOrNull() ?: 1

            val result = Arim.itemManager.parse2ItemStack(itemId, player)
            result.itemStack.amount = amount
            player.inventory.addItem(result.itemStack)
        }
    }
}
```

### 商店系统

```kotlin
data class ShopItem(
    val id: String,
    val price: Double
)

object ShopSystem {
    private val items = mapOf(
        "ruby" to ShopItem("ia:ruby", 100.0),
        "diamond_sword" to ShopItem("minecraft:diamond_sword", 500.0),
        "custom_weapon" to ShopItem("mm:legendary_sword", 1000.0)
    )

    fun buyItem(player: Player, itemKey: String): Boolean {
        val shopItem = items[itemKey] ?: return false

        if (economy.getBalance(player) < shopItem.price) {
            player.sendMessage("余额不足！")
            return false
        }

        val result = Arim.itemManager.parse2ItemStack(shopItem.id, player)
        player.inventory.addItem(result.itemStack)
        economy.withdrawPlayer(player, shopItem.price)
        return true
    }
}
```

### 任务系统物品检测

```kotlin
object QuestSystem {
    fun checkQuestItem(player: Player, requiredItemId: String, amount: Int): Boolean {
        val required = Arim.itemManager.parse2ItemStack(requiredItemId, player)

        var count = 0
        player.inventory.contents.forEach { item ->
            if (item != null && item.isSimilar(required.itemStack)) {
                count += item.amount
            }
        }

        return count >= amount
    }
}
```

### 动态物品池

```kotlin
object LootPool {
    private val commonLoots = listOf(
        "minecraft:iron_ingot",
        "minecraft:gold_ingot"
    )

    private val rareLoots = listOf(
        "ia:ruby",
        "ia:sapphire",
        "mmoitems:MATERIAL:SOUL_CRYSTAL"
    )

    fun dropRandomLoot(player: Player, rarity: Rarity) {
        val pool = when(rarity) {
            Rarity.COMMON -> commonLoots
            Rarity.RARE -> rareLoots
        }

        val itemId = pool.random()
        val result = Arim.itemManager.parse2ItemStack(itemId, player)
        player.world.dropItemNaturally(player.location, result.itemStack)
    }
}
```

## 常见问题

### 如何判断某个物品源是否可用？

```kotlin
val source = Arim.itemManager.getSource("itemsadder")
if (source.isLoaded) {
    println("ItemsAdder 已加载")
}
```

### 物品 ID 格式错误会怎样？

如果物品源不存在，会返回 `minecraft` 物品源并输出警告：

```kotlin
// 假设 "unknown" 物品源不存在
val result = Arim.itemManager.parse2ItemStack("unknown:some_item")
// 控制台输出: 解析物品源 unknown 未挂钩
// 会尝试使用 minecraft 物品源解析
```

### 如何省略物品源名称？

省略物品源时，默认使用 `minecraft`：

```kotlin
// 以下两者等价
val item1 = Arim.itemManager.parse2ItemStack("diamond_sword")
val item2 = Arim.itemManager.parse2ItemStack("minecraft:diamond_sword")
```

### 物品不存在时会返回什么？

当物品 ID 在对应物品源中不存在时，会返回基岩（BEDROCK）物品堆叠并输出警告信息。

### 支持哪些物品插件版本？

请参考各物品插件的官方文档。Arim 会尽力适配最新版本，但建议使用稳定版本的物品插件。
