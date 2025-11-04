---
title: 创建自己的拓展库
sidebar_label: 创建拓展库
sidebar_position: 1
description: 如何创建和发布 TabooLib 扩展库
---

# 创建自己的拓展库

## 什么是拓展库

拓展库是基于 TabooLib 开发的独立功能模块，通过 Maven 仓库发布供其他项目依赖使用。

**与普通插件的区别：**

| 特性 | 拓展库 | 普通插件 |
|------|--------|---------|
| **用途** | 可复用的功能模块 | 独立的完整应用 |
| **使用方式** | 作为依赖引用 | 放入 plugins 文件夹 |
| **发布形式** | Maven 仓库 | JAR 文件 |
| **subproject** | `true` | `false` |

---

## 项目结构

```
my-expansion/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── src/main/kotlin/
```

---

## 配置文件

### settings.gradle.kts

```kotlin
rootProject.name = "my-expansion"
```

### gradle.properties

```properties
group=com.example.expansion
version=1.0.0
```

### build.gradle.kts

```kotlin {12}
import io.izzel.taboolib.gradle.*
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    java
    `maven-publish`
    id("io.izzel.taboolib") version "2.0.27"
    kotlin("jvm") version "1.8.22"
}

taboolib {
    subproject = true  // 关键配置
    env {
        install(Basic, Bukkit, BukkitUI)
    }
    version {
        taboolib = "6.2.3-1a8d7125"
    }
}

repositories {
    mavenCentral()
}

dependencies {
    compileOnly(kotlin("stdlib"))
}

tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        jvmTarget = "1.8"
        freeCompilerArgs = listOf("-Xjvm-default=all")
    }
}

configure<JavaPluginConvention> {
    sourceCompatibility = JavaVersion.VERSION_1_8
    targetCompatibility = JavaVersion.VERSION_1_8
}

publishing {
    repositories {
        maven {
            url = uri("https://nexus.maplex.top/repository/maven-releases/")
            isAllowInsecureProtocol = true
            credentials {
                username = project.findProperty("mavenUsername")?.toString()
                password = project.findProperty("mavenPassword")?.toString()
            }
            authentication {
                create<BasicAuthentication>("basic")
            }
        }
        mavenLocal()
    }
    publications {
        create<MavenPublication>("maven") {
            from(components.findByName("java"))
            groupId = project.group.toString()
            artifactId = rootProject.name
            version = project.version.toString()
        }
    }
}
```

---

## subproject 选项详解

### 为什么需要 subproject = true

| subproject = false（插件模式） | subproject = true（扩展库模式） |
|-------------------------------|--------------------------------|
| 打包完整插件（包含 TabooLib） | 只打包你的代码 |
| JAR 文件 5-10 MB | JAR 文件几百 KB |
| 直接放入 plugins 文件夹使用 | 作为 Maven 依赖使用 |

### subproject = true 的作用

1. **不打包依赖** - 生成的 JAR 不包含 TabooLib 和其他依赖
2. **保持纯净** - 只包含你的源代码
3. **作为库使用** - 供其他项目通过 Maven 依赖

---

## 发布

### 配置凭证

在 `gradle.properties` 添加：

```properties
mavenUsername=你的账号
mavenPassword=你的密码
```

:::warning
不要将凭证提交到 Git，添加到 `.gitignore`。
:::

### 发布到 Maven

```bash
# 发布到本地
./gradlew publishToMavenLocal

# 发布到远程仓库
./gradlew publish
```

---

## 使用扩展库

在其他项目中引用：

```kotlin title="build.gradle.kts"
repositories {
    maven("https://nexus.maplex.top/repository/maven-releases/")
}

dependencies {
    compileOnly("com.example.expansion:my-expansion:1.0.0")
}
```

---

## 托管申请

如需在 TabooWiki 仓库托管，联系枫溪申请账号。
