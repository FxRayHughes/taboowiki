---
sidebar_position: 1
---

# TabooLib 简介

欢迎来到 **TabooLib** 官方文档！TabooLib 是一个现代化的 Minecraft 插件开发框架，旨在简化插件开发流程，提供丰富的工具和组件。

## 什么是 TabooLib？

TabooLib 是一个功能强大的 Minecraft 插件开发框架，提供了：

- **跨平台支持**：支持 Bukkit、BungeeCord、Velocity 等多个平台
- **模块化设计**：按需加载所需功能模块，减少插件体积
- **丰富的工具集**：命令系统、配置文件、数据库、GUI 菜单等开箱即用
- **完善的 NMS 支持**：简化版本适配，提供统一的 NMS 操作接口
- **Kotlin 优先**：充分利用 Kotlin 语言特性，提升开发效率

## 快速开始

### 环境要求

- **JDK 8** 或更高版本
- **Gradle** 或 **Maven** 构建工具
- 基本的 **Kotlin** 或 **Java** 编程知识

### 创建第一个插件

使用 Gradle 添加 TabooLib 依赖：

```kotlin
plugins {
    id("io.izzel.taboolib") version "2.0.23"
}

dependencies {
    compileOnly("ink.ptms.core:v12004:12004:mapped")
    compileOnly("ink.ptms.core:v12004:12004:universal")
    compileOnly(kotlin("stdlib"))
    taboo("platform:platform-bukkit")
}
```

### 主类示例

```kotlin
import taboolib.common.platform.Plugin

object ExamplePlugin : Plugin() {

    override fun onEnable() {
        println("TabooLib 插件已启动！")
    }

    override fun onDisable() {
        println("TabooLib 插件已关闭！")
    }
}
```

## 文档导航

- **核心功能**：了解 TabooLib 的基础架构和核心概念
- **命令系统**：学习如何创建强大的命令系统
- **配置文件**：掌握配置文件的读写和热重载
- **数据库**：使用内置的数据库操作工具
- **GUI 菜单**：创建美观的箱子菜单界面
- **实用工具集**：探索各种便捷的工具函数

## 获取帮助

- **GitHub**：[https://github.com/TabooLib/taboolib](https://github.com/TabooLib/taboolib)
- **QQ 群**：[点击加入](https://qm.qq.com/q/i4Q9SFRqq4)

## 贡献文档

发现文档错误或想要补充内容？欢迎访问 [GitHub 仓库](https://github.com/FxRayHughes/taboowiki) 提交 Pull Request！
