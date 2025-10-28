---
title: 固定算数表达式计算器
sidebar_position: 3
description: 基于三栈算法的增强型数学表达式求值工具，支持指数运算和丰富的数学函数
---

# 固定算数表达式计算器

固定算数表达式计算器（FixedCalculator）是一个基于三栈算法的增强型数学表达式求值工具，支持基础四则运算、指数运算以及丰富的数学函数（三角函数、对数、开方等）。

## 基础用法

```kotlin
import top.maplex.arim.Arim

// 基本四则运算
Arim.fixedCalculator.evaluate("1 + 2 * 3")  // 7.0
Arim.fixedCalculator.evaluate("10 / 2 - 3") // 2.0

// 使用括号
Arim.fixedCalculator.evaluate("(1 + 2) * 3")  // 9.0

// 指数运算
Arim.fixedCalculator.evaluate("2^3")        // 8.0
Arim.fixedCalculator.evaluate("2^3 + 5")    // 13.0

// 三角函数（角度制）
Arim.fixedCalculator.evaluate("sin(30)")    // 0.5
Arim.fixedCalculator.evaluate("cos(60)")    // 0.5
Arim.fixedCalculator.evaluate("sin(30) + cos(60)")  // 1.0

// 对数函数
Arim.fixedCalculator.evaluate("log(100)")   // 2.0 (常用对数)
Arim.fixedCalculator.evaluate("ln(2.718)")  // ~1.0 (自然对数)
Arim.fixedCalculator.evaluate("log2(8)")    // 3.0 (以2为底)

// 其他数学函数
Arim.fixedCalculator.evaluate("sqrt(16)")   // 4.0 (平方根)
Arim.fixedCalculator.evaluate("abs(-5)")    // 5.0 (绝对值)
Arim.fixedCalculator.evaluate("ceil(4.3)")  // 5.0 (向上取整)
Arim.fixedCalculator.evaluate("floor(4.8)") // 4.0 (向下取整)

// 复杂表达式
Arim.fixedCalculator.evaluate(
    "-3 + ((4 * (10 - (6 / 2))) - (8 % 3) + (5 + (-7) / 2))"
)

// 函数与运算符混合使用
Arim.fixedCalculator.evaluate("sqrt(16) * 2^3")  // 32.0
Arim.fixedCalculator.evaluate("abs(-5) + ceil(4.3)")  // 10.0

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
| `^` | 指数 | 4 | `2^3` → `8.0` |
| `(` `)` | 括号 | 1 | `(a + b) * c` |

## 支持的数学函数

### 三角函数（角度制）

| 函数 | 说明 | 示例 |
|-----|------|------|
| `sin(x)` | 正弦函数（x 为角度） | `sin(30)` → `0.5` |
| `cos(x)` | 余弦函数（x 为角度） | `cos(60)` → `0.5` |
| `tan(x)` | 正切函数（x 为角度） | `tan(45)` → `1.0` |
| `asin(x)` / `arcsin(x)` | 反正弦（返回角度） | `asin(0.5)` → `30.0` |
| `acos(x)` / `arccos(x)` | 反余弦（返回角度） | `acos(0.5)` → `60.0` |
| `atan(x)` / `arctan(x)` | 反正切（返回角度） | `atan(1)` → `45.0` |

### 三角函数（弧度制）

| 函数 | 说明 | 示例 |
|-----|------|------|
| `sinr(x)` | 正弦函数（x 为弧度） | `sinr(1.57)` → `~1.0` |
| `cosr(x)` | 余弦函数（x 为弧度） | `cosr(3.14)` → `~-1.0` |
| `tanr(x)` | 正切函数（x 为弧度） | `tanr(0.785)` → `~1.0` |

### 对数函数

| 函数 | 说明 | 示例 |
|-----|------|------|
| `log(x)` | 常用对数（以 10 为底） | `log(100)` → `2.0` |
| `ln(x)` | 自然对数（以 e 为底） | `ln(2.718)` → `~1.0` |
| `log2(x)` | 以 2 为底的对数 | `log2(8)` → `3.0` |

### 其他数学函数

| 函数 | 说明 | 示例 |
|-----|------|------|
| `sqrt(x)` | 平方根 | `sqrt(16)` → `4.0` |
| `cbrt(x)` | 立方根 | `cbrt(27)` → `3.0` |
| `abs(x)` | 绝对值 | `abs(-5)` → `5.0` |
| `ceil(x)` | 向上取整 | `ceil(4.3)` → `5.0` |
| `floor(x)` | 向下取整 | `floor(4.8)` → `4.0` |
| `round(x)` | 四舍五入 | `round(4.5)` → `5.0` |
| `exp(x)` | e 的 x 次方 | `exp(1)` → `~2.718` |
| `sq(x)` | 平方 | `sq(5)` → `25.0` |

**特性：**
- 支持任意层级的括号嵌套
- 支持负数和小数
- 支持函数嵌套调用
- 无需预解析，直接计算

## 实现原理

基于**三栈算法**实现：

```kotlin
val number = Deque<Double>()      // 数字栈
val operator = Deque<Char>()      // 符号栈
val functions = Deque<String>()   // 函数栈
```

**算法流程：**

1. **初始化**：在运算符栈底压入哨兵 `?`（优先级为 0）
2. **解析表达式**：
   - 遇到数字：构建完整的数值（包括小数和负数）
   - 遇到字母：识别函数名并压入函数栈
   - 遇到运算符：根据优先级处理栈中运算符
   - 遇到左括号 `(`：压入运算符栈
   - 遇到右括号 `)`：弹栈计算直到遇到左括号，然后应用函数（如果有）
3. **清栈计算**：遍历结束后，依次弹栈计算最终结果

**运算符优先级：**

```kotlin
fun getPriority(operator: Char): Int {
    return when (operator) {
        '?' -> 0
        '(' -> 1
        '+', '-' -> 2
        '*', '/', '%' -> 3
        '^' -> 4  // 指数运算优先级最高
        else -> throw IllegalStateException("illegal operator: $operator")
    }
}
```

## 实际应用示例

### 配置文件公式计算

```yaml
rewards:
  gold:
    formula: "100 * 1.5 + 50"
  exp:
    formula: "50 * 2.0 * (1 + log(level) / 10)"
  bonus:
    formula: "sqrt(kills) * 10 + abs(score - 100)"
```

```kotlin
fun calculateReward(formula: String, level: Int = 1, kills: Int = 0, score: Int = 0): Double {
    // 替换变量后计算
    val expr = formula
        .replace("level", level.toString())
        .replace("kills", kills.toString())
        .replace("score", score.toString())
    return Arim.fixedCalculator.evaluate(expr)
}
```

### 伤害计算

```kotlin
object DamageSystem {
    // 基础伤害计算
    fun calculateBaseDamage(attack: Double, defense: Double): Double {
        val formula = "($attack * 1.5 - $defense) * (1 + log(${attack / 10}) / 5)"
        return Arim.fixedCalculator.evaluate(formula)
    }

    // 暴击伤害（使用指数运算）
    fun calculateCritDamage(baseDamage: Double, critMultiplier: Double): Double {
        val formula = "$baseDamage * $critMultiplier^2"
        return Arim.fixedCalculator.evaluate(formula)
    }
}
```

### 游戏数值计算

```kotlin
object GameMath {
    // 经验曲线（指数增长）
    fun calculateExpRequired(level: Int): Double {
        return Arim.fixedCalculator.evaluate("100 * 1.5^$level")
    }

    // 掉落概率（对数衰减）
    fun calculateDropChance(playerLevel: Int, itemRarity: Int): Double {
        return Arim.fixedCalculator.evaluate(
            "50 / (1 + abs($playerLevel - $itemRarity) / log($itemRarity + 10))"
        )
    }

    // 技能冷却时间（三角函数平滑）
    fun calculateCooldownReduction(level: Int): Double {
        // 使用三角函数实现平滑的冷却缩减曲线
        return Arim.fixedCalculator.evaluate("30 - 20 * sin($level * 3)")
    }
}
```

### 物理计算

```kotlin
object PhysicsCalculator {
    // 抛物线轨迹计算
    fun calculateTrajectory(velocity: Double, angle: Double, time: Double): Double {
        // y = v * sin(θ) * t - 0.5 * g * t^2
        val g = 9.8
        return Arim.fixedCalculator.evaluate(
            "$velocity * sin($angle) * $time - 0.5 * $g * $time^2"
        )
    }

    // 距离计算
    fun calculateDistance(x1: Double, y1: Double, x2: Double, y2: Double): Double {
        return Arim.fixedCalculator.evaluate(
            "sqrt(($x2 - $x1)^2 + ($y2 - $y1)^2)"
        )
    }
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
| **实现方式** | 三栈算法 | 符号树（AST） |
| **变量支持** | ❌ 不支持 | ✅ 支持 |
| **数学函数** | ✅ 丰富（三角、对数等） | ❌ 不支持 |
| **一次性计算** | 快 | 稍慢（需要构建树） |
| **重复计算** | 快 | 非常快（缓存后） |

**选择建议：**
- 固定公式 + 需要数学函数 → 使用 `FixedCalculator`
- 含变量 + 重复计算 → 使用 `VariableCalculator`

### 三角函数是角度制还是弧度制？

默认函数使用**角度制**，弧度制需要使用带 `r` 后缀的函数：

```kotlin
// 角度制（推荐）
Arim.fixedCalculator.evaluate("sin(30)")   // 0.5
Arim.fixedCalculator.evaluate("cos(60)")   // 0.5

// 弧度制
Arim.fixedCalculator.evaluate("sinr(1.57)")  // ≈1.0 (π/2)
Arim.fixedCalculator.evaluate("cosr(3.14)")  // ≈-1.0 (π)
```

### 函数可以嵌套使用吗？

可以，支持任意层级的函数嵌套：

```kotlin
Arim.fixedCalculator.evaluate("sqrt(abs(-16))")  // 4.0
Arim.fixedCalculator.evaluate("log(sqrt(100))")  // 1.0
Arim.fixedCalculator.evaluate("sin(asin(0.5))")  // 0.5
```

### 如何处理除以零？

Java 的 `Double` 类型除以零会返回 `Infinity` 或 `NaN`：

```kotlin
val result = Arim.fixedCalculator.evaluate("10 / 0")  // Infinity

if (result.isFinite()) {
    // 正常使用
} else {
    // 处理异常值
}
```

### 指数运算的优先级是多少？

指数运算 `^` 的优先级**最高**（优先级 4），高于乘除法（优先级 3）：

```kotlin
Arim.fixedCalculator.evaluate("2 * 3^2")    // 18.0 (2 * 9)
Arim.fixedCalculator.evaluate("2^3 * 4")    // 32.0 (8 * 4)
Arim.fixedCalculator.evaluate("(2 + 3)^2")  // 25.0 (5^2)
```

### 表达式可以包含空格吗？

可以，空格会被自动过滤：

```kotlin
// 以下表达式等价
Arim.fixedCalculator.evaluate("1+2*3")
Arim.fixedCalculator.evaluate("1 + 2 * 3")
Arim.fixedCalculator.evaluate("sqrt(16) + log(100)")
```

### 支持负数的指数运算吗？

支持，但需要注意负数的指数运算规则：

```kotlin
Arim.fixedCalculator.evaluate("(-2)^2")     // 4.0
Arim.fixedCalculator.evaluate("-2^2")       // -4.0 (相当于 -(2^2))
Arim.fixedCalculator.evaluate("2^(-1)")     // 0.5 (相当于 1/2)
```
