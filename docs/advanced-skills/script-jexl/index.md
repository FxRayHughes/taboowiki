---
title: JEXL 脚本引擎
sidebar_label: JEXL 脚本
sidebar_position: 1
description: TabooLib JEXL 脚本引擎的使用指南
---

# JEXL 脚本引擎

## 基本概念

JEXL (Java Expression Language) 是 Apache Commons 提供的轻量级表达式引擎，TabooLib 提供了对 JEXL 的集成支持，使你可以在插件中方便地执行动态表达式和脚本。

**核心特点：**
- 轻量级的表达式引擎
- 支持动态表达式执行
- 支持变量上下文传递
- 提供脚本缓存优化
- 链式配置编译器参数

## 核心 API

### JexlCompiler

`JexlCompiler` 是 JEXL 编译器的封装类，提供了链式 API 来配置编译参数。

```kotlin title="创建编译器" showLineNumbers
import taboolib.expansion.JexlCompiler

val compiler = JexlCompiler.new()
    .strict(false)      // 设置非严格模式
    .cache(256)         // 启用缓存，大小为 256
    .cacheThreshold(64) // 设置缓存阈值
```

**配置方法：**

| 方法 | 参数 | 说明 |
|-----|------|------|
| `antish(Boolean)` | `true`/`false` | 启用 Ant 风格属性访问 |
| `strict(Boolean)` | `true`/`false` | 严格模式，未定义变量会报错 |
| `silent(Boolean)` | `true`/`false` | 静默模式，错误不抛异常 |
| `safe(Boolean)` | `true`/`false` | 安全模式，禁止访问敏感方法 |
| `debug(Boolean)` | `true`/`false` | 调试模式 |
| `cache(Int)` | 缓存大小 | 设置脚本缓存容量 |
| `cacheThreshold(Int)` | 阈值 | 设置缓存阈值 |
| `collectMode(Int)` | 模式值 | 设置变量收集模式 |
| `collectAll(Boolean)` | `true`/`false` | 是否收集所有变量 |
| `stackOverflow(Int)` | 栈大小 | 设置堆栈溢出限制 |
| `namespace(Map)` | 命名空间 | 设置自定义命名空间 |

### 编译脚本

JEXL 提供两种编译方式：**Script**（脚本）和 **Expression**（表达式）。

#### compileToScript - 编译为脚本

适合执行复杂的多行脚本：

```kotlin title="脚本编译示例" showLineNumbers
import taboolib.expansion.compileToScript

// 多行脚本示例
val script = """
    var result = 0;
    for (var i = 1; i <= n; i++) {
        result = result + i;
    }
    result;
""".compileToScript()

// 传入变量并执行
val result = script.eval(mapOf("n" to 100))
println("1 到 100 的和: $result")  // 输出: 5050
```

**特点：**
- 支持多行代码
- 支持变量定义 `var`
- 支持循环、条件等控制结构
- 返回最后一个表达式的值

#### compileToExpression - 编译为表达式

适合执行简单的单行表达式：

```kotlin title="表达式编译示例" showLineNumbers
import taboolib.expansion.compileToExpression

// 数学计算
val expr = "a + b * c".compileToExpression()
val result = expr.eval(mapOf("a" to 10, "b" to 5, "c" to 2))
println(result)  // 输出: 20

// 字符串操作
val greeting = "name + ' is ' + age + ' years old'".compileToExpression()
val message = greeting.eval(mapOf("name" to "Steve", "age" to 18))
println(message)  // 输出: Steve is 18 years old
```

**特点：**
- 性能更优
- 只能单行表达式
- 适合简单计算和字符串拼接

### JexlCompiledScript

编译后的脚本对象，提供 `eval` 方法执行脚本。

```kotlin
interface JexlCompiledScript {
    /** 执行脚本 */
    fun eval(map: Map<String, Any?> = emptyMap()): Any?
}
```

## 基础用法

### 示例 1：简单表达式计算

```kotlin title="SimpleExpression.kt" showLineNumbers
@file:RuntimeDependency(
    "!org.apache.commons:commons-jexl3:3.2.1",
    test = "!org.apache.commons.jexl3_3_2_1.JexlEngine",
    relocate = ["!org.apache.commons.jexl3", "!org.apache.commons.jexl3_3_2_1"],
    transitive = false
)

package com.example.plugin

import taboolib.expansion.compileToExpression

fun calculateDamage(baseDamage: Int, multiplier: Double): Int {
    // 动态计算伤害公式
    val formula = "base * multiplier".compileToExpression()

    val result = formula.eval(mapOf(
        "base" to baseDamage,
        "multiplier" to multiplier
    ))

    return (result as Number).toInt()
}

// 使用
val damage = calculateDamage(100, 1.5)
println("最终伤害: $damage")  // 输出: 最终伤害: 150
```

### 示例 2：条件判断表达式

```kotlin title="ConditionalExpression.kt" showLineNumbers
import taboolib.expansion.compileToExpression

// 等级判断公式
val levelCheck = "level >= 10 ? 'VIP' : 'Normal'".compileToExpression()

val playerLevel = 15
val vipStatus = levelCheck.eval(mapOf("level" to playerLevel))
println("玩家状态: $vipStatus")  // 输出: 玩家状态: VIP
```

### 示例 3：使用自定义编译器

```kotlin title="CustomCompiler.kt" showLineNumbers
import taboolib.expansion.JexlCompiler
import taboolib.expansion.compileToScript

// 创建自定义编译器
val strictCompiler = JexlCompiler.new()
    .strict(true)    // 严格模式：未定义变量会报错
    .safe(true)      // 安全模式：禁止访问敏感方法
    .cache(512)      // 更大的缓存

// 使用自定义编译器
val script = "price * discount".compileToScript(strictCompiler)

try {
    // 缺少 discount 变量，严格模式下会报错
    val result = script.eval(mapOf("price" to 100))
} catch (e: Exception) {
    println("错误: ${e.message}")
}

// 正确执行
val result = script.eval(mapOf("price" to 100, "discount" to 0.8))
println("折后价格: $result")  // 输出: 折后价格: 80.0
```

## 进阶功能

### Ant 风格属性访问

启用 Ant 风格后，点号（`.`）和中括号（`[]`）可以互换使用：

```kotlin title="AntishStyle.kt" showLineNumbers
import taboolib.expansion.JexlCompiler

val compiler = JexlCompiler.new().antish(true)

val script = """
    user.name + ' lives in ' + user['address']['city']
""".trimIndent().compileToScript(compiler)

val result = script.eval(mapOf(
    "user" to mapOf(
        "name" to "Steve",
        "address" to mapOf(
            "city" to "Beijing"
        )
    )
))

println(result)  // 输出: Steve lives in Beijing
```

:::warning[性能提示]

Ant 风格模式对性能有轻微影响（约 5-10%），高频调用场景建议禁用。

:::

### 命名空间注入

通过命名空间可以注入自定义对象和方法：

```kotlin title="NamespaceExample.kt" showLineNumbers
import taboolib.expansion.JexlCompiler

// 自定义工具类
object MathUtils {
    fun sqrt(n: Double) = kotlin.math.sqrt(n)
    fun pow(base: Double, exp: Double) = kotlin.math.pow(base, exp)
}

// 注入命名空间
val compiler = JexlCompiler.new()
    .namespace(mapOf("math" to MathUtils))

// 使用命名空间中的方法
val script = "math:sqrt(16) + math:pow(2, 3)".compileToScript(compiler)
val result = script.eval()

println(result)  // 输出: 12.0 (4 + 8)
```

### 脚本缓存优化

对于频繁执行的脚本，可以配置缓存提升性能：

```kotlin title="CacheOptimization.kt" showLineNumbers
import taboolib.expansion.JexlCompiler

// 配置缓存参数
val compiler = JexlCompiler.new()
    .cache(256)          // 缓存大小：可缓存 256 个脚本
    .cacheThreshold(64)  // 缓存阈值：脚本长度小于 64 才缓存
    .collectMode(0)      // 禁用变量收集，提升性能

// 相同的脚本会从缓存中获取
val script1 = "a + b".compileToScript(compiler)
val script2 = "a + b".compileToScript(compiler)  // 从缓存获取

// 执行
repeat(1000) {
    script1.eval(mapOf("a" to it, "b" to 10))
}
```

**缓存策略：**
- `cache(256)`：最多缓存 256 个脚本对象
- `cacheThreshold(64)`：只缓存长度 ≤ 64 字符的脚本
- 缓存使用 LRU 策略，超出容量时淘汰最久未使用的脚本

## 最佳实践示例

### 场景 1：动态配置公式系统

实现一个可配置的伤害计算系统：

```kotlin title="DamageFormula.kt" showLineNumbers
@file:RuntimeDependency(
    "!org.apache.commons:commons-jexl3:3.2.1",
    test = "!org.apache.commons.jexl3_3_2_1.JexlEngine",
    relocate = ["!org.apache.commons.jexl3", "!org.apache.commons.jexl3_3_2_1"],
    transitive = false
)

package com.example.plugin

import taboolib.expansion.JexlCompiler
import taboolib.expansion.compileToScript
import taboolib.module.configuration.Config
import taboolib.module.configuration.Configuration
import taboolib.common.LifeCycle
import taboolib.common.platform.Awake

object DamageSystem {

    @Config
    lateinit var config: Configuration

    // 创建带缓存的编译器
    private val compiler = JexlCompiler.new()
        .strict(false)
        .cache(128)
        .cacheThreshold(256)

    // 预编译的公式缓存
    private val formulas = mutableMapOf<String, taboolib.expansion.JexlCompiledScript>()

    @Awake(LifeCycle.ENABLE)
    fun loadFormulas() {
        // 从配置文件加载公式
        config.getConfigurationSection("formulas")?.getKeys(false)?.forEach { key ->
            val formula = config.getString("formulas.$key") ?: return@forEach
            formulas[key] = formula.compileToScript(compiler)
        }
    }

    /**
     * 计算伤害
     * @param formulaName 公式名称
     * @param context 变量上下文
     */
    fun calculate(formulaName: String, context: Map<String, Any?>): Double {
        val formula = formulas[formulaName] ?: error("公式 $formulaName 不存在")
        val result = formula.eval(context)
        return (result as Number).toDouble()
    }
}

// 配置文件 config.yml
/*
formulas:
  physical: "base * (1 + strength / 100) * (1 - defense / 100)"
  magical: "base * (1 + intelligence / 100) * (1 - magicResist / 100)"
  critical: "base * critMultiplier * (1 + critDamage / 100)"
*/

// 使用示例
fun dealDamage(player: Player, target: Entity, baseDamage: Double) {
    val context = mapOf(
        "base" to baseDamage,
        "strength" to 50.0,
        "defense" to target.getDefense()
    )

    val finalDamage = DamageSystem.calculate("physical", context)
    target.damage(finalDamage)
}
```

### 场景 2：条件判断系统

实现一个灵活的任务条件检查系统：

```kotlin title="QuestCondition.kt" showLineNumbers
import taboolib.expansion.JexlCompiler
import taboolib.expansion.compileToExpression

object QuestSystem {

    private val compiler = JexlCompiler.new()
        .strict(false)
        .safe(true)  // 安全模式，防止恶意脚本

    /**
     * 检查任务条件
     */
    fun checkCondition(condition: String, context: Map<String, Any?>): Boolean {
        val expr = condition.compileToExpression(compiler)
        val result = expr.eval(context)
        return when (result) {
            is Boolean -> result
            is Number -> result.toInt() > 0
            else -> false
        }
    }
}

// 使用示例
data class PlayerData(
    val level: Int,
    val money: Double,
    val questsCompleted: Int
)

fun canAcceptQuest(player: PlayerData): Boolean {
    // 条件：等级 >= 10 且金币 >= 1000 且完成任务数 >= 5
    val condition = "level >= 10 && money >= 1000 && questsCompleted >= 5"

    val context = mapOf(
        "level" to player.level,
        "money" to player.money,
        "questsCompleted" to player.questsCompleted
    )

    return QuestSystem.checkCondition(condition, context)
}
```

### 场景 3：动态奖励计算

实现一个基于公式的奖励计算系统：

```kotlin title="RewardCalculator.kt" showLineNumbers
import taboolib.expansion.compileToScript
import taboolib.expansion.defaultJexlCompiler

object RewardCalculator {

    /**
     * 计算每日奖励
     */
    fun calculateDailyReward(loginDays: Int): Map<String, Int> {
        // 金币奖励公式：基础 100，每天递增 10，每 7 天翻倍
        val coinFormula = """
            var base = 100;
            var daily = days * 10;
            var weekBonus = (days / 7) * 100;
            base + daily + weekBonus;
        """.trimIndent().compileToScript()

        // 经验奖励公式：50 + days^1.5
        val expFormula = "50 + days^1.5".compileToScript()

        val context = mapOf("days" to loginDays)

        return mapOf(
            "coins" to (coinFormula.eval(context) as Number).toInt(),
            "exp" to (expFormula.eval(context) as Number).toInt()
        )
    }

    /**
     * 计算 VIP 折扣
     */
    fun calculateDiscount(vipLevel: Int, basePrice: Double): Double {
        // VIP 折扣：VIP1 = 95%，VIP2 = 90%，依此类推
        val formula = "price * (1 - vipLevel * 0.05)".compileToScript()

        val result = formula.eval(mapOf(
            "price" to basePrice,
            "vipLevel" to vipLevel
        ))

        return (result as Number).toDouble()
    }
}

// 使用示例
val rewards = RewardCalculator.calculateDailyReward(15)
println("连续登录 15 天奖励: ${rewards["coins"]} 金币, ${rewards["exp"]} 经验")

val discountedPrice = RewardCalculator.calculateDiscount(3, 1000.0)
println("VIP3 折扣价: $discountedPrice")
```

## 常见问题

### 如何选择 Script 还是 Expression？

**使用 `compileToScript`：**
- 需要执行多行代码
- 需要定义变量（`var`）
- 需要使用循环、条件控制

**使用 `compileToExpression`：**
- 只需要简单的单行表达式
- 追求更好的性能
- 数学计算或字符串拼接

### eval 方法返回值是什么类型？

`eval` 返回 `Any?` 类型，需要根据实际情况转换：

```kotlin
val result = script.eval(context)

// 转换为数字
val number = (result as Number).toDouble()

// 转换为字符串
val text = result.toString()

// 转换为布尔值
val bool = result as? Boolean ?: false
```

### 如何处理脚本执行异常？

使用 `try-catch` 捕获异常，或者配置编译器为静默模式：

```kotlin
// 方式 1：try-catch
try {
    val result = script.eval(context)
} catch (e: Exception) {
    println("脚本执行失败: ${e.message}")
}

// 方式 2：静默模式
val compiler = JexlCompiler.new().silent(true)
val script = "invalid / expression".compileToScript(compiler)
val result = script.eval()  // 返回 null 而不抛异常
```

### 如何访问 Java 对象的方法和属性？

JEXL 支持直接访问 Java 对象的公开方法和属性：

```kotlin
data class Player(val name: String, val level: Int) {
    fun getTitle() = "Lv.$level $name"
}

val script = "player.getTitle() + ' has level ' + player.level".compileToScript()
val player = Player("Steve", 10)

val result = script.eval(mapOf("player" to player))
println(result)  // 输出: Lv.10 Steve has level 10
```

:::tip[属性访问]

JEXL 可以直接访问 Kotlin data class 的属性，无需 getter 方法。

:::

### 脚本性能如何优化？

1. **启用缓存**：配置合适的缓存大小和阈值
2. **预编译**：在初始化时编译常用脚本
3. **禁用不必要的功能**：如变量收集（`collectMode(0)`）
4. **使用 Expression 而非 Script**：对于简单表达式

```kotlin
// 性能优化配置
val compiler = JexlCompiler.new()
    .cache(256)          // 启用缓存
    .cacheThreshold(128) // 缓存小于 128 字符的脚本
    .collectMode(0)      // 禁用变量收集
    .antish(false)       // 禁用 Ant 风格（轻微性能提升）
```

### 如何在脚本中使用 Kotlin/Java 的静态方法？

通过命名空间注入：

```kotlin
import kotlin.math.PI
import kotlin.math.sqrt

val compiler = JexlCompiler.new()
    .namespace(mapOf(
        "Math" to java.lang.Math,
        "System" to java.lang.System
    ))

val script = "Math:max(a, b)".compileToScript(compiler)
val result = script.eval(mapOf("a" to 10, "b" to 20))
println(result)  // 输出: 20
```

### 严格模式和安全模式有什么区别？

**严格模式（`strict`）：**
- 访问未定义变量时抛出异常
- 适合调试和开发阶段

**安全模式（`safe`）：**
- 禁止访问敏感方法（如 `System.exit()`）
- 适合执行用户输入的脚本

```kotlin
// 开发环境：严格模式
val devCompiler = JexlCompiler.new().strict(true)

// 生产环境：安全模式 + 静默模式
val prodCompiler = JexlCompiler.new()
    .safe(true)
    .silent(true)
```
