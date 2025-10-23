---
title: 文件夹读取工具
sidebar_position: 10
description: 批量配置文件读取工具，支持自动释放资源、多格式配置文件和自定义过滤规则
---

# 文件夹读取工具

文件夹读取工具（FolderReader）提供便捷的配置文件批量读取能力，支持自动释放插件内嵌资源文件、多格式配置文件和自定义过滤规则。

## 核心功能

- 遍历指定文件夹下的配置文件
- 自动释放插件内嵌资源文件到数据目录
- 多格式配置文件支持（YAML, JSON, TOML, HOCON 等）
- 自定义文件过滤规则
- 批量配置文件操作

## 基础用法

### 读取本地文件夹配置

```kotlin
import top.maplex.arim.tools.folderreader.readFolderWalkConfig
import java.io.File

readFolderWalkConfig(File("./plugins/ExamplePlugin/config")) {
    // 设置读取的文件类型（可选）
    setReadType(Type.YAML, Type.JSON)

    // 添加过滤规则（可选）
    addFilter { name.endsWith("_module.yml") }

    // 遍历处理每个配置文件
    walk {
        // this 指向 Configuration 对象
        val configValue = getString("example.path")
        set("updated.value", System.currentTimeMillis())
        saveToFile()
    }
}
```

### 释放并读取资源文件（常用）

```kotlin
import top.maplex.arim.tools.folderreader.releaseResourceFolderAndRead

releaseResourceFolderAndRead("config") {
    // 操作与常规读取一致
    walk {
        // 这里可以执行配置初始化检查等操作
        if (!contains("version")) {
            set("version", 1.0)
            saveToFile()
        }
    }
}
```

## API 方法

### readFolderWalkConfig - 读取文件夹配置

```kotlin
fun readFolderWalkConfig(file: File, action: FolderReader.() -> Unit)
```

**参数：**
- `file`: 目标文件夹
- `action`: FolderReader 配置和操作

### releaseResourceFolderAndRead - 释放资源并读取

```kotlin
fun releaseResourceFolderAndRead(path: String, action: FolderReader.() -> Unit)
```

**参数：**
- `path`: 资源路径（相对于插件 JAR 内部）
- `action`: FolderReader 配置和操作

**行为：**
1. 如果目标目录不存在，则释放插件 JAR 内的资源文件
2. 如果目标目录已存在，则直接读取文件内容

:::info[资源释放]

资源文件释放仅会在目标目录不存在时触发，已存在的文件不会被覆盖。

:::

## FolderReader 配置

### setReadType - 设置文件类型

```kotlin
fun setReadType(vararg type: Type)
```

**示例：**

```kotlin
// 只处理 YAML 文件
setReadType(Type.YAML)

// 同时处理 YAML 和 HOCON
setReadType(Type.YAML, Type.HOCON)
```

**支持的类型：**
- `Type.YAML`
- `Type.TOML`
- `Type.JSON`
- `Type.JSON_MINIMAL`
- `Type.HOCON`
- `Type.FAST_JSON`

### addFilter - 添加过滤器

```kotlin
fun addFilter(filter: File.() -> Boolean)
```

**示例：**

```kotlin
// 文件名过滤
addFilter { name.startsWith("secret_") }

// 路径过滤
addFilter { path.contains("modules/") }

// 复合过滤
addFilter {
    isFile &&
    length() < 1024 &&
    lastModified() > 1630454400000
}
```

### walk - 遍历配置文件

```kotlin
fun walk(action: Configuration.() -> Unit)
```

在 `walk` 闭包中，`this` 指向 `Configuration` 对象，可以使用所有 TabooLib Configuration API。

## 实际应用示例

### 批量语言文件加载

```kotlin
object LanguageManager {
    private val translations = mutableMapOf<String, MutableMap<String, String>>()

    fun loadLanguages() {
        releaseResourceFolderAndRead("locale") {
            setReadType(Type.JSON)

            walk {
                val lang = getFile()?.nameWithoutExtension ?: "en"
                val messages = mutableMapOf<String, String>()

                getConfigurationSection("messages")?.let { section ->
                    section.getKeys(false).forEach { key ->
                        messages[key] = section.getString(key) ?: ""
                    }
                }

                translations[lang] = messages
            }
        }
        println("Loaded ${translations.size} languages")
    }
}
```

### 配置热重载

```kotlin
object ConfigManager {
    fun reloadConfigurations() {
        readFolderWalkConfig(File(getDataFolder(), "config")) {
            walk {
                reload()
                println("Reloaded: ${getFile()?.name}")
            }
        }
    }
}
```

### 配置版本迁移

```kotlin
object ConfigMigration {
    fun migrateSchemas() {
        releaseResourceFolderAndRead("schemas") {
            addFilter { name.endsWith(".schema.yml") }

            walk {
                val currentVersion = getInt("meta.version", 1)

                when (currentVersion) {
                    1 -> migrateV1toV2()
                    2 -> migrateV2toV3()
                }

                saveToFile()
            }
        }
    }

    private fun Configuration.migrateV1toV2() {
        set("meta.version", 2)
        // 版本迁移逻辑
    }

    private fun Configuration.migrateV2toV3() {
        set("meta.version", 3)
        // 版本迁移逻辑
    }
}
```

### 模块化配置系统

```kotlin
object ModuleLoader {
    private val modules = mutableMapOf<String, ModuleConfig>()

    fun loadModules() {
        releaseResourceFolderAndRead("modules") {
            addFilter { name.endsWith("_module.yml") }
            setReadType(Type.YAML)

            walk {
                val moduleName = getString("module.name") ?: return@walk
                val enabled = getBoolean("module.enabled", false)

                if (enabled) {
                    modules[moduleName] = ModuleConfig(
                        name = moduleName,
                        version = getString("module.version") ?: "1.0",
                        config = this
                    )
                    println("Loaded module: $moduleName")
                }
            }
        }
    }

    data class ModuleConfig(
        val name: String,
        val version: String,
        val config: Configuration
    )
}
```

### 数据验证与修复

```kotlin
object ConfigValidator {
    fun validateAndFix() {
        readFolderWalkConfig(File(getDataFolder(), "data")) {
            setReadType(Type.YAML)

            walk {
                var modified = false

                // 验证必需字段
                if (!contains("version")) {
                    set("version", 1.0)
                    modified = true
                }

                // 修复默认值
                if (getInt("max_players", -1) == -1) {
                    set("max_players", 100)
                    modified = true
                }

                // 持久化修改
                if (modified) {
                    saveToFile()
                    println("Fixed: ${getFile()?.name}")
                }
            }
        }
    }
}
```

## 注意事项

### 默认读取类型

未调用 `setReadType()` 时，默认读取类型为 `Type.YAML`。

### 持久化修改

在 `walk` 闭包中对 `Configuration` 的修改需要调用 `saveToFile()` 才会持久化到文件。

```kotlin
walk {
    set("key", "value")
    saveToFile()  // 必须调用才会保存
}
```

### 资源释放时机

建议在插件启用时（`onEnable`）初始化资源文件：

```kotlin
@PluginOnEnable
fun onEnable() {
    releaseResourceFolderAndRead("config") {
        // 初始化配置
    }
}
```

### 过滤器执行顺序

所有过滤器都必须返回 `true` 才会处理文件（AND 逻辑）：

```kotlin
addFilter { name.startsWith("config_") }  // 条件1
addFilter { !name.contains("temp") }      // 条件2
// 只有同时满足条件1和条件2的文件才会被处理
```

## 常见问题

### 如何只读取特定扩展名的文件？

```kotlin
readFolderWalkConfig(file) {
    setReadType(Type.YAML)  // 只读取 YAML 文件
    // 等价于
    addFilter { extension == "yml" || extension == "yaml" }
}
```

### 如何清除所有过滤器？

```kotlin
clearFilter()
```

### 如何递归读取子文件夹？

`walk()` 默认递归遍历所有子文件夹，无需额外配置。

### 如何获取当前配置文件的路径？

```kotlin
walk {
    val file = getFile()
    val fileName = file?.name
    val filePath = file?.absolutePath
}
```

### 如何处理读取错误？

建议使用 `try-catch` 包裹：

```kotlin
walk {
    try {
        val value = getString("some.path")
        // 处理配置
    } catch (e: Exception) {
        println("Error reading ${getFile()?.name}: ${e.message}")
    }
}
```
