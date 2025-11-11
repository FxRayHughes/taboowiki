---
sidebar_position: 20
title: PlayerSessionMap
description: 线程安全的玩家会话管理容器
---

# PlayerSessionMap

PlayerSessionMap 是一个专为 Bukkit 插件设计的玩家会话管理容器，提供线程安全的会话存储和自动生命周期管理，彻底解决异步场景下的玩家数据管理难题。

## 核心特性

- **线程安全**：基于 `ConcurrentHashMap` 实现，支持并发访问
- **自动生命周期管理**：玩家离线时自动清理会话，避免内存泄漏
- **会话代机制**：通过递增的会话代识别新旧会话，防止异步任务访问过期数据
- **资源释放回调**：支持在会话移除时自动释放资源
- **延迟清理策略**：批量清理过期会话，减少性能开销

## 快速开始

### 基础用法

```kotlin
import taboolib.platform.util.PlayerSessionMap

// 定义玩家会话数据
data class PlayerData(
    val loginTime: Long,
    var money: Double,
    var level: Int
)

// 创建会话容器
val playerSessions = PlayerSessionMap<PlayerData> {
    // 默认工厂函数：玩家首次访问时自动创建
    PlayerData(
        loginTime = System.currentTimeMillis(),
        money = 0.0,
        level = 1
    )
}

// 获取或创建会话
fun getPlayerData(player: Player): PlayerData? {
    return playerSessions.getOrCreate(player)
}

// 访问会话
fun showMoney(player: Player) {
    val data = playerSessions[player]
    data?.let {
        player.sendMessage("你的金币：${it.money}")
    }
}
```

## 核心方法

### getOrCreate - 获取或创建会话

```kotlin
// 使用默认工厂
val data = playerSessions.getOrCreate(player)

// 使用自定义工厂
val data = playerSessions.getOrCreate(player) {
    PlayerData(
        loginTime = System.currentTimeMillis(),
        money = 1000.0,
        level = 5
    )
}

// 基于 UUID
val data = playerSessions.getOrCreate(uuid) {
    loadFromDatabase(uuid)
}
```

**特性：**
- 如果会话已存在且有效，直接返回
- 如果会话不存在或已过期，调用工厂函数创建新会话
- 玩家离线时返回 `null`
- 线程安全，支持并发调用

### get - 获取会话

```kotlin
// 基于 Player 对象
val data = playerSessions[player]

// 基于 UUID
val data = playerSessions[uuid]
```

**特性：**
- 只获取现有会话，不会创建
- 返回 `null` 如果会话不存在或已过期
- 玩家离线时返回 `null`

### set - 主动写入会话

```kotlin
// 创建并写入会话
val newData = PlayerData(
    loginTime = System.currentTimeMillis(),
    money = 5000.0,
    level = 10
)

// 写入会话，返回旧值
val oldData = playerSessions[player] = newData

// 基于 UUID 写入
val oldData = playerSessions[uuid] = newData
```

**特性：**
- 主动创建或替换会话
- 返回旧会话（如果存在）
- 玩家离线时写入失败，返回 `null`

### remove - 移除会话

```kotlin
// 移除会话并触发回调
val data = playerSessions.remove(player)

// 移除会话但不触发回调
val data = playerSessions.remove(player, invokeRemovalCallback = false)

// 基于 UUID 移除
val data = playerSessions.remove(uuid)
```

**适用场景：**
- 手动释放模式下清理会话
- 强制刷新会话数据
- 手动触发资源释放

### contains - 检查会话存在

```kotlin
// 检查玩家是否有有效会话
if (player in playerSessions) {
    println("玩家有会话数据")
}

// 基于 UUID 检查
if (playerSessions.contains(uuid)) {
    println("会话存在")
}
```

## 遍历操作

### entries - 获取所有会话条目

```kotlin
// 遍历所有有效会话
playerSessions.entries().forEach { (uuid, data) ->
    println("玩家 $uuid: 等级 ${data.level}, 金币 ${data.money}")
}

// 使用序列操作
val richPlayers = playerSessions.entries()
    .filter { (_, data) -> data.money > 10000 }
    .map { (uuid, _) -> uuid }
    .toList()
```

### keys - 获取所有 UUID

```kotlin
val onlinePlayerUUIDs = playerSessions.keys().toList()
```

### values - 获取所有会话值

```kotlin
val allData = playerSessions.values().toList()
val totalMoney = playerSessions.values().sumOf { it.money }
```

### forEach - 遍历会话

```kotlin
playerSessions.forEach { uuid, data ->
    println("玩家 $uuid 的金币：${data.money}")
}
```

### size - 获取会话数量

```kotlin
val count = playerSessions.size()
println("当前在线玩家会话数：$count")
```

## 资源释放回调

### 实现 PlayerSessionClosable

当会话对象需要在移除时释放资源（如数据库连接、文件句柄），可以实现 `PlayerSessionClosable` 接口：

```kotlin
import taboolib.platform.util.PlayerSessionClosable
import java.util.UUID

data class PlayerCache(
    val database: Connection,
    val tempFile: File,
    var data: MutableMap<String, Any>
) : PlayerSessionClosable {

    override fun onSessionRemove(uuid: UUID) {
        // 玩家离线时自动调用
        try {
            // 保存数据到数据库
            saveToDatabase(uuid, data)

            // 关闭数据库连接
            database.close()

            // 删除临时文件
            tempFile.delete()

            println("玩家 $uuid 的会话资源已释放")
        } catch (e: Exception) {
            warning("资源释放失败: ${e.message}")
        }
    }
}

// 使用
val caches = PlayerSessionMap<PlayerCache> { uuid ->
    PlayerCache(
        database = createConnection(),
        tempFile = File("cache_$uuid.dat"),
        data = mutableMapOf()
    )
}
```

**回调时机：**
- 玩家离线时
- 会话被主动移除时（调用 `remove()`）
- 会话被替换时（调用 `set()` 覆盖旧值）
- 容器被清空时（调用 `clear()` 或 `close()`）

:::warning[重要提示]
`onSessionRemove()` 可能在异步线程中调用，如需执行主线程操作请使用 `submit(async = false)`。
:::

## 手动释放模式

默认情况下，玩家离线时会自动清理会话。如果需要手动控制释放时机（如延迟保存数据），可以启用手动释放模式：

```kotlin
val manualSessions = PlayerSessionMap<PlayerData>(
    defaultFactory = { uuid ->
        loadFromDatabase(uuid)
    },
    manualRelease = true  // 启用手动释放模式
)

// 玩家离线时不会自动清理，需要手动调用 remove
@EventHandler
fun onPlayerQuit(event: PlayerQuitEvent) {
    val player = event.player

    // 保存数据
    submit(async = true) {
        val data = manualSessions.remove(player)
        data?.let {
            saveToDatabase(player.uniqueId, it)
        }
    }
}
```

**使用场景：**
- 需要在玩家离线后继续处理会话数据
- 需要延迟保存数据到数据库
- 需要批量处理离线玩家的会话

## 不安全获取

在某些特殊场景下（如调试），可能需要跳过会话过期检查直接获取原始数据：

```kotlin
// 不检查会话是否过期
val rawData = playerSessions.unsafeGet(player)
```

:::danger[警告]
此方法可能返回已过期的会话，仅用于调试或非常特殊的场景。一般情况下应使用 `get()` 或 `getOrCreate()`。
:::

## 实战示例

### 示例 1：玩家数据缓存

```kotlin
data class PlayerProfile(
    val name: String,
    var level: Int,
    var exp: Long,
    var lastSave: Long = System.currentTimeMillis()
) : PlayerSessionClosable {

    override fun onSessionRemove(uuid: UUID) {
        // 玩家离线时自动保存
        submit(async = true) {
            saveToDatabase(uuid, this)
        }
    }
}

val profiles = PlayerSessionMap<PlayerProfile> { uuid ->
    // 从数据库加载
    loadFromDatabase(uuid) ?: PlayerProfile(
        name = Bukkit.getOfflinePlayer(uuid).name ?: "Unknown",
        level = 1,
        exp = 0
    )
}

// 增加经验
fun addExp(player: Player, amount: Long) {
    profiles[player]?.let { profile ->
        profile.exp += amount

        // 检查升级
        while (profile.exp >= getRequiredExp(profile.level)) {
            profile.exp -= getRequiredExp(profile.level)
            profile.level++
            player.sendMessage("§a恭喜升级至 ${profile.level} 级！")
        }

        profile.lastSave = System.currentTimeMillis()
    }
}
```

### 示例 2：异步任务中的安全访问

```kotlin
data class TaskData(
    var progress: Int = 0,
    val startTime: Long = System.currentTimeMillis()
)

val tasks = PlayerSessionMap<TaskData> { TaskData() }

// 启动长时间任务
fun startTask(player: Player) {
    val uuid = player.uniqueId

    submit(async = true, period = 20) {
        // 每秒执行一次
        val data = tasks[uuid] ?: run {
            // 玩家已离线，任务自动停止
            cancel()
            return@submit
        }

        data.progress += 10

        // 回到主线程通知玩家
        submit(async = false) {
            player.sendActionBar("§a任务进度: ${data.progress}%")
        }

        if (data.progress >= 100) {
            // 任务完成
            submit(async = false) {
                player.sendMessage("§a任务完成！")
                tasks.remove(uuid)
            }
            cancel()
        }
    }
}
```

### 示例 3：商店会话管理

```kotlin
data class ShopSession(
    val items: MutableList<ItemStack> = mutableListOf(),
    var totalPrice: Double = 0.0,
    val createTime: Long = System.currentTimeMillis()
) : PlayerSessionClosable {

    override fun onSessionRemove(uuid: UUID) {
        // 关闭商店时退还物品
        submit(async = false) {
            val player = Bukkit.getPlayer(uuid)
            player?.let {
                items.forEach { item ->
                    it.giveItem(item)
                }
            }
        }
    }
}

val shopSessions = PlayerSessionMap<ShopSession> { ShopSession() }

// 添加商品到购物车
fun addToCart(player: Player, item: ItemStack, price: Double) {
    shopSessions.getOrCreate(player)?.let { session ->
        session.items.add(item)
        session.totalPrice += price
        player.sendMessage("§a已添加到购物车，总价：${session.totalPrice}")
    }
}

// 结算
fun checkout(player: Player) {
    val session = shopSessions.remove(player) ?: return

    if (economy.getBalance(player) >= session.totalPrice) {
        economy.withdraw(player, session.totalPrice)
        session.items.forEach { player.giveItem(it) }
        player.sendMessage("§a购买成功！")
    } else {
        player.sendMessage("§c余额不足！")
        // 退还物品（通过 onSessionRemove 回调）
    }
}
```

## 最佳实践

### 推荐做法

```kotlin
// ✅ 使用工厂函数延迟创建
val sessions = PlayerSessionMap<PlayerData> { uuid ->
    loadFromDatabase(uuid)
}

// ✅ 检查会话存在性
if (player in sessions) {
    val data = sessions[player]
    // 使用数据
}

// ✅ 使用 let 安全调用
sessions[player]?.let { data ->
    data.money += 100
}

// ✅ 实现资源释放回调
class ResourceHolder : PlayerSessionClosable {
    override fun onSessionRemove(uuid: UUID) {
        // 释放资源
    }
}

// ✅ 在 onDisable 中关闭容器
override fun onDisable() {
    sessions.close()
}
```

### 避免的做法

```kotlin
// ❌ 不要假设会话一定存在
val data = sessions[player]!!  // 可能抛出 NPE

// ❌ 不要在离线后访问会话
@EventHandler
fun onQuit(event: PlayerQuitEvent) {
    submit(async = true, delay = 100) {
        // 玩家已离线，会话已被清理
        val data = sessions[event.player]  // 返回 null
    }
}

// ❌ 不要手动使用 HashMap 存储玩家数据
val playerData = HashMap<UUID, PlayerData>()  // 线程不安全，需要手动清理

// ❌ 手动释放模式下忘记调用 remove
val manual = PlayerSessionMap<Data>(manualRelease = true)
// 忘记在合适的时机调用 manual.remove(player) 会导致内存泄漏
```

## 常见问题

### 为什么 getOrCreate 返回 null？

`getOrCreate()` 在以下情况会返回 `null`：

1. 玩家已离线
2. 会话代快速变化导致重试次数耗尽（极少见）

**解决方法：**

```kotlin
// ✅ 检查返回值
val data = playerSessions.getOrCreate(player)
if (data == null) {
    player.sendMessage("§c数据加载失败，请重新登录")
    return
}

// ✅ 使用 let 安全调用
playerSessions.getOrCreate(player)?.let { data ->
    // 使用数据
}
```

### 会话什么时候被清理？

会话在以下情况会被清理：

1. **玩家离线**：触发 `PlayerQuitEvent` 时自动清理（非手动释放模式）
2. **主动移除**：调用 `remove()` 方法
3. **会话替换**：使用 `set()` 覆盖旧会话
4. **容器关闭**：调用 `close()` 或 `clear()`

### 异步任务中访问会话安全吗？

完全安全。PlayerSessionMap 是线程安全的，并且会自动验证会话代：

```kotlin
// ✅ 在异步线程中安全访问
submit(async = true) {
    val data = playerSessions[player]  // 线程安全
    if (data == null) {
        // 玩家已离线或会话已过期
        return@submit
    }

    // 处理数据...
}
```

### 如何在插件卸载时释放资源？

实现 `onDisable()` 方法并调用 `close()`：

```kotlin
override fun onDisable() {
    // 关闭会话容器，触发所有会话的移除回调
    playerSessions.close()
}
```

### 手动释放模式和自动模式的区别？

| 特性 | 自动模式（默认） | 手动释放模式 |
|------|-----------------|-------------|
| 玩家离线时 | 自动清理会话 | 不清理会话 |
| 资源释放 | 自动触发回调 | 需要手动调用 `remove()` |
| 适用场景 | 大多数场景 | 需要延迟保存数据 |
| 内存管理 | 自动回收 | 需要手动管理 |
