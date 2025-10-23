---
title: 持久化对象容器
sidebar_position: 3
description: 轻量级 ORM 框架，支持数据类自动映射、自动建表、自定义类型序列化和 Filter 条件查询
---

# 持久化对象容器

持久化对象容器（Persistent Container Object，简称 PCO）是轻量级 ORM 框架，通过注解将 Kotlin 数据类映射到数据库表，自动创建表结构并提供类型安全的 CRUD 操作。

:::info[适用场景]

PCO 适合 Minecraft 插件开发中的常见数据持久化场景。如需更复杂的 ORM 功能，推荐使用 Ktorm、MyBatis、MyBatis-Plus 或 Jimmer 等专业框架。

:::


## 核心概念

### 数据类定义

PCO 通过数据类（data class）映射数据库表：

```kotlin
data class PlayerHome(
    @Id                    // 查询主键（非数据库主键）
    val username: UUID,
    @Key                   // 索引（配合 @Id 用于 update 定位）
    @Length(32)            // 字段长度
    val serverName: String,
    @Length(32)
    var world: String,     // var 可变字段可被 update()
    var x: Double,
    var y: Double,
    var z: Double,
    var yaw: Float,
    var pitch: Float,
    var active: Boolean
)
```

**约定：**
1. 使用 `data class` 定义数据类
2. 类名建议以 `Entity` 结尾
3. 驼峰命名会自动转换为下划线列名（`serverName` → `server_name`）

### 注解说明

| 注解 | 作用 | 说明 |
|-----|------|------|
| `@Id` | 查询主键 | 用于 `find()`、`update()`、`delete()` 等操作的主键定位 |
| `@Key` | 建立索引 | 配合 `@Id` 在 `updateByKey()` 时精确定位数据 |
| `@UniqueKey` | 唯一索引 | 建立唯一约束 |
| `@NotNull` | 非空约束 | 字段不允许为 null |
| `@Length(n)` | 字段长度 | String 类型：`-1` 为 LONGTEXT，默认 64；数字类型：精度 |
| `@Alias("name")` | 自定义列名 | 覆盖默认的驼峰转下划线规则 |

### 解包函数（可选）

自定义数据类实例化逻辑：

```kotlin
data class PlayerHome(...) {

    companion object {
        @JvmStatic
        fun wrap(map: BundleMap): PlayerHome {
            return PlayerHome(
                map["username"],
                map["server_name"],  // 驼峰自动转下划线
                map["world"],
                map["x"],
                map["y"],
                map["z"],
                map["yaw"],
                map["pitch"],
                map["active"]
            )
        }
    }
}
```

**解包函数要求：**
1. 名称任意
2. 有且仅有一个 `BundleMap` 参数
3. 返回值为该数据类
4. 若不存在解包函数，则调用主构造函数

## 基础用法

### 创建容器

```kotlin
import taboolib.expansion.*

class PlayerHomeManager {

    // 方式 1：使用默认配置（读取 config.yml 的 database 节点）
    val container = persistentContainer {
        new<PlayerHome>()  // 自动创建表 player_home
    }

    // 方式 2：使用自定义配置文件
    val container = persistentContainer(
        type = dbSection("database.yml", "database")
    ) {
        new<PlayerHome>()
    }

    // 方式 3：手动配置 MySQL
    val container = persistentContainer(
        host = "localhost",
        port = 3306,
        user = "root",
        password = "password",
        database = "minecraft"
    ) {
        new<PlayerHome>()
    }

    // 方式 4：使用 SQLite
    val container = persistentContainer(
        type = dbFile("homes.db")
    ) {
        new<PlayerHome>()
    }

    // 释放资源
    fun close() {
        container.close()
    }
}
```

### 数据库配置

#### 配置文件格式

```yaml
database:
  enable: true           # true: MySQL; false: SQLite
  host: localhost
  port: 3306
  user: root
  password: root
  database: minecraft
```

#### 辅助函数

```kotlin
// 获取数据库文件
dbFile("data.db")

// 读取配置节点
dbSection("config.yml", "database")

// 自动判断配置类型
db(name = "config.yml", node = "database", file = "data.db")
```

## CRUD 操作

### 查询数据

```kotlin
// 1. 获取所有数据
val allHomes = container.get<PlayerHome>()

// 2. 获取单个数据（返回第一个）
val firstHome = container.getOne<PlayerHome>()

// 3. 根据 @Id 查询
val homes = container.get<PlayerHome>().find(playerUUID)

// 4. 根据 @Id + 条件查询
val home = container.get<PlayerHome>().findOne(playerUUID) {
    "server_name" eq "survival"
}

// 5. 条件查询
val activeHomes = container.get<PlayerHome>().get {
    "active" eq true
}
```

### Filter 条件

```kotlin
container.get<PlayerHome>().find(playerUUID) {
    // 相等
    "server_name" eq "survival"

    // 不等
    "active" neq false

    // 大于/小于
    "x" gt 100.0
    "y" lt 200.0

    // 大于等于/小于等于
    "x" gte 100.0
    "y" lte 200.0

    // 模糊匹配
    "world" like "%world%"

    // IN 查询
    "server_name" inside listOf("survival", "creative")
}
```

### 插入数据

```kotlin
val home = PlayerHome(
    username = playerUUID,
    serverName = "survival",
    world = "world",
    x = 100.0,
    y = 64.0,
    z = 200.0,
    yaw = 0f,
    pitch = 0f,
    active = true
)

// 插入单条
container.get<PlayerHome>().insert(listOf(home))

// 批量插入
container.get<PlayerHome>().insert(homeList)
```

### 更新数据

```kotlin
// 方式 1：使用 @Id 和 @Key 精确定位
fun updateHome(home: PlayerHome) {
    container.get<PlayerHome>().updateByKey(home)
}

// 方式 2：使用 @Id + 自定义条件
fun updateHome(home: PlayerHome, serverName: String) {
    container.get<PlayerHome>().update(home) {
        "server_name" eq serverName
    }
}
```

:::warning[重要]

`update()` 和 `updateByKey()` 仅更新 `var` 修饰的可变字段，`val` 字段不会被更新。

:::

### 删除数据

```kotlin
// 根据 @Id 删除
container.get<PlayerHome>().delete<PlayerHome>(playerUUID)

// 根据 @Id + 条件删除
container.get<PlayerHome>().delete<PlayerHome>(playerUUID) {
    "server_name" eq "survival"
}
```

### 检查数据是否存在

```kotlin
// 检查 @Id 是否存在
val exists = container.get<PlayerHome>().has<PlayerHome>(playerUUID)

// 检查 @Id + 条件
val exists = container.get<PlayerHome>().has<PlayerHome>(playerUUID) {
    "active" eq true
}

// 检查条件是否存在
val exists = container.get<PlayerHome>().has {
    "world" eq "world_nether"
}
```

### 排序查询

```kotlin
// 正序（默认返回前 10 条）
val topHomes = container.get<PlayerHome>().sort("x", limit = 10)

// 倒序
val bottomHomes = container.get<PlayerHome>().sortDescending("y", limit = 5)

// 带条件的排序
val sortedHomes = container.get<PlayerHome>().sort("x", limit = 20) {
    "active" eq true
}
```

## 自定义类型

### 注册自定义类型

对于不支持的类型（如 `Date`、`ItemStack`），可以注册自定义序列化：

```kotlin
import taboolib.expansion.CustomType
import taboolib.module.database.ColumnTypeSQL
import taboolib.module.database.ColumnTypeSQLite
import java.sql.Timestamp
import java.util.Date

object DateType : CustomType {

    override val type: Class<*> = Date::class.java

    override val typeSQL: ColumnTypeSQL
        get() = ColumnTypeSQL.DATETIME

    override val typeSQLite: ColumnTypeSQLite
        get() = ColumnTypeSQLite.INTEGER

    override val length = 6

    override fun serialize(value: Any): Any {
        return Timestamp((value as Date).time)
    }

    override fun deserialize(value: Any): Any {
        return Date(value as Long)
    }
}
```

### 使用自定义类型

```kotlin
data class PlayerData(
    @Id
    val uuid: UUID,
    var joinDate: Date,  // 使用自定义类型
    var lastSeen: Date
)
```

CustomType 会自动被 PCO 识别并应用。

## 实际应用示例

### 玩家家园系统

```kotlin
data class PlayerHome(
    @Id val username: UUID,
    @Key @Length(32) val homeName: String,
    @Length(32) var world: String,
    var x: Double,
    var y: Double,
    var z: Double,
    var yaw: Float,
    var pitch: Float
)

object HomeManager {

    private val container = persistentContainer { new<PlayerHome>() }

    fun createHome(player: Player, name: String, location: Location) {
        val home = PlayerHome(
            username = player.uniqueId,
            homeName = name,
            world = location.world.name,
            x = location.x,
            y = location.y,
            z = location.z,
            yaw = location.yaw,
            pitch = location.pitch
        )
        container.get<PlayerHome>().insert(listOf(home))
    }

    fun getPlayerHomes(player: Player): List<PlayerHome> {
        return container.get<PlayerHome>().find(player.uniqueId)
    }

    fun getHome(player: Player, name: String): PlayerHome? {
        return container.get<PlayerHome>().findOne(player.uniqueId) {
            "home_name" eq name
        }
    }

    fun updateHome(home: PlayerHome) {
        container.get<PlayerHome>().updateByKey(home)
    }

    fun deleteHome(player: Player, name: String) {
        container.get<PlayerHome>().delete<PlayerHome>(player.uniqueId) {
            "home_name" eq name
        }
    }

    fun close() {
        container.close()
    }
}
```

### 公会系统

```kotlin
data class GuildEntity(
    @Id @UniqueKey @Length(32) val guildName: String,
    @Length(128) var description: String,
    var leaderUUID: UUID,
    var createTime: Long,
    var level: Int,
    var exp: Long
)

data class GuildMemberEntity(
    @Id val memberUUID: UUID,
    @Key @Length(32) val guildName: String,
    var role: String,
    var joinTime: Long,
    var contribution: Int
)

object GuildManager {

    private val container = persistentContainer {
        new<GuildEntity>()
        new<GuildMemberEntity>()
    }

    fun createGuild(name: String, leader: UUID) {
        val guild = GuildEntity(
            guildName = name,
            description = "",
            leaderUUID = leader,
            createTime = System.currentTimeMillis(),
            level = 1,
            exp = 0
        )
        container.get<GuildEntity>().insert(listOf(guild))

        val member = GuildMemberEntity(
            memberUUID = leader,
            guildName = name,
            role = "LEADER",
            joinTime = System.currentTimeMillis(),
            contribution = 0
        )
        container.get<GuildMemberEntity>().insert(listOf(member))
    }

    fun getGuild(name: String): GuildEntity? {
        return container.get<GuildEntity>().findOne(name)
    }

    fun getGuildMembers(guildName: String): List<GuildMemberEntity> {
        return container.get<GuildMemberEntity>().get {
            "guild_name" eq guildName
        }
    }

    fun getTopGuilds(limit: Int = 10): List<GuildEntity> {
        return container.get<GuildEntity>().sortDescending("level", limit)
    }

    fun close() {
        container.close()
    }
}
```

### 延迟初始化容器

```kotlin
object DataManager {

    val container by lazy {
        persistentContainer {
            new<PlayerHome>()
            new<GuildEntity>()
            new<GuildMemberEntity>()
        }
    }

    @Awake(LifeCycle.DISABLE)
    fun close() {
        if (::container.isInitialized) {
            container.close()
        }
    }
}
```

## 常见问题

### 如何自定义表名？

```kotlin
// 默认：类名驼峰转下划线
new<PlayerHome>()  // 表名: player_home

// 自定义表名
new<PlayerHome>("custom_homes")
```

### update 无法更新某个字段？

确保字段使用 `var` 而非 `val`：

```kotlin
data class Entity(
    @Id val id: UUID,
    var name: String,    // ✅ 可更新
    val createTime: Long // ❌ 不可更新
)
```

### 如何存储复杂对象？

注册 CustomType 或使用 JSON 序列化：

```kotlin
data class PlayerData(
    @Id val uuid: UUID,
    @Length(-1)  // LONGTEXT
    var itemsJson: String  // 手动序列化为 JSON
)
```

### 驼峰命名如何映射？

- `playerName` → `player_name`
- `serverIP` → `server_i_p`
- 使用 `@Alias("custom_name")` 覆盖默认规则

### 如何处理 UUID 类型？

UUID 会自动序列化为字符串存储，反序列化时自动转换回 UUID 对象。

### @Id 和数据库主键的区别？

- **@Id**：用于 PCO 操作的逻辑主键（`find()`、`update()` 定位）
- **数据库主键**：数据库层面的真实主键，PCO 不自动创建

如需数据库主键，使用 `@UniqueKey` + `@NotNull` 组合。

### 支持哪些数据类型？

- **基础类型**：Boolean, Byte, Short, Int, Long, Float, Double, Char
- **常用类型**：String, UUID, Enum, ByteArray
- **自定义类型**：通过 CustomType 接口注册
