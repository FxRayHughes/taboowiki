---
title: 符号树变量计算器
sidebar_position: 4
description: 基于抽象语法树的数学表达式计算工具，支持变量替换和公式缓存
---

# 符号树变量计算器

符号树变量计算器（VariableCalculator）是一个基于抽象语法树（AST）的数学表达式计算工具，支持变量替换和公式缓存，特别适合需要重复计算的动态表达式场景。

## 基础用法

### 简单运算（不推荐）

```kotlin
// 不含变量的简单运算
Arim.variableCalculator.calculate("1 + 2 * 3")  // 7.0
```

:::tip[推荐]

这种用法不如使用 [固定算数表达式计算器](../fixed-calculator/)，因为需要额外的解析和构建语法树开销。

:::

### 预解析上下文（推荐）

```kotlin
val vc = Arim.variableCalculator

// 1. 预解析公式为上下文对象（推荐缓存此对象）
val context = vc.parseContext("a + b * ( level + 10 )")

// 2. 使用 Map 传递变量
val result1 = context.evaluate(mapOf(
    "a" to 1.0,
    "b" to 2.0,
    "level" to 3.0
))  // 27.0

// 3. 使用可变参数传递变量
val result2 = context.evaluate(
    "a" to 5.0,
    "b" to 3.0,
    "level" to 10.0
)  // 65.0
```

:::tip[最佳实践]

缓存 `NodeContext` 对象，需要计算时直接传入变量即可。

:::

## 核心概念

### Node - 符号树节点

`Node` 是符号树的基本单元，使用组合模式设计：

| 节点类型 | 说明 | 示例 |
|---------|------|------|
| `ValueNode` | 常量值节点 | `5.0`, `3.14` |
| `DynamicNode` | 变量节点 | `level`, `health` |
| `AdditionNode` | 加法节点 | `a + b` |
| `SubtractionNode` | 减法节点 | `a - b` |
| `MultiplicationNode` | 乘法节点 | `a * b` |
| `DivisionNode` | 除法节点 | `a / b` |
| `ModulusNode` | 取模节点 | `a % b` |

### NodeContext - 解析上下文

`NodeContext` 封装了解析后的符号树，提供便捷的求值方法：

```kotlin
class NodeContext(var node: Node) {
    fun evaluate(variable: Map<String, Double>): Double
    fun evaluate(vararg variables: Pair<String, Double>): Double
}
```

## 方法签名

### parseContext - 解析为上下文（推荐）

```kotlin
fun parseContext(expression: String): NodeContext
```

**示例：**

```kotlin
val context = Arim.variableCalculator.parseContext("a + b * c")

// 缓存 context，重复使用
val result1 = context.evaluate("a" to 1.0, "b" to 2.0, "c" to 3.0)
val result2 = context.evaluate("a" to 5.0, "b" to 4.0, "c" to 2.0)
```

## 实际应用示例

### 伤害计算公式

```kotlin
object DamageCalculator {
    // 缓存解析后的公式
    private val damageFormula = Arim.variableCalculator.parseContext(
        "baseDamage * attackMultiplier * ( 1 + critRate ) - defense"
    )

    fun calculateDamage(
        baseDamage: Double,
        attackMultiplier: Double,
        critRate: Double,
        defense: Double
    ): Double {
        return damageFormula.evaluate(
            "baseDamage" to baseDamage,
            "attackMultiplier" to attackMultiplier,
            "critRate" to critRate,
            "defense" to defense
        )
    }
}
```

### 配置文件公式系统

```yaml
rewards:
  kill_boss:
    gold_formula: "baseGold * bossLevel * ( 1 + playerLevel / 100 )"
```

```kotlin
object RewardSystem {
    private val formulaCache = mutableMapOf<String, NodeContext>()

    fun loadFormulas(config: Configuration) {
        config.getKeys(false).forEach { key ->
            val formula = config.getString("$key.gold_formula")
            if (formula != null) {
                formulaCache[key] = Arim.variableCalculator.parseContext(formula)
            }
        }
    }

    fun calculateReward(rewardType: String, variables: Map<String, Double>): Double {
        return formulaCache[rewardType]?.evaluate(variables) ?: 0.0
    }
}
```

## 性能优化

### 缓存 NodeContext

```kotlin
// ✅ 推荐: 缓存 NodeContext
object Calculator {
    private val formula = Arim.variableCalculator.parseContext("a + b * c")

    fun calculate(a: Double, b: Double, c: Double): Double {
        return formula.evaluate("a" to a, "b" to b, "c" to c)
    }
}

// ❌ 不推荐: 每次都解析
fun calculate(a: Double, b: Double, c: Double): Double {
    val formula = Arim.variableCalculator.parseContext("a + b * c")
    return formula.evaluate("a" to a, "b" to b, "c" to c)
}
```

### 性能对比

| 操作 | 耗时 | 说明 |
|-----|------|------|
| 首次解析 | ~10-50μs | 构建符号树 |
| 缓存后求值 | ~1-5μs | 树遍历求值 |

## 常见问题

### 如何缓存 NodeContext？

```kotlin
// 方案 1: 静态变量（推荐）
object Calculator {
    private val formula = Arim.variableCalculator.parseContext("a + b")
}

// 方案 2: Map 缓存
val cache = mutableMapOf<String, NodeContext>()
cache["myFormula"] = Arim.variableCalculator.parseContext("a + b")

// 方案 3: 懒加载
object Calculator {
    val damageFormula by lazy {
        Arim.variableCalculator.parseContext("baseDamage * multiplier")
    }
}
```

### 变量不存在时会发生什么？

如果变量在 Map 中不存在，会使用默认值 `0.0`：

```kotlin
val context = Arim.variableCalculator.parseContext("a + b")
val result = context.evaluate("a" to 10.0)  // b 不存在，使用 0.0
println(result)  // 10.0
```

### 可以使用 Int 类型的变量吗？

不可以，变量值必须是 `Double` 类型：

```kotlin
// ✅ 正确
context.evaluate("level" to 10.toDouble())
context.evaluate("level" to 10.0)
```
