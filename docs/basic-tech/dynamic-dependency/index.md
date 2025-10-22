---
sidebar_position: 3
---

# 动态依赖

## 重要提示

⚠️ 该功能在后续添加依赖时，因为缓存机制可能导致无法正常运行。需要删除缓存后重新加载才能生效。

**清除缓存方法：**
删除服务端根目录 `cache/taboolib/` 文件夹下你的包名对应的所有 jar 文件。

## 基本概念

动态依赖允许在运行时自动下载和加载外部库，无需将依赖打包到插件中。这样可以：
- 减小插件体积
- 避免依赖冲突
- 动态更新依赖版本

## 单个依赖

### 基础用法

使用 `@RuntimeDependency` 注解在类上声明依赖：

```kotlin
@RuntimeDependency(
    value = "!com.google.code.gson:gson:2.10.1",
    relocate = ["!com.google.gson", "!com.example.library.gson"]
)
object Example : Plugin()
```

这样在插件启动时就会自动载入 Google 的 GSON 库到服务器中。

**关键点：**
- `value` 中的 `!` 前缀：避免在编译时被重定向
- `relocate` 数组：指定重定向规则，将原包名重定向到新包名

## 注解参数详解

### 完整签名

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Repeatable(RuntimeDependencies.class)
public @interface RuntimeDependency {

    /**
     * 依赖地址，格式为：
     * <groupId>:<artifactId>[:<extension>[:<classifier>]]:<version>
     */
    String value();

    /**
     * 测试类
     */
    String test() default "";

    /**
     * 仓库地址，留空默认使用阿里云中央仓库
     */
    String repository() default "";

    /**
     * 是否进行依赖传递
     */
    boolean transitive() default true;

    /**
     * 忽略可选依赖
     */
    boolean ignoreOptional() default true;

    /**
     * 忽略加载异常
     */
    boolean ignoreException() default false;

    /**
     * 依赖范围
     */
    DependencyScope[] scopes() default {DependencyScope.RUNTIME, DependencyScope.COMPILE};

    /**
     * 依赖重定向
     */
    String[] relocate() default {};

    /**
     * 是否外部库（不会被扫描）
     */
    boolean external() default true;
}
```

### 参数说明

#### value（必填）

依赖的 Maven 坐标，格式为：

```
<groupId>:<artifactId>[:<extension>[:<classifier>]]:<version>
```

**示例：**

```kotlin
// 基础格式
value = "!com.google.code.gson:gson:2.10.1"

// 带分类器
value = "!org.example:my-lib:jar:sources:1.0.0"
```

**注意：** 使用 `!` 前缀避免在编译时被重定向。

#### test

测试类，用于检查依赖是否已经存在。

```kotlin
@RuntimeDependency(
    value = "!org.bukkit:bukkit:1.19.4-R0.1-SNAPSHOT",
    test = "!org.bukkit.Bukkit"  // 前缀 ! 避免编译时重定向
)
```

**使用场景：** 检查某个类是否已加载，避免重复下载。

#### repository

自定义 Maven 仓库地址，默认使用阿里云中央仓库。

```kotlin
@RuntimeDependency(
    value = "!com.example:custom-lib:1.0.0",
    repository = "https://repo.example.com/maven"
)
```

**默认仓库：** `https://maven.aliyun.com/repository/central`

#### transitive

是否进行依赖传递，默认为 `true`。

```kotlin
@RuntimeDependency(
    value = "!com.example:my-lib:1.0.0",
    transitive = false  // 不下载传递依赖
)
```

**说明：**
- `true`（默认）：自动下载该依赖的所有传递依赖
- `false`：只下载指定的依赖，不下载其依赖的其他库

#### ignoreOptional

是否忽略可选依赖，默认为 `true`。

```kotlin
@RuntimeDependency(
    value = "!com.example:my-lib:1.0.0",
    ignoreOptional = false  // 下载可选依赖
)
```

**说明：**
- `true`（默认）：忽略 Maven POM 中标记为 `<optional>true</optional>` 的依赖
- `false`：下载所有依赖，包括可选依赖

#### ignoreException

是否忽略加载异常，默认为 `false`。

```kotlin
@RuntimeDependency(
    value = "!com.example:my-lib:1.0.0",
    ignoreException = true  // 加载失败时不抛出异常
)
```

**使用场景：** 当依赖是可选的，加载失败不影响插件运行时使用。

#### scopes

依赖范围，默认为 `{RUNTIME, COMPILE}`。

```kotlin
@RuntimeDependency(
    value = "!com.example:my-lib:1.0.0",
    scopes = [DependencyScope.RUNTIME]
)
```

**可用范围：**

| 范围 | 说明 |
|-----|------|
| `COMPILE` | 编译时需要，运行时会下载 |
| `PROVIDED` | 运行时环境提供，不会下载 |
| `RUNTIME` | 运行时需要，会下载 |
| `TEST` | 测试时需要，运行时不会下载 |
| `SYSTEM` | 系统已有，不会下载 |
| `IMPORT` | 仅 POM 文件，不会下载 |

#### relocate

依赖重定向规则，用于避免类冲突。

```kotlin
@RuntimeDependency(
    value = "!com.google.code.gson:gson:2.10.1",
    relocate = ["!com.google.gson", "!com.example.library.gson"]
)
```

**格式：** 数组的第一个元素是原包名，第二个元素是目标包名。

**说明：**
- 使用 `!` 前缀避免编译时被重定向
- 第一个参数：原始包名（被替换的）
- 第二个参数：目标包名（替换后的）

**示例：**

```kotlin
// 将 com.google.gson 重定向到 com.example.library.gson
relocate = ["!com.google.gson", "!com.example.library.gson"]

// 将 taboolib. 重定向到 taboolib610.
relocate = ["!taboolib.", "!taboolib610."]
```

#### external

是否为外部库（不会被扫描），默认为 `true`。

```kotlin
@RuntimeDependency(
    value = "!com.example:my-lib:1.0.0",
    external = false  // 会被 TabooLib 扫描
)
```

**说明：**
- `true`（默认）：该依赖不会被 TabooLib 的类扫描器处理
- `false`：该依赖会被扫描，可以使用 TabooLib 的注解功能

## 多个依赖

### 使用 @RuntimeDependencies

当需要加载多个依赖时，使用 `@RuntimeDependencies` 包装多个 `@RuntimeDependency`：

```kotlin
@RuntimeDependencies(
    RuntimeDependency(
        value = "!com.google.code.gson:gson:2.10.1",
        relocate = ["!com.google.gson", "!com.example.library.gson"]
    ),
    RuntimeDependency(
        value = "!com.github.ben-manes.caffeine:caffeine:2.9.3",
        relocate = ["!com.github.benmanes.caffeine", "!com.example.library.caffeine"]
    )
)
object Example : Plugin()
```

**说明：** 外层使用 `@RuntimeDependencies` 作为容器，内部包含多个 `@RuntimeDependency`。

## 实际应用示例

### 示例 1：加载 GSON 库

```kotlin
@RuntimeDependency(
    value = "!com.google.code.gson:gson:2.10.1",
    relocate = ["!com.google.gson", "!com.example.myplugin.gson"]
)
object MyPlugin : Plugin()
```

使用：

```kotlin
import com.example.myplugin.gson.Gson

val gson = Gson()
val json = gson.toJson(myObject)
```

### 示例 2：加载数据库驱动

```kotlin
@RuntimeDependency(
    value = "!mysql:mysql-connector-java:8.0.33",
    transitive = false  // 不需要传递依赖
)
object MyPlugin : Plugin()
```

### 示例 3：加载多个依赖

```kotlin
@RuntimeDependencies(
    RuntimeDependency(
        value = "!com.zaxxer:HikariCP:5.0.1",
        relocate = ["!com.zaxxer.hikari", "!com.example.myplugin.hikari"]
    ),
    RuntimeDependency(
        value = "!mysql:mysql-connector-java:8.0.33",
        transitive = false
    ),
    RuntimeDependency(
        value = "!org.slf4j:slf4j-api:2.0.7",
        ignoreException = true  // 可选依赖
    )
)
object MyPlugin : Plugin()
```

### 示例 4：使用自定义仓库

```kotlin
@RuntimeDependency(
    value = "!com.example:private-lib:1.0.0",
    repository = "https://repo.example.com/maven",
    ignoreException = true
)
object MyPlugin : Plugin()
```

## 常见问题

### 为什么要使用 ! 前缀？

在 `value`、`test` 和 `relocate` 参数中使用 `!` 前缀可以避免在编译时被字节码处理工具重定向。

```kotlin
// 正确
value = "!com.google.code.gson:gson:2.10.1"

// 错误（可能在编译时被处理）
value = "com.google.code.gson:gson:2.10.1"
```

### 如何解决依赖冲突？

使用 `relocate` 参数将依赖重定向到不同的包名：

```kotlin
@RuntimeDependency(
    value = "!com.google.code.gson:gson:2.10.1",
    relocate = ["!com.google.gson", "!com.example.myplugin.gson"]
)
```

这样即使服务器中已有其他版本的 GSON，也不会发生冲突。

### 如何清除缓存？

删除以下目录中的文件：

```
服务端根目录/cache/taboolib/<你的包名>/
```

### transitive 应该设置为 true 还是 false？

- **true**（默认）：适合大多数情况，自动处理依赖关系
- **false**：当你只需要特定的库，且确定不需要其依赖时使用

示例：数据库驱动通常不需要传递依赖。

```kotlin
@RuntimeDependency(
    value = "!mysql:mysql-connector-java:8.0.33",
    transitive = false
)
```

### 如何知道依赖的 Maven 坐标？

访问 [Maven Central](https://search.maven.org/) 搜索依赖，复制坐标。

格式：`groupId:artifactId:version`

### relocate 参数的顺序是什么？

```kotlin
relocate = ["原始包名", "目标包名"]
```

第一个元素是被替换的包名，第二个元素是替换后的包名。

### 依赖下载失败怎么办？

1. 检查网络连接
2. 检查 Maven 坐标是否正确
3. 尝试指定其他仓库
4. 查看服务端日志获取详细错误信息

如果依赖是可选的，可以设置 `ignoreException = true`。
