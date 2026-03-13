---
title: 最佳实践与测试
sidebar_label: 最佳实践与测试
sidebar_position: 5
description: TabooLib IoC 容器的完整插件示例和单元测试指南
---

# 最佳实践与测试

## 完整的插件示例

以下是一个完整的插件示例，展示组件定义、依赖注入、名称限定、生命周期和容器查询的组合使用：

```kotlin title="ExamplePlugin.kt" showLineNumbers
import taboolib.common.LifeCycle
import taboolib.common.platform.Awake
import top.wcpe.yourplugin.ioc.annotation.*
import top.wcpe.yourplugin.ioc.bean.BeanContainer

// 1. 定义仓储
@Repository
class UserRepository {
    fun loadStatus(): String = "ioc-ready"
}

// 2. 定义服务，使用构造函数注入
@Service
class ReportService @Inject constructor(
    private val repository: UserRepository
) {
    @Inject
    @Named("wechatGateway")
    lateinit var auditGateway: PaymentGateway

    @Resource(name = "alipayGateway")
    fun bindFallback(gateway: PaymentGateway) {
        this.fallbackGateway = gateway
    }

    private lateinit var fallbackGateway: PaymentGateway

    @PostConstruct
    fun onInit() {
        println("ReportService 初始化完成")
    }

    @PreDestroy
    fun onDestroy() {
        println("ReportService 销毁")
    }
}

// 3. 定义控制器
@Controller
class FeatureController @Inject constructor(
    private val reportService: ReportService
) {
    fun run() {
        // 从容器获取 Bean
        val service = BeanContainer.getBean(ReportService::class.java)
        val gateways = BeanContainer.getBeansOfType(PaymentGateway::class.java)
        println("Gateways: ${gateways.map { it.channel() }}")
    }
}

// 4. 插件入口
object ExamplePlugin {

    @Inject
    lateinit var controller: FeatureController

    @Awake(LifeCycle.ACTIVE)
    fun onActive() {
        // 手动注册 Bean
        BeanContainer.registerBean("customToken", CustomToken("value"))
        // 执行业务逻辑
        controller.run()
    }
}
```

## 单元测试

IoC 容器的一大优势是让业务组件可以脱离 Bukkit/TabooLib 运行时进行单元测试。项目提供了 `IocTestContext` 轻量测试上下文，在纯 JUnit 环境中即可完成依赖注入和容器行为验证。

### 配置测试依赖

```kotlin title="build.gradle.kts"
dependencies {
    // 生产依赖
    taboo(project(":taboolib-ioc"))

    // 测试依赖
    testImplementation(project(":taboolib-ioc-core"))
    testImplementation(project(":taboolib-ioc-api"))
    testImplementation("org.junit.jupiter:junit-jupiter-api:5.8.1")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.8.1")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
```

### IocTestContext 测试上下文

`IocTestContext` 是一个不依赖 `BeanContainer` 单例的独立容器，每个测试方法创建自己的实例，互不干扰：

```kotlin title="IocTestExample.kt" showLineNumbers
@Test
fun `构造函数注入 - Service 通过构造函数获取 Repository 依赖`() {
    val ctx = IocTestContext()
    ctx.register(SimpleUserRepository::class.java)
    ctx.register(SimpleUserService::class.java)
    ctx.initialize()

    val service = ctx.getBean(SimpleUserService::class.java)

    assertNotNull(service)
    assertEquals("user-alice", service!!.findUser("alice"))
}

@Test
fun `Prototype 作用域 - 每次获取都创建新实例`() {
    PrototypeCounter.count = 0
    val ctx = IocTestContext()
    ctx.register(PrototypeCounter::class.java)
    ctx.initialize()

    val first = ctx.getBean(PrototypeCounter::class.java)
    val second = ctx.getBean(PrototypeCounter::class.java)

    assertNotSame(first, second)
    assertEquals(1, first!!.id)
    assertEquals(2, second!!.id)
}

@Test
fun `字段循环依赖 - singleton Bean 的字段循环依赖可正常解析`() {
    val ctx = IocTestContext()
    ctx.register(CycleNodeA::class.java)
    ctx.register(CycleNodeB::class.java)
    ctx.initialize()

    val a = ctx.getBean(CycleNodeA::class.java)
    val b = ctx.getBean(CycleNodeB::class.java)

    assertSame(b, a!!.nodeB)
    assertSame(a, b!!.nodeA)
}
```

:::tip[运行测试]

```bash
./gradlew :taboolib-ioc-example:test
```

:::
