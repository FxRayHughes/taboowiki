---
title: Kether 脚本引擎
sidebar_label: Kether 脚本
sidebar_position: 3
description: TabooLib Kether 脚本引擎完整指南
---

# Kether 脚本引擎

## 基本概念

Kether 是 TabooLib 内置的一套功能强大的脚本语言，专为 Minecraft 插件开发设计。它提供了简洁的语法、丰富的内置功能和强大的扩展能力。

**项目历史：**
- 最初由 **海螺** 开发，设计了带栈的脚本语法解释器
- 后续由 **坏黑** 进行二次开发
- 现已集成到 TabooLib 作为官方脚本引擎

**核心特点：**
- 基于栈的脚本解释器设计
- 专为 Minecraft 设计的脚本语言
- 简洁易懂的自然语言风格语法
- 支持变量、循环、条件等控制结构
- 可以直接操作玩家、物品、实体等游戏对象
- 支持自定义语句扩展
- 内置脚本缓存机制
- 异步执行支持

## 语法列表

完整的 Kether 语法列表请查看：[Kether 语法列表](https://taboo.8aka.org/kether-list)

## 核心 API

### KetherShell - 脚本执行器

`KetherShell` 是执行 Kether 脚本的核心类。

```kotlin title="执行脚本" showLineNumbers
import taboolib.module.kether.KetherShell
import taboolib.module.kether.ScriptOptions

// 基础用法
val result = KetherShell.eval("tell 'Hello World!'").join()

// 带参数的执行
val result = KetherShell.eval(
    "tell 'Hello, ' + name",
    ScriptOptions.new {
        sender(player)
        set("name", "Steve")
    }
).join()
```

**eval 方法签名：**

```kotlin
fun eval(
    source: String,
    options: ScriptOptions = ScriptOptions()
): CompletableFuture<Any?>
```

### ScriptOptions - 脚本选项

`ScriptOptions` 用于配置脚本执行的各种参数。

```kotlin title="ScriptOptions 配置" showLineNumbers
val options = ScriptOptions.new {
    // 设置脚本执行者
    sender(player)

    // 设置变量
    set("name", "Steve")
    set("level", 10)

    // 批量设置变量
    vars(mapOf("hp" to 20.0, "mp" to 100.0))

    // 设置命名空间（优先使用指定命名空间的语句）
    namespace(listOf("myplugin"))

    // 是否使用缓存（默认 true）
    useCache(true)

    // 是否在沙盒中执行（不抛出异常，默认 false）
    sandbox(false)

    // 是否打印详细错误信息
    detailError(true)
}

KetherShell.eval("tell 'Hello!'", options).join()
```

**ScriptOptions 方法列表：**

| 方法 | 参数 | 说明 |
|-----|------|------|
| `sender(Any)` | 执行者对象 | 设置脚本执行者（Player 等） |
| `set(String, Any?)` | 键，值 | 设置单个变量 |
| `vars(Map)` | 变量映射 | 批量设置变量 |
| `vars(vararg Pair)` | 键值对 | 使用 Pair 设置变量 |
| `namespace(List)` | 命名空间列表 | 设置优先命名空间 |
| `useCache(Boolean)` | 是否缓存 | 控制脚本是否缓存（默认 true） |
| `sandbox(Boolean)` | 沙盒模式 | 错误时不抛异常（默认 false） |
| `detailError(Boolean)` | 详细错误 | 打印详细错误堆栈（默认 false） |
| `cache(Cache)` | 缓存容器 | 自定义缓存容器 |

### KetherFunction - 内联脚本解析

`KetherFunction` 用于在字符串中嵌入 Kether 脚本，类似于模板引擎。

```kotlin title="内联脚本示例" showLineNumbers
import taboolib.module.kether.KetherFunction
import taboolib.module.kether.ScriptOptions

// 在字符串中使用 {{ }} 包裹脚本
val text = "你好，{{player name}}！你的等级是 {{player level}}"

val result = KetherFunction.parse(
    text,
    ScriptOptions.new {
        sender(player)
    }
)

println(result)  // 输出: 你好，Steve！你的等级是 10
```

**使用场景：**
- 配置文件中的动态文本
- 消息模板
- 动态生成的文本内容

**语法：**
- 使用 `{{ }}` 包裹 Kether 脚本
- 脚本会被执行，结果替换 `{{ }}` 部分
- 支持嵌套的 `{{ }}`

:::tip[parse 与 eval 的区别]

- `KetherShell.eval()`：执行完整的 Kether 脚本，返回结果
- `KetherFunction.parse()`：解析字符串中的内联脚本，替换并返回字符串

:::

## Kether 脚本语法基础

### 基本语法规则

```
# 单行脚本
tell "Hello World!"

# 多行脚本需要用 def main = { } 包裹
def main = {
    tell "第一行"
    tell "第二行"
}

# 设置变量
set name to "Steve"
tell name

# 获取变量
set level to player level
tell "等级: " + level
```

**关键点：**
- 单行脚本可以直接执行
- 多行脚本需要 `def main = { }` 包裹
- 使用 `set ... to ...` 设置变量
- 使用变量名直接引用变量
- 使用 `+` 连接字符串

### 内置数据类型

Kether 支持以下数据类型：

```kotlin
# 字符串
"Hello World"
'单引号字符串'

# 数字
100          # 整数
1.5          # 小数
10L          # Long 类型
3.14F        # Float 类型

# 布尔值
true
false

# 列表
[ 1, 2, 3, 4, 5 ]
[ "apple", "banana", "cherry" ]

# null
null
```

### 注释

```
# 这是单行注释
tell "Hello"  # 行尾注释
```

## 变量操作

### 设置变量

```
# 基本赋值
set name to "Steve"
set level to 10

# 从表达式获取值
set health to player health
set location to player location

# 计算表达式
set total to 10 + 20
set result to level * 2
```

### 获取变量

```
# 直接使用变量名
tell name
tell "等级: " + level

# 在表达式中使用
set newLevel to level + 5
```

### 变量作用域

```kotlin title="变量作用域示例"
// 通过 ScriptOptions 设置的变量是全局变量
val options = ScriptOptions.new {
    set("globalVar", "全局")
}

// 在脚本中设置的变量是局部变量
val script = """
    set localVar to "局部"
    tell globalVar
    tell localVar
"""

KetherShell.eval(script, options).join()
```

**作用域规则：**
- 通过 `ScriptOptions.set()` 设置的变量是全局变量
- 在脚本中使用 `set` 创建的变量是局部变量
- 局部变量在脚本执行结束后销毁

## 控制流语句

### if - 条件判断

```
# 基本 if 语句
if player level >= 10 then {
    tell "你的等级足够高！"
}

# if-else 语句
if player health < 10 then {
    tell "生命值过低！"
} else {
    tell "生命值正常"
}

# 多重条件
if player level >= 20 then {
    tell "高级玩家"
} else if player level >= 10 then {
    tell "中级玩家"
} else {
    tell "新手玩家"
}
```

### check - 条件检查

```
# 单行条件执行
check player level >= 10 then tell "等级达标！"

# 带 else
check player health > 0 then tell "存活" else tell "死亡"
```

## 循环语句

### while - 条件循环

```
set count to 0
while count < 5 {
    tell "计数: " + count
    set count to count + 1
}
```

### for - 遍历循环

```
# 遍历数字范围
for num in range 1 to 5 {
    tell "数字: " + num
}

# 遍历列表
set items to [ "apple", "banana", "cherry" ]
for item in items {
    tell "物品: " + item
}
```

### repeat - 重复执行

```
# 重复 5 次
repeat 5 times {
    tell "重复执行"
}
```

## 数学运算

### 基本运算

```
set result to 10 + 5      # 加法: 15
set result to 10 - 5      # 减法: 5
set result to 10 * 5      # 乘法: 50
set result to 10 / 5      # 除法: 2
set result to 10 % 3      # 取模: 1
set result to 2 ^ 3       # 幂运算: 8
```

### 比较运算

```
10 > 5        # 大于: true
10 < 5        # 小于: false
10 >= 10      # 大于等于: true
10 <= 5       # 小于等于: false
10 == 10      # 等于: true
10 != 5       # 不等于: true
```

### 逻辑运算

```
true && false    # 逻辑与: false
true || false    # 逻辑或: true
!true            # 逻辑非: false

# 复合条件
if player level >= 10 && player health > 50 then {
    tell "状态良好"
}
```

## 玩家操作

### 获取玩家信息

```
# 玩家名称
set name to player name

# 玩家等级
set level to player level

# 玩家生命值
set health to player health

# 玩家位置
set location to player location
```

### 修改玩家属性

```
# 设置生命值
give player health 20.0

# 设置等级
give player level 10

# 传送玩家
teleport player to 0 64 0
```

## 输出语句

### tell - 发送消息

```
# 发送给当前执行者
tell "Hello World!"

# 发送给指定玩家
tell player "Steve" with "你好！"

# 彩色消息
tell "&a绿色消息 &c红色消息"
```

### log/print - 控制台输出

```
# 输出到控制台（info 级别）
log "这是一条日志"
print "打印信息"

# 警告级别
warn "这是警告"

# 错误级别
error "这是错误"
```

## 注册自定义语句

Kether 支持通过两种方式注册自定义语句：`scriptParser` 和 `combinationParser`。

### @KetherParser 注解

使用 `@KetherParser` 注解标记解析器函数：

```kotlin
@KetherParser(
    value = ["example"],           // 语句关键词（必填）
    namespace = "myplugin",         // 命名空间（默认 "kether"）
    shared = true                   // 是否共享给其他插件（默认 false）
)
```

**参数说明：**

| 参数 | 类型 | 说明 |
|-----|------|------|
| `value` | `Array<String>` | 语句关键词，可以有多个别名 |
| `namespace` | `String` | 命名空间，用于避免冲突 |
| `shared` | `Boolean` | 是否允许其他插件使用 |

### scriptParser - 简单解析器

`scriptParser` 适合处理简单的语句。

```kotlin title="SimpleParser.kt" showLineNumbers
@KetherParser(["givecoins"], namespace = "myplugin")
fun parserGiveCoins() = scriptParser {
    GiveCoinsAction(it.nextParsedAction())
}

class GiveCoinsAction(val amount: ParsedAction<*>) : ScriptAction<Void>() {

    override fun run(frame: ScriptFrame): CompletableFuture<Void> {
        val player = frame.script().sender?.castSafely<Player>()
            ?: return CompletableFuture.completedFuture(null)

        // 执行 amount 动作并获取数值
        frame.newFrame(amount).run<Any>().thenAccept { value ->
            val coins = (value as Number).toInt()
            player.sendMessage("你获得了 $coins 金币！")
        }

        return CompletableFuture.completedFuture(null)
    }
}

// 使用示例：givecoins 100
```

**关键点：**
- `it` 是 `QuestReader` 对象
- 使用 `nextParsedAction()` 获取下一个动作
- 返回一个继承自 `ScriptAction` 的对象

### combinationParser - 组合解析器

`combinationParser` 提供更强大的参数解析能力，适合复杂的语句。

```kotlin title="CombinationParserExample.kt" showLineNumbers
@KetherParser(["tell"], namespace = "myplugin")
fun parserTell() = combinationParser {
    it.group(text()).apply(it) { message ->
        now {
            script().sender?.sendMessage(message)
        }
    }
}

// 使用: tell "Hello World!"
```

**方法列表：**

| 方法 | 说明 |
|-----|------|
| `action()` | 动作语句 |
| `text()` | 文本（可以是动作） |
| `int()` | Int 类型 |
| `long()` | Long 类型 |
| `bool()` | Boolean 类型 |
| `any()` | 任意类型 |

**多个参数示例：**

```kotlin title="GiveItemAction.kt" showLineNumbers
// 语法: giveitem <player> <item> <amount>
@KetherParser(["giveitem"], namespace = "myplugin")
fun parserGiveItem() = combinationParser {
    it.group(text(), text(), int()).apply(it) { playerName, itemType, amount ->
        now {
            val player = Bukkit.getPlayerExact(playerName) ?: error("玩家不存在")
            val material = Material.valueOf(itemType.uppercase())
            val item = ItemStack(material, amount)

            player.inventory.addItem(item)
            player.sendMessage("你获得了 $amount 个 $itemType")
        }
    }
}

// 使用: giveitem "Steve" "diamond" 64
```

## 最佳实践示例

### 场景 1：任务系统

实现一个简单的任务系统：

```kotlin title="QuestSystem.kt" showLineNumbers
object QuestSystem {

    // 从配置文件加载任务脚本
    fun loadQuest(questId: String): List<String> {
        return config.getStringList("quests.$questId.script")
    }

    // 执行任务脚本
    fun executeQuest(player: Player, questId: String) {
        val script = loadQuest(questId)

        KetherShell.eval(
            script,
            ScriptOptions.new {
                sender(player)
                set("questId", questId)
                set("questName", config.getString("quests.$questId.name"))
            }
        ).thenAccept { result ->
            player.sendMessage("§a任务完成！")
        }
    }
}

// 配置文件 config.yml
/*
quests:
  daily_login:
    name: "每日登录"
    script:
      - "tell '&a欢迎回来，' + player name + '!'"
      - "give player exp 100"
      - "log player name + ' 完成了每日登录任务'"
*/
```

### 场景 2：条件奖励系统

根据玩家等级给予不同奖励：

```kotlin title="RewardSystem.kt" showLineNumbers
val rewardScript = """
    if player level >= 30 then {
        give player item diamond 10
        tell '&a恭喜！你获得了 10 颗钻石！'
    } else if player level >= 20 then {
        give player item gold_ingot 20
        tell '&a你获得了 20 个金锭！'
    } else if player level >= 10 then {
        give player item iron_ingot 30
        tell '&a你获得了 30 个铁锭！'
    } else {
        give player exp 50
        tell '&a你获得了 50 经验！'
    }
"""

KetherShell.eval(rewardScript, ScriptOptions.new {
    sender(player)
}).join()
```

### 场景 3：配置文件中的动态消息

在配置文件中使用 Kether 脚本：

```kotlin title="MessageConfig.kt" showLineNumbers
object MessageConfig {

    fun sendMessage(player: Player, key: String) {
        val template = config.getString("messages.$key") ?: return

        val result = KetherFunction.parse(
            template,
            ScriptOptions.new {
                sender(player)
            }
        )

        player.sendMessage(result)
    }
}

// 配置文件 messages.yml
/*
messages:
  welcome: "&a欢迎，{{player name}}！你的等级是 {{player level}}"
  health: "&c你当前的生命值：{{player health}}/{{player max-health}}"
  location: "&e你在 {{player location world}} 的 {{player location x}}, {{player location y}}, {{player location z}}"
*/

// 使用
MessageConfig.sendMessage(player, "welcome")
```

## 常见问题

### 如何执行多行脚本？

**方式 1：使用列表**

```kotlin
val script = listOf(
    "tell '第一行'",
    "tell '第二行'",
    "tell '第三行'"
)

KetherShell.eval(script).join()
```

**方式 2：使用 def main**

```kotlin
val script = """
    def main = {
        tell '第一行'
        tell '第二行'
    }
"""

KetherShell.eval(script).join()
```

### 如何获取脚本执行结果？

```kotlin
val result = KetherShell.eval("player level").join()
val level = (result as Number).toInt()
println("玩家等级: $level")
```

### 如何处理脚本错误？

**方式 1：使用 try-catch**

```kotlin
try {
    KetherShell.eval("invalid script").join()
} catch (e: Exception) {
    println("脚本错误: ${e.message}")
}
```

**方式 2：使用沙盒模式**

```kotlin
val result = KetherShell.eval(
    "invalid script",
    ScriptOptions.new {
        sandbox(true)          // 不抛出异常
        detailError(true)      // 打印详细错误
    }
).join()

// result 为 null 表示执行失败
```

### 脚本中如何使用 Kotlin/Java 对象？

通过变量传入对象：

```kotlin
data class PlayerData(val name: String, val coins: Int)

val playerData = PlayerData("Steve", 100)

KetherShell.eval(
    "tell 'Name: ' + data.name + ', Coins: ' + data.coins",
    ScriptOptions.new {
        sender(player)
        set("data", playerData)
    }
).join()
```

### 如何优化脚本性能？

**1. 启用缓存（默认启用）**

```kotlin
ScriptOptions.new {
    useCache(true)  // 默认值
}
```

**2. 预编译常用脚本**

```kotlin
val cache = KetherShell.Cache()

// 首次执行会缓存
KetherShell.eval("tell 'Hello'", ScriptOptions.new {
    cache(cache)
}).join()

// 后续执行从缓存获取
repeat(1000) {
    KetherShell.eval("tell 'Hello'", ScriptOptions.new {
        cache(cache)
    }).join()
}
```

**3. 避免在循环中执行脚本**

```kotlin
// ❌ 不好：每次都执行脚本
repeat(1000) {
    KetherShell.eval("player level").join()
}

// ✅ 好：只执行一次
val level = KetherShell.eval("player level").join()
repeat(1000) {
    // 使用 level 变量
}
```

### Kether 脚本可以调用 Java 方法吗？

可以！通过变量传入对象后，可以调用其公开方法：

```kotlin
// 注册自定义语句来调用方法
@KetherParser(["math"], namespace = "myplugin")
fun parserMath() = combinationParser {
    it.group(text(), int()).apply(it) { method, value ->
        now {
            when (method) {
                "sqrt" -> kotlin.math.sqrt(value.toDouble())
                "abs" -> kotlin.math.abs(value)
                else -> error("未知方法")
            }
        }
    }
}

// 使用: set result to math "sqrt" 16
```

### 如何在脚本中使用异步操作？

在自定义语句中返回 `CompletableFuture`：

```kotlin
@KetherParser(["asyncquery"], namespace = "myplugin")
fun parserAsyncQuery() = combinationParser {
    it.group(text()).apply(it) { sql ->
        future {
            CompletableFuture.supplyAsync {
                // 异步数据库查询
                DatabaseAPI.query(sql)
            }
        }
    }
}
```

### scriptParser 和 combinationParser 有什么区别？

**scriptParser：**
- 适合简单的语句
- 手动解析参数
- 更灵活但需要自己处理参数

**combinationParser：**
- 适合复杂的参数组合
- 自动解析和验证参数
- 语法更清晰，推荐使用

:::tip[推荐]

对于新的自定义语句，推荐使用 `combinationParser`，它提供了更好的类型安全和代码可读性。

:::
