---
title: 实体匹配工具
sidebar_position: 6
description: 实体检测系统，提供灵活的公式写法来匹配实体的各种属性
---

# 实体匹配工具

实体匹配工具（EntityMatch）与物品匹配工具类似，提供了一种公式写法来进行实体检测。

## 基础用法

```kotlin
import top.maplex.arim.Arim

val entity: LivingEntity = ...

// 匹配实体名称以 "&c机械" 开头，且包含 "怪" 字
val matched = Arim.entityMatch.match(
    entity,
    "name:all(startswith(&c机械),c(怪))"
)

// 安全匹配（捕获异常）
val matched = Arim.entityMatch.matchTry(entity, "name:c(僵尸)")
```

## 语法规则

### 基本格式

```
<处理器>:<条件>;<处理器2>:<条件2>;...
```

**示例：**

```kotlin
// 单个处理器
"name:c(僵尸)"

// 多个处理器（使用分号分隔）
"name:c(精英);type:ZOMBIE;health:>100"

// 复杂条件
"name:all(startswith(&c),c(BOSS));health:>=500"
```

## 处理器类型

### 内置处理器

| 处理器 | 说明 | 示例 |
|-------|------|------|
| `name` | 匹配实体名称 | `name:c(僵尸)` |
| `type` | 匹配实体类型 | `type:ZOMBIE` |
| `meta` | 匹配实体元数据 | `meta:npc` |
| `health` | 匹配实体血量 | `health:>100` |
| `mm` | 匹配 MythicMobs ID | `mm:EliteBoss` |
| `ady` | 匹配 Adyeshach NPC ID | `ady:custom_npc` |

:::info[插件支持]

- `mm` 处理器需要 MythicMobs 插件和 universal-mythic 前置
- `ady` 处理器需要 Adyeshach 插件

这些处理器会在检测到对应插件时自动注册。

:::

### 自定义处理器

```kotlin
class CustomEntityHandler : EntityHandler {
    override fun check(entity: LivingEntity, condition: String): Boolean {
        // 自定义匹配逻辑
        return true
    }
}

// 注册
Arim.entityMatch.registerHandler("custom", CustomEntityHandler())

// 注销
Arim.entityMatch.unregisterHandler("custom")
```

## 表达式系统

### 逻辑组合条件

与物品匹配工具相同：

| 关键字 | 说明 | 示例 |
|-------|------|------|
| `any` | 满足任意一个子条件 | `any(c(僵尸),c(骷髅))` |
| `all` | 必须全部满足 | `all(startswith(&c),c(BOSS))` |
| `none` / `not` | 全都不满足 | `none(c(普通),c(弱小))` |

### 内容匹配条件

| 规则 | 关键字 | 说明 | 示例 |
|-----|-------|------|------|
| 精准匹配 | 无 | 直接写参数 | `name:&c精英僵尸` |
| 正则匹配 | `regex`, `reg`, `r` | 正则表达式 | `name:regex(^Boss.*)` |
| 包含匹配 | `contains`, `con`, `c` | 字符串包含 | `name:c(精英)` |
| 开头匹配 | `startswith`, `start`, `s` | 以...开头 | `name:s(&c)` |
| 结尾匹配 | `endswith`, `end`, `e` | 以...结尾 | `name:e(BOSS)` |

**可选项：**
- `uncolored`, `uc` - 去除颜色：`name:c[uc](僵尸)`
- `lowercase` - 转换为小写：`name:c[lowercase](zombie)`

### 算数匹配条件

支持的符号：`>`, `>=`, `<`, `<=`, `=`

```kotlin
// 血量匹配
"health:>100"
"health:>=500"
```

## 处理器详解

### name - 名称匹配

```kotlin
// 精准匹配
"name:&c精英僵尸"

// 包含匹配
"name:c(BOSS)"

// 开头匹配
"name:startswith(&c精英)"

// 组合条件
"name:all(startswith(&c),c(BOSS))"

// 支持 Adyeshach 实体
```

### type - 类型匹配

```kotlin
// 匹配僵尸类型
"type:ZOMBIE"

// 匹配多种类型
"type:any(ZOMBIE,SKELETON,CREEPER)"

// 正则匹配（所有骷髅类型）
"type:regex(.*SKELETON.*)"

// 支持 Adyeshach 实体
```

**实体类型：** 使用 Bukkit 的 `EntityType` 枚举名称

### health - 血量匹配

```kotlin
// 血量大于 100
"health:>100"

// 血量等于满血
"health:=20"

// 血量小于等于 50
"health:<=50"
```

### meta - 元数据匹配

```kotlin
// 匹配元数据
"meta:npc"

// 支持 Adyeshach 实体的元数据
```

### mm - MythicMobs 匹配

```kotlin
// 匹配 MythicMobs 的 MobID
"mm:EliteBoss"
"mm:CustomZombie"

// 组合使用
"mm:c(Elite);health:>500"
```

:::warning[前置要求]

需要安装 MythicMobs 插件和 universal-mythic 前置。

:::

### ady - Adyeshach 匹配

```kotlin
// 匹配 Adyeshach 的 NpcID
"ady:custom_npc"
"ady:quest_giver"

// 组合使用
"ady:c(quest);name:c(商人)"
```

:::warning[前置要求]

需要安装 Adyeshach 插件。

:::

## 实际应用示例

### BOSS 检测

```kotlin
fun isBoss(entity: LivingEntity): Boolean {
    return Arim.entityMatch.match(
        entity,
        "name:c(BOSS);health:>500"
    )
}
```

### 精英怪物检测

```kotlin
fun isEliteMob(entity: LivingEntity): Boolean {
    return Arim.entityMatch.matchTry(
        entity,
        "name:startswith(&c精英);type:any(ZOMBIE,SKELETON)"
    )
}
```

### 配置文件条件

```yaml
mob_rewards:
  elite_zombie:
    condition: "mm:EliteZombie;health:>200"
    reward_exp: 100
  boss:
    condition: "name:c(BOSS);health:>=1000"
    reward_exp: 500
```

```kotlin
fun checkMobReward(entity: LivingEntity, condition: String): Boolean {
    return Arim.entityMatch.matchTry(entity, condition)
}
```

### MythicMobs 整合

```kotlin
fun handleMythicMob(entity: LivingEntity) {
    when {
        Arim.entityMatch.matchTry(entity, "mm:EliteBoss") -> {
            // 精英 BOSS 逻辑
        }
        Arim.entityMatch.matchTry(entity, "mm:c(Elite)") -> {
            // 精英怪物逻辑
        }
        else -> {
            // 普通怪物逻辑
        }
    }
}
```

## 多实体类型支持

### 原版实体匹配

```kotlin
fun match(entity: LivingEntity, match: String): Boolean
fun matchTry(entity: LivingEntity, match: String): Boolean
```

### Adyeshach 实体匹配

```kotlin
fun match(entity: BaseEntityInstance, match: String): Boolean
fun matchTry(entity: BaseEntityInstance, match: String): Boolean
```

**示例：**

```kotlin
// 原版实体
val livingEntity: LivingEntity = ...
Arim.entityMatch.match(livingEntity, "name:c(僵尸)")

// Adyeshach 实体
val adyEntity: BaseEntityInstance = ...
Arim.entityMatch.match(adyEntity, "ady:custom_npc;name:c(商人)")
```

## 常见问题

### 如何匹配多种实体类型？

```kotlin
// 使用 any 逻辑组合
"type:any(ZOMBIE,SKELETON,CREEPER)"

// 使用正则表达式
"type:regex(.*(ZOMBIE|SKELETON).*)"
```

### 如何判断是否为 MythicMobs 怪物？

```kotlin
// 方法 1: 使用 mm 处理器
val isMM = Arim.entityMatch.matchTry(entity, "mm:.*")

// 方法 2: 检测特定 MobID
val isElite = Arim.entityMatch.matchTry(entity, "mm:c(Elite)")
```

### name 和 type 的区别？

- `name`: 匹配实体的自定义名称（displayName）
- `type`: 匹配实体的类型（EntityType，如 ZOMBIE、SKELETON）

```kotlin
// name - 匹配显示名称
"name:c(精英僵尸)"  // 匹配名称包含"精英僵尸"的实体

// type - 匹配实体类型
"type:ZOMBIE"  // 匹配所有僵尸类型的实体
```

### 条件格式错误会抛出异常吗？

`match()` 可能抛出异常，建议使用 `matchTry()`：

```kotlin
// matchTry() - 自动捕获异常
val matched = Arim.entityMatch.matchTry(entity, condition)
```
