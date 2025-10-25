---
sidebar_position: 1
---

# Arim 工具库

Arim（城市）是一个功能强大的 TabooLib 扩展工具库集合,由多位开发者贡献,提供了丰富的实用工具和功能模块。

## 概述

Arim 整合了多个常用工具,涵盖计算、匹配、随机、菜单等多个方面,旨在简化 Minecraft 插件开发中的常见任务。

## 工具模块列表

| 模块                       | 说明          | 作者        |
|--------------------------|-------------|-----------|
| 双栈计算器                    | 固定算数表达式计算器  | Saukiya   |
| 符号树变量计算器                 | 支持变量的表达式计算器 | Saukiya   |
| 条件表达式求值器                 | 条件表达式求值工具   | 枫溪        |
| 物品匹配工具                   | 物品匹配与筛选工具   | 枫溪        |
| 实体匹配工具                   | 实体匹配与筛选工具   | WhiteSoul |
| 生物&方块发光工具                | 实体和方块发光效果   | Gei       |
| 文件夹读取工具                  | 批量读取文件夹配置   | 枫溪        |
| TabooLib 5.X FLAT 风格命令帮助 | 传统风格命令帮助系统  | 坏黑、Mical  |
| 基于权重的快速随机工具              | 权重随机选择工具    | 枫溪        |
| 多物品库插件挂钩工具               | 集成多种物品插件    | 嘿鹰        |
| 菜单快速构建工具                 | 快速构建 UI 菜单  | 枫溪        |
| Gson 工具类                 | JSON 序列化与反序列化 | GermMC    |

## 快速开始

### 添加依赖

**最新版本:**

![Sonatype Nexus (Releases)](https://img.shields.io/nexus/r/top.maplex.arim/Arim?server=https%3A%2F%2Fnexus.maplex.top&nexusVersion=3)

1. 添加仓库和依赖

```kotlin
repositories {
    maven {
        // 枫溪的仓库
        url = uri("https://nexus.maplex.top/repository/maven-public/")
        isAllowInsecureProtocol = true
    }
}

dependencies {
    taboo("top.maplex.arim:Arim:1.3.0") // 替换为最新版本
}
```

2. 设置重定向

```kotlin
taboolib {
    relocate("top.maplex.arim", "your.package.arim")
}
```

### 基础使用

Arim 采用单例模式提供各种工具:

```kotlin
import top.maplex.arim.Arim

// 条件表达式求值
val result = Arim.evaluator.evaluate("1 > 0 && 2 < 3")

// 固定算数表达式计算
val value = Arim.fixedCalculator.calculate("1 + 2 * 3")

// 变量表达式计算
val calc = Arim.variableCalculator.calculate("x + y * 2", mapOf("x" to 10, "y" to 5))

// 物品匹配
val matched = Arim.itemMatch.match(itemStack, conditions)

// 实体匹配
val entityMatched = Arim.entityMatch.match(entity, conditions)

// 权重随机
val randomItem = Arim.weightRandom.random(weightedList)

// 物品管理器
val item = Arim.itemManager.getItem("itemsadder:custom_sword")

// JSON 序列化
val json = GsonUtils.toJson(data)
val obj = GsonUtils.fromJson(json, MyClass::class.java)
```

## 核心工具

### 计算工具

- **固定算数表达式计算器**: 基于双栈算法,支持四则运算、括号、小数等
- **符号树变量计算器**: 基于符号树,支持变量替换和复杂表达式计算
- **条件表达式求值器**: 支持逻辑运算符(`&&`, `||`, `!`)和比较运算符(`>`, `<`, `>=`, `<=`, `==`, `!=`)

### 匹配工具

- **物品匹配工具**: 支持材质、名称、Lore、NBT、附魔、数量、耐久度等多维度匹配
- **实体匹配工具**: 支持实体类型、名称、生命值、元数据、MythicMobs 等匹配

### 发光工具

- **生物发光**: 支持多版本(1.12.2, 1.16.5, 1.17+),基于 PacketEvents 实现
- **方块发光**: 支持多种模式,包括虚拟发光方块和真实发光方块

### 物品管理器

集成多种物品插件的统一接口:

- ItemsAdder
- NeigeItems
- MMOItems
- Oraxen
- Zaphkiel
- MythicMobs
- CraftEngine
- 原版 Minecraft
- SX-Item
- PxRpg
- AzureFlow

### 其他工具

- **权重随机工具**: 基于权重的快速随机选择
- **文件夹读取工具**: 批量读取和管理配置文件
- **菜单快速构建工具**: 快速构建交互式 UI 菜单
- **TabooLib 5.X 风格命令帮助**: 传统风格的命令帮助系统
- **Gson 工具类**: 增强版 JSON 序列化/反序列化，支持 Bukkit 对象和智能类型推断

## 使用示例

### 示例 1: 条件判断与计算

```kotlin
// 条件判断
val canProceed = Arim.evaluator.evaluate("level >= 10 && money > 1000")

if (canProceed) {
    // 计算奖励
    val reward = Arim.fixedCalculator.calculate("100 * 1.5 + 50")
    player.sendMessage("你获得了 $reward 金币!")
}
```

### 示例 2: 物品匹配与筛选

```kotlin
// 定义匹配条件
val conditions = """
    material: DIAMOND_SWORD
    name: "神圣之剑"
    lore:
      - "*光明*"
    enchant:
      - "DAMAGE_ALL > 3"
""".trimIndent()

// 检查物品是否匹配
val item = player.inventory.itemInMainHand
if (Arim.itemMatch.match(item, conditions)) {
    player.sendMessage("这是一把强大的神圣之剑!")
}
```

### 示例 3: 权重随机抽取

```kotlin
// 定义奖励池
val rewards = listOf(
    WeightedItem("钻石", 10),
    WeightedItem("金锭", 30),
    WeightedItem("铁锭", 60)
)

// 随机抽取
val reward = Arim.weightRandom.random(rewards)
player.sendMessage("你获得了: ${reward.name}")
```

### 示例 4: 跨插件物品获取

```kotlin
// 统一接口获取不同插件的物品
val items = listOf(
    Arim.itemManager.getItem("itemsadder:ruby"),
    Arim.itemManager.getItem("ni:custom_sword"),
    Arim.itemManager.getItem("mmoitems:SWORD:EXCALIBUR"),
    Arim.itemManager.getItem("minecraft:diamond")
)

items.forEach { item ->
    player.inventory.addItem(item)
}
```

### 示例 5: 实体发光效果

```kotlin
// 为实体添加发光效果
Arim.glow.setEntityGlow(
    player,                    // 观察者
    entity,                    // 目标实体
    ChatColor.RED,             // 发光颜色
    player                     // 视角玩家
)

// 移除发光效果
Arim.glow.removeEntityGlow(player, entity)
```

## 常见问题

### 如何选择合适的计算器?

- **固定算数表达式计算器**: 表达式固定,不需要变量,如: `"1 + 2 * 3"`
- **符号树变量计算器**: 表达式包含变量,需要动态替换,如: `"x + y * 2"`
- **条件表达式求值器**: 逻辑判断,返回布尔值,如: `"level >= 10 && money > 1000"`

### 物品管理器支持哪些插件?

Arim 的物品管理器支持以下插件:

- ItemsAdder (前缀: `itemsadder:`)
- NeigeItems (前缀: `ni:`)
- MMOItems (前缀: `mmoitems:`)
- Oraxen (前缀: `oraxen:`)
- Zaphkiel (前缀: `zaphkiel:`)
- MythicMobs (前缀: `mythic:`)
- CraftEngine (前缀: `craftengine:`)
- SX-Item (前缀: `sx:`)
- PxRpg (前缀: `pxrpg:`)
- AzureFlow (前缀: `azureflow:`)
- Minecraft 原版 (前缀: `minecraft:`)

### 发光工具支持哪些版本?

- **生物发光**: 1.12.2, 1.16.5, 1.17+ (已测试: 1.18.2, 1.19.4, 1.20.1, 1.20.4, 1.21.1, 1.21.4)
- **方块发光**: 根据不同模式有不同的版本支持,详见模块文档

### 如何贡献代码?

Arim 是一个开放的工具库,欢迎贡献新的工具模块。如果你有好的想法或改进建议,可以通过以下方式参与:

1. 提交 Issue 或 Pull Request
2. 联系项目维护者
3. 参考现有模块的代码风格
