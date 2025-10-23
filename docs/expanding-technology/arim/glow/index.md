---
title: 发光工具
sidebar_position: 7
description: 基于 PacketEvents 的实体与方块发光效果工具，支持自定义颜色和多种发光模式
---

# 发光工具

发光工具（Glow）提供了实体和方块的发光效果，基于 PacketEvents 实现，支持自定义颜色和多种发光模式。

## 前置要求

:::warning[依赖要求]

- **前置插件**: PacketEvents
- **支持版本**:
  - 1.12.2, 1.16.5
  - 1.17+ (已测试: 1.18.2, 1.19.4, 1.20.1, 1.20.4, 1.21.1, 1.21.4)

:::

## 基础用法

### 实体发光

```kotlin
import net.kyori.adventure.text.format.NamedTextColor
import top.maplex.arim.Arim

val entity = // 目标实体
val player = // 观察者

// 设置发光（红色）
Arim.glow.setGlowing(entity, player, NamedTextColor.RED)

// 取消发光
Arim.glow.setGlowing(entity, player, null)
```

### 方块发光

```kotlin
import top.maplex.arim.tools.glow.internal.pojo.BlockGlowMode

val block = location.block
val player = // 观察者

// 设置发光（蓝色，Classic 模式）
Arim.glow.setGlowing(
    block,
    player,
    NamedTextColor.BLUE,
    BlockGlowMode.CLASSIC_11200_11605_UNIVERSAL
)

// 取消发光
Arim.glow.setGlowing(block, player, null, BlockGlowMode.CLASSIC_11200_11605_UNIVERSAL)
```

## API 方法

### setGlowing - 实体发光

```kotlin
fun setGlowing(entity: Entity, receiver: Player, color: NamedTextColor?)
```

**参数：**
- `entity`: 目标实体
- `receiver`: 观察者玩家
- `color`: 发光颜色，`null` 表示取消发光

### setGlowing - 方块发光

```kotlin
fun setGlowing(
    block: Block,
    receiver: Player,
    color: NamedTextColor?,
    mode: BlockGlowMode
)
```

**参数：**
- `block`: 目标方块
- `receiver`: 观察者玩家
- `color`: 发光颜色，`null` 表示取消发光
- `mode`: 发光模式

:::info[空气方块]

目前不支持空气方块发光。

:::

## 方块发光模式

Arim 提供两种方块发光模式，适用于不同场景：

### CLASSIC_11200_11605_UNIVERSAL

使用潜影贝实现，支持所有版本（1.12.2, 1.16.5, 1.17+）。

**优点：**
- 不影响方块交互
- 版本支持广泛

**缺点：**
- 发光边框只能为正方形
- 无法隐藏潜影贝内部的小头

**适用场景：** 不透明的全尺寸方块

### STYLE_11200_11605_ONLY

使用掉落方块实体实现，仅支持 1.12.2 和 1.16.5（高版本已修复此特性）。

**优点：**
- 发光边框完美贴合原方块

**缺点：**
- 方块变为实体，交互不可用
- 碰撞箱变得奇怪

**适用场景：** 仅用于向玩家展示的方块

## 颜色选项

使用 `NamedTextColor` 枚举：

| 颜色 | 枚举值 |
|-----|--------|
| 黑色 | `NamedTextColor.BLACK` |
| 深蓝 | `NamedTextColor.DARK_BLUE` |
| 深绿 | `NamedTextColor.DARK_GREEN` |
| 青色 | `NamedTextColor.DARK_AQUA` |
| 深红 | `NamedTextColor.DARK_RED` |
| 紫色 | `NamedTextColor.DARK_PURPLE` |
| 金色 | `NamedTextColor.GOLD` |
| 灰色 | `NamedTextColor.GRAY` |
| 深灰 | `NamedTextColor.DARK_GRAY` |
| 蓝色 | `NamedTextColor.BLUE` |
| 绿色 | `NamedTextColor.GREEN` |
| 青色 | `NamedTextColor.AQUA` |
| 红色 | `NamedTextColor.RED` |
| 粉色 | `NamedTextColor.LIGHT_PURPLE` |
| 黄色 | `NamedTextColor.YELLOW` |
| 白色 | `NamedTextColor.WHITE` |

## 实际应用示例

### 标记任务目标

```kotlin
object QuestMarker {
    private val glowingEntities = mutableMapOf<UUID, Entity>()

    fun markQuestTarget(player: Player, entity: Entity) {
        // 标记为黄色发光
        Arim.glow.setGlowing(entity, player, NamedTextColor.YELLOW)
        glowingEntities[player.uniqueId] = entity
    }

    fun clearMarker(player: Player) {
        glowingEntities[player.uniqueId]?.let { entity ->
            Arim.glow.setGlowing(entity, player, null)
        }
        glowingEntities.remove(player.uniqueId)
    }
}
```

### 矿点标记系统

```kotlin
object MineMarker {
    fun highlightOres(player: Player, radius: Int) {
        val center = player.location

        for (x in -radius..radius) {
            for (y in -radius..radius) {
                for (z in -radius..radius) {
                    val block = center.clone().add(x.toDouble(), y.toDouble(), z.toDouble()).block

                    when (block.type) {
                        Material.DIAMOND_ORE -> {
                            Arim.glow.setGlowing(
                                block, player, NamedTextColor.AQUA,
                                BlockGlowMode.CLASSIC_11200_11605_UNIVERSAL
                            )
                        }
                        Material.GOLD_ORE -> {
                            Arim.glow.setGlowing(
                                block, player, NamedTextColor.GOLD,
                                BlockGlowMode.CLASSIC_11200_11605_UNIVERSAL
                            )
                        }
                        else -> {}
                    }
                }
            }
        }
    }
}
```

### PVP 队伍标记

```kotlin
object TeamGlow {
    fun updateTeamGlow(player: Player, team: Team) {
        val color = when (team.color) {
            ChatColor.RED -> NamedTextColor.RED
            ChatColor.BLUE -> NamedTextColor.BLUE
            else -> NamedTextColor.WHITE
        }

        // 为同队玩家标记发光
        team.entries.forEach { memberName ->
            Bukkit.getPlayer(memberName)?.let { member ->
                if (member != player) {
                    Arim.glow.setGlowing(member, player, color)
                }
            }
        }
    }
}
```

## 常见问题

### 如何为所有玩家显示发光？

需要遍历所有在线玩家：

```kotlin
fun setGlowingForAll(entity: Entity, color: NamedTextColor) {
    Bukkit.getOnlinePlayers().forEach { player ->
        Arim.glow.setGlowing(entity, player, color)
    }
}
```

### 方块发光模式如何选择？

```kotlin
// 推荐使用 CLASSIC 模式（兼容性好）
BlockGlowMode.CLASSIC_11200_11605_UNIVERSAL

// 仅在 1.12.2 或 1.16.5 且需要完美边框时使用
BlockGlowMode.STYLE_11200_11605_ONLY
```

### 玩家退出时需要清理吗？

建议在玩家退出时清理发光效果，避免内存泄漏：

```kotlin
@EventHandler
fun onPlayerQuit(event: PlayerQuitEvent) {
    val player = event.player
    // 清理该玩家的所有发光效果
    glowingEntities.remove(player.uniqueId)
}
```

### PacketEvents 如何安装？

从 [SpigotMC](https://www.spigotmc.org/resources/packetevents-api.80279/) 下载 PacketEvents 插件并放入 plugins 文件夹。
