---
title: Kotlinx 序列化
sidebar_label: Kotlinx 序列化
sidebar_position: 4
description: 使用 Kotlinx Serialization 进行数据序列化与反序列化
---

# Kotlinx 序列化

## 基本概念

Kotlinx Serialization 是 Kotlin 官方提供的一个序列化与反序列化库，具有以下特点：

**核心特点：**
- 编译时类型安全
- 支持多种格式（JSON、Protobuf、YAML、CBOR 等）
- 零反射，性能优异
- 与 Kotlin 语言特性深度集成
- 支持自定义序列化器

**支持的格式：**
- JSON - 最常用的数据交换格式
- ProtoBuf - 高效的二进制格式
- CBOR - 简洁的二进制对象表示
- Properties - Java 属性文件格式
- YAML - 人类可读的配置格式

## 引入依赖

### Gradle 配置

Kotlinx Serialization 需要引入编译器插件和运行时库：

```kotlin title="build.gradle.kts" showLineNumbers
plugins {
    id("org.jetbrains.kotlin.jvm") version "1.9.22"
    kotlin("plugin.serialization") version "1.9.22"  // 序列化插件
}

dependencies {
    // 核心库
    compileOnly("org.jetbrains.kotlinx:kotlinx-serialization-core-jvm:1.6.3") {
        isTransitive = false
    }
    // JSON 支持
    compileOnly("org.jetbrains.kotlinx:kotlinx-serialization-json-jvm:1.6.3") {
        isTransitive = false
    }
}
```

**关键点：**
- `plugin.serialization` 插件版本需要与 Kotlin 版本一致
- 设置 `isTransitive = false` 避免依赖冲突

### 使用 RuntimeDependency 动态加载

在 TabooLib 插件中，推荐使用动态依赖加载：

```kotlin title="YourPlugin.kt" showLineNumbers
@file:RuntimeDependencies(
    RuntimeDependency(
        value = "org.jetbrains.kotlinx:kotlinx-serialization-core-jvm:1.6.3",
        test = "!kotlinx.serialization.Serializer",
        relocate = [
            "!kotlin.", "!kotlin1922.",
            "!kotlinx.serialization.", "!kotlinx.serialization163."
        ],
        transitive = false
    ),
    RuntimeDependency(
        value = "org.jetbrains.kotlinx:kotlinx-serialization-json-jvm:1.6.3",
        test = "!kotlinx.serialization.json.Json",
        relocate = [
            "!kotlin.", "!kotlin1922.",
            "!kotlinx.serialization.", "!kotlinx.serialization163."
        ],
        transitive = false
    )
)

package your.plugin.name

import taboolib.common.env.RuntimeDependencies
import taboolib.common.env.RuntimeDependency
```

**代码说明：**
- `test`：检测类，用于判断依赖是否已加载
- `relocate`：重定向包名，避免版本冲突
- `transitive = false`：不下载传递依赖

:::warning[重要提示]

需要在项目的 `build.gradle.kts` 中配置包重定向：

```kotlin
relocate("kotlinx.serialization", "kotlinx.serialization163")
```

:::

## 数据类定义

### 基础用法

使用 `@Serializable` 注解标记可序列化的数据类：

```kotlin title="BasicExample.kt" showLineNumbers
import kotlinx.serialization.Serializable

@Serializable
data class User(
    val name: String,
    val age: Int,
    val email: String
)

@Serializable
data class PlayerData(
    val uuid: String,
    val level: Int,
    val coins: Double,
    val items: List<String>
)
```

**支持的基本类型：**
- 基础类型：`Int`、`Long`、`Double`、`Float`、`Boolean`、`String`
- 集合类型：`List`、`Set`、`Map`
- 可空类型：`String?`、`Int?` 等
- 枚举类型

### 自定义序列化器

对于非基本类型（如 `UUID`、`ItemStack` 等），需要自定义序列化器：

```kotlin title="UUIDSerializer.kt" showLineNumbers
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import java.util.UUID

object UUIDSerializer : KSerializer<UUID> {

    override val descriptor: SerialDescriptor =
        PrimitiveSerialDescriptor("java.util.UUID", PrimitiveKind.STRING)

    override fun deserialize(decoder: Decoder): UUID {
        return UUID.fromString(decoder.decodeString())
    }

    override fun serialize(encoder: Encoder, value: UUID) {
        encoder.encodeString(value.toString())
    }
}
```

**在数据类中使用自定义序列化器：**

```kotlin title="PlayerSaveData.kt" showLineNumbers
import kotlinx.serialization.Serializable
import java.util.UUID

@Serializable
data class PlayerSaveData(
    @Serializable(with = UUIDSerializer::class)
    val uuid: UUID,

    val level: Int,
    val exp: Long,

    @Serializable(with = ItemStackMapSerializer::class)
    val inventory: Map<Int, ItemStack?>
)
```

**代码说明：**
- 在字段上使用 `@Serializable(with = YourSerializer::class)` 指定序列化器
- 序列化器必须实现 `KSerializer<T>` 接口

## JSON 序列化

### 创建 JSON 实例

配置 JSON 序列化器的行为：

```kotlin title="JsonConfig.kt" showLineNumbers
import kotlinx.serialization.json.Json

val json = Json {
    // 格式化输出（美化 JSON）
    prettyPrint = true

    // 宽松模式（允许不标准的 JSON）
    isLenient = true

    // 忽略未知的键（反序列化时）
    ignoreUnknownKeys = true

    // 强制输入值（将 null 转为默认值）
    coerceInputValues = true

    // 编码默认值
    encodeDefaults = true

    // 允许结构化的 Map 键
    allowStructuredMapKeys = true

    // 允许特殊浮点值（NaN、Infinity）
    allowSpecialFloatingPointValues = true
}
```

**配置参数说明：**

| 参数 | 默认值 | 说明 |
|-----|--------|------|
| `prettyPrint` | `false` | 是否格式化输出 JSON |
| `isLenient` | `false` | 是否允许不标准的 JSON 格式 |
| `ignoreUnknownKeys` | `false` | 反序列化时忽略未知字段 |
| `coerceInputValues` | `false` | 将无效值转换为默认值 |
| `encodeDefaults` | `true` | 是否编码默认值 |
| `allowStructuredMapKeys` | `false` | 允许复杂对象作为 Map 的键 |
| `allowSpecialFloatingPointValues` | `false` | 允许 NaN 和 Infinity |

### 序列化（对象 → JSON 字符串）

```kotlin title="Serialize.kt" showLineNumbers
import kotlinx.serialization.encodeToString

val user = User("Steve", 18, "steve@example.com")

// 序列化为 JSON 字符串
val jsonString = json.encodeToString(user)
println(jsonString)

// 输出:
// {
//     "name": "Steve",
//     "age": 18,
//     "email": "steve@example.com"
// }
```

**使用 serializer()：**

```kotlin
val playerData = PlayerSaveData(/* ... */)

// 显式指定序列化器
val jsonString = json.encodeToString(
    PlayerSaveData.serializer(),
    playerData
)
```

### 反序列化（JSON 字符串 → 对象）

```kotlin title="Deserialize.kt" showLineNumbers
import kotlinx.serialization.decodeFromString

val jsonString = """
    {
        "name": "Steve",
        "age": 18,
        "email": "steve@example.com"
    }
"""

// 反序列化为对象
val user = json.decodeFromString<User>(jsonString)
println(user.name)  // 输出: Steve
```

**使用 serializer()：**

```kotlin
val jsonString = """{"uuid": "...", "level": 10}"""

// 显式指定序列化器
val playerData = json.decodeFromString(
    PlayerSaveData.serializer(),
    jsonString
)
```

**处理可能为空的 JSON：**

```kotlin
val data = json.decodeFromString<PlayerSaveData>(
    jsonString ?: "{}"  // 提供默认值
)
```

## 自定义序列化器示例

### 示例 1：UUID 序列化器

```kotlin title="UUIDSerializer.kt" showLineNumbers
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import java.util.UUID

object UUIDSerializer : KSerializer<UUID> {

    override val descriptor: SerialDescriptor =
        PrimitiveSerialDescriptor("java.util.UUID", PrimitiveKind.STRING)

    override fun deserialize(decoder: Decoder): UUID {
        return UUID.fromString(decoder.decodeString())
    }

    override fun serialize(encoder: Encoder, value: UUID) {
        encoder.encodeString(value.toString())
    }
}
```

### 示例 2：ItemStack 序列化器

```kotlin title="ItemStackSerializer.kt" showLineNumbers
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.*
import kotlinx.serialization.encoding.*
import org.bukkit.inventory.ItemStack
import taboolib.module.nms.MinecraftVersion
import taboolib.module.nms.nmsProxy

object ItemStackSerializer : KSerializer<ItemStack> {

    override val descriptor: SerialDescriptor =
        PrimitiveSerialDescriptor("org.bukkit.inventory.ItemStack", PrimitiveKind.STRING)

    override fun deserialize(decoder: Decoder): ItemStack {
        val base64 = decoder.decodeString()
        return nmsProxy<NMSItem>().loadItem(base64)
    }

    override fun serialize(encoder: Encoder, value: ItemStack) {
        val base64 = nmsProxy<NMSItem>().saveItem(value)
        encoder.encodeString(base64)
    }
}

// 使用
@Serializable
data class PlayerInventory(
    @Serializable(with = ItemStackSerializer::class)
    val helmet: ItemStack?,

    @Serializable(with = ItemStackSerializer::class)
    val chestplate: ItemStack?,

    val items: Map<Int, @Serializable(with = ItemStackSerializer::class) ItemStack?>
)
```

### 示例 3：Location 序列化器

```kotlin title="LocationSerializer.kt" showLineNumbers
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.*
import kotlinx.serialization.encoding.*
import org.bukkit.Bukkit
import org.bukkit.Location

object LocationSerializer : KSerializer<Location> {

    override val descriptor: SerialDescriptor = buildClassSerialDescriptor("org.bukkit.Location") {
        element<String>("world")
        element<Double>("x")
        element<Double>("y")
        element<Double>("z")
        element<Float>("yaw")
        element<Float>("pitch")
    }

    override fun deserialize(decoder: Decoder): Location {
        return decoder.decodeStructure(descriptor) {
            var world = ""
            var x = 0.0
            var y = 0.0
            var z = 0.0
            var yaw = 0f
            var pitch = 0f

            while (true) {
                when (val index = decodeElementIndex(descriptor)) {
                    0 -> world = decodeStringElement(descriptor, 0)
                    1 -> x = decodeDoubleElement(descriptor, 1)
                    2 -> y = decodeDoubleElement(descriptor, 2)
                    3 -> z = decodeDoubleElement(descriptor, 3)
                    4 -> yaw = decodeFloatElement(descriptor, 4)
                    5 -> pitch = decodeFloatElement(descriptor, 5)
                    CompositeDecoder.DECODE_DONE -> break
                    else -> error("Unexpected index: $index")
                }
            }

            Location(Bukkit.getWorld(world), x, y, z, yaw, pitch)
        }
    }

    override fun serialize(encoder: Encoder, value: Location) {
        encoder.encodeStructure(descriptor) {
            encodeStringElement(descriptor, 0, value.world?.name ?: "world")
            encodeDoubleElement(descriptor, 1, value.x)
            encodeDoubleElement(descriptor, 2, value.y)
            encodeDoubleElement(descriptor, 3, value.z)
            encodeFloatElement(descriptor, 4, value.yaw)
            encodeFloatElement(descriptor, 5, value.pitch)
        }
    }
}
```

## 最佳实践示例

### 场景 1：玩家数据保存系统

实现一个完整的玩家数据序列化系统：

```kotlin title="PlayerDataSystem.kt" showLineNumbers
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import java.io.File
import java.util.UUID

// JSON 配置
val json = Json {
    prettyPrint = true
    ignoreUnknownKeys = true
    encodeDefaults = true
}

// 玩家数据类
@Serializable
data class PlayerData(
    @Serializable(with = UUIDSerializer::class)
    val uuid: UUID,

    val name: String,
    val level: Int = 1,
    val exp: Long = 0,
    val coins: Double = 0.0,

    @Serializable(with = LocationSerializer::class)
    val lastLocation: Location? = null,

    val inventory: Map<Int, @Serializable(with = ItemStackSerializer::class) ItemStack?> = emptyMap()
)

object PlayerDataManager {

    private val dataFolder = File("plugins/MyPlugin/playerdata")

    init {
        dataFolder.mkdirs()
    }

    /**
     * 保存玩家数据
     */
    fun save(player: Player) {
        val data = PlayerData(
            uuid = player.uniqueId,
            name = player.name,
            level = player.level,
            exp = player.totalExperience.toLong(),
            coins = EconomyAPI.getCoins(player),
            lastLocation = player.location,
            inventory = player.inventory.contents
                .mapIndexed { index, item -> index to item }
                .toMap()
        )

        val file = File(dataFolder, "${player.uniqueId}.json")
        file.writeText(json.encodeToString(data))
    }

    /**
     * 加载玩家数据
     */
    fun load(uuid: UUID): PlayerData? {
        val file = File(dataFolder, "$uuid.json")
        if (!file.exists()) return null

        return try {
            json.decodeFromString<PlayerData>(file.readText())
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * 应用数据到玩家
     */
    fun apply(player: Player, data: PlayerData) {
        player.level = data.level
        player.totalExperience = data.exp.toInt()
        EconomyAPI.setCoins(player, data.coins)

        data.lastLocation?.let { player.teleport(it) }

        player.inventory.clear()
        data.inventory.forEach { (slot, item) ->
            if (item != null) {
                player.inventory.setItem(slot, item)
            }
        }
    }
}

// 使用示例
@SubscribeEvent
fun onPlayerJoin(e: PlayerJoinEvent) {
    val data = PlayerDataManager.load(e.player.uniqueId)
    data?.let { PlayerDataManager.apply(e.player, it) }
}

@SubscribeEvent
fun onPlayerQuit(e: PlayerQuitEvent) {
    PlayerDataManager.save(e.player)
}
```

### 场景 2：配置文件序列化

使用 Kotlinx Serialization 管理配置：

```kotlin title="ConfigManager.kt" showLineNumbers
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import java.io.File

@Serializable
data class PluginConfig(
    val serverName: String = "我的服务器",
    val maxPlayers: Int = 100,
    val enablePVP: Boolean = true,
    val spawnLocation: @Serializable(with = LocationSerializer::class) Location? = null,
    val messages: Messages = Messages()
)

@Serializable
data class Messages(
    val welcome: String = "欢迎来到服务器！",
    val farewell: String = "期待下次见面！",
    val levelUp: String = "恭喜升级到 {level} 级！"
)

object ConfigManager {

    private val json = Json {
        prettyPrint = true
        encodeDefaults = true
        ignoreUnknownKeys = true
    }

    private val configFile = File("plugins/MyPlugin/config.json")
    var config: PluginConfig = PluginConfig()
        private set

    fun load() {
        if (!configFile.exists()) {
            save()  // 生成默认配置
            return
        }

        config = try {
            json.decodeFromString<PluginConfig>(configFile.readText())
        } catch (e: Exception) {
            e.printStackTrace()
            PluginConfig()
        }
    }

    fun save() {
        configFile.parentFile.mkdirs()
        configFile.writeText(json.encodeToString(config))
    }

    fun reload() {
        load()
    }
}

// 使用
ConfigManager.load()
println(ConfigManager.config.serverName)
```

### 场景 3：网络数据传输

序列化数据用于网络传输：

```kotlin title="NetworkData.kt" showLineNumbers
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json

@Serializable
data class NetworkPacket(
    val type: String,
    val timestamp: Long = System.currentTimeMillis(),
    val data: Map<String, String>
)

@Serializable
data class PlayerSyncData(
    @Serializable(with = UUIDSerializer::class)
    val uuid: UUID,
    val health: Double,
    val food: Int,
    val position: @Serializable(with = LocationSerializer::class) Location
)

object NetworkManager {

    private val json = Json {
        ignoreUnknownKeys = true
    }

    /**
     * 发送数据包
     */
    fun sendPacket(channel: String, packet: NetworkPacket) {
        val jsonString = json.encodeToString(packet)
        // 通过网络发送 jsonString
        sendToChannel(channel, jsonString)
    }

    /**
     * 接收数据包
     */
    fun receivePacket(jsonString: String): NetworkPacket? {
        return try {
            json.decodeFromString<NetworkPacket>(jsonString)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    /**
     * 同步玩家数据到其他服务器
     */
    fun syncPlayer(player: Player) {
        val syncData = PlayerSyncData(
            uuid = player.uniqueId,
            health = player.health,
            food = player.foodLevel,
            position = player.location
        )

        val packet = NetworkPacket(
            type = "player_sync",
            data = mapOf("payload" to json.encodeToString(syncData))
        )

        sendPacket("player-sync", packet)
    }
}
```

## 常见问题

### 如何处理可空类型？

```kotlin
@Serializable
data class User(
    val name: String,
    val email: String? = null,  // 可空，有默认值
    val phone: String?          // 可空，无默认值
)

// 序列化时，null 值的处理取决于 encodeDefaults 配置
val json = Json { encodeDefaults = true }  // 会编码 null
```

### 如何序列化枚举类型？

```kotlin
enum class PlayerRole {
    ADMIN, MODERATOR, PLAYER
}

@Serializable
data class User(
    val name: String,
    val role: PlayerRole = PlayerRole.PLAYER  // 枚举类型自动支持
)

// 序列化结果
// {"name": "Steve", "role": "PLAYER"}
```

### 如何处理继承关系？

使用 `@Polymorphic` 和 `@SerialName`：

```kotlin
import kotlinx.serialization.Polymorphic
import kotlinx.serialization.SerialName

@Serializable
sealed class Message {
    @Serializable
    @SerialName("text")
    data class TextMessage(val content: String) : Message()

    @Serializable
    @SerialName("image")
    data class ImageMessage(val url: String) : Message()
}

@Serializable
data class Chat(
    val messages: List<Message>
)
```

### 序列化失败怎么处理？

```kotlin
// 方式 1：try-catch
try {
    val data = json.decodeFromString<PlayerData>(jsonString)
} catch (e: kotlinx.serialization.SerializationException) {
    println("序列化错误: ${e.message}")
}

// 方式 2：使用 ignoreUnknownKeys
val json = Json {
    ignoreUnknownKeys = true  // 忽略未知字段
    coerceInputValues = true  // 将无效值转为默认值
}
```

### 如何优化性能？

**1. 复用 JSON 实例**

```kotlin
// ✅ 好：复用实例
val json = Json { /* config */ }
repeat(1000) {
    json.encodeToString(data)
}

// ❌ 坏：频繁创建
repeat(1000) {
    Json { /* config */ }.encodeToString(data)
}
```

**2. 使用编译时序列化**

Kotlinx Serialization 在编译时生成序列化代码，性能优于运行时反射。

**3. 避免不必要的序列化**

```kotlin
// 使用 @Transient 标记不需要序列化的字段
@Serializable
data class Player(
    val name: String,
    @kotlinx.serialization.Transient
    val tempData: Any? = null  // 不会被序列化
)
```

### Kotlinx Serialization vs Gson 有什么区别？

| 特性 | Kotlinx Serialization | Gson |
|-----|----------------------|------|
| 类型安全 | ✅ 编译时检查 | ❌ 运行时检查 |
| 性能 | ✅ 编译时生成代码 | ❌ 运行时反射 |
| Kotlin 支持 | ✅ 原生支持 | ⚠️ 需要额外配置 |
| 体积 | ⚠️ 需要插件 | ✅ 更小 |
| 学习曲线 | ⚠️ 稍陡 | ✅ 简单 |

:::tip[推荐]

对于新项目，推荐使用 Kotlinx Serialization，它提供了更好的类型安全和性能。

:::

### 如何迁移现有的 Gson 代码？

```kotlin
// Gson
val gson = Gson()
val json = gson.toJson(user)
val user = gson.fromJson(json, User::class.java)

// Kotlinx Serialization
val json = Json.encodeToString(user)
val user = Json.decodeFromString<User>(json)
```

**迁移步骤：**
1. 添加 `@Serializable` 注解到数据类
2. 替换 Gson 的序列化/反序列化调用
3. 为自定义类型实现序列化器
4. 测试确保行为一致
