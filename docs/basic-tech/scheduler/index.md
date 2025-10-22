---
sidebar_position: 2
---

# 调度器 & 协程调度器

## 传统调度器

### Bukkit 原生写法

在传统的 Bukkit 开发中，创建调度任务需要通过 Scheduler 管理器：

```kotlin
Bukkit.getScheduler().runTask(BukkitPlugin.javaPlugin) {
    // TODO
}
```

这种写法需要获取 Scheduler 管理器，然后创建任务。TabooLib 简化了这一流程。

### TabooLib 基础写法

使用 `submit` 函数可以快速创建调度任务：

```kotlin
submit(period = 10, async = true, delay = 20) {
    // TODO
}
```

这样就创建了一个每 10 Tick 运行一次、异步执行、首次延迟 20 Tick 的调度器。

### 参数详解

`submit` 函数的完整签名：

```kotlin title="submit 函数签名"
fun submit(
    now: Boolean = false,     // 是否立即执行
    async: Boolean = false,   // 是否异步执行
    delay: Long = 0,          // 延迟执行时间（Tick）
    period: Long = 0,         // 重复执行间隔（Tick）
    executor: PlatformExecutor.PlatformTask.() -> Unit, // 任务逻辑
): PlatformExecutor.PlatformTask
```

**参数说明：**
- `now`：设置为 `true` 时立即执行，**此时任务不会重复执行**（忽略 `period` 参数）
- `async`：设置为 `true` 时在异步线程执行
- `delay`：首次执行前的延迟时间（单位：Tick，20 Tick = 1 秒）
- `period`：重复执行的时间间隔（单位：Tick，0 表示只执行一次）
- `executor`：任务的具体执行逻辑

**返回值：**
- `PlatformExecutor.PlatformTask`：可用于取消任务的任务对象

### 快捷异步调度器

对于简单的异步任务，可以使用 `submitAsync`：

```kotlin
submitAsync {
    // TODO
}
```

`submitAsync` 函数的完整签名：

```kotlin
fun submitAsync(
    now: Boolean = false,     // 是否立即执行
    delay: Long = 0,          // 延迟执行时间（Tick）
    period: Long = 0,         // 重复执行间隔（Tick）
    executor: PlatformExecutor.PlatformTask.() -> Unit, // 任务逻辑
): PlatformExecutor.PlatformTask
```

等价于 `submit(async = true, ...)`。

### 取消任务

调度任务返回 `PlatformTask` 对象，可以通过 `cancel()` 方法取消：

```kotlin
val task = submit(period = 20) {
    // TODO
}

// 取消任务
task.cancel()
```

### 注解式调度器

使用 `@Schedule` 注解可以自动注册周期性任务：

```kotlin
@Schedule(period = 20, async = true)
fun tick() {
    Bukkit.getOnlinePlayers().forEach {
        it.sendMessage("Hello super bee")
    }
}
```

**注解参数：**
- `async`：是否异步执行（默认 `false`）
- `delay`：首次执行前的延迟时间（默认 `0`）
- `period`：重复执行的时间间隔（默认 `0`，表示只执行一次）

**特性：**
- 自动注册，无需手动调用
- 适合固定周期的后台任务
- 支持异步执行

**适用场景：** 定时保存数据、定时检查状态、周期性广播等

## 协程调度器

### 基本认知

协程调度器是对 Kotlin Coroutine API 的封装，是一种简化异步编程的并发设计模式。

> 协程通过将复杂性放入库来简化异步编程。程序的逻辑可以在协程中顺序地表达，而底层库会为我们解决其异步性。该库可以将用户代码的相关部分包装为回调、订阅相关事件、在不同线程（甚至不同机器）上调度执行，而代码则保持如同顺序执行一样简单。

**核心特点：**
- 利用回调 (Callback) 和订阅 (Observer) 实现
- 代码保持顺序执行的简洁性
- 底层自动处理异步调度

**适用场景：** 需要按顺序执行多个异步操作并处理返回值的场景

### 基础用法

#### 入口

使用 `submitChain` 创建协程调度链：

```kotlin
submitChain {
    // TODO
}
```

`submitChain` 函数签名：

```kotlin
fun <R> submitChain(
    type: DispatcherType = ASYNC,           // 调度器类型（ASYNC 或 SYNC）
    block: suspend Chain<R>.() -> R         // 协程块
): CompletableFuture<R>
```

**参数说明：**
- `type`：默认为 `ASYNC`（异步），也可以设置为 `SYNC`（同步）
- `block`：协程逻辑块
- 返回值：`CompletableFuture<R>`，可以获取协程的最终返回值

#### 延迟任务

使用 `wait` 函数在协程中等待指定时间：

```kotlin
submitChain {
    // 等待 10 ticks
    wait(10)
    // 10 ticks 后继续执行
}
```

**wait 函数签名：**

```kotlin
suspend fun wait(value: Long, type: DurationType = MINECRAFT_TICK)
```

**参数说明：**
- `value`：等待时长
- `type`：时间类型
  - `MINECRAFT_TICK`（默认）：Minecraft Tick（1 Tick = 50ms）
  - `MILLIS`：毫秒

**示例：**

```kotlin
submitChain {
    wait(10)                              // 等待 10 ticks（500ms）
    wait(10, MINECRAFT_TICK)              // 等待 10 ticks（500ms）
    wait(500, MILLIS)                     // 等待 500 毫秒
}
```

#### 切换到同步线程

使用 `sync` 在主线程执行代码：

```kotlin
submitChain {
    sync {
        sender.sendMessage("Hello from Sync!")
    }
}
```

**使用场景：** 需要操作游戏 API（如修改方块、传送玩家等）时必须在主线程执行

#### 切换到异步线程

使用 `async` 在异步线程执行代码：

```kotlin
submitChain {
    async {
        // 执行耗时操作，不阻塞主线程
        performHeavyCalculation()
    }
}
```

**使用场景：** 执行耗时操作（如数据库查询、网络请求等）时避免阻塞主线程

### 获取返回值

协程调度器支持获取异步任务的返回值：

```kotlin
submitChain {
    // 在异步线程计算
    // highlight-start
    val value = async {
        1 + 2 + 3
    }
    // highlight-end
    // 切换到主线程使用结果
    sync {
        sender.sendMessage("Value: $value")
    }
}
```

**执行流程：**
1. 进入 `async` 块，在异步线程计算 `1 + 2 + 3`
2. 将结果赋值给 `value`
3. 切换到主线程，在 `sync` 块中发送消息

### 周期任务

在 `sync` 或 `async` 后添加 `period` 参数可创建周期性执行的任务：

```kotlin
submitChain {
    var index = 0

    val context = sync(period = 20L, delay = 0L) {
        index += 1
        sender.sendMessage("Sync: $index")

        if (index == 10) {
            sender.sendMessage("&cSync task cancelled.".colored())
            // highlight-next-line
            cancel()  // 取消周期任务
            "END"     // 返回值（仅在任务取消时应用）
        } else {
            "_"       // 任务未取消时返回值不生效
        }
    }
}
```

**周期任务函数签名：**

```kotlin
suspend fun <T> sync(
    period: Long,                          // 重复执行间隔（Tick）
    now: Boolean = false,                  // 是否立即执行
    delay: Long = 0L,                      // 首次执行延迟（Tick）
    block: Cancellable.() -> T             // 任务逻辑
): T

suspend fun <T> async(
    period: Long,                          // 重复执行间隔（Tick）
    now: Boolean = false,                  // 是否立即执行
    delay: Long = 0L,                      // 首次执行延迟（Tick）
    block: Cancellable.() -> T             // 任务逻辑
): T
```

**关键点：**
- `period`：重复执行的时间间隔（单位：Tick）
- `delay`：首次执行前的延迟时间（单位：Tick）
- `now`：是否立即执行（忽略 `delay`）
- `cancel()`：在 `Cancellable` 上下文中调用，取消周期任务
- 返回值：只有在调用 `cancel()` 后，返回值才会被应用到变量上

### 实际应用示例

#### 示例 1：异步查询后同步处理

```kotlin
submitChain {
    // 异步查询数据库
    val playerData = async {
        database.getPlayerData(player.uniqueId)
    }

    // 等待 5 ticks
    wait(5)

    // 同步更新玩家状态
    sync {
        player.health = playerData.health
        player.sendMessage("数据已加载")
    }
}
```

#### 示例 2：多步骤异步操作

```kotlin
submitChain {
    // 第一步：异步获取配置
    val config = async {
        loadConfigFromFile()
    }

    // 第二步：异步验证数据
    val isValid = async {
        validateConfig(config)
    }

    // 第三步：同步应用配置
    sync {
        if (isValid) {
            applyConfig(config)
            sender.sendMessage("配置已应用")
        } else {
            sender.sendMessage("配置无效")
        }
    }
}
```

#### 示例 3：带超时的周期检查

```kotlin
submitChain {
    var attempts = 0
    val maxAttempts = 10

    sync(period = 20L) {
        attempts++

        if (checkCondition()) {
            sender.sendMessage("条件满足")
            cancel()
            "Success"
        } else if (attempts >= maxAttempts) {
            sender.sendMessage("超时")
            cancel()
            "Timeout"
        } else {
            "_"
        }
    }
}
```

## 常见问题

### 何时使用传统调度器，何时使用协程调度器？

- **传统调度器**：适合简单的定时任务、周期性任务
- **协程调度器**：适合需要按顺序执行多个异步操作并处理返回值的复杂场景

### 协程中的 sync 和 async 有什么区别？

- `sync`：在主线程执行，可以安全操作游戏 API
- `async`：在异步线程执行，适合耗时操作，不能直接操作游戏 API

### 如何取消正在执行的调度任务？

传统调度器：

```kotlin
val task = submit(period = 20) {
    // TODO
}
// 取消任务
task.cancel()
```

协程调度器（周期任务）：

```kotlin
sync(period = 20) {
    if (shouldStop) {
        cancel()
    }
}
```

### 协程调度器的返回值何时生效？

- **非周期任务**：返回值会自动应用到变量上
- **周期任务**：只有在调用 `cancel()` 后，返回值才会被应用

### now 参数为 true 时会发生什么？

在传统调度器中，当 `now = true` 时：
- 任务立即执行
- 任务**不会重复执行**，即使设置了 `period` 参数

### wait 函数的时间单位是什么？

`wait` 函数默认使用 Minecraft Tick 作为单位：
- `wait(10)` - 等待 10 ticks（500ms，因为 1 Tick = 50ms）
- `wait(10, MINECRAFT_TICK)` - 等待 10 ticks
- `wait(500, MILLIS)` - 等待 500 毫秒

### submitChain 默认是异步还是同步？

`submitChain` 默认是**异步**（`ASYNC`），如果需要同步执行：

```kotlin
submitChain(type = SYNC) {
    // 在主线程中执行
}
```

### 如何获取协程的返回值？

```kotlin
val future = submitChain {
    val result = async {
        calculateSomething()
    }
    result
}

// 获取最终结果
future.thenAccept { result ->
    println("Result: $result")
}
```
