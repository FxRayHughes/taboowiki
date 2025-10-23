---
title: 简单数据库
sidebar_position: 2
description: 轻量级玩家键值存储系统，支持缓存优先和数据库优先两种模式，提供 Redis 集成和多表处理能力
---

# 简单数据库

简单数据库（PlayerDatabase）提供轻量级的玩家数据键值存储系统，支持缓存优先和数据库优先两种数据访问模式，内置 Redis 集成和多表处理能力。

## 核心概念

### 两种数据容器

| 容器类型 | 优先级 | 读取策略 | 写入策略 | 适用场景 |
|---------|--------|---------|---------|---------|
| **DataContainer** | 缓存优先 | 从缓存读取 | 写入缓存后异步同步数据库 | 频繁读写、对实时性要求不高 |
| **AutoDataContainer** | 数据库优先 | 定期从数据库同步到缓存 | 直接写入数据库并更新缓存 | 跨服数据共享、需要强一致性 |

### 数据库配置

支持 MySQL 和 SQLite 两种数据库：

```kotlin
// 方式 1：使用配置文件
setupPlayerDatabase(config.getConfigurationSection("database")!!)

// 方式 2：手动配置 MySQL
setupPlayerDatabase(
    host = "localhost",
    port = 3306,
    user = "root",
    password = "password",
    database = "minecraft",
    table = "player_data"
)

// 方式 3：使用 SQLite（默认）
setupPlayerDatabase(File("data.db"))
```

## 基础用法

### 玩家加入时初始化数据

```kotlin
import taboolib.common.platform.event.SubscribeEvent
import taboolib.expansion.*
import taboolib.platform.BukkitPlugin

object DataListener {

    @SubscribeEvent
    fun onJoin(event: PlayerJoinEvent) {
        val player = event.player.cast<ProxyPlayer>()

        // 初始化缓存优先容器
        player.setupDataContainer()

        // 或使用用户名模式
        player.setupDataContainer(usernameMode = true)
    }

    @SubscribeEvent
    fun onQuit(event: PlayerQuitEvent) {
        val player = event.player.cast<ProxyPlayer>()

        // 释放数据容器
        player.releaseDataContainer()
    }
}
```

### 使用 DataContainer（缓存优先）

```kotlin
val container = player.getDataContainer()

// 写入数据（立即保存）
container["coins"] = 1000
container["level"] = 10

// 延迟写入（3 秒后保存到数据库）
container.setDelayed("temp_data", "value", delay = 3L, TimeUnit.SECONDS)

// 读取数据
val coins = container["coins"]?.toIntOrNull() ?: 0
val level = container["level"]?.toIntOrNull() ?: 1

// 获取所有键
val keys = container.keys()

// 获取所有数据
val allData = container.values()

// 强制保存指定键
container.save("coins")

// 删除数据
container["old_key"] = ""  // 设置为空字符串会自动删除
```

**特性：**
- 写入立即更新缓存，异步同步数据库
- 每秒自动检查并保存延迟写入的数据
- 空字符串自动触发删除操作

### 使用 AutoDataContainer（数据库优先）

```kotlin
val autoContainer = player.uniqueId.getAutoDataContainer()

// 写入数据（穿透缓存直接写数据库）
autoContainer["coins"] = 2000
autoContainer["vip_level"] = 3

// 读取数据（从缓存读取）
val coins = autoContainer["coins"]?.toIntOrNull() ?: 0

// 手动触发数据库同步
autoContainer.update()

// 释放容器
player.uniqueId.releaseAutoDataContainer()
```

**特性：**
- 写入操作穿透缓存直接写入数据库
- 每 4 秒（80 ticks）自动从数据库同步到缓存
- 适合跨服数据共享场景

:::tip[同步间隔调整]

可通过修改 `AutoDataContainer.syncTick` 调整同步间隔（单位：ticks）。

:::

## MultipleHandler - 多表处理器

用于管理多个数据表或多套数据源：

```kotlin
// 初始化多表处理器
val handler = MultipleHandler(
    conf = config.getConfigurationSection("database")!!,
    table = "custom_table",
    autoHook = true,  // 自动监听玩家登录/退出
    syncTick = 100L   // AutoDataContainer 同步间隔
)

// 为任意标识符创建数据容器（不限于玩家 UUID）
val container = handler.setupDataContainer("custom_user_001")

// 获取数据容器
val data = handler.getDataContainer("custom_user_001")
data["points"] = 500

// 获取 AutoDataContainer
val autoData = handler.getAutoDataContainer("custom_user_002")
autoData["rank"] = "VIP"

// 释放容器
handler.removeDataContainer("custom_user_001")
handler.removeAutoDataContainer("custom_user_002")
handler.removeContainer("custom_user_003")  // 同时释放两种容器

// 手动触发所有 AutoDataContainer 更新
handler.updateAutoDataContainer()

// 停止/重启自动同步
handler.stopSync()
handler.restartSync()
```

**参数说明：**

| 参数 | 类型 | 默认值 | 说明 |
|-----|------|--------|------|
| `conf` | ConfigurationSection | 必填 | 数据库配置 |
| `table` | String | 插件 ID | 数据表名 |
| `flags` | List\<String\> | `emptyList()` | 数据库连接参数 |
| `clearFlags` | Boolean | `false` | 是否清除默认连接参数 |
| `ssl` | String? | `null` | SSL 模式 |
| `dataFile` | String | `"data.db"` | SQLite 文件名 |
| `autoHook` | Boolean | `false` | 自动监听玩家登录/退出事件 |
| `syncTick` | Long | `80L` | AutoDataContainer 同步间隔 |

## Redis 集成

### RedisDataContainer（需要 EXPANSION_PLAYER_DATABASE_REDIS 模块）

```kotlin
import taboolib.expansion.RedisDataContainer
import taboolib.expansion.RedisDatabaseHandler

// 初始化 Redis 处理器
val redis = RedisDatabaseHandler(
    host = "localhost",
    port = 6379,
    password = "redis_password"
)

// 创建 Redis 数据容器
val redisContainer = RedisDataContainer(
    user = player.uniqueId.toString(),
    database = playerDatabase!!,
    redis = redis
)

// 读取数据（优先从 Redis 缓存读取）
val value = redisContainer["cache_key"]

// 写入数据（删除 Redis 缓存并写入数据库）
redisContainer["cache_key"] = "new_value"

// 设置临时缓存（不写入数据库）
redisContainer.setDelayed("temp_key", "temp_value", delay = 60L, TimeUnit.SECONDS)
```

**工作原理：**

1. **读取**：先查 Redis 缓存 → 若无则从数据库读取并缓存 30 分钟
2. **写入**：删除 Redis 缓存并直接写入数据库
3. **临时数据**：仅存储在 Redis 中，到期自动删除

**配置缓存时长：**

```kotlin
RedisDataContainer.REDIS_SECONDS = 3600L  // 缓存 1 小时
RedisDataContainer.REDIS_TIMEOUT = TimeUnit.SECONDS
```

## 实际应用示例

### 玩家经济系统

```kotlin
object EconomySystem {

    fun addCoins(player: ProxyPlayer, amount: Int) {
        val container = player.getDataContainer()
        val current = container["coins"]?.toIntOrNull() ?: 0
        container["coins"] = current + amount
    }

    fun getCoins(player: ProxyPlayer): Int {
        val container = player.getDataContainer()
        return container["coins"]?.toIntOrNull() ?: 0
    }

    fun hasEnough(player: ProxyPlayer, amount: Int): Boolean {
        return getCoins(player) >= amount
    }
}
```

### 跨服数据共享

```kotlin
object CrossServerData {

    fun saveRank(player: ProxyPlayer, rank: String) {
        // 使用 AutoDataContainer 确保立即写入数据库
        val container = player.uniqueId.getAutoDataContainer()
        container["rank"] = rank
        container["last_update"] = System.currentTimeMillis().toString()
    }

    fun getRank(player: ProxyPlayer): String {
        val container = player.uniqueId.getAutoDataContainer()
        return container["rank"] ?: "MEMBER"
    }
}
```

### 自定义数据表管理

```kotlin
object CustomDataManager {

    private lateinit var guildHandler: MultipleHandler
    private lateinit var marketHandler: MultipleHandler

    fun initialize(config: Configuration) {
        // 公会数据表
        guildHandler = MultipleHandler(
            conf = config.getConfigurationSection("database")!!,
            table = "guild_data",
            autoHook = false
        )

        // 市场数据表
        marketHandler = MultipleHandler(
            conf = config.getConfigurationSection("database")!!,
            table = "market_data",
            autoHook = false
        )
    }

    fun setGuildData(guildId: String, key: String, value: String) {
        val container = guildHandler.setupDataContainer(guildId)
        container[key] = value
    }

    fun getGuildData(guildId: String, key: String): String? {
        return guildHandler.getDataContainer(guildId)[key]
    }
}
```

### 临时数据缓存（Redis）

```kotlin
object CacheManager {

    fun setCooldown(player: ProxyPlayer, action: String, seconds: Long) {
        val container = player.getDataContainer()
        container.setDelayed(
            key = "cooldown_$action",
            value = System.currentTimeMillis().toString(),
            delay = seconds,
            timeUnit = TimeUnit.SECONDS
        )
    }

    fun hasCooldown(player: ProxyPlayer, action: String): Boolean {
        val container = player.getDataContainer()
        val timestamp = container["cooldown_$action"]?.toLongOrNull() ?: return false
        return System.currentTimeMillis() < timestamp
    }
}
```

## 配置文件示例

### MySQL 配置

```yaml
database:
  enable: true
  host: localhost
  port: 3306
  user: root
  password: your_password
  database: minecraft
  table: player_data
```

### SQLite 配置

```yaml
database:
  enable: false
```

## 常见问题

### DataContainer 和 AutoDataContainer 如何选择？

- **DataContainer**：适合频繁读写的玩家数据（经验、金币、临时状态）
- **AutoDataContainer**：适合跨服共享数据（等级、VIP 状态、全局排名）

### 数据什么时候同步到数据库？

- **DataContainer**：立即写入缓存，异步保存到数据库；`setDelayed()` 延迟保存
- **AutoDataContainer**：`set()` 操作立即写入数据库并更新缓存

### 如何确保数据不丢失？

在玩家退出时调用 `releaseDataContainer()`，系统会确保所有待保存数据完成写入。

### 能否在非玩家场景使用？

可以，使用 `UUID` 或 `MultipleHandler` 配合自定义标识符：

```kotlin
val customUUID = UUID.randomUUID()
customUUID.setupPlayerDataContainer()
val container = customUUID.getPlayerDataContainer()
```

### Redis 缓存失效后会发生什么？

缓存失效后下次读取会自动从数据库重新加载并缓存。

### MultipleHandler 的 autoHook 如何工作？

启用 `autoHook = true` 后，系统会自动监听玩家登录创建容器、退出释放容器，标识符为玩家 UUID 字符串。
