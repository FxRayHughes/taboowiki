---
title: 固定算数表达式计算器
sidebar_position: 3
description: 基于双栈算法的高性能数学表达式求值工具，专门用于处理不含变量的固定公式计算
---

# 固定算数表达式计算器

固定算数表达式计算器（FixedCalculator）是一个基于双栈算法的高性能数学表达式求值工具，专门用于处理不含变量的固定公式计算。

## 基础用法

```kotlin
import top.maplex.arim.Arim

// 基本四则运算
Arim.fixedCalculator.evaluate("1 + 2 * 3")  // 7.0
Arim.fixedCalculator.evaluate("10 / 2 - 3") // 2.0

// 使用括号
Arim.fixedCalculator.evaluate("(1 + 2) * 3")  // 9.0

// 复杂表达式
Arim.fixedCalculator.evaluate(
    "-3 + ((4 * (10 - (6 / 2))) - (8 % 3) + (5 + (-7) / 2))"
)

// 小数运算
Arim.fixedCalculator.evaluate("3.14 * 2.5 + 1.5")
```

## 支持的运算符

| 运算符 | 说明 | 优先级 | 示例 |
|-------|------|--------|------|
| `+` | 加法 | 2 | `1 + 2` → `3.0` |
| `-` | 减法 | 2 | `5 - 3` → `2.0` |
| `*` | 乘法 | 3 | `2 * 3` → `6.0` |
| `/` | 除法 | 3 | `10 / 2` → `5.0` |
| `%` | 取模 | 3 | `10 % 3` → `1.0` |
| `(` `)` | 括号 | 1 | `(a + b) * c` |

**特性：**
- 支持任意层级的括号嵌套
- 支持负数和小数
- 无需预解析，直接计算

## 实现原理

基于**双栈算法**实现：

```
val number = Deque<Double>()      // 数字栈
val operator = Deque<Char>()      // 符号栈
```

**算法流程：**
1. 在运算符栈底压入哨兵 `?`（优先级为 0）
2. 遍历表达式，根据字符类型进行处理
3. 清栈计算最终结果

## 实际应用示例

### 配置文件公式计算

```yaml
rewards:
  gold:
    formula: "100 * 1.5 + 50"
  exp:
    formula: "50 * 2.0"
```

```kotlin
fun calculateReward(formula: String): Double {
    return Arim.fixedCalculator.evaluate(formula)
}
```

### 伤害计算

```kotlin
fun calculateDamage(baseDamage: Double, multiplier: Double): Double {
    val formula = "($baseDamage * $multiplier + 10) * 0.9"
    return Arim.fixedCalculator.evaluate(formula)
}
```

## 性能优化

### 选择合适的计算器

- **固定公式**: 使用 `FixedCalculator`（无解析开销）
- **含变量公式**: 使用 `VariableCalculator` 并缓存 `NodeContext`

```kotlin
// 固定公式
val damage = Arim.fixedCalculator.evaluate("50 * 1.5 + 10")

// 含变量公式
val context = Arim.variableCalculator.parseContext("baseDamage * multiplier")
val damage = context.evaluate("baseDamage" to 50.0, "multiplier" to 1.5)
```

## 常见问题

### FixedCalculator 和 VariableCalculator 有什么区别？

| 特性 | FixedCalculator | VariableCalculator |
|-----|----------------|-------------------|
| **实现方式** | 双栈算法 | 符号树（AST） |
| **变量支持** | ❌ 不支持 | ✅ 支持 |
| **一次性计算** | 快 | 稍慢（需要构建树） |
| **重复计算** | 快 | 非常快（缓存后） |

### 如何处理除以零？

Java 的 `Double` 类型除以零会返回 `Infinity` 或 `NaN`：

```kotlin
val result = Arim.fixedCalculator.evaluate("10 / 0")  // Infinity

if (result.isFinite()) {
    // 正常使用
}
```

### 表达式可以包含空格吗？

可以，空格会被正确处理：

```kotlin
// 以下表达式等价
Arim.fixedCalculator.evaluate("1+2*3")
Arim.fixedCalculator.evaluate("1 + 2 * 3")
```
