---
title: 常见问题
sidebar_label: 常见问题
sidebar_position: 6
description: TabooLib IoC 容器常见问题解答
---

# 常见问题

## 构造函数选择规则是什么？

容器按以下顺序选择构造函数：
1. 显式标了 `@Inject` 的构造函数
2. 类唯一的构造函数
3. 无参构造函数

如果一个类存在多个构造函数并且没有 `@Inject`，容器会抛出异常。

## Bean 名称是如何确定的？

- 注解 `value` 非空时，使用它（如 `@Component("myBean")`）
- 否则使用类名首字母小写（如 `UserService` → `userService`）

## 循环依赖如何处理？

- **singleton Bean 的字段/方法注入**：循环依赖可正常解析，通过早期暴露机制完成
- **构造函数循环依赖**：会抛出 `CircularDependencyException`，异常携带完整依赖链便于定位

## 为什么我的 Bean 没有被 AOP 代理？

AOP 基于 JDK 动态代理实现，目标 Bean 必须实现接口才能被代理。没有实现接口的 Bean 即使有匹配的 Advisor 也不会被代理，容器会输出 warning 日志提示。

## @PostConstruct 和 @PostEnable 有什么区别？

- `@PostConstruct`：在 Bean 创建并注入完成后立即调用，此时其他 Bean 可能尚未创建
- `@PostEnable`：在所有 Bean 就绪后统一执行，适合需要跨 Bean 协调的初始化逻辑

## 为什么必须使用 taboo() 而不是 compileOnly()？

`taboo()` 会将 IoC 容器打包到你的插件 Jar 内，运行时才能找到类。`compileOnly()` 只在编译时可见，运行时会抛出 `ClassNotFoundException`。

## @Lazy 字段注入为什么不生效？

字段级别的 `@Lazy` 仅支持接口类型。如果字段类型是具体类而非接口，`@Lazy` 会回退到立即注入并输出警告日志。

## 如何注册自定义作用域？

通过 `BeanContainer.registerScope()` 注册，需在容器初始化前完成：

```kotlin
BeanContainer.registerScope("conversation", object : BeanScope {
    private val cache = ConcurrentHashMap<String, Any>()

    override fun get(name: String, definition: BeanDefinition, creator: () -> Any): Any {
        return cache.getOrPut(name, creator)
    }
})
```

然后在 Bean 上使用 `@Scope("conversation")` 声明。

## Kotlin object 中的注入什么时候执行？

Kotlin `object` 的注入在 ENABLE 阶段（优先级 -90）执行，晚于容器初始化（-100），早于 `@PostEnable`（-80）。因此在 `@PostEnable` 回调中可以安全使用 `object` 中注入的依赖。
