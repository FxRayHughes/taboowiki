---
sidebar_position: 4
---

# 自唤醒

:::danger 重要技术
**TabooLib 最常用的功能，必须掌握** 
:::

## 基本概念

自唤醒（Awake）是 TabooLib 的核心功能之一，允许在服务器的特定生命周期自动执行 `object` 内的无参方法，无需在主类中手动调用。

**核心优势：**
- 大大降低每个类对主类的耦合度
- 自动化代码执行
- 模块化开发更加便捷

## 入口 @Awake

### 基础用法

使用 `@Awake` 注解标记方法，在指定的生命周期自动执行：

```kotlin
@Awake(LifeCycle.ENABLE)
fun test() {
    info("我运行了")
}
```

**等价于传统写法：**

```kotlin
object FengXiHaoShuai : Plugin() {
    override fun onEnable() {
        info("我运行了")
    }
}
```

### 注解定义

```kotlin
@Retention(AnnotationRetention.RUNTIME)
annotation class Awake(val value: LifeCycle = LifeCycle.CONST)
```

**参数说明：**
- `value`：生命周期，默认为 `LifeCycle.CONST`

## 使用要求

⚠️ **必须注意以下两点：**

### 1. 必须在 object 类内

自唤醒方法必须定义在 `object` 单例类中，否则会无效或报错。

```kotlin
// ✅ 正确
object MyModule {
    @Awake(LifeCycle.ENABLE)
    fun init() {
        println("初始化")
    }
}

// ❌ 错误 - class 类不支持
class MyClass {
    @Awake(LifeCycle.ENABLE)
    fun init() {
        // 不会被执行
    }
}
```

### 2. 方法不可以含有参数

自唤醒方法必须是无参方法。

```kotlin
// ✅ 正确
@Awake(LifeCycle.ENABLE)
fun init() {
    println("初始化")
}

// ❌ 错误 - 带参数
@Awake(LifeCycle.ENABLE)
fun init(config: Config) {
    // 不会被执行
}
```

**注意：** 某些构建工具可能会在编译时往函数内插入参数，需要检查。

## 生命周期详解

### LifeCycle 枚举

```java
public enum LifeCycle {
    NONE,     // 未启动
    CONST,    // 插件初始化（静态代码块被执行时）
    INIT,     // 插件主类被实例化时
    LOAD,     // 插件加载时
    ENABLE,   // 插件启用时
    ACTIVE,   // 服务器完全启动（调度器启动）时
    DISABLE   // 插件卸载时
}
```

### 生命周期时序图

```
Q1 (插件加载阶段)        插件运行阶段              插件关闭
    │                    │                      │
    ├─ CONST            ├─ ENABLE              ├─ DISABLE
    │                    │                      │
    ├─ INIT              └─ ACTIVE              │
    │                                           │
    └─ LOAD                                     │
```

**详细说明：**

| 生命周期 | 触发时机 | 适用场景 |
|---------|---------|---------|
| `NONE` | 未启动 | 无 |
| `CONST` | 插件初始化，静态代码块执行时 | 早期初始化，注册监听器 |
| `INIT` | 插件主类被实例化时 | 初始化配置 |
| `LOAD` | 插件加载时 | 加载数据 |
| `ENABLE` | 插件启用时（最常用） | 启动功能模块 |
| `ACTIVE` | 服务器完全启动，调度器已启动 | 需要调度器的功能 |
| `DISABLE` | 插件卸载时 | 保存数据、清理资源 |

### 生命周期示例

```kotlin
object MyPlugin {

    @Awake(LifeCycle.CONST)
    fun onConst() {
        println("1. CONST - 静态代码块执行")
    }

    @Awake(LifeCycle.INIT)
    fun onInit() {
        println("2. INIT - 主类实例化")
    }

    @Awake(LifeCycle.LOAD)
    fun onLoad() {
        println("3. LOAD - 插件加载")
    }

    @Awake(LifeCycle.ENABLE)
    fun onEnable() {
        println("4. ENABLE - 插件启用")
    }

    @Awake(LifeCycle.ACTIVE)
    fun onActive() {
        println("5. ACTIVE - 服务器完全启动")
    }

    @Awake(LifeCycle.DISABLE)
    fun onDisable() {
        println("6. DISABLE - 插件卸载")
    }
}
```

## 进阶用法 - ClassVisitor

如果你需要在初始化时自动扫描并处理某些类（例如继承了特定接口或添加了特定注解的类），应该使用 `ClassVisitor`，而不是自己编写扫包模块。

### ClassVisitor 基础

```kotlin
@Awake
object ClassReader : ClassVisitor(0) {

    override fun getLifeCycle(): LifeCycle {
        return LifeCycle.ENABLE
    }

    override fun visitStart(clazz: ReflexClass) {
        // 当类开始加载时
    }

    override fun visitEnd(clazz: ReflexClass) {
        // 当类结束加载时
    }

    override fun visit(field: ClassField, owner: ReflexClass) {
        // 当字段加载时
    }

    override fun visit(method: ClassMethod, owner: ReflexClass) {
        // 当方法加载时
    }
}
```

### 实际示例：自动注册技能

```kotlin
@Awake
object SkillClassVisitor : ClassVisitor(0) {

    override fun getLifeCycle(): LifeCycle {
        return LifeCycle.ENABLE
    }

    override fun visitStart(clazz: ReflexClass) {
        // 检查是否实现了 AbstractSkill 接口
        if (clazz.structure.interfaces.contains(AbstractSkill::class.java)) {
            info("加载技能: ${clazz.simpleName}")

            // 创建实例
            val instance = clazz.newInstance()
            if (instance is AbstractSkill) {
                // 注册到技能管理器
                SkillManager.skills[instance.id] = instance
            }
        }
    }
}
```

### ClassVisitor 方法说明

#### getLifeCycle()

指定 Visitor 在哪个生命周期执行。

```kotlin
override fun getLifeCycle(): LifeCycle {
    return LifeCycle.ENABLE
}
```

#### visitStart(clazz)

当类开始加载时调用，可以检查类的接口、注解等。

```kotlin
override fun visitStart(clazz: ReflexClass) {
    if (clazz.hasAnnotation(MyAnnotation::class.java)) {
        // 处理带有 @MyAnnotation 的类
    }
}
```

#### visitEnd(clazz)

当类结束加载时调用。

```kotlin
override fun visitEnd(clazz: ReflexClass) {
    println("类 ${clazz.name} 加载完成")
}
```

#### visit(field, owner)

当字段加载时调用。

```kotlin
override fun visit(field: ClassField, owner: ReflexClass) {
    if (field.hasAnnotation(Config::class.java)) {
        // 处理带有 @Config 的字段
    }
}
```

#### visit(method, owner)

当方法加载时调用。

```kotlin
override fun visit(method: ClassMethod, owner: ReflexClass) {
    if (method.hasAnnotation(Command::class.java)) {
        // 处理带有 @Command 的方法
    }
}
```

### 优先级

ClassVisitor 构造函数接受优先级参数，数值越小优先级越高。

```kotlin
// 优先级 0（高）
object HighPriorityVisitor : ClassVisitor(0) {
    // ...
}

// 优先级 5（低）
object LowPriorityVisitor : ClassVisitor(5) {
    // ...
}
```

## 实际应用示例

### 示例 1：配置文件加载

```kotlin
object ConfigModule {

    lateinit var config: Config

    @Awake(LifeCycle.ENABLE)
    fun loadConfig() {
        config = Config.load("config.yml")
        info("配置文件已加载")
    }

    @Awake(LifeCycle.DISABLE)
    fun saveConfig() {
        config.save()
        info("配置文件已保存")
    }
}
```

### 示例 2：数据库连接

```kotlin
object DatabaseModule {

    lateinit var database: Database

    @Awake(LifeCycle.ENABLE)
    fun connect() {
        database = Database.connect(
            host = "localhost",
            port = 3306,
            user = "root",
            password = "password"
        )
        info("数据库已连接")
    }

    @Awake(LifeCycle.DISABLE)
    fun disconnect() {
        database.close()
        info("数据库已断开")
    }
}
```

### 示例 3：命令注册（使用 ACTIVE）

```kotlin
object CommandModule {

    @Awake(LifeCycle.ACTIVE)
    fun registerCommands() {
        // 需要调度器已启动，使用 ACTIVE
        simpleCommand("day") { sender, args ->
            Bukkit.getWorld("world")?.time = 1000
            sender.sendMessage("已设置为白天")
        }
    }
}
```

### 示例 4：自动注册监听器

```kotlin
@Awake
object ListenerRegister : ClassVisitor(0) {

    override fun getLifeCycle(): LifeCycle {
        return LifeCycle.ENABLE
    }

    override fun visitStart(clazz: ReflexClass) {
        // 检查是否实现了 Listener 接口
        if (clazz.structure.interfaces.contains(Listener::class.java)) {
            val instance = findInstance(clazz)
            if (instance is Listener) {
                Bukkit.getPluginManager().registerEvents(instance, plugin)
                info("注册监听器: ${clazz.simpleName}")
            }
        }
    }
}
```

## 常见问题

### @Awake 方法没有执行？

检查以下几点：
1. 方法是否在 `object` 类中
2. 方法是否为无参方法
3. 生命周期是否正确
4. 类是否在正确的包下（被扫描到）

### 如何在特定生命周期执行？

使用对应的 `LifeCycle` 枚举值：

```kotlin
@Awake(LifeCycle.ENABLE)  // 插件启用时
@Awake(LifeCycle.DISABLE) // 插件卸载时
@Awake(LifeCycle.ACTIVE)  // 服务器完全启动时
```

### CONST 和 INIT 有什么区别？

- **CONST**：静态代码块执行时，此时插件还未实例化
- **INIT**：插件主类被实例化时

通常使用 `ENABLE` 即可满足大多数需求。

### 为什么要用 ClassVisitor 而不是自己扫包？

1. **性能优化**：TabooLib 的扫描器经过优化，性能更好
2. **统一管理**：所有扫描逻辑集中管理
3. **生命周期控制**：可以精确控制扫描时机
4. **避免重复**：不会重复扫描同一个类

### 如何获取 object 实例？

使用 `ClassVisitor.findInstance()`：

```kotlin
override fun visitStart(clazz: ReflexClass) {
    val instance = findInstance(clazz)
    if (instance != null) {
        // 处理实例
    }
}
```

### 多个 @Awake 方法的执行顺序？

同一生命周期下，方法执行顺序不保证。如果需要保证顺序，应该在一个方法中依次调用。

```kotlin
@Awake(LifeCycle.ENABLE)
fun init() {
    initConfig()
    initDatabase()
    initCommands()
}
```
