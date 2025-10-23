---
title: MythicMobs 兼容工具
sidebar_position: 4
description: 统一 MythicMobs 4.X 和 5.X 的 API 差异，提供跨版本兼容的怪物、物品、技能管理接口
---

# MythicMobs 兼容工具

Universal-Mythic（简称 UM）是 MythicMobs 跨版本兼容工具，抹平 MM4 和 MM5 的巨大 API 差异，提供统一的接口用于怪物、物品、技能的管理和交互。

:::warning[重要提示]

MythicMobs 的维护与开发不规范，MM4 与 MM5 的 API 差距巨大。使用 UM 工具可以避免在升级 MM 版本时重写代码。

:::

## 依赖配置

### Gradle 配置

```kotlin
taboolib {
    description {
        dependencies {
            name("MythicMobs")
        }
    }
    // ⚠️ 必须重定向，否则多个使用 UM 的插件会冲突
    relocate("ink.ptms.um", "你的包名.um")
}

repositories {
    maven("https://nexus.maplex.top/repository/maven-public/")
}

dependencies {
    taboo("ink.ptms:um:1.2.1")
}
```

:::danger[必须重定向]

无论什么版本都需要重定向 `ink.ptms.um` 包名，否则两个使用 UM 的插件会产生冲突导致崩溃。

:::

### 版本说明

- **TabooLib 6.2.X**: 推荐使用 `ink.ptms:um:1.2.1`
- **TabooLib 6.0.X**: 使用 `ink.ptms:um:1.0.0-beta-34`

最新版本请查看 [GitHub Releases](https://github.com/TabooLib/universal-mythic)。

## 基础 API

所有 API 通过 `Mythic.API` 入口访问：

```kotlin
import ink.ptms.um.Mythic

// 判断 MythicMobs 是否已加载
if (Mythic.isLoaded()) {
    val api = Mythic.API

    // 判断是否 MM4.X 版本
    if (api.isLegacy) {
        println("MythicMobs 4.X")
    } else {
        println("MythicMobs 5.X")
    }
}
```

## 物品管理

### 获取 MythicItem

```kotlin
// 获取 MythicItem 实例
val item = Mythic.API.getItem("example_sword")

if (item != null) {
    println("物品 ID: ${item.internalName}")
    println("显示名称: ${item.displayName}")
    println("数量: ${item.amount}")

    // 生成 ItemStack
    val itemStack = item.generateItemStack(5)
}
```

### 获取 ItemStack 对应的 MythicItem ID

```kotlin
val itemStack: ItemStack = player.inventory.itemInMainHand

// 获取物品 ID
val itemId = Mythic.API.getItemId(itemStack)
if (itemId != null) {
    println("这是 MythicItem: $itemId")
}
```

:::info[版本差异]

- **MM4.X**: `getItemId()` 返回物品名称
- **MM5.X**: `getItemId()` 返回内部 NBT 标识

UM 自动处理版本差异，开发者无需关心。

:::

### 直接构建 ItemStack

```kotlin
// 不指定玩家
val itemStack = Mythic.API.getItemStack("example_sword")

// 为特定玩家构建（支持变量替换）
val itemStack = Mythic.API.getItemStack("example_sword", player)
```

### 获取所有物品

```kotlin
// 获取所有物品 ID 列表
val itemIds = Mythic.API.getItemIDList()
itemIds.forEach { println(it) }

// 获取所有 Item 实例
val items = Mythic.API.getItemList()
items.forEach { item ->
    println("${item.internalName}: ${item.displayName}")
}
```

## 怪物管理

### 获取 ActiveMob

```kotlin
// 通过实体获取
val entity: Entity = ...
val mob = Mythic.API.getMob(entity)

if (mob != null) {
    println("怪物 ID: ${mob.id}")
    println("显示名称: ${mob.displayName}")
    println("等级: ${mob.level}")
    println("姿态: ${mob.stance}")
    println("阵营: ${mob.faction}")
}

// 通过 UUID 获取
val mob = Mythic.API.getMob(UUID.fromString("..."))
```

### Mob 属性

```kotlin
val mob = Mythic.API.getMob(entity) ?: return

// 获取 MobType
val mobType = mob.type
println("怪物类型: ${mobType.id}")

// 获取实体对象
val bukkitEntity = mob.entity

// 获取实体类型
val entityType = mob.entityType

// 访问配置
val config = mob.config
val health = config.getDouble("Health", 20.0)
```

### 仇恨管理

```kotlin
val mob = Mythic.API.getMob(entity) ?: return
val target = player as LivingEntity

// 增加仇恨
mob.addThreat(entity, target, 100.0)

// 减少仇恨
mob.reduceThreat(entity, target, 50.0)
```

### 获取 MobType

```kotlin
// 获取 MobType 实例
val mobType = Mythic.API.getMobType("example_boss")

if (mobType != null) {
    println("怪物 ID: ${mobType.id}")
    println("显示名称: ${mobType.displayName}")
    println("实体类型: ${mobType.entityType}")

    // 生成怪物到指定位置
    val spawnedMob = mobType.spawn(location, level = 5.0)
}
```

### 获取所有怪物

```kotlin
// 获取所有 Mob ID 列表
val mobIds = Mythic.API.getMobIDList()
mobIds.forEach { println(it) }
```

## 技能系统

### 释放技能

```kotlin
// 基础用法
Mythic.API.castSkill(
    caster = player,
    skillName = "example_skill"
)

// 完整参数
Mythic.API.castSkill(
    caster = player,                       // 施法者
    skillName = "example_skill",           // 技能名称
    trigger = targetEntity,                // 触发器（可选）
    origin = player.location,              // 技能释放位置
    et = setOf(targetEntity1, targetEntity2), // 目标实体
    lt = setOf(location1, location2),      // 目标位置
    power = 1.5f                           // 技能强度
)
```

### 技能触发器

```kotlin
// 获取技能触发器
val trigger = Mythic.API.getSkillTrigger("onAttack")

// 获取默认触发器
val defaultTrigger = Mythic.API.getDefaultSkillTrigger()
```

### 从字符串创建技能

```kotlin
// 将 MythicMobs 技能字符串转换为技能实例
val skill = Mythic.API.getSkillMechanic("message{m=\"Hello World\"}")

if (skill != null) {
    println("技能延迟: ${skill.delay}")

    // 执行技能
    skill.execute(
        trigger = Mythic.API.getDefaultSkillTrigger(),
        entity = player,
        target = targetEntity
    )

    // 检查冷却
    if (skill.onCooldown(player)) {
        val cooldown = skill.getCooldown(player)
        println("冷却中: $cooldown 秒")
    }

    // 设置冷却
    skill.setCooldown(player, 10.0)
}
```

### 获取玩家目标

```kotlin
// 获取玩家准星瞄准的实体
val targetEntity = Mythic.API.getTargetedEntity(player)

if (targetEntity != null) {
    println("玩家正在瞄准: ${targetEntity.type}")
}
```

## 注册自定义技能

### EntityTargetSkill（实体目标技能）

```kotlin
import ink.ptms.um.event.MobSkillLoadEvent
import ink.ptms.um.skill.type.EntityTargetSkill
import ink.ptms.um.skill.SkillResult
import taboolib.common.platform.event.SubscribeEvent

@SubscribeEvent
fun onSkillLoad(event: MobSkillLoadEvent) {
    if (event.nameIs("damage_ap", "ap_damage")) {
        event.register(object : EntityTargetSkill {

            // 从配置读取参数（支持占位符）
            val attribute = event.config.getPlaceholderString(
                arrayOf("attribute", "att"),
                ""
            )

            val damage = event.config.getPlaceholderDouble(
                arrayOf("damage", "d"),
                10.0
            )

            override fun cast(meta: SkillMeta, entity: Entity): SkillResult {
                if (entity !is LivingEntity) return SkillResult.ERROR

                val damager = meta.caster.entity as? LivingEntity
                    ?: return SkillResult.ERROR

                // 获取占位符值
                val attributeValue = attribute.get(meta.caster)
                val damageValue = damage.get(meta.caster)

                // 执行技能逻辑
                entity.damage(damageValue, damager)

                return SkillResult.SUCCESS
            }
        })
    }
}
```

**技能配置示例：**

```yaml
# MythicMobs/Skills/custom.yml
damage_ap:
  Skills:
    - damage_ap{attribute="fire&ice";damage=50} @Target
```

### NoTargetSkill（无目标技能）

```kotlin
@SubscribeEvent
fun onSkillLoad(event: MobSkillLoadEvent) {
    if (event.nameIs("aoe_explosion")) {
        event.register(object : NoTargetSkill {

            val radius = event.config.getPlaceholderDouble(
                arrayOf("radius", "r"),
                5.0
            )

            override fun cast(meta: SkillMeta): SkillResult {
                val caster = meta.caster.entity
                val location = caster.location
                val radiusValue = radius.get(meta.caster)

                // 获取范围内的实体
                val nearbyEntities = caster.getNearbyEntities(
                    radiusValue,
                    radiusValue,
                    radiusValue
                )

                nearbyEntities.filterIsInstance<LivingEntity>().forEach {
                    it.damage(20.0)
                }

                return SkillResult.SUCCESS
            }
        })
    }
}
```

### LocationTargetSkill（位置目标技能）

```kotlin
@SubscribeEvent
fun onSkillLoad(event: MobSkillLoadEvent) {
    if (event.nameIs("spawn_particle")) {
        event.register(object : LocationTargetSkill {

            val particle = event.config.getString("particle", "FLAME")
            val amount = event.config.getInt("amount", 10)

            override fun cast(meta: SkillMeta, location: Location): SkillResult {
                location.world?.spawnParticle(
                    Particle.valueOf(particle),
                    location,
                    amount
                )

                return SkillResult.SUCCESS
            }
        })
    }
}
```

### SkillConfig 配置读取

`SkillConfig` 提供丰富的配置读取方法：

```kotlin
val config = event.config

// 基础类型
val bool = config.getBoolean("enabled", true)
val string = config.getString("message", "默认消息")
val int = config.getInt("amount", 10)
val double = config.getDouble("damage", 5.0)
val float = config.getFloat("speed", 1.0f)
val long = config.getLong("cooldown", 1000L)

// 支持别名（多个 key）
val value = config.getString(arrayOf("damage", "dmg", "d"), "10")

// 带占位符的值（支持 MythicMobs 变量）
val placeholderString = config.getPlaceholderString(
    arrayOf("message", "msg"),
    "默认值"
)
val placeholderInt = config.getPlaceholderInt(
    arrayOf("amount", "amt"),
    10
)
val placeholderDouble = config.getPlaceholderDouble(
    arrayOf("damage", "dmg"),
    10.0
)
val placeholderFloat = config.getPlaceholderFloat(
    arrayOf("speed"),
    1.0f
)

// 在技能中使用占位符值
override fun cast(meta: SkillMeta, entity: Entity): SkillResult {
    val message = placeholderString.get(meta.caster)
    val damage = placeholderDouble.get(meta.caster)
    // ...
}

// 颜色
val color = config.getColor("color", "255,0,0")
```

### SkillResult 返回值

| 返回值 | 说明 |
|--------|------|
| `SUCCESS` | 技能成功执行 |
| `ERROR` | 执行出错 |
| `INVALID_TARGET` | 无效目标 |
| `INVALID_CONFIG` | 配置错误 |
| `CONDITION_FAILED` | 条件未满足 |
| `REQUIRES_PREMIUM` | 需要高级版 |
| `INVALID_VERSION` | 版本不兼容 |
| `MISSING_COMPATIBILITY` | 缺少兼容性依赖 |

## 注册自定义掉落

```kotlin
import ink.ptms.um.event.MobDropLoadEvent
import taboolib.common.platform.event.SubscribeEvent

@SubscribeEvent
fun onDropLoad(event: MobDropLoadEvent) {
    // 注册自定义掉落
    event.registerItem { dropMeta ->
        // dropMeta.dropper: 掉落者（施法者）
        // dropMeta.cause: 触发者（杀手）
        // dropMeta.amount: 掉落数量

        val killer = dropMeta.cause as? Player
        if (killer != null && killer.hasPermission("example.bonus")) {
            // 给有权限的玩家额外掉落
            ItemStack(Material.DIAMOND, dropMeta.amount.toInt() * 2)
        } else {
            ItemStack(Material.DIAMOND, dropMeta.amount.toInt())
        }
    }
}
```

## 动态注册与移除

### 注册物品

```kotlin
import java.io.File

val itemFile = File("path/to/items.yml")

// 注册物品
val success = Mythic.API.registerItem(itemFile, "custom_sword")
if (success) {
    println("物品注册成功")
} else {
    println("物品已存在或注册失败")
}

// 移除物品
val removed = Mythic.API.unregisterItem("custom_sword")
if (removed) {
    println("物品已移除")
}
```

### 注册怪物

```kotlin
val mobFile = File("path/to/mobs.yml")

// 注册怪物
val success = Mythic.API.registerMob(mobFile, "custom_boss")
if (success) {
    println("怪物注册成功")
} else {
    println("怪物已存在或注册失败")
}

// 移除怪物
val removed = Mythic.API.unregisterMob("custom_boss")
if (removed) {
    println("怪物已移除")
}
```

## 实际应用示例

### 自定义伤害技能系统

```kotlin
object CustomSkillManager {

    @SubscribeEvent
    fun registerSkills(event: MobSkillLoadEvent) {
        // 真实伤害技能
        if (event.nameIs("true_damage")) {
            event.register(object : EntityTargetSkill {
                val damage = event.config.getPlaceholderDouble(
                    arrayOf("damage", "d"),
                    10.0
                )

                override fun cast(meta: SkillMeta, entity: Entity): SkillResult {
                    if (entity !is LivingEntity) return SkillResult.INVALID_TARGET

                    val damageValue = damage.get(meta.caster)
                    val health = entity.health - damageValue
                    entity.health = health.coerceAtLeast(0.0)

                    return SkillResult.SUCCESS
                }
            })
        }

        // 范围减速技能
        if (event.nameIs("area_slow")) {
            event.register(object : LocationTargetSkill {
                val radius = event.config.getDouble("radius", 5.0)
                val duration = event.config.getInt("duration", 100)
                val amplifier = event.config.getInt("amplifier", 1)

                override fun cast(meta: SkillMeta, location: Location): SkillResult {
                    location.world?.getNearbyEntities(location, radius, radius, radius)
                        ?.filterIsInstance<LivingEntity>()
                        ?.forEach { entity ->
                            entity.addPotionEffect(
                                PotionEffect(
                                    PotionEffectType.SLOW,
                                    duration,
                                    amplifier
                                )
                            )
                        }

                    return SkillResult.SUCCESS
                }
            })
        }
    }
}
```

### Boss 战斗系统

```kotlin
object BossSystem {

    fun spawnBoss(location: Location, playerCount: Int) {
        val mobType = Mythic.API.getMobType("world_boss") ?: return

        // 根据玩家数量调整等级
        val level = 1.0 + (playerCount * 0.5)
        val boss = mobType.spawn(location, level)

        println("Boss 已生成: ${boss.displayName} (Lv.$level)")
    }

    @SubscribeEvent
    fun onBossDeath(event: MobDeathEvent) {
        val mob = event.mob

        if (mob.id == "world_boss") {
            val killer = event.killer as? Player ?: return

            // 给予击杀奖励
            val reward = Mythic.API.getItemStack("boss_reward", killer)
            if (reward != null) {
                killer.inventory.addItem(reward)
            }
        }
    }
}
```

### 物品识别系统

```kotlin
object ItemChecker {

    fun checkPlayerHand(player: Player) {
        val itemStack = player.inventory.itemInMainHand
        val itemId = Mythic.API.getItemId(itemStack)

        if (itemId != null) {
            val item = Mythic.API.getItem(itemId)
            if (item != null) {
                player.sendMessage("你手持 MythicItem: ${item.displayName}")

                // 读取物品配置
                val config = item.config
                val customValue = config.getString("CustomData.power", "0")
                player.sendMessage("物品能量: $customValue")
            }
        } else {
            player.sendMessage("这不是 MythicItem")
        }
    }
}
```

## 常见问题

### 如何判断 MythicMobs 是否已加载？

```kotlin
if (Mythic.isLoaded()) {
    // MythicMobs 已加载
} else {
    // MythicMobs 未加载
}
```

### MM4 和 MM5 的主要区别是什么？

UM 自动处理以下版本差异：
- **物品 ID 获取方式**：MM4 使用物品名，MM5 使用内部 NBT
- **API 结构**：完全不同的包名和类结构
- **技能系统**：不同的触发器和参数系统

使用 UM 后无需关心这些差异。

### 为什么必须重定向包名？

多个插件使用 UM 时，如果不重定向，会加载同一个 UM 实例导致冲突。重定向后每个插件都有独立的 UM 副本。

### 技能配置中的占位符如何使用？

使用 `getPlaceholder*()` 方法读取的值支持 MythicMobs 的占位符系统，如 `<caster.level>`、`<target.hp>` 等。

### 如何获取技能的 SkillMeta？

在自定义技能的 `cast()` 方法中，`meta` 参数包含：
- `meta.caster`: 施法者信息
- `meta.trigger`: 触发者
- `meta.origin`: 原点位置
- `meta.power`: 技能强度
- `meta.entityTargets`: 目标实体集合
- `meta.locationTargets`: 目标位置集合

### 如何调试自定义技能？

```kotlin
override fun cast(meta: SkillMeta, entity: Entity): SkillResult {
    try {
        // 技能逻辑
        return SkillResult.SUCCESS
    } catch (e: Exception) {
        e.printStackTrace()
        return SkillResult.ERROR
    }
}
```

检查服务器日志获取错误信息。
