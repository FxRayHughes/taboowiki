---
title: JavaScript 脚本引擎
sidebar_label: JavaScript 脚本
sidebar_position: 2
description: TabooLib JavaScript (Nashorn) 脚本引擎的使用指南
---

# JavaScript 脚本引擎

## 基本概念

TabooLib 提供了对 JavaScript 的支持，使用 Nashorn 引擎执行 JavaScript 代码。Nashorn 是一个高性能的 JavaScript 引擎，可以无缝调用 Java/Kotlin 代码。

**核心特点：**
- 使用标准的 JavaScript 语法
- 完整的 ECMAScript 5.1 支持
- 可以直接调用 Java/Kotlin 对象和方法
- 支持脚本预编译和缓存
- 与 Java 类型无缝互操作

## 核心 API

### scriptEngine

全局的 JavaScript 脚本引擎实例，可以直接执行脚本：

```kotlin title="ScriptEngine 基础使用" showLineNumbers
import taboolib.common5.scriptEngine

// 执行简单的 JavaScript 代码
val result = scriptEngine.eval("1 + 2 * 3")
println(result)  // 输出: 7

// 执行带变量的代码
scriptEngine.put("name", "Steve")
scriptEngine.put("level", 10)
val message = scriptEngine.eval("name + ' is level ' + level")
println(message)  // 输出: Steve is level 10
```

**ScriptEngine 常用方法：**

| 方法 | 说明 |
|-----|------|
| `eval(String)` | 执行 JavaScript 代码 |
| `put(String, Any?)` | 设置全局变量 |
| `get(String)` | 获取全局变量 |
| `compile(String)` | 编译脚本（需要 Compilable） |

### compileJS - 编译脚本

将 JavaScript 代码预编译为 `CompiledScript`，提升重复执行的性能：

```kotlin title="编译脚本示例" showLineNumbers
import taboolib.common5.compileJS
import javax.script.SimpleBindings

// 预编译脚本
val script = """
    function calculate(a, b) {
        return a * b + c;
    }
    calculate(x, y);
""".trimIndent().compileJS()

// 执行脚本，传入变量
val bindings = SimpleBindings().apply {
    put("x", 10)
    put("y", 5)
    put("c", 3)
}

val result = script?.eval(bindings)
println(result)  // 输出: 53 (10 * 5 + 3)
```

**使用场景：**
- 需要重复执行相同脚本
- 性能敏感的场景
- 启动时预编译常用脚本

:::tip[性能优化]

预编译可以显著提升性能，编译后的脚本可以多次执行，避免重复解析。

:::

## 基础用法

### 示例 1：简单表达式计算

```kotlin title="SimpleCalculation.kt" showLineNumbers
@file:RuntimeDependencies(
    RuntimeDependency(
        "!org.openjdk.nashorn:nashorn-core:15.4",
        test = "!jdk.nashorn.api.scripting.NashornScriptEngineFactory"
    )
)

package com.example.plugin

import taboolib.common5.scriptEngine
import javax.script.SimpleBindings

fun calculateExpression(formula: String, variables: Map<String, Any>): Any? {
    // 创建变量上下文
    val bindings = SimpleBindings(variables)

    // 执行表达式
    return scriptEngine.eval(formula, bindings)
}

// 使用示例
val result = calculateExpression(
    "Math.sqrt(a * a + b * b)",  // 计算斜边长度
    mapOf("a" to 3, "b" to 4)
)
println("斜边长度: $result")  // 输出: 斜边长度: 5.0
```

### 示例 2：调用 JavaScript 函数

```kotlin title="JavaScriptFunction.kt" showLineNumbers
import taboolib.common5.scriptEngine
import javax.script.Invocable

// 定义 JavaScript 函数
scriptEngine.eval("""
    function greet(name, title) {
        return 'Hello, ' + title + ' ' + name + '!';
    }

    function formatNumber(num) {
        return num.toLocaleString('en-US');
    }
""")

// 调用 JavaScript 函数
val invocable = scriptEngine as Invocable

val greeting = invocable.invokeFunction("greet", "Steve", "Mr.")
println(greeting)  // 输出: Hello, Mr. Steve!

val formatted = invocable.invokeFunction("formatNumber", 1234567)
println(formatted)  // 输出: 1,234,567
```

**关键点：**
- 使用 `Invocable` 接口调用已定义的 JavaScript 函数
- `invokeFunction(函数名, 参数...)`

### 示例 3：在 JavaScript 中使用 Java 对象

```kotlin title="JavaInterop.kt" showLineNumbers
import taboolib.common5.scriptEngine
import javax.script.SimpleBindings

data class Player(
    val name: String,
    var level: Int,
    var exp: Int
) {
    fun levelUp() {
        level++
        exp = 0
    }

    fun getTitle() = "Lv.$level $name"
}

// 创建 Player 对象
val player = Player("Steve", 10, 500)

// 在 JavaScript 中操作 Java 对象
val script = """
    // 访问属性
    var currentLevel = player.level;
    var currentExp = player.exp;

    // 调用方法
    if (currentExp >= 1000) {
        player.levelUp();
    }

    // 返回对象
    {
        title: player.getTitle(),
        level: player.level,
        exp: player.exp
    }
"""

val bindings = SimpleBindings().apply {
    put("player", player)
}

val result = scriptEngine.eval(script, bindings)
println(result)
```

**说明：**
- JavaScript 可以直接访问 Java/Kotlin 对象的公开属性和方法
- 支持 Kotlin data class 的属性访问
- 可以修改可变属性（`var`）

## 进阶功能

### 使用 Java 类和静态方法

在 JavaScript 中导入和使用 Java 类：

```kotlin title="JavaTypes.kt" showLineNumbers
import taboolib.common5.scriptEngine

val script = """
    // 导入 Java 类
    var ArrayList = Java.type('java.util.ArrayList');
    var Math = Java.type('java.lang.Math');
    var System = Java.type('java.lang.System');

    // 使用 ArrayList
    var list = new ArrayList();
    list.add('Apple');
    list.add('Banana');
    list.add('Cherry');

    // 使用 Math
    var pi = Math.PI;
    var sqrt = Math.sqrt(16);

    // 返回结果
    {
        listSize: list.size(),
        pi: pi,
        sqrt: sqrt
    }
"""

val result = scriptEngine.eval(script)
println(result)
```

**Java.type 语法：**
- `Java.type('完整类名')`：导入 Java 类
- `new ClassName()`：创建实例
- `ClassName.staticMethod()`：调用静态方法

### 预编译与缓存

对于频繁执行的脚本，使用预编译提升性能：

```kotlin title="CompiledScriptCache.kt" showLineNumbers
import taboolib.common5.compileJS
import javax.script.CompiledScript
import javax.script.SimpleBindings

object ScriptCache {
    // 脚本缓存
    private val cache = mutableMapOf<String, CompiledScript?>()

    /**
     * 获取编译后的脚本（带缓存）
     */
    fun getScript(code: String): CompiledScript? {
        return cache.getOrPut(code) {
            code.compileJS()
        }
    }

    /**
     * 执行脚本
     */
    fun execute(code: String, variables: Map<String, Any?>): Any? {
        val script = getScript(code) ?: return null
        val bindings = SimpleBindings(variables)
        return script.eval(bindings)
    }
}

// 使用示例
repeat(1000) {
    // 相同的脚本只会编译一次
    val result = ScriptCache.execute(
        "a + b * c",
        mapOf("a" to it, "b" to 2, "c" to 3)
    )
}
```

### 异步脚本执行

在异步任务中执行 JavaScript 脚本：

```kotlin title="AsyncScript.kt" showLineNumbers
import taboolib.common.platform.function.submit
import taboolib.common5.scriptEngine
import javax.script.SimpleBindings

fun executeAsync(script: String, variables: Map<String, Any>, callback: (Any?) -> Unit) {
    submit(async = true) {
        try {
            val bindings = SimpleBindings(variables)
            val result = scriptEngine.eval(script, bindings)

            // 回到主线程执行回调
            submit(async = false) {
                callback(result)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

// 使用示例
executeAsync(
    "Math.pow(base, exp)",
    mapOf("base" to 2, "exp" to 10)
) { result ->
    println("计算结果: $result")  // 输出: 计算结果: 1024.0
}
```

:::warning[线程安全]

`ScriptEngine` 不是线程安全的。在多线程环境中，每个线程应使用独立的引擎实例，或者使用同步机制。

:::

### 脚本沙箱与安全限制

限制脚本访问敏感类和方法：

```kotlin title="ScriptSandbox.kt" showLineNumbers
import jdk.nashorn.api.scripting.ClassFilter
import jdk.nashorn.api.scripting.NashornScriptEngineFactory

// 自定义类过滤器
class SafeClassFilter : ClassFilter {
    override fun exposeToScripts(className: String): Boolean {
        // 禁止访问系统类
        if (className.startsWith("java.lang.System")) return false
        if (className.startsWith("java.lang.Runtime")) return false
        if (className.startsWith("java.io.File")) return false

        // 允许其他类
        return true
    }
}

// 创建安全的脚本引擎
val factory = taboolib.common5.scriptEngineFactory as NashornScriptEngineFactory
val safeEngine = factory.getScriptEngine(SafeClassFilter())

// 测试
try {
    // 这会被阻止
    safeEngine.eval("var System = Java.type('java.lang.System'); System.exit(0);")
} catch (e: Exception) {
    println("已阻止危险操作: ${e.message}")
}

// 允许的操作
val result = safeEngine.eval("1 + 2 + 3")
println("安全计算: $result")  // 输出: 安全计算: 6
```

## 最佳实践示例

### 场景 1：动态技能效果系统

实现一个可配置的技能效果脚本系统：

```kotlin title="SkillSystem.kt" showLineNumbers
@file:RuntimeDependencies(
    RuntimeDependency(
        "!org.openjdk.nashorn:nashorn-core:15.4",
        test = "!jdk.nashorn.api.scripting.NashornScriptEngineFactory"
    )
)

package com.example.plugin

import taboolib.common5.compileJS
import taboolib.module.configuration.Config
import taboolib.module.configuration.Configuration
import taboolib.common.LifeCycle
import taboolib.common.platform.Awake
import javax.script.CompiledScript
import javax.script.SimpleBindings

object SkillSystem {

    @Config
    lateinit var config: Configuration

    // 技能脚本缓存
    private val skills = mutableMapOf<String, CompiledScript>()

    @Awake(LifeCycle.ENABLE)
    fun loadSkills() {
        config.getConfigurationSection("skills")?.getKeys(false)?.forEach { skillId ->
            val script = config.getString("skills.$skillId.script") ?: return@forEach

            // 预编译技能脚本
            skills[skillId] = script.compileJS() ?: return@forEach
        }
    }

    /**
     * 执行技能
     */
    fun castSkill(skillId: String, caster: Player, target: LivingEntity): SkillResult {
        val script = skills[skillId] ?: error("技能 $skillId 不存在")

        // 创建脚本上下文
        val bindings = SimpleBindings().apply {
            put("caster", caster)
            put("target", target)
            put("world", caster.world)
            put("Math", java.lang.Math)
        }

        // 执行脚本
        val result = script.eval(bindings)

        return SkillResult.fromScriptResult(result)
    }
}

data class SkillResult(
    val damage: Double,
    val effects: List<String>,
    val message: String
) {
    companion object {
        fun fromScriptResult(obj: Any?): SkillResult {
            // 处理脚本返回的对象
            val map = obj as? Map<*, *> ?: return SkillResult(0.0, emptyList(), "")

            return SkillResult(
                damage = (map["damage"] as? Number)?.toDouble() ?: 0.0,
                effects = (map["effects"] as? List<*>)?.mapNotNull { it as? String } ?: emptyList(),
                message = map["message"] as? String ?: ""
            )
        }
    }
}

// 配置文件 config.yml
/*
skills:
  fireball:
    name: "火球术"
    script: |
      var damage = caster.level * 10 + Math.random() * 20;
      var distance = caster.location.distance(target.location);

      // 距离衰减
      if (distance > 10) {
          damage = damage * (10 / distance);
      }

      // 施加燃烧效果
      target.fireTicks = 100;

      // 返回技能结果
      ({
          damage: damage,
          effects: ['FIRE'],
          message: caster.name + ' 对 ' + target.name + ' 造成了 ' + damage.toFixed(1) + ' 点火焰伤害！'
      })

  heal:
    name: "治疗术"
    script: |
      var healAmount = caster.level * 5 + 20;
      var maxHealth = target.maxHealth;
      var currentHealth = target.health;

      // 不能超过最大生命值
      var actualHeal = Math.min(healAmount, maxHealth - currentHealth);
      target.health = currentHealth + actualHeal;

      ({
          damage: -actualHeal,
          effects: ['REGENERATION'],
          message: caster.name + ' 为 ' + target.name + ' 恢复了 ' + actualHeal.toFixed(1) + ' 点生命值！'
      })
*/
```

### 场景 2：表达式配置系统

实现一个基于 JavaScript 表达式的配置计算系统：

```kotlin title="ExpressionConfig.kt" showLineNumbers
import taboolib.common5.scriptEngine
import taboolib.module.configuration.Configuration
import javax.script.SimpleBindings

object ExpressionConfig {

    /**
     * 解析配置中的表达式
     * 支持在配置中使用 ${} 包裹的表达式
     */
    fun parseExpression(config: Configuration, path: String, context: Map<String, Any>): Any? {
        val value = config.getString(path) ?: return null

        // 匹配 ${...} 表达式
        val regex = """\$\{([^}]+)}""".toRegex()

        return regex.replace(value) { matchResult ->
            val expression = matchResult.groupValues[1]

            // 执行表达式
            val bindings = SimpleBindings(context)
            val result = scriptEngine.eval(expression, bindings)

            result?.toString() ?: ""
        }
    }

    /**
     * 批量解析配置节
     */
    fun parseSection(config: Configuration, section: String, context: Map<String, Any>): Map<String, Any?> {
        val result = mutableMapOf<String, Any?>()

        config.getConfigurationSection(section)?.getKeys(false)?.forEach { key ->
            result[key] = parseExpression(config, "$section.$key", context)
        }

        return result
    }
}

// 配置文件示例
/*
messages:
  welcome: "欢迎 ${player.name}，你的等级是 ${player.level}"
  coins: "你有 ${player.money.toFixed(2)} 金币"
  online: "当前在线: ${server.onlinePlayers.size()} / ${server.maxPlayers}"

shop:
  price_sword: "${basePrice * (1 + vipLevel * 0.1)}"
  price_armor: "${basePrice * 2 * discountRate}"
*/

// 使用示例
fun sendWelcomeMessage(player: Player) {
    val context = mapOf(
        "player" to player,
        "server" to Bukkit.getServer()
    )

    val message = ExpressionConfig.parseExpression(config, "messages.welcome", context)
    player.sendMessage(message.toString())
}
```

### 场景 3：条件触发器系统

实现一个灵活的事件条件触发系统：

```kotlin title="TriggerSystem.kt" showLineNumbers
import taboolib.common5.compileJS
import javax.script.CompiledScript
import javax.script.SimpleBindings

data class Trigger(
    val id: String,
    val condition: CompiledScript,
    val actions: List<String>
)

object TriggerSystem {

    private val triggers = mutableListOf<Trigger>()

    /**
     * 注册触发器
     */
    fun register(id: String, condition: String, actions: List<String>) {
        val compiled = condition.compileJS() ?: error("无效的条件表达式: $condition")

        triggers.add(Trigger(id, compiled, actions))
    }

    /**
     * 检查触发器
     */
    fun check(event: String, context: Map<String, Any>): List<Trigger> {
        val triggered = mutableListOf<Trigger>()

        for (trigger in triggers) {
            try {
                val bindings = SimpleBindings(context).apply {
                    put("event", event)
                }

                val result = trigger.condition.eval(bindings)

                // 检查条件是否满足
                val satisfied = when (result) {
                    is Boolean -> result
                    is Number -> result.toInt() > 0
                    else -> false
                }

                if (satisfied) {
                    triggered.add(trigger)
                }
            } catch (e: Exception) {
                println("触发器 ${trigger.id} 执行失败: ${e.message}")
            }
        }

        return triggered
    }

    /**
     * 执行动作
     */
    fun executeActions(trigger: Trigger, context: Map<String, Any>) {
        trigger.actions.forEach { action ->
            println("执行动作: $action")
            // 实际执行逻辑...
        }
    }
}

// 使用示例
fun setupTriggers() {
    // 玩家等级达到 10 级时触发
    TriggerSystem.register(
        "level_10",
        "event === 'LEVEL_UP' && player.level >= 10",
        listOf("give_reward", "send_message")
    )

    // 玩家连续登录 7 天时触发
    TriggerSystem.register(
        "login_streak_7",
        "event === 'PLAYER_JOIN' && player.loginStreak >= 7",
        listOf("give_vip", "broadcast")
    )

    // 击败 Boss 时触发
    TriggerSystem.register(
        "boss_kill",
        "event === 'ENTITY_DEATH' && entity.type === 'ENDER_DRAGON'",
        listOf("announce_victory", "give_title")
    )
}

// 事件监听
fun onPlayerLevelUp(player: Player) {
    val context = mapOf("player" to player)

    val triggered = TriggerSystem.check("LEVEL_UP", context)

    triggered.forEach { trigger ->
        TriggerSystem.executeActions(trigger, context)
    }
}
```

### 场景 4：自定义脚本 API

为脚本提供自定义的 API 对象：

```kotlin title="ScriptAPI.kt" showLineNumbers
import taboolib.common5.scriptEngine
import javax.script.SimpleBindings

// 自定义脚本 API
object ScriptAPI {
    /**
     * 延迟执行
     */
    fun delay(ticks: Long, action: Runnable) {
        submit(delay = ticks) {
            action.run()
        }
    }

    /**
     * 广播消息
     */
    fun broadcast(message: String) {
        Bukkit.broadcastMessage(message)
    }

    /**
     * 生成随机数
     */
    fun random(min: Int, max: Int): Int {
        return (min..max).random()
    }

    /**
     * 获取在线玩家
     */
    fun getOnlinePlayers(): List<Player> {
        return Bukkit.getOnlinePlayers().toList()
    }
}

// 脚本执行器
object ScriptExecutor {
    /**
     * 执行脚本，注入自定义 API
     */
    fun execute(script: String, additionalContext: Map<String, Any> = emptyMap()): Any? {
        val bindings = SimpleBindings(additionalContext).apply {
            // 注入自定义 API
            put("API", ScriptAPI)
            put("server", Bukkit.getServer())
            put("console", Bukkit.getConsoleSender())
        }

        return scriptEngine.eval(script, bindings)
    }
}

// 示例脚本
val exampleScript = """
    // 使用自定义 API
    var randomPlayer = API.getOnlinePlayers()[API.random(0, API.getOnlinePlayers().size() - 1)];

    API.broadcast('随机选中了玩家: ' + randomPlayer.name);

    // 延迟 5 秒后执行
    API.delay(100, function() {
        randomPlayer.sendMessage('你被选中了！');
    });
"""

// 执行
ScriptExecutor.execute(exampleScript)
```

## 常见问题

### JavaScript 引擎是否线程安全？

`ScriptEngine` **不是线程安全的**。在多线程环境中：

```kotlin
// ❌ 错误：多线程共享一个引擎
val sharedEngine = scriptEngine
thread { sharedEngine.eval("1 + 1") }  // 可能出错

// ✅ 正确：每个线程使用独立引擎
thread {
    val localEngine = taboolib.common5.scriptEngineFactory.scriptEngine
    localEngine.eval("1 + 1")
}
```

### compileJS 返回 null 怎么办？

`compileJS` 在以下情况返回 `null`：
1. 引擎不支持编译（非 Compilable）
2. 脚本语法错误

```kotlin
val script = "invalid javascript code".compileJS()

if (script == null) {
    println("脚本编译失败")
    // 回退到直接执行
    scriptEngine.eval("valid code")
}
```

### 如何在 JavaScript 中创建 Java 数组？

使用 `Java.to` 方法：

```kotlin
val script = """
    // 创建 Java 数组
    var javaArray = Java.to([1, 2, 3, 4, 5], "int[]");

    // 创建字符串数组
    var stringArray = Java.to(['a', 'b', 'c'], "java.lang.String[]");

    javaArray.length;  // 返回 5
"""

val result = scriptEngine.eval(script)
```

### 如何处理 JavaScript 异常？

使用 try-catch 捕获异常：

```kotlin
import javax.script.ScriptException

try {
    val result = scriptEngine.eval("undefined.property")
} catch (e: ScriptException) {
    println("脚本错误: ${e.message}")
    println("行号: ${e.lineNumber}")
    println("列号: ${e.columnNumber}")
}
```

### JavaScript 和 Java 类型如何转换？

**基本类型：**
- JavaScript 数字 → Java `Number` (Double/Integer)
- JavaScript 字符串 → Java `String`
- JavaScript 布尔 → Java `Boolean`
- JavaScript 对象 → Java `Map`
- JavaScript 数组 → Java `List`

```kotlin
val script = """
    ({
        number: 123,
        text: 'hello',
        flag: true,
        array: [1, 2, 3],
        object: { key: 'value' }
    })
"""

val result = scriptEngine.eval(script) as Map<*, *>

val number = (result["number"] as Number).toInt()  // 123
val text = result["text"] as String                  // "hello"
val flag = result["flag"] as Boolean                 // true
val array = result["array"] as List<*>               // [1, 2, 3]
```

### 如何优化脚本执行性能？

1. **预编译常用脚本**

```kotlin
val compiled = "a + b * c".compileJS()

// 重复执行
repeat(1000) {
    compiled?.eval(SimpleBindings(mapOf("a" to it, "b" to 2, "c" to 3)))
}
```

2. **缓存编译结果**

```kotlin
val cache = mutableMapOf<String, CompiledScript?>()

fun getCachedScript(code: String) = cache.getOrPut(code) { code.compileJS() }
```

3. **减少引擎创建**

```kotlin
// ✅ 好：复用引擎
val engine = scriptEngine
repeat(100) { engine.eval("1 + 1") }

// ❌ 坏：频繁创建
repeat(100) {
    val newEngine = scriptEngineFactory.scriptEngine
    newEngine.eval("1 + 1")
}
```

### Nashorn 在 JDK 15+ 中被移除了吗？

是的，Nashorn 在 JDK 15 中被标记为移除。TabooLib 的解决方案：

1. **JDK 8-14**：使用内置 Nashorn
2. **JDK 15+**：自动下载独立版 `nashorn-core:15.4`

:::info[自动适配]

TabooLib 会自动检测 JDK 版本并选择合适的 Nashorn 引擎，无需手动配置。

:::

### 如何在脚本中使用 Kotlin 扩展函数？

Kotlin 扩展函数在 Java/JavaScript 中不可见。需要提供包装对象：

```kotlin
// Kotlin 扩展函数
fun Player.giveCoins(amount: Int) {
    // 给予金币
}

// 创建包装对象
object PlayerUtils {
    fun giveCoins(player: Player, amount: Int) {
        player.giveCoins(amount)
    }
}

// 在脚本中使用
scriptEngine.put("PlayerUtils", PlayerUtils)
scriptEngine.eval("PlayerUtils.giveCoins(player, 100)")
```

### 能否在脚本中使用 ES6+ 特性？

Nashorn 仅支持 **ECMAScript 5.1**，不支持 ES6+ 特性：

❌ 不支持：
- `let`/`const`
- 箭头函数 `() =>`
- `Promise`
- `async`/`await`
- 模板字符串 `` `${var}` ``

✅ 支持：
- `var`
- `function`
- 传统对象和数组

如需 ES6+ 支持，考虑使用 GraalVM 的 JavaScript 引擎。
