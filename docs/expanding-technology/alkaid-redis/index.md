# Alkaid Redis工具

Alkaid Redis是一个基于Jedis的Redis客户端封装模块，提供了简洁的API和强大的功能支持。

## 依赖配置

在你的 `build.gradle.kts` 中添加：

```kotlin
taboolib {
    subproject = true
    install("database-alkaid-redis")
    // 如果需要高级缓存工具
    install("database-alkaid-redis-tool")
}
```

模块运行时依赖：
- Jedis 4.2.3
- slf4j-api
- commons-pool2
- fastjson2
- gson

## 基础使用

### 单机模式

#### 创建连接

```kotlin
val redis = AlkaidRedis.create()
    .host("localhost")
    .port(6379)
    .pass("password")
    .connect(32)              // 连接池大小，默认32
    .timeout(1000)            // 超时时间(ms)，默认1000
    .reconnectDelay(1000L)    // 重连延迟(ms)，默认1000
    .connection()
```

#### 从配置文件加载

```kotlin
val config = conf.getConfigurationSection("redis")!!
val redis = AlkaidRedis.create()
    .fromConfig(config)
    .connection()
```

配置文件示例（config.yml）：

```yaml
redis:
  host: localhost
  port: 6379
  password: your_password
  connect: 32
  timeout: 1000
```

#### 便捷创建方式

```kotlin
val redis = AlkaidRedis.createDefault {
    host("localhost")
    port(6379)
    pass("password")
}
```

### 集群模式

```kotlin
val cluster = AlkaidRedis.linkCluster {
    addNode("192.168.1.1:6379")
    addNode("192.168.1.2:6379")
    addNode("192.168.1.3:6379")
    pass("password")
    connect(32)
    timeout(1000)
    maxAttempts(20)           // 最大重试次数，默认20
    clientName("my-cluster")  // 客户端名称
}.build()
```

**注意**：Redis集群至少需要3个主节点才能正常工作。

## 核心功能

### 基本操作

```kotlin
// 设置值
redis.set("key", "value")
redis.setEx("key", "value", 60) // 设置并指定过期时间(秒)
redis.setNx("key", "value")     // 仅当key不存在时设置

// 获取值
val value = redis.get("key")

// 删除
redis.delete("key")

// 设置过期时间
redis.expire("key", 60)

// 检查key是否存在
if (redis.contains("key")) {
    // ...
}
```

### Set集合操作

```kotlin
// 添加元素
redis.sadd("myset", "value1", "value2", "value3")

// 移除元素
redis.srem("myset", "value1")

// 获取集合大小
val size = redis.scard("myset")

// 获取所有成员
val members = redis.smembers("myset")

// 检查是否是集合成员
if (redis.sismember("myset", "value2")) {
    // ...
}
```

### 发布订阅

#### 发布消息

```kotlin
redis.publish("channel", "Hello World")
```

#### 订阅消息

```kotlin
// 普通订阅
redis.subscribe("channel") { message ->
    println("收到消息: ${message.message}")
    println("频道: ${message.channel}")

    // 可以使用FastJSON反序列化
    val data = message.deserialize<MyData>()

    // 取消订阅
    // message.close()
}

// 模式订阅（支持通配符）
redis.subscribe("user:*", pattern = true) { message ->
    println("模式匹配: ${message.channel}")
    println("消息: ${message.message}")
}
```

#### 实战示例：跨服消息通信

```kotlin
data class PlayerMessage(
    val playerName: String,
    val action: String,
    val data: Map<String, Any>
)

// 服务器A：发布玩家传送消息
redis.publish("server:events", PlayerMessage(
    playerName = "Steve",
    action = "teleport",
    data = mapOf("target" to "server-2")
).toJson())

// 服务器B：监听并处理
redis.subscribe("server:events") { message ->
    val event = message.deserialize<PlayerMessage>()
    when (event.action) {
        "teleport" -> handlePlayerTeleport(event)
        else -> {}
    }
}
```

### Lua脚本执行

```kotlin
val script = """
    local current = redis.call('get', KEYS[1])
    if current then
        return redis.call('incr', KEYS[1])
    else
        redis.call('set', KEYS[1], ARGV[1])
        return ARGV[1]
    end
""".trimIndent()

val result = redis.eval(script, listOf("counter"), listOf("1"))
```

## 分布式锁

Alkaid Redis提供了基于Lua脚本的分布式锁实现，支持自动续期（看门狗机制）。

### 基本使用

```kotlin
val lock = redis.getLock("my-lock")

// 尝试获取锁
if (lock.tryLock()) {
    try {
        // 执行业务逻辑
        performCriticalOperation()
    } finally {
        // 释放锁
        lock.unlock()
    }
}
```

### 看门狗机制

锁默认租约时间为30秒，看门狗会每20 ticks（1秒）自动续期，防止业务执行时间过长导致锁被释放。

```kotlin
val lock = redis.getLock("resource-lock")
lock.tryLock()

// 长时间操作，看门狗会自动续期
Thread.sleep(60000) // 60秒

lock.unlock() // 完成后释放
```

### 实战示例：防止重复执行

```kotlin
@Awake(LifeCycle.ENABLE)
object DailyTask {

    val redis = AlkaidRedis.createDefault { /* ... */ }

    fun executeDailyReset() {
        val lock = redis.getLock("daily-reset-lock")

        // 使用锁确保集群中只有一个服务器执行重置
        if (lock.tryLock()) {
            try {
                println("开始执行每日重置...")
                resetPlayerData()
                resetRankings()
                println("每日重置完成")
            } finally {
                lock.unlock()
            }
        } else {
            println("其他服务器正在执行重置，跳过")
        }
    }
}
```

### 锁的注意事项

- 始终在 `finally` 块中释放锁
- 避免在锁内执行耗时的I/O操作
- 锁默认租约30秒，看门狗每20 ticks续期一次
- 确保业务逻辑不会导致死锁

## RedisCache工具（高级）

`database-alkaid-redis-tool` 模块提供了更高级的缓存工具类，支持对象序列化和本地回退。

### 安装

```kotlin
taboolib {
    install("database-alkaid-redis-tool")
}
```

### 初始化

```kotlin
// 从配置文件初始化
RedisCache.link(config.getConfigurationSection("redis")!!)
```

### 基本操作

```kotlin
// 字符串缓存
RedisCache.set("key", "value")
val value = RedisCache.get("key")

// 设置过期时间
RedisCache.setEx("session:123", "data", 3600L) // 1小时后过期
RedisCache.setExpire("key", 60L) // 设置已存在key的过期时间

// 删除
RedisCache.del("key")
RedisCache.delPrefix("user:*") // 删除指定前缀的所有key
```

### 对象缓存

RedisCache使用Jackson-Kotlin进行对象序列化，支持Kotlin数据类。

```kotlin
data class PlayerData(
    val name: String,
    val level: Int,
    val coins: Double
)

// 保存对象
val player = PlayerData("Steve", 50, 1000.0)
RedisCache.setCacheObject("player:steve", player)

// 读取对象
val cached = RedisCache.getObject<PlayerData>("player:steve")
println(cached?.name) // "Steve"
```

### 本地回退机制

当Redis连接失败或不可用时，RedisCache会自动回退到本地 `ConcurrentHashMap` 缓存，确保业务不中断。

```kotlin
// 即使Redis不可用，这些操作也能正常工作
RedisCache.set("temp", "value")
val value = RedisCache.get("temp") // 从本地缓存读取
```

本地缓存会每60秒自动清理过期数据。

### 实战示例：玩家数据缓存

```kotlin
object PlayerCache {

    data class CachedPlayer(
        val uuid: String,
        val name: String,
        val lastSeen: Long,
        val statistics: Map<String, Int>
    )

    // 缓存玩家数据（5分钟过期）
    fun cachePlayer(player: Player) {
        val data = CachedPlayer(
            uuid = player.uniqueId.toString(),
            name = player.name,
            lastSeen = System.currentTimeMillis(),
            statistics = getPlayerStats(player)
        )
        RedisCache.setCacheObject("player:${player.name}", data, 300L)
    }

    // 获取缓存的玩家数据
    fun getCachedPlayer(name: String): CachedPlayer? {
        return RedisCache.getObject<CachedPlayer>("player:$name")
    }

    // 清除玩家缓存
    fun clearPlayerCache(name: String) {
        RedisCache.del("player:$name")
    }

    // 清除所有玩家缓存
    fun clearAllPlayers() {
        RedisCache.delPrefix("player:*")
    }
}
```

## 自动重连机制

Alkaid Redis内置了自动重连机制。当连接失败时，会自动尝试重连，无需手动处理。

```kotlin
val redis = AlkaidRedis.create()
    .host("localhost")
    .reconnectDelay(1000L) // 重连延迟1秒
    .connection()

// 即使Redis暂时不可用，操作会在重连后自动重试
redis.set("key", "value")
```

重连失败时会在控制台输出错误信息：
```
Redis connection failed: Connection refused
```

## 完整示例

### 示例1：全局Redis管理器

```kotlin
@Awake(LifeCycle.ENABLE)
object RedisManager {

    lateinit var redis: SingleRedisConnection

    fun init(config: ConfigurationSection) {
        redis = AlkaidRedis.create()
            .fromConfig(config)
            .connection()

        println("Redis连接已建立")
    }

    fun publish(channel: String, message: Any) {
        redis.publish(channel, message.toJson())
    }

    fun subscribe(channel: String, handler: (String) -> Unit) {
        redis.subscribe(channel) { msg ->
            handler(msg.message)
        }
    }
}

// 在主类中初始化
@Awake(LifeCycle.ENABLE)
object ExamplePlugin {

    val conf = Config.loadFromFile(File(plugin.dataFolder, "config.yml"))

    fun enable() {
        RedisManager.init(conf.getConfigurationSection("redis")!!)
    }
}
```

### 示例2：跨服玩家数据同步

```kotlin
object CrossServerSync {

    data class PlayerUpdate(
        val server: String,
        val player: String,
        val type: String,
        val data: Map<String, Any>
    )

    val redis = AlkaidRedis.createDefault { /* ... */ }

    // 启动监听
    fun startListening() {
        redis.subscribe("player:updates") { message ->
            val update = message.deserialize<PlayerUpdate>()
            handleUpdate(update)
        }
    }

    // 发布更新
    fun publishUpdate(player: Player, type: String, data: Map<String, Any>) {
        redis.publish("player:updates", PlayerUpdate(
            server = serverName,
            player = player.name,
            type = type,
            data = data
        ).toJson())
    }

    private fun handleUpdate(update: PlayerUpdate) {
        when (update.type) {
            "coins" -> updatePlayerCoins(update.player, update.data["amount"] as Double)
            "level" -> updatePlayerLevel(update.player, update.data["level"] as Int)
        }
    }
}
```

### 示例3：分布式速率限制

```kotlin
object RateLimiter {

    val redis = AlkaidRedis.createDefault { /* ... */ }

    // 检查是否超过速率限制（每分钟最多10次）
    fun checkLimit(player: Player, action: String): Boolean {
        val key = "ratelimit:${player.name}:$action"
        val current = redis.get(key)?.toIntOrNull() ?: 0

        if (current >= 10) {
            return false // 超过限制
        }

        if (current == 0) {
            redis.setEx(key, "1", 60) // 首次，设置60秒过期
        } else {
            redis.set(key, (current + 1).toString())
        }

        return true
    }

    // 使用示例
    fun onPlayerCommand(player: Player) {
        if (!checkLimit(player, "command")) {
            player.sendMessage("操作过于频繁，请稍后再试")
            return
        }

        // 执行命令
    }
}
```

## 最佳实践

1. **连接管理**
   - 使用单例模式管理Redis连接
   - 合理设置连接池大小（默认32）
   - 配置适当的超时时间

2. **错误处理**
   - 利用自动重连机制，无需手动捕获连接异常
   - 对于关键操作，使用分布式锁保证一致性

3. **性能优化**
   - 使用 `setEx` 代替 `set + expire` 组合
   - 批量操作使用Lua脚本减少网络往返
   - 合理设置key过期时间，避免内存溢出

4. **集群模式**
   - 确保至少3个主节点
   - 使用hash tag确保相关key在同一节点：`{user:123}:profile`
   - 避免跨节点的multi/exec操作

5. **安全性**
   - 始终配置密码认证
   - 不要在Redis中存储敏感明文数据
   - 定期检查key的过期策略
