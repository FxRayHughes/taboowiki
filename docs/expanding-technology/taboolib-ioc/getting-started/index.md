---
title: 安装与快速开始
sidebar_label: 安装与快速开始
sidebar_position: 2
description: TabooLib IoC 容器安装指南与快速上手，涵盖组件定义、依赖注入、生命周期、作用域等基础用法
---

# 安装与快速开始

## 安装

使用 TabooLib 的 `taboo()` 方法将 IoC 容器打包到插件内：

```kotlin title="build.gradle.kts"
repositories {
    maven("https://maven.wcpe.top/repository/maven-public/")
}

dependencies {
    taboo("top.wcpe.taboolib.ioc:taboolib-ioc:1.1.0-SNAPSHOT")
}

// 重定向到你的插件包名，避免与其他插件冲突
taboolib {
    relocate("top.wcpe.taboolib.ioc", "top.wcpe.yourplugin.ioc")
}
```

:::danger[必须使用 taboo()]

必须使用 `taboo()` 而非 `compileOnly()`，否则运行时找不到类。同时务必配置 `relocate` 重定向包名，避免与其他插件冲突。

:::

## 定义组件

使用 `@Component`、`@Service`、`@Repository`、`@Controller` 标记组件类，它们的行为完全一致，仅在语义上有所区分：

```kotlin title="Components.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.annotation.Repository
import top.wcpe.yourplugin.ioc.annotation.Service
import top.wcpe.yourplugin.ioc.annotation.Component
import top.wcpe.yourplugin.ioc.annotation.Inject

// 仓储层 - 使用 @Repository 标记
@Repository
class UserRepository {
    fun findUserById(id: String): String = "User($id)"
}

// 服务层 - 使用 @Service 标记，构造函数注入
@Service
class UserService @Inject constructor(
    private val repository: UserRepository
) {
    fun getUser(id: String): String = repository.findUserById(id)
}

// 通用组件 - 使用 @Component 标记
@Component
class TextFormatter {
    fun format(label: String, value: Any): String = "$label=$value"
}
```

**代码说明：**
- `@Repository`：标记数据访问层组件
- `@Service`：标记业务逻辑层组件
- `@Component`：标记通用组件
- `@Inject constructor(...)`：通过构造函数注入依赖

## 依赖注入

IoC 容器支持三种注入方式：构造函数注入、字段注入和方法注入。

```kotlin title="OrderService.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.annotation.Service
import top.wcpe.yourplugin.ioc.annotation.Inject

@Service
class OrderService {

    // 字段注入
    @Inject
    lateinit var userService: UserService

    // 方法注入
    @Inject
    fun bindFormatter(formatter: TextFormatter) {
        this.formatter = formatter
    }

    private lateinit var formatter: TextFormatter

    fun processOrder(userId: String): String {
        val user = userService.getUser(userId)
        return formatter.format("order", user)
    }
}
```

**代码说明：**
- `@Inject lateinit var`：字段注入，容器自动按类型查找并注入
- `@Inject fun bindFormatter(...)`：方法注入，容器调用方法并自动解析参数

:::tip[推荐做法]

Kotlin 属性注入直接写 `@Inject lateinit var foo: Foo` 即可，不需要强制改成 `@field:Inject`。

:::

## 名称限定注入

当同一接口有多个实现时，使用 `@Named` 或 `@Resource` 指定具体实现：

```kotlin title="PaymentService.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.annotation.*

interface PaymentGateway {
    fun channel(): String
}

@Component("wechatGateway")
class WechatGateway : PaymentGateway {
    override fun channel() = "wechat"
}

@Component("alipayGateway")
class AlipayGateway : PaymentGateway {
    override fun channel() = "alipay"
}

@Service
class PaymentService {

    // 使用 @Named 指定注入 wechatGateway
    @Inject
    @Named("wechatGateway")
    lateinit var primaryGateway: PaymentGateway

    // 使用 @Resource 指定注入 alipayGateway
    @Resource(name = "alipayGateway")
    fun bindFallback(gateway: PaymentGateway) {
        this.fallbackGateway = gateway
    }

    private lateinit var fallbackGateway: PaymentGateway
}
```

**代码说明：**
- `@Component("wechatGateway")`：注册 Bean 时指定名称
- `@Named("wechatGateway")`：配合 `@Inject` 按名称限定注入
- `@Resource(name = "alipayGateway")`：按名称注入资源，可用于字段或方法

## 生命周期回调

IoC 容器提供三个生命周期注解：

```kotlin title="LifecycleService.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.annotation.Service
import top.wcpe.yourplugin.ioc.annotation.PostConstruct
import top.wcpe.yourplugin.ioc.annotation.PostEnable
import top.wcpe.yourplugin.ioc.annotation.PreDestroy

@Service
class LifecycleService {

    @PostConstruct
    fun onInit() {
        println("Bean 初始化完成，依赖注入已执行")
    }

    @PostEnable
    fun onEnable() {
        println("所有 Bean 已就绪，插件 ENABLE 阶段统一执行")
    }

    @PreDestroy
    fun onDestroy() {
        println("容器关闭前执行清理")
    }
}
```

**执行时序：**
1. `@PostConstruct` — Bean 创建并注入完成后立即调用
2. `@PostEnable` — 所有 Bean 就绪后，在 ENABLE 阶段（优先级 -80）统一执行
3. `@PreDestroy` — 容器关闭时（DISABLE 阶段）按初始化逆序调用

:::info

一个类可以有多个标注了同一生命周期注解的方法，所有方法都会被调用。

:::

## 从容器获取 Bean

IoC 容器提供两种方式获取 Bean：

```kotlin title="GetBean.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.bean.BeanContainer

// 按类型获取
val userService = BeanContainer.getBean(UserService::class.java)

// 按名称获取
val gateway = BeanContainer.getBean(PaymentGateway::class.java, "wechatGateway")

// 获取某类型的所有 Bean
val allGateways = BeanContainer.getBeansOfType(PaymentGateway::class.java)

// 检查 Bean 是否存在
val exists = BeanContainer.containsBean("userService")

// 获取所有 Bean 名称
val names = BeanContainer.getBeanNames()

// 手动注册 Bean
BeanContainer.registerBean("manualValue", MyCustomObject("data"))
```

### Kotlin 扩展方法

更简洁的 Bean 获取方式：

```kotlin title="BeanExtensions.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.bean.bean
import top.wcpe.yourplugin.ioc.bean.beanOrNull
import top.wcpe.yourplugin.ioc.bean.beans

// 按类型获取，找不到抛异常
val userService = bean<UserService>()

// 按名称获取
val gateway = bean<PaymentGateway>("wechatGateway")

// 按类型获取，找不到返回 null
val optional = beanOrNull<UserService>()

// 获取某类型的所有 Bean
val allGateways = beans<PaymentGateway>()
```

**代码说明：**
- `bean<T>()`：基于 Kotlin reified 泛型，按类型获取 Bean，找不到时抛出 `IllegalStateException`
- `beanOrNull<T>()`：找不到时返回 `null`，适合可选依赖场景
- `beans<T>()`：获取指定类型的所有 Bean（包括手动注册的）

## Kotlin object 注入

所有位于插件 Jar 中、字段上带 `@Inject` 或 `@Resource` 的 Kotlin `object` 都会自动注入：

```kotlin title="PluginState.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.annotation.Inject

object PluginState {

    @Inject
    lateinit var userService: UserService

    fun doSomething() {
        userService.getUser("123")
    }
}
```

:::info

Kotlin `object` 的注入在 ENABLE 阶段（优先级 -90）执行，晚于容器初始化（-100），早于 `@PostEnable`（-80）。

:::

## 作用域与懒加载

IoC 容器支持多种作用域，控制 Bean 的创建策略：

```kotlin title="Scopes.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.annotation.*

// 默认单例 — 容器内唯一实例
@Service
class SingletonService

// 每次获取都创建新实例
@Service
@Prototype
class PrototypeService

// 延迟初始化，首次使用时才创建
@Service
@Lazy
class LazyService

// 自定义作用域
@Service
@Scope("conversation")
class ConversationService
```

| 作用域 | 注解 | 说明 |
|--------|------|------|
| singleton | 默认 | 容器内唯一实例，预初始化 |
| prototype | `@Prototype` | 每次获取创建新实例 |
| thread | `@ThreadScope` | 每个线程持有独立实例 |
| refresh | `@RefreshScope` | 可刷新缓存，支持运行时重建 |
| 自定义 | `@Scope("name")` | 配合 `registerScope()` 使用 |

:::warning[注意]

`prototype` 和自定义作用域的 Bean 不参与容器关闭时的统一 `@PreDestroy` 回调。

:::
