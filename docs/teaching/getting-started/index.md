---
sidebar_position: 2
---

# 快速入门

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

欢迎使用 TabooLib！本教程将帮助你快速创建第一个使用 TabooLib 的插件。

## 环境准备

在开始之前，请确保你已经安装了以下工具：

:::info 必需环境

- **JDK 8** 或更高版本
- **IntelliJ IDEA** （推荐）或其他 IDE

:::

## 创建项目

### 1. 创建 Gradle 项目

使用 IntelliJ IDEA 创建一个新的 Gradle 项目：

1. File → New → Project
2. 选择 **Gradle**
3. 语言选择 **Kotlin**
4. Build System 选择 **Gradle**

:::tip 使用模板

TabooLib 提供了项目模板，可以更快速地开始：
[TabooLib Plugin Template](https://github.com/TabooLib/taboolib-plugin-template)

:::

### 2. 配置 build.gradle.kts

在项目根目录的 `build.gradle.kts` 文件中添加以下配置：

<Tabs groupId="build-system">
<TabItem value="gradle-kts" label="Kotlin DSL" default>

```kotlin title="build.gradle.kts" showLineNumbers
plugins {
    java
    // highlight-next-line
    id("io.izzel.taboolib") version "2.0.23"
    id("org.jetbrains.kotlin.jvm") version "1.9.23"
}

// highlight-start
taboolib {
    // 选择需要的模块
    install("common")
    install("platform-bukkit")
    install("module-chat")
    install("module-configuration")
    install("module-lang")
    // highlight-end

    // 设置 TabooLib 版本
    version {
        taboolib = "6.2.0"
    }
}
```

</TabItem>
<TabItem value="gradle-groovy" label="Groovy DSL">

```groovy title="build.gradle" showLineNumbers
plugins {
    id 'java'
    // highlight-next-line
    id 'io.izzel.taboolib' version '2.0.23'
    id 'org.jetbrains.kotlin.jvm' version '1.9.23'
}

// highlight-start
taboolib {
    // 选择需要的模块
    install 'common'
    install 'platform-bukkit'
    install 'module-chat'
    install 'module-configuration'
    install 'module-lang'
    // highlight-end

    // 设置 TabooLib 版本
    version {
        taboolib = '6.2.0'
    }
}
```

</TabItem>
</Tabs>

:::warning 模块选择

只安装你需要的模块可以减小插件体积。常用模块包括：
- `common` - 核心功能（必需）
- `platform-bukkit` - Bukkit 平台支持
- `module-chat` - 聊天消息工具
- `module-configuration` - 配置文件管理
- `module-lang` - 多语言支持

查看[完整模块列表](/docs/basic-tech/self-awake/)了解更多。

:::

### 3. 添加依赖

```kotlin title="build.gradle.kts" {3-5}
dependencies {
    compileOnly(kotlin("stdlib"))
    // highlight-start
    compileOnly("ink.ptms.core:v12004:12004:mapped")
    compileOnly("ink.ptms.core:v12004:12004:universal")
    // highlight-end
}
```

## 创建插件主类

在 `src/main/kotlin` 目录下创建你的插件主类：

<Tabs groupId="programming-language">
<TabItem value="kotlin" label="Kotlin">

```kotlin title="src/main/kotlin/com/example/ExamplePlugin.kt" showLineNumbers
package com.example

import taboolib.common.platform.Plugin
import taboolib.common.platform.function.info
import taboolib.platform.BukkitPlugin

// highlight-next-line
object ExamplePlugin : BukkitPlugin() {

    override fun onEnable() {
        // highlight-next-line
        info("TabooLib 插件已启动！")
        info("版本: ${description.version}")
    }

    override fun onDisable() {
        info("插件已关闭，再见！")
    }
}
```

</TabItem>
<TabItem value="java" label="Java">

```java title="src/main/java/com/example/ExamplePlugin.java" showLineNumbers
package com.example;

import taboolib.common.platform.Plugin;
import taboolib.common.platform.function.FunctionKt;
import taboolib.platform.BukkitPlugin;

// highlight-next-line
public final class ExamplePlugin extends BukkitPlugin {

    private static ExamplePlugin instance;

    public ExamplePlugin() {
        instance = this;
    }

    @Override
    public void onEnable() {
        // highlight-next-line
        FunctionKt.info("TabooLib 插件已启动！");
        FunctionKt.info("版本: " + getDescription().getVersion());
    }

    @Override
    public void onDisable() {
        FunctionKt.info("插件已关闭，再见！");
    }

    public static ExamplePlugin getInstance() {
        return instance;
    }
}
```

</TabItem>
</Tabs>

:::tip Kotlin 对象

在 Kotlin 中使用 `object` 声明会自动创建单例，无需手动管理实例。这是推荐的做法！

:::

## 配置 plugin.yml

创建 `src/main/resources/plugin.yml`：

```yaml title="plugin.yml" showLineNumbers
name: ExamplePlugin
version: 1.0.0
main: com.example.ExamplePlugin
api-version: 1.13
author: YourName
description: My first TabooLib plugin

# highlight-start
# TabooLib 会自动处理依赖加载
# 无需手动指定 softdepend
# highlight-end
```

## 构建和测试

### 构建插件

```bash npm2yarn
npm run build
```

或者使用 Gradle 命令：

<Tabs groupId="operating-systems">
<TabItem value="windows" label="Windows">

```bash
gradlew clean build
```

</TabItem>
<TabItem value="unix" label="Linux/macOS">

```bash
./gradlew clean build
```

</TabItem>
</Tabs>

构建完成后，在 `build/libs` 目录下会生成插件 JAR 文件。

### 测试插件

1. 将生成的 JAR 文件复制到服务器的 `plugins` 目录
2. 启动服务器
3. 查看控制台输出

你应该会看到类似这样的日志：

```log
[ExamplePlugin] TabooLib 插件已启动！
[ExamplePlugin] 版本: 1.0.0
```

:::success 恭喜！

你已经成功创建了第一个 TabooLib 插件！🎉

:::

## 下一步

现在你已经掌握了基础，可以继续学习：

- [命令系统](/docs/basic-tech/command/) - 创建强大的命令
- [配置文件](/docs/basic-tech/config/) - 管理插件配置
- [语言文件](/docs/basic-tech/language/) - 实现多语言支持
- [数据库](/docs/basic-tech/database/) - 数据持久化

## 常见问题

<details>
<summary><b>找不到 TabooLib 类？</b></summary>

请确保：
1. Gradle 同步成功
2. 正确添加了 TabooLib 插件
3. 安装了所需的模块

尝试重新同步 Gradle 项目。

</details>

<details>
<summary><b>服务器启动时找不到主类？</b></summary>

检查 `plugin.yml` 中的 `main` 字段是否与你的类全名一致。

例如：`com.example.ExamplePlugin`

</details>

<details>
<summary><b>插件无法加载依赖？</b></summary>

确保使用了正确的 TabooLib Gradle 插件版本，它会自动处理依赖加载。

</details>

## 获取帮助

遇到问题？欢迎加入我们的社区：

- [GitHub Issues](https://github.com/TabooLib/taboolib/issues)
- [QQ 群](https://qm.qq.com/q/i4Q9SFRqq4)
- [文档首页](/docs/intro)
