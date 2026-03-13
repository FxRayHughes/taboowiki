---
title: API 参考
sidebar_label: API 参考
sidebar_position: 2
description: TabooLib IoC 容器的完整 API 参考，包含所有注解、容器方法和扩展函数
---

# API 参考

本文档描述 TabooLib IoC 容器当前版本真实可用的公开 API。

## 组件注解

### @Component

通用组件注解。

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Component(val value: String = "")
```

- `value` 为空时，Bean 名称默认为类名首字母小写

### @Service

服务组件注解，行为与 `@Component` 一致，语义上标记业务逻辑层。

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Service(val value: String = "")
```

### @Repository

仓储组件注解，行为与 `@Component` 一致，语义上标记数据访问层。

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Repository(val value: String = "")
```

### @Controller

控制器组件注解，行为与 `@Component` 一致，语义上标记控制层。

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Controller(val value: String = "")
```

## 注入注解

### @Inject

依赖注入注解，支持构造函数、字段和方法注入。

```kotlin
@Target(AnnotationTarget.CONSTRUCTOR, AnnotationTarget.FIELD, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class Inject(val required: Boolean = true)
```

- `required = true`（默认）：注入失败时抛出 `IllegalStateException`
- `required = false`：注入失败时字段保持 `null`，输出 warning 日志

```kotlin title="示例"
@Service
class UserService @Inject constructor(
    private val repository: UserRepository  // 构造函数注入
) {
    @Inject
    lateinit var formatter: TextFormatter   // 字段注入

    @Inject
    fun bindLogger(logger: LoggerService) { // 方法注入
        this.logger = logger
    }
    private lateinit var logger: LoggerService

    @Inject(required = false)
    var analytics: AnalyticsService? = null  // 可选注入
}
```

### @Named

给 `@Inject` 指定名称限定。

```kotlin
@Target(AnnotationTarget.VALUE_PARAMETER, AnnotationTarget.FIELD)
@Retention(AnnotationRetention.RUNTIME)
annotation class Named(val value: String = "")
```

```kotlin title="示例"
@Inject
@Named("wechatGateway")
lateinit var gateway: PaymentGateway
```

### @Resource

按名称注入资源，可用于字段或方法。

```kotlin
@Target(AnnotationTarget.FIELD, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class Resource(val name: String = "")
```

```kotlin title="示例"
@Resource(name = "alipayGateway")
fun bindGateway(gateway: PaymentGateway) {
    this.gateway = gateway
}
```

### @Value

属性注入，从 `@PropertySource` 加载的配置文件或系统属性中读取值。

```kotlin
@Target(AnnotationTarget.FIELD)
@Retention(AnnotationRetention.RUNTIME)
annotation class Value(val value: String)
```

格式为 `\${property:default}`，冒号后为默认值。

```kotlin title="示例"
@Value("\${app.name:DefaultApp}")
var name: String = ""
```

## 作用域注解

### @Scope

声明 Bean 作用域。

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Scope(val value: String = "singleton")
```

- 默认作用域是 `singleton`
- 内置支持 `singleton` 与 `prototype`
- 其他名称会被当作自定义作用域，通过 `BeanContainer.registerScope(...)` 解析

### @Prototype

`prototype` 作用域的快捷注解。

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Prototype
```

- 每次 `getBean(...)` 或每次依赖解析都会创建新实例
- prototype Bean 不参与容器关闭时的统一 `@PreDestroy`

### @ThreadScope

线程作用域快捷注解，等价于 `@Scope("thread")`。

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class ThreadScope
```

- 每个线程持有独立的 Bean 实例
- 通过 `BeanContainer.getThreadScope()?.clearCurrentThread()` 清理当前线程缓存

### @RefreshScope

可刷新作用域快捷注解，等价于 `@Scope("refresh")`。

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class RefreshScope
```

- Bean 实例会被缓存，通过 `BeanContainer.refreshScope()` 触发重建
- 支持按名称刷新：`BeanContainer.refreshScope("beanName")`

### @Lazy

延迟 Bean 初始化。

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Lazy(val value: Boolean = true)
```

- **类级别**：延迟 Bean 自身的创建时机，singleton Bean 会在首次解析时初始化
- **字段/参数级别**：对接口类型的字段或构造函数参数使用 `@Lazy`，会创建 JDK 动态代理，首次调用方法时才解析真实 Bean

:::warning[注意]

字段级别的 `@Lazy` 仅支持接口类型，非接口类型会回退到立即注入并输出警告。

:::

## 优先级与排序注解

### @Primary

标记首选 Bean。当同一类型存在多个 Bean 时，`getBean` 按类型解析优先返回标记了 `@Primary` 的。

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Primary
```

```kotlin title="示例"
interface Cache {
    fun type(): String
}

@Component
@Primary
class RedisCache : Cache {
    override fun type() = "redis"
}

@Component
class LocalCache : Cache {
    override fun type() = "local"
}

// getBean(Cache::class.java) 返回 RedisCache
```

### @Order

控制 Bean 的排序优先级。

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Order(val value: Int = Int.MAX_VALUE)
```

- 值越小优先级越高，默认为 `Int.MAX_VALUE`
- 影响 `getBeansOfType` 返回顺序
- 影响 AOP Advisor 执行顺序
- 无 `@Primary` 时，`getPrimaryByType` 返回 order 值最小的

## 生命周期注解

### @PostConstruct

Bean 完成依赖注入后执行。方法无参数，一个类可以有多个。

```kotlin
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class PostConstruct
```

### @PostEnable

插件 ENABLE 后统一执行的回调。在所有 Bean 创建完毕、object 注入完成后调用。

```kotlin
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class PostEnable
```

**执行时序：** `@PostConstruct`（Bean 创建时）→ object 注入 → `@PostEnable`（ENABLE -80）→ 用户 `@Awake(LifeCycle.ENABLE)`

### @PreDestroy

容器关闭时执行。方法无参数，一个类可以有多个。

```kotlin
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class PreDestroy
```

## 配置注解

### @Configuration

标记一个类为配置类，其中的 `@Bean` 方法会被扫描并注册为 Bean 定义。

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Configuration
```

- 配置类本身也会被注册为 singleton Bean
- 可配合 `@PropertySource` 加载配置文件

### @Bean

在 `@Configuration` 类中声明一个 Bean。

```kotlin
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class Bean(val value: String = "")
```

- `value` 为空时，Bean 名称默认为方法名
- 方法参数会自动从容器中解析注入，支持 `@Named` 限定和 `@Lazy` 延迟注入
- 返回类型上的 `@Inject`/`@Value` 字段会被自动注入
- 返回类型上的 `@PostConstruct`/`@PostEnable`/`@PreDestroy` 会被自动调用
- 可配合 `@Primary`、`@Order`、`@Scope`、`@Lazy`、条件注解使用

### @PropertySource

指定配置文件来源，标注在 `@Configuration` 类上。

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class PropertySource(vararg val value: String)
```

- `value`：classpath 相对路径列表
- 支持 `.properties` 格式和简单的 `.yml` 格式（仅扁平 `key: value`）
- 属性查找优先级：已加载配置文件 > 系统属性

### @ComponentScan

限制当前插件 Jar 内的组件扫描范围。

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class ComponentScan(
    val value: Array<String> = [],
    val basePackages: Array<String> = [],
    val basePackageClasses: Array<KClass<*>> = []
)
```

- 未声明时，默认扫描当前插件 Jar 内的全部组件类
- 声明后，仅扫描指定包及其子包

### @DependsOn

声明当前 Bean 依赖于指定的 Bean，确保它们在当前 Bean 之前初始化。

```kotlin
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class DependsOn(vararg val value: String)
```

- `value`：依赖的 Bean 名称列表
- 容器会按拓扑排序确保依赖的 Bean 先初始化

## AOP 注解

### @Aspect

标记一个类为切面。切面类会自动注册为组件，无需额外标记 `@Component`。

```kotlin
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Aspect
```

- 切面 Bean 在容器初始化时优先创建
- 切面 Bean 自身不会被 AOP 代理

### @Before

前置通知，在目标方法执行之前调用。

```kotlin
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class Before(val value: String)
```

- `value`：切点表达式，格式为 `execution(类名.方法名)`

### @After

后置通知，在目标方法执行之后调用（无论是否抛出异常）。

```kotlin
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class After(val value: String)
```

### @Around

环绕通知，包裹目标方法的执行。

```kotlin
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class Around(val value: String)
```

- 通知方法必须接收一个 `MethodInvocation` 参数
- 必须调用 `invocation.proceed()` 继续执行，否则目标方法不会被调用（短路）

### @Pointcut

定义可复用的切点表达式，其他通知注解可以通过方法名引用。

```kotlin
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class Pointcut(val value: String)
```

```kotlin title="示例"
@Aspect
class MyAspect {
    @Pointcut("execution(OrderService.*)")
    fun orderMethods() {}

    @Before("orderMethods")  // 通过方法名引用切点
    fun beforeOrder() { ... }
}
```

### MethodInvocation

`@Around` 通知的方法调用上下文。

```kotlin
class MethodInvocation(
    val target: Any,                    // 目标对象
    val method: Method,                 // 被调用的方法
    val arguments: Array<out Any?>?     // 方法参数
) {
    fun proceed(): Any?                 // 继续执行拦截器链或目标方法
}
```

### 切点表达式语法

| 格式 | 说明 |
|------|------|
| `execution(类名.方法名)` | 精确匹配（支持简单类名和全限定名） |
| `execution(*.方法名)` | 匹配所有类的指定方法 |
| `execution(包名..*.方法名)` | 匹配包及子包下所有类的指定方法 |
| `execution(类名.*)` | 匹配类的所有方法 |

也可以省略 `execution()` 包裹，直接写 `类名.方法名`。

## 条件装配注解

### @Conditional

通用条件注解，指定一个或多个 `Condition` 实现类。

```kotlin
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class Conditional(vararg val value: KClass<out Condition>)
```

- 多个 Condition 之间为 AND 关系，全部满足才注册
- 可用于类级别和 `@Bean` 方法级别

### @ConditionalOnClass

当指定的类存在于 ClassPath 中时注册。

```kotlin
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class ConditionalOnClass(vararg val value: String)
```

### @ConditionalOnMissingClass

当指定的类不存在于 ClassPath 中时注册。

```kotlin
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class ConditionalOnMissingClass(vararg val value: String)
```

### @ConditionalOnBean

当容器中存在指定类型或名称的 Bean 时注册。

```kotlin
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class ConditionalOnBean(
    vararg val value: KClass<*> = [],
    val name: Array<String> = []
)
```

- 在阶段二（所有非条件 Bean 注册后）评估

### @ConditionalOnMissingBean

当容器中不存在指定类型或名称的 Bean 时注册。

```kotlin
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class ConditionalOnMissingBean(
    vararg val value: KClass<*> = [],
    val name: Array<String> = []
)
```

### @ConditionalOnProperty

当系统属性匹配指定值时注册。

```kotlin
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class ConditionalOnProperty(
    val name: String,
    val havingValue: String = "",
    val matchIfMissing: Boolean = false
)
```

- `havingValue` 为空时，仅检查属性是否存在
- `matchIfMissing`：属性不存在时是否视为匹配

### Condition 接口

自定义条件实现接口。

```kotlin
interface Condition {
    fun matches(context: ConditionContext): Boolean
}
```

### ConditionContext 接口

条件评估上下文，提供容器和类加载器信息。

```kotlin
interface ConditionContext {
    fun getClassLoader(): ClassLoader
    fun containsBeanDefinition(name: String): Boolean
    fun getBeanNamesForType(type: Class<*>): List<String>
}
```

## BeanContainer API

### getBean(type, name?)

```kotlin
fun <T> getBean(type: Class<T>, name: String? = null): T?
```

- `name != null` 时，优先按名称解析
- `name == null` 时，优先从容器组件中按类型解析
- 如果没有托管组件，再回退到手动注册的同类型实例
- 支持接口和父类类型查询

### getBeansOfType(type)

```kotlin
fun <T> getBeansOfType(type: Class<T>): List<T>
```

返回所有可赋值到该类型的容器组件，同时包含 `registerBean` 手动注册的同类型实例。

### containsBean(name)

```kotlin
fun containsBean(name: String): Boolean
```

同时检查容器组件和手动注册实例。

### getBeanNames()

```kotlin
fun getBeanNames(): Set<String>
```

返回当前容器组件名称和手动注册名称的并集。

### registerBean(name, instance)

```kotlin
fun registerBean(name: String, instance: Any)
```

手动注册一个现成单例，注册后可被 `containsBean`、`getBeanNames`、`getBeansOfType` 查询到。

### registerScope(name, scope)

```kotlin
fun registerScope(name: String, scope: BeanScope)
```

注册一个自定义 Bean 作用域。`name` 不能覆盖内置的 `singleton` / `prototype`。需在容器初始化前完成注册。

```kotlin title="示例"
import top.wcpe.yourplugin.ioc.bean.BeanScope
import top.wcpe.yourplugin.ioc.bean.BeanDefinition
import java.util.concurrent.ConcurrentHashMap

BeanContainer.registerScope("conversation", object : BeanScope {
    private val cache = ConcurrentHashMap<String, Any>()

    override fun get(name: String, definition: BeanDefinition, creator: () -> Any): Any {
        return cache.getOrPut(name, creator)
    }
})
```

### refreshScope(name?)

```kotlin
fun refreshScope(name: String? = null)
```

刷新 `refresh` 作用域中的 Bean 缓存。`name` 不为空时仅刷新指定 Bean，为空时刷新全部。

### getThreadScope()

```kotlin
fun getThreadScope(): ThreadBeanScope?
```

获取内置的线程作用域实例，可用于手动清理当前线程的 Bean 缓存。

## Kotlin 扩展方法

基于 Kotlin reified 泛型，提供更简洁的 Bean 获取方式。

### bean&lt;T&gt;(name?)

```kotlin
inline fun <reified T> bean(name: String? = null): T
```

按类型获取 Bean，找不到时抛出 `IllegalStateException`。

### beanOrNull&lt;T&gt;(name?)

```kotlin
inline fun <reified T> beanOrNull(name: String? = null): T?
```

按类型获取 Bean，找不到时返回 `null`。

### beans&lt;T&gt;()

```kotlin
inline fun <reified T> beans(): List<T>
```

获取指定类型的所有 Bean（包括手动注册的）。

## BeanPostProcessor

Bean 后处理器扩展点，允许在 Bean 初始化前后对实例进行自定义处理。

```kotlin
interface BeanPostProcessor {
    fun postProcessBeforeInitialization(bean: Any, beanName: String): Any = bean
    fun postProcessAfterInitialization(bean: Any, beanName: String): Any = bean
}
```

- `postProcessBeforeInitialization`：在 `@PostConstruct` 之前调用
- `postProcessAfterInitialization`：在 `@PostConstruct` 之后、AOP 代理之前调用
- 实现此接口的 Bean 会被自动发现并注册

## 扫描与生命周期时序

| 阶段 | 优先级 | 操作 |
|------|--------|------|
| LOAD | — | `ComponentVisitor` 扫描组件类，解析 `@ComponentScan`，注册 `BeanDefinition` |
| LOAD | — | `ObjectInjector` 收集带 `@Inject`/`@Resource` 的 Kotlin `object` 类 |
| ENABLE | -100 | 容器初始化：注册内置作用域、创建切面、发现 `BeanPostProcessor`、预初始化 eager singleton |
| ENABLE | -90 | 注入 Kotlin `object` 字段 |
| ENABLE | -80 | 执行所有 singleton Bean 的 `@PostEnable` 回调 |
| DISABLE | 100 | 容器关闭：按初始化逆序执行 `@PreDestroy`，清理所有资源 |

## 构造函数解析规则

容器按以下顺序选择构造函数：

1. 显式标了 `@Inject` 的构造函数
2. 类唯一的构造函数
3. 无参构造函数

如果一个类存在多个构造函数并且没有 `@Inject`，容器会抛出异常。

## Bean 命名规则

- 注解 `value` 非空时，使用它
- 否则使用类名首字母小写

```kotlin
@Service("customService")
class MyService              // bean name: customService

@Repository
class UserRepository         // bean name: userRepository
```
