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

如果需要数学函数（如 sin、log、sqrt 等），应使用 FixedCalculator，它在 6.2.3+ 版本支持丰富的数学函数。

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

// 4. 使用指数运算
val powerContext = vc.parseContext("base^exponent + 10")
val result3 = powerContext.evaluate(
    "base" to 2.0,
    "exponent" to 3.0
)  // 18.0 (2^3 + 10)
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
| `PowerNode` | 指数节点 | `a^b` |

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
    // 基础伤害计算
    private val damageFormula = Arim.variableCalculator.parseContext(
        "baseDamage * attackMultiplier * ( 1 + critRate ) - defense"
    )

    // 暴击伤害计算（使用指数运算）
    private val critDamageFormula = Arim.variableCalculator.parseContext(
        "baseDamage * critMultiplier^critStack"
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

    fun calculateCritDamage(
        baseDamage: Double,
        critMultiplier: Double,
        critStack: Double
    ): Double {
        return critDamageFormula.evaluate(
            "baseDamage" to baseDamage,
            "critMultiplier" to critMultiplier,
            "critStack" to critStack
        )
    }
}
```

### 配置文件公式系统

```yaml
rewards:
  kill_boss:
    gold_formula: "baseGold * bossLevel * ( 1 + playerLevel / 100 )"
  level_up:
    exp_formula: "baseExp * level^1.5"
  daily_reward:
    bonus_formula: "baseBonus * ( 1 + streak / 10 )^2"
```

```kotlin
object RewardSystem {
    private val formulaCache = mutableMapOf<String, NodeContext>()

    fun loadFormulas(config: Configuration) {
        config.getKeys(false).forEach { key ->
            // 加载金币公式
            val goldFormula = config.getString("$key.gold_formula")
            if (goldFormula != null) {
                formulaCache["${key}_gold"] = Arim.variableCalculator.parseContext(goldFormula)
            }

            // 加载经验公式
            val expFormula = config.getString("$key.exp_formula")
            if (expFormula != null) {
                formulaCache["${key}_exp"] = Arim.variableCalculator.parseContext(expFormula)
            }

            // 加载奖励公式
            val bonusFormula = config.getString("$key.bonus_formula")
            if (bonusFormula != null) {
                formulaCache["${key}_bonus"] = Arim.variableCalculator.parseContext(bonusFormula)
            }
        }
    }

    fun calculateReward(rewardType: String, variables: Map<String, Double>): Double {
        return formulaCache[rewardType]?.evaluate(variables) ?: 0.0
    }

    // 使用示例
    fun getLevelUpExp(level: Int): Double {
        return calculateReward("level_up_exp", mapOf(
            "baseExp" to 100.0,
            "level" to level.toDouble()
        ))
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

### 指数运算的优先级是多少？

指数运算 `^` 的优先级**最高**（优先级 4），高于乘除法（优先级 3）：

```kotlin
val context1 = Arim.variableCalculator.parseContext("a * b^c")
context1.evaluate("a" to 2.0, "b" to 3.0, "c" to 2.0)  // 18.0 (2 * 9)

val context2 = Arim.variableCalculator.parseContext("(a + b)^c")
context2.evaluate("a" to 2.0, "b" to 3.0, "c" to 2.0)  // 25.0 (5^2)
```

### VariableCalculator 支持数学函数吗？

不支持。VariableCalculator 专注于变量计算，不支持数学函数（sin、log、sqrt 等）。

**功能对比：**

| 特性 | VariableCalculator | FixedCalculator |
|-----|-------------------|-----------------|
| 变量支持 | ✅ | ❌ |
| 数学函数 | ❌ | ✅（6.2.3+ 版本） |
| 指数运算 | ✅ | ✅ |
| 推荐场景 | 含变量的重复计算 | 固定公式 + 数学函数 |

**选择建议：**

```kotlin
// 需要变量 → 使用 VariableCalculator
val context = Arim.variableCalculator.parseContext("baseDamage * level^1.5")
val damage = context.evaluate("baseDamage" to 10.0, "level" to 5.0)

// 需要数学函数 → 使用 FixedCalculator
val angle = Arim.fixedCalculator.evaluate("sin(30) + cos(60)")
```
