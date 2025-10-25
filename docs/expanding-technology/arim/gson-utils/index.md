---
title: Gson 工具类
sidebar_position: 13
description: 强化版 Gson 工具，支持 Bukkit 序列化对象和智能类型推断
---

# Gson 工具类

GsonUtils 是一个增强的 Gson 工具类，提供完整的 JSON 序列化/反序列化功能，特别针对 Minecraft Bukkit 环境进行了优化。

## 核心特性

- **Bukkit 序列化支持**：自动处理 `ConfigurationSerializable` 对象
- **智能类型推断**：自动识别整数、长整型、浮点数类型
- **深度反序列化**：递归解析嵌套的 JSON 结构
- **特殊值处理**：支持 NaN、Infinity 等特殊浮点数
- **HTML 转义禁用**：保留原始字符不转义

## 基础用法

### 序列化对象为 JSON

```kotlin
import top.maplex.arim.tools.gson.GsonUtils

data class PlayerData(
    val name: String,
    val level: Int,
    val coins: Double
)

val data = PlayerData("Steve", 50, 1000.5)

// 序列化为 JSON 字符串
val json = GsonUtils.toJson(data)
// 结果: {"name":"Steve","level":50,"coins":1000.5}
```

### 反序列化 JSON 为对象

```kotlin
val json = """{"name":"Steve","level":50,"coins":1000.5}"""

// 反序列化为 PlayerData 对象
val data = GsonUtils.fromJson(json, PlayerData::class.java)

println(data.name)   // Steve
println(data.level)  // 50
println(data.coins)  // 1000.5
```

## Bukkit 序列化对象支持

GsonUtils 内置了对 Bukkit `ConfigurationSerializable` 对象的支持，可以直接序列化和反序列化物品、位置等 Bukkit 对象。

### 序列化 ItemStack

```kotlin
val item = ItemStack(Material.DIAMOND_SWORD).apply {
    itemMeta = itemMeta?.apply {
        setDisplayName("§c传说之剑")
        lore = listOf("§7这是一把传说中的剑")
        addEnchant(Enchantment.DAMAGE_ALL, 5, true)
    }
}

// 序列化为 JSON
val json = GsonUtils.toJson(item)

// 反序列化回 ItemStack
val deserializedItem = GsonUtils.fromJson(json, ItemStack::class.java)
```

**JSON 格式示例：**

```json
{
  "==": "org.bukkit.inventory.ItemStack",
  "v": 3837,
  "type": "DIAMOND_SWORD",
  "meta": {
    "==": "ItemMeta",
    "meta-type": "UNSPECIFIC",
    "display-name": "§c传说之剑",
    "lore": ["§7这是一把传说中的剑"],
    "enchants": {
      "DAMAGE_ALL": 5
    }
  }
}
```

### 序列化 Location

```kotlin
val location = Location(Bukkit.getWorld("world"), 100.5, 64.0, 200.5, 90f, 0f)

// 序列化
val json = GsonUtils.toJson(location)

// 反序列化
val loc = GsonUtils.fromJson(json, Location::class.java)
```

### 自定义序列化对象

任何实现了 `ConfigurationSerializable` 的类都可以被自动序列化：

```kotlin
class CustomData : ConfigurationSerializable {
    var value: String = ""

    constructor(value: String) {
        this.value = value
    }

    override fun serialize(): Map<String, Any> {
        return mapOf("value" to value)
    }

    companion object {
        @JvmStatic
        fun deserialize(map: Map<String, Any>): CustomData {
            return CustomData(map["value"] as String)
        }
    }
}

// 注册序列化类
ConfigurationSerialization.registerClass(CustomData::class.java)

// 使用
val data = CustomData("test")
val json = GsonUtils.toJson(data)
val restored = GsonUtils.fromJson(json, CustomData::class.java)
```

## 深度反序列化

`deepDeserialize` 方法可以将 JSON 字符串递归解析为嵌套的 Map 和 List 结构，并智能识别数据类型。

### 基础示例

```kotlin
val json = """
{
    "player": "Steve",
    "level": 50,
    "coins": 1000.5,
    "active": true,
    "skills": ["mining", "combat"],
    "equipment": {
        "sword": "Diamond Sword",
        "armor": "Iron Chestplate"
    }
}
"""

val map = GsonUtils.deepDeserialize(json)

// 访问数据
println(map["player"])           // Steve (String)
println(map["level"])            // 50 (Long)
println(map["coins"])            // 1000.5 (Double)
println(map["active"])           // true (Boolean)
println(map["skills"])           // [mining, combat] (List)
println(map["equipment"])        // {sword=..., armor=...} (Map)
```

### 类型识别规则

GsonUtils 会自动识别并转换为正确的 Java 类型：

| JSON 类型 | Java 类型 | 示例 |
|----------|----------|------|
| 整数 | `Long` | `42` → `42L` |
| 小数 | `Double` | `3.14` → `3.14` |
| 布尔值 | `Boolean` | `true` → `true` |
| 字符串 | `String` | `"hello"` → `"hello"` |
| 数组 | `List<Object>` | `[1,2,3]` → `ArrayList` |
| 对象 | `Map<String, Object>` | `{"a":1}` → `LinkedHashMap` |
| null | `null` | `null` → `null` |

### 实战示例：解析配置文件

```kotlin
val configJson = """
{
    "database": {
        "host": "localhost",
        "port": 3306,
        "user": "root",
        "tables": ["users", "items", "logs"]
    },
    "settings": {
        "max-players": 100,
        "difficulty": 1.5,
        "pvp-enabled": true
    }
}
"""

val config = GsonUtils.deepDeserialize(configJson)

// 访问嵌套数据
val database = config["database"] as Map<String, Any>
val host = database["host"] as String
val port = database["port"] as Long
val tables = database["tables"] as List<String>

val settings = config["settings"] as Map<String, Any>
val maxPlayers = settings["max-players"] as Long
val difficulty = settings["difficulty"] as Double
val pvpEnabled = settings["pvp-enabled"] as Boolean

println("数据库: $host:$port")
println("表: $tables")
println("最大玩家: $maxPlayers")
println("难度: $difficulty")
println("PVP: $pvpEnabled")
```

## 智能数字类型转换

GsonUtils 会智能地将数字转换为合适的类型：

```kotlin
val json = """
{
    "整数": 42,
    "大整数": 9999999999,
    "小数": 3.14,
    "科学计数法": 1.5e10
}
"""

val map = GsonUtils.deepDeserialize(json)

map["整数"]       // 42 (Long) - 自动识别为整数
map["大整数"]     // 9999999999 (Long) - 超出 Int 范围，使用 Long
map["小数"]       // 3.14 (Double) - 包含小数点
map["科学计数法"]  // 1.5E10 (Double) - 科学计数法
```

## 特殊功能

### 空值序列化

默认情况下，GsonUtils 会序列化 null 值：

```kotlin
data class Data(val name: String?, val value: Int)

val data = Data(null, 100)
val json = GsonUtils.toJson(data)
// 结果: {"name":null,"value":100}
```

### 特殊浮点数支持

支持 NaN 和 Infinity 等特殊浮点数值：

```kotlin
val data = mapOf(
    "nan" to Double.NaN,
    "infinity" to Double.POSITIVE_INFINITY,
    "negInfinity" to Double.NEGATIVE_INFINITY
)

val json = GsonUtils.toJson(data)
// 可以正常序列化这些特殊值
```

### 禁用 HTML 转义

默认禁用 HTML 转义，保留原始字符：

```kotlin
val text = mapOf("html" to "<div>Hello & World</div>")
val json = GsonUtils.toJson(text)
// 结果: {"html":"<div>Hello & World</div>"}
// 不会转义为 {"html":"\u003cdiv\u003e..."}
```

## 高级用法

### 获取 Gson 实例

如果需要使用 Gson 的高级功能，可以获取内部的 Gson 实例：

```kotlin
val gson = GsonUtils.getGson()

// 使用 TypeToken 处理泛型
val type = object : TypeToken<List<PlayerData>>() {}.type
val list: List<PlayerData> = gson.fromJson(json, type)
```

### 配合 TabooLib Configuration 使用

```kotlin
import taboolib.module.configuration.Configuration

val config = Configuration.loadFromString("""
    player:
      name: Steve
      level: 50
      coins: 1000.5
""")

// 将配置转换为 Map
val map = config.getConfigurationSection("player")!!.getValues(false)

// 序列化为 JSON
val json = GsonUtils.toJson(map)

// 反序列化回 Map
val restored = GsonUtils.deepDeserialize(json)
```

## 实战示例

### 示例 1：玩家数据持久化

```kotlin
data class PlayerProfile(
    val uuid: String,
    val name: String,
    val level: Int,
    val experience: Double,
    val inventory: List<ItemStack>,
    val location: Location
)

object PlayerDataManager {

    fun savePlayer(player: Player, file: File) {
        val profile = PlayerProfile(
            uuid = player.uniqueId.toString(),
            name = player.name,
            level = player.level,
            experience = player.exp.toDouble(),
            inventory = player.inventory.contents.filterNotNull(),
            location = player.location
        )

        val json = GsonUtils.toJson(profile)
        file.writeText(json)
    }

    fun loadPlayer(file: File): PlayerProfile {
        val json = file.readText()
        return GsonUtils.fromJson(json, PlayerProfile::class.java)
    }
}
```

### 示例 2：跨服数据传输

```kotlin
// 服务器 A：发送数据
val transferData = mapOf(
    "player" to player.name,
    "items" to player.inventory.contents.filterNotNull(),
    "money" to economy.getBalance(player)
)

val json = GsonUtils.toJson(transferData)
redisClient.publish("server-transfer", json)

// 服务器 B：接收数据
redisClient.subscribe("server-transfer") { message ->
    val data = GsonUtils.deepDeserialize(message)

    val playerName = data["player"] as String
    val items = data["items"] as List<Map<String, Any>>
    val money = data["money"] as Double

    // 处理数据...
}
```

### 示例 3：API 数据解析

```kotlin
// 解析外部 API 返回的 JSON
val apiResponse = """
{
    "status": "success",
    "data": {
        "user": {
            "id": 12345,
            "name": "Player",
            "stats": {
                "kills": 100,
                "deaths": 50,
                "kd_ratio": 2.0
            }
        }
    }
}
"""

val response = GsonUtils.deepDeserialize(apiResponse)
val data = response["data"] as Map<String, Any>
val user = data["user"] as Map<String, Any>
val stats = user["stats"] as Map<String, Any>

val kills = stats["kills"] as Long
val deaths = stats["deaths"] as Long
val kdRatio = stats["kd_ratio"] as Double

println("击杀: $kills, 死亡: $deaths, K/D: $kdRatio")
```

### 示例 4：配置文件格式转换

```kotlin
// 将 YAML 配置转换为 JSON
val yamlConfig = Configuration.loadFromFile(File("config.yml"))
val map = yamlConfig.getValues(true)
val json = GsonUtils.toJson(map)

// 保存为 JSON 文件
File("config.json").writeText(json)

// 将 JSON 转换回 YAML
val jsonData = File("config.json").readText()
val restored = GsonUtils.deepDeserialize(jsonData)
val newConfig = Configuration.empty()
restored.forEach { (key, value) -> newConfig[key] = value }
newConfig.saveToFile(File("config_restored.yml"))
```

## 注意事项

### 类型转换

使用 `deepDeserialize` 时，所有整数都会被解析为 `Long` 类型，需要注意类型转换：

```kotlin
val data = GsonUtils.deepDeserialize("""{"count": 10}""")
val count = data["count"] as Long  // ✅ 正确
// val count = data["count"] as Int // ❌ 会抛出 ClassCastException
```

如果确实需要 `Int` 类型：

```kotlin
val count = (data["count"] as Long).toInt()
```

### ConfigurationSerializable 注册

自定义的序列化类必须先注册才能被正确反序列化：

```kotlin
// 在插件启动时注册
ConfigurationSerialization.registerClass(CustomData::class.java)
ConfigurationSerialization.registerClass(CustomData::class.java, "CustomAlias")
```

### 循环引用

避免序列化包含循环引用的对象，会导致栈溢出：

```kotlin
class Node {
    var next: Node? = null
}

val node1 = Node()
val node2 = Node()
node1.next = node2
node2.next = node1  // 循环引用

// GsonUtils.toJson(node1) // ❌ 会导致栈溢出
```

### 泛型擦除

由于 Java 泛型擦除，直接反序列化泛型集合需要使用 `getGson()` 配合 `TypeToken`：

```kotlin
val json = """[{"name":"Steve"},{"name":"Alex"}]"""

// ❌ 错误：无法推断泛型类型
// val list = GsonUtils.fromJson(json, List::class.java)

// ✅ 正确：使用 TypeToken
val type = object : TypeToken<List<PlayerData>>() {}.type
val list: List<PlayerData> = GsonUtils.getGson().fromJson(json, type)
```

## 性能建议

1. **重用 Gson 实例**：GsonUtils 内部已经缓存了 Gson 实例，无需自己创建
2. **大数据处理**：对于超大 JSON（>10MB），考虑使用流式解析
3. **频繁序列化**：如果频繁序列化同一类型，考虑缓存 `TypeAdapter`
4. **深度嵌套**：避免过深的 JSON 嵌套（>20 层），可能影响性能

## 与 TabooLib Config 的对比

| 特性 | GsonUtils | TabooLib Config |
|-----|-----------|-----------------|
| 格式支持 | JSON | YAML, JSON, TOML, HOCON |
| Bukkit 对象 | ✅ 完整支持 | ✅ 完整支持 |
| 数据类型 | 智能推断 | 需要手动指定 |
| 适用场景 | API 交互、数据传输 | 配置文件管理 |
| 性能 | 高 | 中 |
| 可读性 | JSON 格式 | YAML 更易读 |

**推荐使用场景：**
- **GsonUtils**：API 数据解析、跨服通信、数据序列化、缓存存储
- **TabooLib Config**：插件配置文件、玩家数据文件、多格式支持

## 常见问题

### Q: 如何处理日期时间？

A: Gson 默认不支持日期，可以转换为时间戳：

```kotlin
val data = mapOf(
    "timestamp" to System.currentTimeMillis(),
    "date" to LocalDateTime.now().toString()
)
```

### Q: 如何美化输出的 JSON？

A: 使用 `setPrettyPrinting()`：

```kotlin
val gson = GsonBuilder()
    .setPrettyPrinting()
    .create()

val json = gson.toJson(data)
```

### Q: 如何忽略某些字段？

A: 使用 `@Expose` 注解或 `transient` 关键字：

```kotlin
data class Data(
    val name: String,
    @Transient val temp: String = ""  // 不会被序列化
)
```

## 作者

**GermMC**

感谢萌芽引擎
