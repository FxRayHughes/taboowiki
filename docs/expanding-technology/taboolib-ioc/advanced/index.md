---
title: 进阶功能
sidebar_label: 进阶功能
sidebar_position: 3
description: TabooLib IoC 容器进阶功能，包括 AOP 切面编程、条件装配、作用域管理、Java Config 等
---

# 进阶功能

## AOP 切面编程

使用 `@Aspect` 定义切面，通过 `@Before`、`@After`、`@Around` 拦截方法调用：

```kotlin title="AopExample.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.annotation.*
import top.wcpe.yourplugin.ioc.bean.MethodInvocation

interface OrderService {
    fun placeOrder(orderId: String): String
}

@Service
class OrderServiceImpl : OrderService {
    override fun placeOrder(orderId: String): String {
        println("下单: $orderId")
        return "OK"
    }
}

@Aspect
class LoggingAspect {

    // highlight-next-line
    @Before("execution(OrderServiceImpl.placeOrder)")
    fun beforeOrder() {
        println("准备下单...")
    }

    // highlight-next-line
    @After("execution(OrderServiceImpl.placeOrder)")
    fun afterOrder() {
        println("下单完成")
    }

    // highlight-next-line
    @Around("execution(OrderServiceImpl.placeOrder)")
    fun aroundOrder(invocation: MethodInvocation): Any? {
        val start = System.currentTimeMillis()
        val result = invocation.proceed()
        println("耗时: ${System.currentTimeMillis() - start}ms")
        return result
    }
}
```

**切点表达式支持：**

| 格式 | 说明 |
|------|------|
| `execution(类名.方法名)` | 精确匹配 |
| `execution(*.方法名)` | 匹配所有类的指定方法 |
| `execution(包名..*.方法名)` | 匹配包下所有类的指定方法 |
| `execution(类名.*)` | 匹配类的所有方法 |

:::warning[AOP 限制]

AOP 代理基于 JDK 动态代理，目标 Bean 必须实现接口才能被代理。`@Aspect` 类会自动注册为组件，无需额外标记 `@Component`。

:::

## 条件装配

根据运行时条件决定是否注册 Bean：

```kotlin title="ConditionalBeans.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.annotation.*

// 仅当 ClassPath 中存在 Redis 客户端时注册
@Service
@ConditionalOnClass("redis.clients.jedis.Jedis")
class RedisCache : Cache {
    override fun get(key: String): String? = TODO()
}

// 当没有其他 Cache 实现时，使用内存缓存作为兜底
@Service
@ConditionalOnMissingBean(Cache::class)
class InMemoryCache : Cache {
    override fun get(key: String): String? = TODO()
}

// 当系统属性 feature.audit=true 时启用审计
@Service
@ConditionalOnProperty(name = "feature.audit", havingValue = "true")
class AuditService

// 自定义条件
class ProductionCondition : Condition {
    override fun matches(context: ConditionContext): Boolean {
        return System.getProperty("env") == "production"
    }
}

@Service
@Conditional(ProductionCondition::class)
class ProductionOnlyService
```

**条件评估分两阶段：**
1. **扫描时**：`@ConditionalOnClass`、`@ConditionalOnMissingClass`、`@ConditionalOnProperty`、`@Conditional`
2. **注册后**：`@ConditionalOnBean`、`@ConditionalOnMissingBean`（依赖已注册的 Bean 信息）

:::info

同一个类上可以叠加多个条件注解，所有条件之间为 AND 关系，全部满足才注册。

:::

## 线程作用域与可刷新作用域

```kotlin title="ThreadAndRefreshScope.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.annotation.*
import top.wcpe.yourplugin.ioc.bean.BeanContainer

// 每个线程持有独立实例
@Service
@ThreadScope
class RequestContext {
    var userId: String = ""
}

// 可刷新作用域，支持运行时重建
@Service
@RefreshScope
class DynamicConfig {
    var maxRetries: Int = 3
}

// 使用
fun example() {
    // 刷新所有 refresh 作用域的 Bean
    BeanContainer.refreshScope()

    // 刷新指定 Bean
    BeanContainer.refreshScope("dynamicConfig")

    // 清理当前线程的 ThreadScope 缓存
    BeanContainer.getThreadScope()?.clearCurrentThread()
}
```

**代码说明：**
- `@ThreadScope`：线程级作用域，每个线程持有独立的 Bean 实例，适合请求上下文等场景
- `@RefreshScope`：可刷新作用域，调用 `refreshScope()` 后下次获取会重新创建实例，适合动态配置

## @Configuration + @Bean

通过 `@Configuration` 类中的 `@Bean` 方法声明 Bean，适合需要自定义创建逻辑的场景：

```kotlin title="DatabaseConfig.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.annotation.*

interface DataSource {
    fun url(): String
}

class MysqlDataSource(private val jdbcUrl: String) : DataSource {
    override fun url(): String = jdbcUrl
}

@Configuration
class DatabaseConfig {

    @Bean
    fun dataSource(@Named("jdbcUrl") url: String): DataSource = MysqlDataSource(url)

    @Primary
    @Bean("mainCache")
    fun mainCache(): CacheService = RedisCacheService()

    @ConditionalOnProperty(name = "cache.local.enabled", havingValue = "true")
    @Bean
    fun localCache(): CacheService = LocalCacheService()
}
```

**代码说明：**
- `@Configuration`：标记配置类，配置类本身也会被注册为 singleton Bean
- `@Bean`：方法返回值作为 Bean 实例，`value` 为空时名称默认为方法名
- 方法参数自动从容器中解析注入，支持 `@Named` 限定和 `@Lazy` 延迟注入
- `@Bean` 产物支持 `@PostConstruct`/`@PostEnable`/`@PreDestroy` 生命周期回调和 `@Value`/`@Inject` 字段注入

## @PropertySource 配置文件

在 `@Configuration` 类上使用 `@PropertySource` 指定配置文件，配合 `@Value` 注入属性值：

```kotlin title="AppConfig.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.annotation.*

// app.properties:
// app.name=MyPlugin
// app.version=2.0

@PropertySource("app.properties")
@Configuration
class AppConfig {
    @Bean
    fun appInfo(): AppInfo = AppInfo()
}

class AppInfo {
    @Value("\${app.name:DefaultApp}")
    var name: String = ""

    @Value("\${app.version:1.0}")
    var version: String = ""
}
```

**代码说明：**
- `@PropertySource`：指定 classpath 相对路径，支持 `.properties` 和简单的 `.yml` 格式（仅扁平 `key: value`）
- `@Value("\${key:default}")`：从配置文件或系统属性中读取值，冒号后为默认值
- 属性查找优先级：已加载配置文件 > 系统属性

## BeanPostProcessor 扩展

`BeanPostProcessor` 允许在 Bean 初始化前后对实例进行自定义处理：

```kotlin title="AuditPostProcessor.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.annotation.Component
import top.wcpe.yourplugin.ioc.bean.BeanPostProcessor

@Component
class AuditPostProcessor : BeanPostProcessor {
    override fun postProcessAfterInitialization(bean: Any, beanName: String): Any {
        println("Bean 初始化完成: $beanName")
        return bean
    }
}
```

**代码说明：**
- `postProcessBeforeInitialization`：在 `@PostConstruct` 之前调用
- `postProcessAfterInitialization`：在 `@PostConstruct` 之后、AOP 代理之前调用
- 实现此接口的 Bean 会被自动发现并注册，可以返回原始实例或包装后的代理

## @DependsOn 初始化顺序

使用 `@DependsOn` 显式声明 Bean 初始化顺序依赖，确保指定的 Bean 先初始化：

```kotlin title="DependsOnExample.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.annotation.*

@Component
class DatabaseConnection {
    @PostConstruct
    fun connect() { println("数据库已连接") }
}

// highlight-next-line
@DependsOn("databaseConnection")
@Component
class UserDao {
    @Inject
    lateinit var db: DatabaseConnection
}
```

**代码说明：**
- `@DependsOn("databaseConnection")`：确保 `DatabaseConnection` 在 `UserDao` 之前初始化
- 容器会按拓扑排序确保依赖的 Bean 先初始化
- 可用于类级别和 `@Bean` 方法级别

## 可选注入

使用 `@Inject(required = false)` 标记可选依赖，当依赖不存在时不抛异常：

```kotlin title="OptionalInject.kt" showLineNumbers
import top.wcpe.yourplugin.ioc.annotation.*

@Component
class PluginFeature {
    // 如果 AnalyticsService 没有注册，字段保持 null，不抛异常
    // highlight-next-line
    @Inject(required = false)
    var analytics: AnalyticsService? = null

    fun isAnalyticsEnabled(): Boolean = analytics != null
}
```

**代码说明：**
- `required = true`（默认）：注入失败时抛出 `IllegalStateException`
- `required = false`：注入失败时字段保持 `null`，输出 warning 日志
