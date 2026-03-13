---
title: 架构文档
sidebar_label: 架构文档
sidebar_position: 3
description: TabooLib IoC 容器的内部架构、模块结构、启动时序和核心机制详解
---

# 架构文档

本文档详细说明 TabooLib IoC 容器的内部架构、启动流程和核心机制。

:::info[版本信息]

版本：1.1.0-SNAPSHOT | TabooLib 6.2.x | Kotlin 2.1.0

:::

## 模块结构与依赖关系

```
taboolib-ioc-annotation   ← 38 个注解定义（零依赖）
taboolib-ioc-api           ← 15 个数据类/接口（依赖 annotation）
taboolib-ioc-core          ← 核心实现，26+ 个类（依赖 api）
taboolib-ioc               ← 聚合打包模块
taboolib-ioc-example       ← 示例插件
test-v1_20 / test-v1_12    ← MC 版本集成测试
```

```mermaid
graph LR
    annotation["taboolib-ioc-annotation<br/>注解定义"]
    api["taboolib-ioc-api<br/>数据类 & 接口"]
    core["taboolib-ioc-core<br/>核心实现"]
    agg["taboolib-ioc<br/>聚合打包"]
    example["taboolib-ioc-example<br/>示例插件"]
    test20["test-v1_20"]
    test12["test-v1_12"]

    api --> annotation
    core --> api
    agg --> core
    example --> agg
    test20 --> agg
    test12 --> agg

    style annotation fill:#e3f2fd,color:#000
    style api fill:#fff3e0,color:#000
    style core fill:#e8f5e9,color:#000
    style agg fill:#f3e5f5,color:#000
    style example fill:#fce4ec,color:#000
    style test20 fill:#f1f8e9,color:#000
    style test12 fill:#f1f8e9,color:#000
```

## 核心包职责

| 包 | 核心类 | 职责 |
|---|---|---|
| `scan` | `ComponentVisitor`, `ClassScanner`, `ConfigurationScanner`, `ComponentScanPackages` | 类扫描、元数据解析、`@ComponentScan` 包过滤 |
| `bean` | `BeanContainer`, `BeanResolver`, `BeanRegistry`, `BeanContainerExtensions` | 容器主入口、Bean 查找与作用域解析 |
| `inject` | `Injector`, `FieldInjector`, `ConstructorResolver`, `ObjectInjector`, `LazyProxyFactory`, `ValueResolver` | 依赖注入（字段/构造函数/方法/@Value）、`@Lazy` 代理 |
| `lifecycle` | `LifecycleManager`, `ContainerLifecycle`, `EventBus` | 生命周期管理、TabooLib 生命周期集成、容器事件 |
| `cycle` | `CycleDetector`, `CycleResolver`, `CircularDependencyException` | 循环依赖检测、单例早期暴露 |
| `aop` | `AopProxyFactory`, `AdvisorRegistry`, `AspectScanner`, `InterceptorChain`, `JdkDynamicAopProxy` | AOP 代理（JDK 动态代理） |
| `condition` | `ConditionEvaluator`, `OnBeanCondition`, `OnClassCondition`, `OnMissingBeanCondition`, `OnMissingClassCondition`, `OnPropertyCondition` | 条件装配评估 |
| `scope` | `ThreadBeanScope`, `RefreshBeanScope` | 内置自定义作用域 |
| `util` | `KotlinPropertyAnnotations` | Kotlin 属性注解工具（处理 `$annotations` 合成方法） |

## 容器启动时序

容器通过 TabooLib 的 `@Awake` 和 `registerLifeCycleTask` 机制集成到 Bukkit 插件生命周期中。

```mermaid
sequenceDiagram
    participant TL as TabooLib 生命周期
    participant CV as ComponentVisitor
    participant OI as ObjectInjector
    participant CL as ContainerLifecycle
    participant BC as BeanContainer
    participant LM as LifecycleManager

    rect rgb(230, 245, 255)
        Note over TL: LOAD 阶段
        TL->>CV: @Awake(LOAD) scanAll()
        CV->>CV: 加载 runningClassMapInJar 所有类
        CV->>CV: 解析 @ComponentScan 包过滤
        CV->>CV: 阶段一：扫描组件 → 条件评估 → 注册 BeanDefinition
        CV->>CV: 扫描 @Configuration 的 @Bean 方法
        CV->>CV: 加载 @PropertySource 配置文件
        CV->>CV: 阶段二：评估 @ConditionalOnBean / @ConditionalOnMissingBean
        TL->>OI: @Awake(LOAD) collectObjectClasses()
        OI->>OI: 收集带 @Inject/@Resource 的 Kotlin object 类
        TL->>CL: @Awake(LOAD) registerLifecycleTasks()
        CL->>CL: 注册 ENABLE/DISABLE 阶段任务
    end

    rect rgb(230, 255, 230)
        Note over TL: ENABLE 阶段
        TL->>BC: ENABLE 优先级 -100
        BC->>BC: registerBuiltinScopes (thread, refresh)
        BC->>BC: initializeAspects → AspectScanner 解析 Advisor
        BC->>BC: discoverBeanPostProcessors
        BC->>LM: initialize()
        LM->>LM: validateScopes — 验证所有 Bean 作用域
        LM->>LM: logResolvableDependencyCycles — 循环依赖检测
        LM->>LM: topologicalSort — 按 @DependsOn 拓扑排序
        LM->>LM: 预初始化 eager singleton（先切面后普通）
        LM->>LM: 发布 ContainerInitializedEvent

        TL->>OI: ENABLE 优先级 -90
        OI->>OI: injectObjectFields — 注入 object 类字段
        OI->>OI: 支持 @Lazy 代理注入

        TL->>BC: ENABLE 优先级 -80
        BC->>LM: invokePostEnable()
        LM->>LM: 按初始化顺序执行 @PostEnable 方法
    end

    rect rgb(255, 235, 235)
        Note over TL: DISABLE 阶段
        TL->>BC: DISABLE 优先级 100
        BC->>LM: shutdown()
        LM->>LM: 按初始化逆序执行 @PreDestroy
        LM->>LM: 发布 ContainerShutdownEvent
        BC->>BC: 清理作用域、AdvisorRegistry、CycleResolver
        BC->>BC: 清理 BeanRegistry、ValueResolver
    end
```

### LOAD 阶段 — 组件扫描

入口：`ComponentVisitor.scanAll()`（`@Awake(LifeCycle.LOAD)`）

1. 从 `runningClassMapInJar` 加载 Jar 内所有类
2. 解析 `@ComponentScan` 注解，确定扫描包范围（`ComponentScanPackages.resolve`）
3. 按包名过滤候选类（`ComponentScanPackages.matches`）
4. **阶段一扫描：**
   - 对每个候选类调用 `ClassScanner.scan()` 生成 `BeanDefinition`
   - 评估类级条件注解（`@ConditionalOnClass`、`@ConditionalOnMissingClass`、`@ConditionalOnProperty`、`@Conditional`）
   - 带 `@ConditionalOnBean` / `@ConditionalOnMissingBean` 的延迟到阶段二
   - 通过条件的注册到 `BeanRegistry`
   - 对 `@Configuration` 类：`ConfigurationScanner.scan()` 扫描 `@Bean` 方法，评估方法级条件注解后注册
   - 加载 `@PropertySource` 指定的配置文件到 `ValueResolver`
5. **阶段二扫描：**
   - 评估延迟的 `@ConditionalOnBean` / `@ConditionalOnMissingBean`（此时 BeanRegistry 已有阶段一的注册结果）

同时，`ObjectInjector.collectObjectClasses()` 在 LOAD 阶段收集所有带 `@Inject`/`@Resource` 字段的 Kotlin `object` 类。

### ENABLE -100 — 容器初始化

入口：`ContainerLifecycle` → `BeanContainer.initialize()`

```
registerBuiltinScopes (thread, refresh)
    ↓
initializeAspects — 创建切面 Bean 实例 → AspectScanner 解析 Advisor → 注册到 AdvisorRegistry
    ↓
discoverBeanPostProcessors — 发现并注册 BeanPostProcessor
    ↓
LifecycleManager.initialize()
    ├── validateScopes — 验证所有 BeanDefinition 的作用域是否已注册
    ├── logResolvableDependencyCycles — 对单例 Bean 做循环依赖检测（仅日志警告）
    ├── topologicalSort — 按 @DependsOn 声明拓扑排序
    ├── 预初始化 eager singleton（先切面 Bean 后普通 Bean）
    │   └── 对每个 Bean 调用 getOrCreateSingleton → createBean
    └── 发布 ContainerInitializedEvent
```

### ENABLE -90 — Object 注入

入口：`ObjectInjector.injectObjectFields()`

- 遍历 LOAD 阶段收集的 Kotlin `object` 类
- 通过 `INSTANCE` 静态字段获取 object 单例
- 对每个 `@Inject`/`@Resource` 字段：
  - 带 `@Lazy`：通过 `LazyProxyFactory` 创建 JDK 动态代理
  - 不带 `@Lazy`：直接调用 `BeanContainer.getBean()` 获取实例并注入

### ENABLE -80 — PostEnable 回调

入口：`ContainerLifecycle` → `BeanContainer.invokePostEnable()` → `LifecycleManager.invokePostEnable()`

- 按 `initializationOrder`（Bean 创建顺序）遍历所有已初始化的 singleton
- 执行每个 Bean 的 `@PostEnable` 方法
- 对 `@Bean` 工厂方法产物，会补充扫描实际类型上的 `@PostEnable` 方法

### DISABLE 100 — 容器关闭

入口：`ContainerLifecycle` → `BeanContainer.shutdown()`

```
LifecycleManager.shutdown()
    ├── 按 initializationOrder 逆序遍历 singleton
    ├── 执行每个 Bean 的 @PreDestroy 方法
    ├── 发布 BeanDestroyedEvent
    └── 发布 ContainerShutdownEvent
        ↓
清理 customScopes（调用每个 scope 的 clear()）
清理 AdvisorRegistry
清理 CycleResolver
清理 BeanRegistry
清理 manualBeansByName
清理 EventBus
清理 ValueResolver
```

## Bean 创建流程

`LifecycleManager.createBean()` 是 Bean 实例化的核心方法，处理完整的创建-注入-初始化-代理流程。

```mermaid
flowchart TD
    Start(["createBean(definition)"])
    CheckCycle{"创建栈中是否存在<br/>当前 Bean？"}
    ThrowCycle["抛出 CircularDependencyException"]
    PushStack["压入创建栈"]
    Instantiate["实例化<br/>构造函数 new / @Bean 工厂方法 invoke"]
    EarlyExpose{"是单例？"}
    CacheEarly["早期暴露到 CycleResolver"]
    BPPBefore["BeanPostProcessor<br/>.postProcessBeforeInitialization"]
    Populate["populate 属性装配<br/>① 字段注入 @Inject/@Resource<br/>② 方法注入（setter）<br/>③ @Value 属性注入<br/>④ @Bean 产物补充扫描"]
    PostConstruct["执行 @PostConstruct 回调"]
    BPPAfter["BeanPostProcessor<br/>.postProcessAfterInitialization"]
    UpdateCache{"processedInstance<br/>被替换？"}
    UpdateCycle["更新 CycleResolver 缓存"]
    AopCheck{"非切面 Bean 且<br/>有匹配的 Advisor？"}
    AopWrap["AopProxyFactory.wrapIfNecessary<br/>JDK 动态代理包装"]
    UpdateAop["更新 CycleResolver 缓存"]
    Record["记录 initializationOrder"]
    PublishEvent["发布 BeanCreatedEvent"]
    PopStack["弹出创建栈"]
    Return(["返回 finalInstance"])

    Start --> CheckCycle
    CheckCycle -- 是 --> ThrowCycle
    CheckCycle -- 否 --> PushStack
    PushStack --> Instantiate
    Instantiate --> EarlyExpose
    EarlyExpose -- 是 --> CacheEarly
    EarlyExpose -- 否 --> BPPBefore
    CacheEarly --> BPPBefore
    BPPBefore --> Populate
    Populate --> PostConstruct
    PostConstruct --> BPPAfter
    BPPAfter --> UpdateCache
    UpdateCache -- 是 --> UpdateCycle
    UpdateCache -- 否 --> AopCheck
    UpdateCycle --> AopCheck
    AopCheck -- 是 --> AopWrap
    AopCheck -- 否 --> Record
    AopWrap --> UpdateAop
    UpdateAop --> Record
    Record --> PublishEvent
    PublishEvent --> PopStack
    PopStack --> Return

    style Start fill:#e3f2fd,color:#000
    style Return fill:#e3f2fd,color:#000
    style ThrowCycle fill:#fce4ec,color:#000
    style AopWrap fill:#f3e5f5,color:#000
    style PostConstruct fill:#e8f5e9,color:#000
    style Populate fill:#fff3e0,color:#000
```

实例化方式取决于 `BeanDefinition` 的类型：

| 类型 | 实例化方式 |
|---|---|
| 普通组件（`@Component`/`@Service`/`@Repository`/`@Controller`） | `ConstructorResolver` 选择构造函数 → `constructor.newInstance(args)` |
| `@Bean` 工厂方法产物 | 获取 `@Configuration` 类实例 → `factoryMethod.invoke(configInstance, args)` |

构造函数/工厂方法参数解析支持 `@Lazy` 延迟代理（通过 `LazyProxyFactory` 创建 JDK 动态代理）。

## 依赖解析流程

依赖解析涉及两个层次：`FieldInjector.resolveDependency()` 负责入口路由，`BeanResolver.resolveBean()` 负责实际查找与作用域处理。

```mermaid
flowchart TD
    Start(["resolveDependency(type, nameQualifier)"])
    HasName{"nameQualifier<br/>非空？"}
    ByName["按名称从 BeanRegistry 查找"]
    NameFound{"找到且类型匹配？"}
    CallProvider1["beanProvider(type, name)"]
    FallbackProvider["回退到 beanProvider"]
    ByType["beanProvider(type, null)<br/>→ BeanResolver.resolveBean"]

    subgraph BeanResolver["BeanResolver.resolveBean(type, name)"]
        direction TB
        ResolveEntry{"name 非空？"}
        GetByName["registry.getByName(name)"]
        GetPrimary["registry.getPrimaryByType(type)"]
        CheckDef{"definition 存在<br/>且类型匹配？"}
        ReturnNull1["返回 null"]
        ScopeCheck{"作用域"}
        Singleton["singletonProvider<br/>→ getOrCreateSingleton"]
        Prototype["transientProvider<br/>→ createTransient"]
        Custom["scopeLookup → scope.get()"]
    end

    Start --> HasName
    HasName -- 是 --> ByName
    ByName --> NameFound
    NameFound -- 是 --> CallProvider1
    NameFound -- 否 --> FallbackProvider
    HasName -- 否 --> ByType

    ByType --> ResolveEntry
    ResolveEntry -- 是 --> GetByName
    ResolveEntry -- 否 --> GetPrimary
    GetByName --> CheckDef
    GetPrimary --> CheckDef
    CheckDef -- 否 --> ReturnNull1
    CheckDef -- 是 --> ScopeCheck

    ScopeCheck -- singleton --> Singleton
    ScopeCheck -- prototype --> Prototype
    ScopeCheck -- 其他 --> Custom

    style Start fill:#e3f2fd,color:#000
    style BeanResolver fill:#f1f8e9,color:#000
    style ReturnNull1 fill:#fce4ec,color:#000
    style Singleton fill:#e8f5e9,color:#000
    style Prototype fill:#fff3e0,color:#000
    style Custom fill:#f3e5f5,color:#000
```

`BeanResolver` 还会检查 `manualBeansByName`（通过 `BeanContainer.registerBean()` 手动注册的 Bean），作为 `BeanRegistry` 查找的补充。

## 条件装配机制

条件装配分两个阶段评估，由 `ConditionEvaluator` 统一协调：

| 阶段 | 评估的条件注解 | 时机 |
|---|---|---|
| 阶段一（扫描时） | `@Conditional`、`@ConditionalOnClass`、`@ConditionalOnMissingClass`、`@ConditionalOnProperty` | `ComponentVisitor.scanAll()` 扫描每个类/方法时 |
| 阶段二（注册后） | `@ConditionalOnBean`、`@ConditionalOnMissingBean` | 阶段一全部注册完成后，基于已注册的 BeanDefinition 评估 |

分两阶段的原因：`@ConditionalOnBean` 需要知道哪些 Bean 已经注册，因此必须等阶段一完成后才能评估。

条件注解可以标注在：
- 组件类上（`@Component`/`@Service`/`@Configuration` 等）
- `@Bean` 工厂方法上

## AOP 代理机制

AOP 基于 JDK 动态代理实现，仅支持实现了接口的 Bean。

**初始化流程：**
1. `BeanContainer.initializeAspects()` — 找到所有 `isAspect=true` 的 BeanDefinition，创建切面实例
2. `AspectScanner.scan()` — 解析切面类中的 `@Before`/`@After`/`@Around` 方法，生成 `Advisor` 列表
3. `AdvisorRegistry.registerAll()` — 注册所有 Advisor

**代理包装：**
- 在 `createBean` 的最后阶段，`AopProxyFactory.wrapIfNecessary()` 检查 Bean 是否有匹配的 Advisor
- 切面 Bean 自身不会被代理
- 匹配时通过 `JdkDynamicAopProxy` 创建代理，方法调用经过 `InterceptorChain` 执行通知链

## 作用域管理

| 作用域 | 标识 | 实现类 | 行为 |
|---|---|---|---|
| singleton | `singleton` | 内置（`CycleResolver` 缓存） | 容器内唯一实例，预初始化 |
| prototype | `prototype` | 内置（每次 `createTransient`） | 每次请求创建新实例 |
| thread | `thread` | `ThreadBeanScope` | 线程级缓存，可通过 `getThreadScope().clear()` 清理 |
| refresh | `refresh` | `RefreshBeanScope` | 可刷新缓存，通过 `BeanContainer.refreshScope()` 触发 |
| 自定义 | 任意字符串 | 实现 `BeanScope` 接口 | 通过 `BeanContainer.registerScope()` 注册 |

作用域通过 `@Scope("name")` 或快捷注解（`@ThreadScope`、`@RefreshScope`、`@Prototype`）声明。标准作用域（singleton/prototype）不允许被覆盖。

`LifecycleManager.validateScopes()` 在容器初始化时验证所有 BeanDefinition 引用的作用域是否已注册，未注册则抛出异常。
