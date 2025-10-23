---
title: 权重随机工具
sidebar_position: 8
description: 基于权重的随机选择工具，支持动态权重计算和集合扩展函数，线程安全
---

# 权重随机工具

权重随机工具（WeightRandom）提供基于权重的随机选择功能，适用于抽奖、随机事件触发等需要按指定概率分配的场景。

## 核心特性

- 权重配置管理
- 动态权重计算
- 集合扩展函数支持
- 类型安全的泛型支持
- 线程安全的 Random

## 基础用法

### 使用 WeightCategory

```kotlin
import top.maplex.arim.Arim
import top.maplex.arim.tools.weightrandom.WeightRandom.WeightCategory

// 创建权重列表
val items = listOf(
    WeightCategory("普通道具", 70),
    WeightCategory("稀有道具", 25),
    WeightCategory("史诗道具", 5)
)

// 进行随机选择
val selected = Arim.weightRandom.getWeightRandom(items)
println("获得：${selected ?: "无"}")
```

### 动态权重计算

```kotlin
data class Enemy(val name: String, val baseRate: Int)

val enemies = listOf(
    Enemy("史莱姆", 5),
    Enemy("狼人", 3),
    Enemy("巨龙", 1)
)

// 根据环境因素动态计算权重
val selectedEnemy = Arim.weightRandom.getRandom(enemies) { enemy ->
    enemy.baseRate * weatherMultiplier()  // 天气影响因子
}

println("遭遇：${selectedEnemy?.category?.name}")
```

## API 方法

### getRandom - 基础权重选择

```kotlin
fun <T> getRandom(categories: Collection<WeightCategory<T>>): WeightCategory<T>?
```

**参数：** 预包装的权重类别集合

**返回：** 随机选中的权重类别对象（包含原始对象和权重），权重总和 ≤ 0 时返回 `null`

### getRandom - 动态权重计算

```kotlin
fun <T> getRandom(categories: Collection<T>, processing: (T) -> Int): WeightCategory<T>?
```

**参数：**
- `categories`: 原始对象集合
- `processing`: 权重计算函数（从对象中提取权重值）

**返回：** 包含原始对象和计算权重的结果对象

### getWeightRandom - 快速获取结果

```kotlin
fun <T> getWeightRandom(categories: Collection<WeightCategory<T>>): T?
```

**返回：** 直接返回选中对象的原始值（不包含权重信息）

## 扩展函数

### randomWeight - 集合直接调用

```kotlin
fun <T> Collection<T>.randomWeight(processing: (T) -> Int): WeightCategory<T>?
```

**示例：**

```kotlin
// 快速创建权重列表
val result = listOf("A", "B", "C").randomWeight {
    when(it) {
        "A" -> 50
        "B" -> 30
        else -> 20
    }
}
```

### randomWeightValue - 快速获取值

```kotlin
fun <T> Collection<T>.randomWeightValue(processing: (T) -> Int): T?
```

**示例：**

```kotlin
// 直接获取结果值
val result = listOf(1, 2, 3).randomWeightValue { it * 10 }  // 权重分别为 10, 20, 30
```

## WeightCategory 数据类

```kotlin
data class WeightCategory<T>(
    var category: T,  // 原始对象
    var weight: Int   // 权重值
)
```

## 实际应用示例

### 战利品掉落系统

```kotlin
data class Loot(val name: String, val rarity: Rarity)

enum class Rarity { COMMON, UNCOMMON, RARE, EPIC }

object LootSystem {
    private val lootTable = listOf(
        Loot("铜币", Rarity.COMMON),
        Loot("银币", Rarity.UNCOMMON),
        Loot("金币", Rarity.RARE),
        Loot("钻石", Rarity.EPIC)
    )

    fun dropLoot(): Loot? {
        return lootTable.randomWeightValue { loot ->
            when(loot.rarity) {
                Rarity.COMMON -> 1000
                Rarity.UNCOMMON -> 100
                Rarity.RARE -> 10
                Rarity.EPIC -> 1
            }
        }
    }
}
```

### 随机事件系统

```kotlin
object RandomEventSystem {
    private val events = listOf(
        WeightCategory("流星雨", 5),
        WeightCategory("血月", 10),
        WeightCategory("商人来访", 30),
        WeightCategory("无事件", 55)
    )

    fun triggerRandomEvent(): String? {
        return Arim.weightRandom.getWeightRandom(events)
    }
}
```

### 动态难度调整

```kotlin
data class Monster(val name: String, val level: Int)

object SpawnSystem {
    fun spawnMonster(playerLevel: Int): Monster? {
        val monsters = listOf(
            Monster("史莱姆", 1),
            Monster("骷髅", 5),
            Monster("僵尸", 10),
            Monster("精英怪", 20)
        )

        return monsters.randomWeightValue { monster ->
            // 根据玩家等级调整权重
            val levelDiff = (playerLevel - monster.level).coerceAtLeast(0)
            100 - (levelDiff * 10).coerceAtMost(90)
        }
    }
}
```

### 抽奖系统

```kotlin
object GachaSystem {
    private val rewards = listOf(
        WeightCategory("谢谢参与", 60),
        WeightCategory("10 金币", 25),
        WeightCategory("50 金币", 10),
        WeightCategory("稀有道具", 4),
        WeightCategory("传说武器", 1)
    )

    fun draw(player: Player): String {
        val result = Arim.weightRandom.getWeightRandom(rewards)
        return result ?: "抽奖失败"
    }

    fun multiDraw(count: Int): List<String> {
        return (1..count).map { draw(player) }
    }
}
```

## 权重计算规则

### 概率计算公式

```
实际概率 = 项目权重 / 总权重
```

**示例：**

```kotlin
val items = listOf(
    WeightCategory("A", 50),  // 50 / 100 = 50%
    WeightCategory("B", 30),  // 30 / 100 = 30%
    WeightCategory("C", 20)   // 20 / 100 = 20%
)
```

### 权重总和为 0 或负数

当所有项目的权重总和 ≤ 0 时，返回 `null`：

```kotlin
val items = listOf(
    WeightCategory("A", 0),
    WeightCategory("B", -10)
)

val result = Arim.weightRandom.getWeightRandom(items)  // null
```

## 常见问题

### 如何确保某个项目必定出现？

将该项目的权重设置得足够大：

```kotlin
val guaranteed = listOf(
    WeightCategory("保底奖励", 9999),
    WeightCategory("其他", 1)
)
```

### 扩展函数和直接调用的区别？

```kotlin
// 扩展函数（更简洁）
val result1 = items.randomWeightValue { it.rarity.weight }

// 直接调用（更明确）
val result2 = Arim.weightRandom.getRandom(items) { it.rarity.weight }?.category

// 两者等价
```

### 是否线程安全？

是的，WeightRandom 使用 TabooLib 的线程安全 `random()` 函数，可以在多线程环境下安全使用。

### 如何实现保底机制？

```kotlin
object GachaWithPity {
    private var pityCounter = 0

    fun draw(): String {
        pityCounter++

        // 90 抽保底
        if (pityCounter >= 90) {
            pityCounter = 0
            return "★★★★★ 传说武器"
        }

        val result = normalDraw()
        if (result.startsWith("★★★★★")) {
            pityCounter = 0
        }
        return result
    }

    private fun normalDraw(): String {
        return Arim.weightRandom.getWeightRandom(rewards) ?: "抽奖失败"
    }
}
```
