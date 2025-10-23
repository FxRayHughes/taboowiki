---
title: 条件表达式求值器
sidebar_position: 2
description: 轻量级的逻辑表达式计算工具，专为配置文件中的条件判断场景设计
---

# 条件表达式求值器

条件表达式求值器是一个轻量级的逻辑表达式计算工具，专为配置文件中的条件判断场景设计。

## 设计初衷

在配置文件中经常需要让用户自己进行参数判断，例如 `&amount >= 10`。使用重量级脚本引擎显得笨重，而 Kether
的语法对于简单条件判断又显得过于复杂。因此，条件表达式求值器应运而生。

**核心特点：**

- 轻量级实现，基于双栈算法
- 支持逻辑运算和比较运算
- 支持变量替换
- 简洁的语法规则

## 基础用法

```kotlin
import top.maplex.arim.Arim

// 基本比较运算
Arim.evaluator.evaluate("1 > 2")  // false
Arim.evaluator.evaluate("5 >= 3") // true

// 逻辑运算
Arim.evaluator.evaluate("5 > 3 && 2 < 10") // true

// 使用变量
Arim.evaluator.evaluate("a < 2", "a" to 5) // false

// 使用 Map 传递多个变量
Arim.evaluator.evaluate(
    "level >= 10 && money > 1000",
    mapOf("level" to 15, "money" to 1500)
) // true
```

## 语法规则

### 必须使用空格分隔

**重要：** 表达式中的每个元素（数字、字符串、运算符、括号）都必须用空格分隔。

```kotlin
// ✅ 正确写法
Arim.evaluator.evaluate("var > 5 && var < 10")
Arim.evaluator.evaluate("( 5 > 3 || 2 < 1 ) && 'a' != 'b'")

// ❌ 错误写法（缺少空格）
Arim.evaluator.evaluate("var>5&&var<10")  // 解析错误
```

:::warning[性能考虑]

空格分隔是对性能的让步，使用空格可以简化解析逻辑，符合轻量级设计的初衷。

:::

### 字符串必须加引号

字符串值必须用单引号 `'` 或双引号 `"` 包围：

```kotlin
// ✅ 正确
Arim.evaluator.evaluate("name == 'John'", "name" to "枫溪")

// ❌ 错误
Arim.evaluator.evaluate("name == John")  // 解析错误
```

### 变量无需加引号

```kotlin
// 变量在表达式中直接使用
Arim.evaluator.evaluate("level >= 10", "level" to 15)
Arim.evaluator.evaluate("name == 'Admin'", "name" to "Admin")
```

## 支持的运算符

### 比较运算符

| 运算符  | 说明   | 优先级 | 示例                  |
|------|------|-----|---------------------|
| `>`  | 大于   | 2   | `5 > 3` → `true`    |
| `<`  | 小于   | 2   | `2 < 10` → `true`   |
| `>=` | 大于等于 | 2   | `5 >= 5` → `true`   |
| `<=` | 小于等于 | 2   | `3 <= 5` → `true`   |
| `==` | 等于   | 2   | `10 == 10` → `true` |
| `!=` | 不等于  | 2   | `5 != 3` → `true`   |

### 逻辑运算符

| 运算符    | 说明  | 优先级 | 示例                         |
|--------|-----|-----|----------------------------|
| `&&`   | 逻辑与 | 1   | `true && true` → `true`    |
| `\|\|` | 逻辑或 | 1   | `true \|\| false` → `true` |

### 括号

| 符号  | 说明  | 优先级 |
|-----|-----|-----|
| `(` | 左括号 | 0   |
| `)` | 右括号 | 0   |

## 方法签名

### evaluate - 无变量版本

```kotlin
fun evaluate(expression: String): Boolean
```

**示例：**

```kotlin
val result = Arim.evaluator.evaluate("10 > 5 && 3 < 7")
```

### evaluate - 可变参数版本

```kotlin
fun evaluate(expression: String, vararg variable: Pair<String, Any>): Boolean
```

**示例：**

```kotlin
val result = Arim.evaluator.evaluate(
    "level >= minLevel && score > minScore",
    "level" to 10,
    "minLevel" to 5,
    "score" to 100,
    "minScore" to 50
)
```

### evaluate - Map 参数版本

```kotlin
fun evaluate(expression: String, variable: Map<String, Any>): Boolean
```

**示例：**

```kotlin
val variables = mapOf(
    "level" to 10,
    "minLevel" to 5
)
val result = Arim.evaluator.evaluate("level >= minLevel", variables)
```

## 实际应用示例

### 等级与金币检查

```kotlin
fun checkRequirements(player: Player): Boolean {
    val level = player.level
    val money = economy.getBalance(player)

    return Arim.evaluator.evaluate(
        "level >= 10 && money >= 1000",
        mapOf("level" to level, "money" to money)
    )
}
```

### 配置文件条件

```yaml
rewards:
  diamond:
    item: DIAMOND
    amount: 10
    condition: "level >= 10 && vip == 'true'"
```

```kotlin
fun giveReward(player: Player, condition: String) {
    val variables = mapOf(
        "level" to player.level,
        "vip" to hasVIP(player).toString()
    )

    if (Arim.evaluator.evaluate(condition, variables)) {
        // 给予奖励
    }
}
```

### 多条件组合判断

```kotlin
fun canEnterDungeon(player: Player): Boolean {
    val level = player.level
    val health = player.health
    val hasKey = player.inventory.contains(Material.TRIPWIRE_HOOK)

    // 复杂条件: (等级>=20 或 有钥匙) 且 生命值>10
    return Arim.evaluator.evaluate(
        "( level >= 20 || hasKey == 'true' ) && health > 10",
        mapOf(
            "level" to level,
            "hasKey" to hasKey.toString(),
            "health" to health
        )
    )
}
```

## 常见问题

### 为什么必须使用空格分隔？

空格分隔是性能和简洁性的权衡。使用空格可以简化词法分析，避免复杂的正则表达式或状态机，保持代码轻量。如果需要更复杂的语法，建议使用
Kether 或其他脚本引擎。

### 支持哪些数据类型？

目前支持两种类型：

- **数字**: 所有数字会被解析为 `Double` 类型
- **字符串**: 必须用引号包围的文本

### 表达式出错会抛出异常吗？

是的，格式错误时会抛出 `IllegalArgumentException`。建议添加异常处理：

```kotlin
try {
    val result = Arim.evaluator.evaluate(expression, variables)
    // 处理结果
} catch (e: IllegalArgumentException) {
    logger.warning("条件表达式错误: ${e.message}")
    // 返回默认值或处理错误
}
```
