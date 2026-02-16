---
title: PTC Object ORM
sidebar_position: 3
description: 轻量级 ORM 框架，支持 DataMapper API、事务、联表查询、分页、游标、缓存、版本迁移和多数据库适配
---

# PTC Object ORM

PTC Object（Persistent Container Object）是 TabooLib 内置的轻量级 ORM 框架，通过注解将 Kotlin 数据类映射到数据库表，提供类型安全的 CRUD 操作、事务管理、联表查询、分页、缓存等完整功能。

:::info[适用场景]

PTC Object 适合 Minecraft 插件开发中的常见数据持久化场景，支持 MySQL、SQLite 和 PostgreSQL。如需更复杂的 ORM 功能，推荐使用 Ktorm、MyBatis-Plus 或 Jimmer 等专业框架。

:::

## 核心概念

### 数据类定义

PTC Object 通过数据类映射数据库表，使用注解声明主键、索引和字段约束：

```kotlin title="PlayerHome.kt" showLineNumbers
data class PlayerHome(
    @Id                        // 逻辑主键，用于 CRUD 定位
    val username: UUID,
    @Key                       // 索引 + 复合定位条件
    @Length(32)
    val serverName: String,
    @Length(32)
    var world: String,
    var x: Double,
    var y: Double,
    var z: Double,
    var yaw: Float,
    var pitch: Float,
    var active: Boolean
)
```

**约定：**
1. 驼峰命名自动转换为下划线列名（`serverName` → `server_name`）
2. `var` 字段可被 `update()` 更新，`val` 字段不可更新
3. 无 `@Id` 字段时，框架自动添加名为 `id` 的自增主键列

### 注解系统

#### 主键与索引

| 注解 | 作用 | 说明 |
|------|------|------|
| `@Id` | 逻辑主键 | 用于 `find()`、`update()`、`delete()` 定位。MySQL 创建 KEY，SQLite 创建 PRIMARY KEY |
| `@Key` | 索引 + 复合定位 | 配合 `@Id` 在 `updateByKey()` / `upsert()` 时精确定位 |
| `@UniqueKey` | 唯一索引 | 数据库层面的唯一约束，不参与 CRUD 定位 |

#### 字段约束

| 注解 | 作用 | 说明 |
|------|------|------|
| `@NotNull` | 非空约束 | 为列添加 NOT NULL |
| `@Length(n)` | 字段长度 | `-1` 为 LONGTEXT，默认 64 |
| `@Alias("name")` | 列名别名 | 覆盖默认的驼峰转下划线规则 |
| `@ColumnType` | 显式列类型 | 手动指定 SQL/SQLite/PostgreSQL 列类型 |
| `@Ignore` | 忽略字段 | 不参与数据库读写，使用 Kotlin 默认值 |

#### 关联与表名

| 注解 | 作用 | 说明 |
|------|------|------|
| `@LinkTable("class")` | 外键关联 | 支持多层嵌套（A→B→C），自动 LEFT JOIN 和级联保存 |
| `@TableName("name", schema="")` | 自定义表名 | 支持 PostgreSQL Schema |

### 解包函数（可选）

自定义数据类实例化逻辑：

```kotlin
data class PlayerHome(...) {
    companion object {
        @JvmStatic
        fun wrap(map: BundleMap): PlayerHome {
            return PlayerHome(
                map["username"], map["server_name"],
                map["world"], map["x"], map["y"], map["z"],
                map["yaw"], map["pitch"], map["active"]
            )
        }
    }
}
```

若不存在解包函数，则调用主构造函数。

## DataMapper API

DataMapper 是 PTC Object 的核心 API，推荐使用属性委托创建：

### 创建 DataMapper

以下示例来自 [Ptc-Test](https://github.com/TabooLib/Ptc-Test) 项目：

```kotlin title="Database.kt" showLineNumbers
/** 玩家家园 Mapper —— 无缓存（默认），用于大部分 CRUD 测试 */
val homeMapper by mapper<PlayerHome>(db(file = "test.db"))

/** 玩家统计 Mapper —— 与 homeMapper 共用数据源，用于 JOIN 联查测试 */
val statsMapper by mapper<PlayerStats>(db(file = "test.db"))

/** 简单笔记 Mapper —— 无 @Id 数据类，用于 rowId / autoKey / columnType 测试 */
val noteMapper by mapper<SimpleNote>(db(file = "test.db"))

/** 带缓存的玩家家园 Mapper —— L2 双层缓存配置 */
val cachedHomeMapper by mapper<PlayerHome>(db(file = "test_cached.db")) {
    cache {
        beanCache { maximumSize = 100; expireAfterWrite = 60 }
        queryCache { maximumSize = 50; expireAfterWrite = 60 }
    }
}

/** 手动建表 Mapper —— 跳过自动建表，执行用户提供的 SQL */
val manualHomeMapper by mapper<ManualHome>(dbFile("test_manual.db")) {
    manualTable(
        """CREATE TABLE IF NOT EXISTS manual_home (
            username VARCHAR(64) PRIMARY KEY,
            world VARCHAR(64),
            x REAL DEFAULT 0,
            y REAL DEFAULT 0,
            z REAL DEFAULT 0
        )"""
    )
}

/** 版本迁移 Mapper —— 手动建表 + 版本迁移组合使用 */
val migrationHomeMapper by mapper<MigrationHome>(dbFile("test_migration.db")) {
    manualTable(
        """CREATE TABLE IF NOT EXISTS migration_home (
            username VARCHAR(64) PRIMARY KEY,
            world VARCHAR(64)
        )"""
    )
    migration {
        version(1,
            "ALTER TABLE migration_home ADD COLUMN x REAL DEFAULT 0",
            "ALTER TABLE migration_home ADD COLUMN y REAL DEFAULT 0"
        )
        version(2,
            "ALTER TABLE migration_home ADD COLUMN z REAL DEFAULT 0"
        )
    }
}
```

### 数据库配置源

```kotlin
dbFile("data.db")                              // SQLite 文件
dbSection("config.yml", "database")            // 配置节点
db("config.yml", "database", "data.db")        // 自动选择
db("config.yml", "database", type = "postgresql") // 强制 PostgreSQL
```

**配置文件格式：**

```yaml
database:
  enable: true           # true: MySQL; false: SQLite
  host: localhost
  port: 3306
  user: root
  password: root
  database: minecraft
```

## CRUD 操作

以下示例来自 [Ptc-Test](https://github.com/TabooLib/Ptc-Test) 项目的测试用例。

### 插入与查询

```kotlin title="TestBasic.kt" showLineNumbers
// insert —— 插入单条记录，所有构造参数（val + var）都参与 INSERT
val home = PlayerHome("test_basic", "lobby", "world", 1.0, 2.0, 3.0, true)
homeMapper.insert(home)

// findById —— 通过 @Id 值查询单条记录，返回 T?
val found = homeMapper.findById("test_basic")

// findAll(id) —— 通过 @Id 值查询所有匹配记录，返回 List<T>
val allById = homeMapper.findAll("test_basic")

// update —— 通过 @Id 定位并更新 var 字段（val 字段不参与 SET）
val updated = found!!.copy(world = "world_nether", x = 10.0)
homeMapper.update(updated)

// exists —— 通过 @Id 检查记录是否存在
val ex = homeMapper.exists("test_basic")

// deleteById —— 通过 @Id 删除记录
homeMapper.deleteById("test_basic")
```

### 分页查询

```kotlin title="分页查询" showLineNumbers
// 基础分页
val page = homeMapper.findPage(page = 1, size = 20) {
    "world" eq "world"
}

// 排序分页
val page = homeMapper.sortDescendingPage("level", page = 1, size = 20)

// Page 对象
page.content       // 当前页数据
page.page          // 当前页码（从 1 开始）
page.size          // 每页大小
page.total         // 总记录数
page.totalPages    // 总页数
page.hasNext       // 是否有下一页
page.hasPrevious   // 是否有上一页
```

### 游标查询

在事务中逐行读取数据，避免大数据量时内存溢出：

```kotlin title="游标查询" showLineNumbers
homeMapper.transaction {
    selectCursor { "world" eq "overworld" }.forEach { home ->
        // 逐条处理，内存中始终只有一条数据
    }
}
```

:::warning[注意事项]
游标查询必须在事务中使用。
:::

### 更新

```kotlin title="更新操作" showLineNumbers
// 通过 @Id 更新
homeMapper.update(home)

// 通过 @Id + @Key 更新
homeMapper.updateByKey(home)

// 插入或更新
homeMapper.insertOrUpdate(home) { "username" eq "player1" }

// 批量 upsert（通过 @Id + @Key 判断）
homeMapper.upsertBatch(listOf(home1, home2))
```

:::warning[重要]
`update()` 和 `updateByKey()` 仅更新 `var` 修饰的可变字段。
:::

### 删除

```kotlin title="删除操作" showLineNumbers
// 通过 @Id 删除
homeMapper.deleteById("player1")

// 条件删除
homeMapper.deleteWhere { "world" eq "world_nether" }

// 批量删除
homeMapper.deleteByIds(listOf("player1", "player2"))
```

### 检查与计数

```kotlin title="检查与计数" showLineNumbers
val exists = homeMapper.exists("player1")
val exists = homeMapper.exists { "world" eq "world" }
val count = homeMapper.count { "world" eq "world" }
```

### Filter 条件

```kotlin
// 相等 / 不等
"server_name" eq "survival"
"active" neq false

// 大于 / 小于 / 大于等于 / 小于等于
"x" gt 100.0
"y" lt 200.0
"x" gte 100.0
"y" lte 200.0

// 模糊匹配
"world" like "%world%"

// IN 查询
"server_name" inside listOf("survival", "creative")
```

## 自定义 SQL

```kotlin title="自定义查询" showLineNumbers
// 自定义 SELECT（结果自动映射为 T）
val homes = homeMapper.query {
    where { "world" eq "world_nether" }
    limit(10)
}

// 自定义 SELECT + 自定义结果处理
val worlds = homeMapper.rawQuery({ rows("world"); groupBy("world") }) { rs ->
    buildList { while (rs.next()) add(rs.getString(1)) }
}

// 自定义 UPDATE
val affected = homeMapper.rawUpdate {
    set("active", false)
    where { "world" eq "world_nether" }
}
```

## 事务

### 基础事务

以下示例来自 [Ptc-Test](https://github.com/TabooLib/Ptc-Test) 项目：

```kotlin title="TestTransaction.kt" showLineNumbers
// transaction {} —— 事务块
// lambda 内的 this 是 DataMapper<PlayerHome>
// 返回 Result<Int>（lambda 最后一个表达式的类型）
val result = homeMapper.transaction {
    // 事务内插入两条记录
    insert(PlayerHome("tx_user_1", "lobby", "world", 0.0, 64.0, 0.0, true))
    insert(PlayerHome("tx_user_2", "survival", "world", 100.0, 64.0, 100.0, false))

    // 事务内查询并更新（读己之写）
    val home = findById("tx_user_1")
    if (home != null) {
        update(home.copy(world = "world_nether"))
    }

    // 返回值：找到的记录数
    val r1 = findById("tx_user_1")
    val r2 = findById("tx_user_2")
    (if (r1 != null) 1 else 0) + (if (r2 != null) 1 else 0)
}

// 检查事务执行结果
result.isSuccess          // 事务是否成功提交
result.getOrNull()        // 获取 lambda 的返回值
result.exceptionOrNull()  // 获取异常信息（成功时为 null）
```

### 容器级事务

跨表操作共享同一个数据库连接：

```kotlin title="容器级事务" showLineNumbers
val result = container.transaction {
    val homes = get<PlayerHome>()
    val stats = get<PlayerStats>()

    homes.insert(listOf(newHome))
    stats.update(playerStats)
}
```

### 事务特性

- **自动提交/回滚**：成功时自动提交，异常时自动回滚
- **事务传播**：嵌套 `transaction()` 自动复用外层连接
- **立即中止**：`rollbackNow(message)` 抛出异常并立即回滚

## 联表查询（JoinQuery）

### 基础用法

以下示例来自 [Ptc-Test](https://github.com/TabooLib/Ptc-Test) 项目：

```kotlin title="TestJoin.kt" showLineNumbers
// 分别向两张表插入关联数据
homeMapper.insert(PlayerHome("join_user", "lobby", "world", 1.0, 64.0, 1.0, true))
statsMapper.insert(PlayerStats("join_user", 100, 50, 36000L))

// join DSL 构建联查
val results = homeMapper.join {
    // innerJoin<PlayerStats> —— 通过泛型推断关联 player_stats 表
    innerJoin<PlayerStats> {
        // on() 指定连接条件
        // pre() 表示右侧是列引用，不是参数值
        on("player_home.username" eq pre("player_stats.username"))
    }
    // selectAs —— 指定查询列及别名，避免同名列冲突
    selectAs(
        "player_home.username" to "username",
        "player_home.world" to "world",
        "player_stats.kills" to "kills",
        "player_stats.deaths" to "deaths"
    )
    // where —— 过滤条件
    where { "player_home.username" eq "join_user" }
}.execute()  // execute() 执行查询，返回 List<BundleMap>

// BundleMap.get<T>(key) —— 通过别名获取值
val row = results[0]
val username = row.get<Any>("username")
val kills = row.get<Any>("kills")
```

### JOIN 类型

```kotlin
innerJoin<T> { on(...) }   // 内连接
leftJoin<T> { on(...) }    // 左连接
rightJoin<T> { on(...) }   // 右连接
```

### 列别名

解决同名列冲突：

```kotlin title="列别名" showLineNumbers
homeMapper.join {
    innerJoin<PlayerStats> {
        on("player_home.username" eq pre("player_stats.username"))
    }
    selectAs(
        "player_home.username" to "username",
        "player_stats.level" to "level"
    )
}.mapTo<PlayerSummary>()
```

### 子查询 JOIN

```kotlin title="子查询" showLineNumbers
homeMapper.join {
    from("`player_home` AS `h`")
    innerJoin(
        subQuery("player_stats", "sub") {
            rows("username", "SUM(kills) AS total_kills")
            where { "kills" gt 50 }
            groupBy("username")
        }
    ) {
        on("h.username" eq pre("sub.username"))
    }
    selectAs("h.username" to "username", "sub.total_kills" to "total_kills")
}.execute()
```

## 容器类型子表

### 支持的类型

List、Set、Map 字段自动创建子表：

```kotlin title="容器类型字段" showLineNumbers
data class PlayerProfile(
    @Id val username: UUID,
    var tags: List<String?>,           // 子表: player_profile_tags
    var scores: Set<String?>,          // 子表: player_profile_scores
    var props: Map<String, String?>    // 子表: player_profile_props
)
```

### 数据库代理

所有操作直接转化为 SQL，不在内存中缓存：

```kotlin title="数据库代理" showLineNumbers
// Map 代理
val props = mapper.mapOf("player1", "props")
props["key1"] = "value1"   // → SQL INSERT/UPDATE
val value = props["key1"]  // → SQL SELECT

// List 代理
val tags = mapper.listOf("player1", "tags")
tags.add("newTag")         // → SQL INSERT

// Set 代理
val scores = mapper.setOf("player1", "scores")
scores.add("100")          // → SQL INSERT IF NOT EXISTS

// 通过 Filter 定位
val props = mapper.mapOf("props") { "username" eq "player1" }
```

## 缓存系统

### L2 双层缓存

- **Bean Cache**：按实体 ID 存储，更新/删除只影响特定 ID
- **Query Cache**：按查询哈希存储，任何写操作清空整个 Query Cache

```kotlin title="缓存配置" showLineNumbers
val homeMapper by mapper<PlayerHome>(dbFile("data.db")) {
    cache {
        beanCache {
            maximumSize = 10000
            expireAfterWrite = 600   // 秒
            expireAfterAccess = 600
        }
        queryCache {
            maximumSize = 1000
            expireAfterAccess = 600
        }
    }
}
```

### 自定义缓存实现

实现 `DataCache` 接口即可替换内置缓存：

```kotlin title="自定义缓存" showLineNumbers
class MyCaffeineCache : DataCache {
    private val caffeine = Caffeine.newBuilder().maximumSize(1000).build<String, Any?>()
    override fun get(key: String, loader: () -> Any?) = caffeine.get(key) { loader() }
    override fun put(key: String, value: Any?) = caffeine.put(key, value)
    override fun invalidate(key: String) = caffeine.invalidate(key)
    override fun invalidateByPrefix(prefix: String) {
        caffeine.asMap().keys.removeIf { it.startsWith(prefix) }
    }
    override fun invalidateAll() = caffeine.invalidateAll()
}

val homeMapper by mapper<PlayerHome>(dbFile("data.db")) {
    cache(MyCaffeineCache(), MyCaffeineCache())
}
```

## 版本迁移

通过 `_ptc_meta` 表跟踪版本号，按序执行迁移 SQL：

```kotlin title="版本迁移" showLineNumbers
val homeMapper by mapper<PlayerHome>(dbFile("data.db")) {
    migration {
        version(1,
            "ALTER TABLE player_home ADD COLUMN x DOUBLE DEFAULT 0",
            "ALTER TABLE player_home ADD COLUMN y DOUBLE DEFAULT 0"
        )
        version(2,
            "ALTER TABLE player_home ADD COLUMN z DOUBLE DEFAULT 0"
        )
    }
}
```

仅执行版本号大于当前版本的迁移 SQL，每个表独立跟踪版本。

## 自定义类型

### 注册自定义类型

对于不支持的类型（如 `Date`、`ItemStack`），注册自定义序列化：

```kotlin title="自定义类型" showLineNumbers
object DateType : CustomType {
    override val type = Date::class.java
    override val typeSQL = ColumnTypeSQL.DATETIME
    override val typeSQLite = ColumnTypeSQLite.INTEGER
    override val typePostgreSQL = ColumnTypePostgreSQL.TIMESTAMP
    override val length = 6

    override fun serialize(value: Any) = Timestamp((value as Date).time)
    override fun deserialize(value: Any) = Date(value as Long)
}

// 注册
CustomTypeFactory.register(DateType)
```

### IndexedEnum

枚举以数值形式存储，而非名称。以下示例来自 [Ptc-Test](https://github.com/TabooLib/Ptc-Test)：

```kotlin title="AccountData.kt" showLineNumbers
enum class AccountType(override val index: Long, val desc: String) : IndexedEnum {
    NORMAL(1, "普通用户"),
    VIP(2, "VIP用户"),
    ADMIN(3, "管理员"),
}

data class AccountData(
    @Id val username: String,
    var type: AccountType,   // 数据库中存储 1, 2, 3
    var score: Double
)

// WHERE 条件自动转换
accountMapper.findAll { "type" eq AccountType.VIP }
// 生成 SQL: WHERE `type` = 2
```

## @Ignore 注解

标记字段不参与数据库读写。以下示例来自 [Ptc-Test](https://github.com/TabooLib/Ptc-Test)：

```kotlin title="IgnorePlayerHome.kt" showLineNumbers
class IgnorePlayerHome {

    @Id
    var username: String = ""

    @Length(32)
    var world: String = ""

    var x: Double = 0.0
    var y: Double = 0.0
    var z: Double = 0.0

    // highlight-start
    @Ignore
    var cachedDisplayName: String = "Unknown"  // 不建列，默认 "Unknown"
    @Ignore
    var tempScore: Int = 100                   // 不建列，默认 100
    @Ignore
    var debugInfo: String? = null              // 不建列，可空默认 null
    // highlight-end
}
```

**默认值行为：**
- Kotlin 声明了默认值 → 使用 Kotlin 默认值
- 可空类型 → null
- List → emptyList()
- 基础类型 → 零值

## @LinkTable 外键关联

支持多层嵌套和级联保存。以下示例来自 [Ptc-Test](https://github.com/TabooLib/Ptc-Test)：

```kotlin title="LinkedPlayerHome.kt" showLineNumbers
data class LinkedPlayerHome(
    @Id val username: String,
    @Length(32) val serverName: String,
    @Length(32) var world: String,
    @ColumnType(sql = ColumnTypeSQL.TEXT, sqlite = ColumnTypeSQLite.TEXT) var description: String,
    // highlight-next-line
    @LinkTable("statsUsername") val stats: PlayerStats?  // 自动 LEFT JOIN，可能为 null
)

data class PlayerStats(
    @Id val username: String,
    var kills: Int,
    var deaths: Int,
    var playtime: Long
)
```

**写入行为（级联保存）：**
- 深度优先级联保存（先保存最深层）
- 关联对象不存在 → 自动插入
- 关联对象已存在 → 自动更新

## 实际应用示例

### 玩家家园系统

```kotlin title="HomeManager.kt" showLineNumbers
data class PlayerHome(
    @Id val username: UUID,
    @Key @Length(32) val homeName: String,
    @Length(32) var world: String,
    var x: Double, var y: Double, var z: Double,
    var yaw: Float, var pitch: Float
)

object HomeManager {

    val homeMapper by mapper<PlayerHome>(db("config.yml", "database", "homes.db"))

    fun createHome(player: Player, name: String, loc: Location) {
        homeMapper.insert(PlayerHome(
            player.uniqueId, name, loc.world.name,
            loc.x, loc.y, loc.z, loc.yaw, loc.pitch
        ))
    }

    fun getHomes(player: Player) = homeMapper.findAll(player.uniqueId)

    fun getHome(player: Player, name: String) =
        homeMapper.findOneByKey(PlayerHome(
            player.uniqueId, name, "", 0.0, 0.0, 0.0, 0f, 0f
        ))

    fun deleteHome(player: Player, name: String) {
        homeMapper.deleteByKey(PlayerHome(
            player.uniqueId, name, "", 0.0, 0.0, 0.0, 0f, 0f
        ))
    }
}
```

### 排行榜系统

```kotlin title="RankSystem.kt" showLineNumbers
data class PlayerStats(
    @Id val uuid: UUID,
    var kills: Long = 0,
    var deaths: Long = 0,
    var level: Int = 1
)

object RankSystem {

    val statsMapper by mapper<PlayerStats>(dbFile("stats.db")) {
        cache {
            beanCache { maximumSize = 5000; expireAfterAccess = 300 }
        }
    }

    // 击杀排行榜
    fun getKillsTop(limit: Int = 10) =
        statsMapper.sortDescending("kills", limit = limit)

    // 分页查询
    fun getStatsPage(page: Int) =
        statsMapper.sortDescendingPage("level", page = page, size = 20)

    // 事务内批量更新
    fun batchUpdate(statsList: List<PlayerStats>) {
        statsMapper.transaction {
            updateBatch(statsList)
        }
    }
}
```

## 旧版 API（兼容）

旧版 `persistentContainer` API 仍然可用：

```kotlin title="旧版 API" showLineNumbers
val container = persistentContainer { new<PlayerHome>() }
val homes = container.get<PlayerHome>().find(playerUUID)
container.get<PlayerHome>().insert(listOf(home))
container.get<PlayerHome>().updateByKey(home)
```

推荐迁移到新的 DataMapper API 以获得更好的开发体验。

## 常见问题

### 如何自定义表名？

```kotlin
@TableName("custom_homes")
data class PlayerHome(...)

// 或在 PostgreSQL 中指定 Schema
@TableName("player_home", schema = "game")
data class PlayerHome(...)
```

### @Id 和数据库主键的区别？

- **@Id**：PTC Object 的逻辑主键，用于 CRUD 定位
- **数据库主键**：MySQL 中 @Id 创建 KEY（普通索引），SQLite 中创建 PRIMARY KEY
- 无 @Id 时，框架自动添加 `id` 自增主键

### 支持哪些数据类型？

- **基础类型**：Boolean, Byte, Short, Int, Long, Float, Double, Char
- **常用类型**：String, UUID, Enum, ByteArray
- **容器类型**：List, Set, Map（自动创建子表）
- **IndexedEnum**：以数值存储的枚举
- **自定义类型**：通过 CustomType 接口注册

### 如何存储复杂对象？

方式 1：注册 CustomType 自定义序列化
方式 2：使用 `@Length(-1)` 的 String 字段手动 JSON 序列化
方式 3：使用 `@LinkTable` 外键关联

### 事务中可以使用联表查询吗？

可以，`join {}` 在事务中会共享事务连接。

### 游标查询和普通查询的区别？

普通查询将所有结果加载到内存，游标查询逐行读取。当数据量很大时，游标查询可以避免内存溢出。游标必须在事务中使用。
