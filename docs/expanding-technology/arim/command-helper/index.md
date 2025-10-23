---
title: TabooLib 5.X 风格命令帮助
sidebar_position: 12
description: TabooLib 5.0 FLAT 风格的命令帮助工具，支持跨平台和多命令配置
---

# TabooLib 5.X 风格命令帮助

TabooLib 5.X 风格命令帮助工具提供经典的 TabooLib 5.0 FLAT 风格命令帮助界面。

:::info[跨平台支持]

该工具支持跨平台使用。

:::

## 基础用法

在 `CommandComponent` 下调用 `createTabooLegacyStyleCommandHelper()` 函数即可：

```kotlin
command("example") {
    createTabooLegacyStyleCommandHelper()
}
```

或者使用 `@CommandBody` 注解：

```kotlin
@CommandBody
val main = mainCommand {
    createTabooLegacyStyleCommandHelper()
}
```

其他代码无需改动，该怎么写就怎么写。

## 配置帮助内容

工具不自带命令帮助所涉及的任何文本，您需要导入 `I18n` 模块，并在语言文件中粘贴以下内容。

### 语言文件配置

```yaml
command-helper:
  - '&7'
  - ' &f&l{pluginId} &7v{pluginVersion}'
  - '&7'
  - ' &7命令: &f/{command} &8[...]'
  - ' &7参数:'
  - '{subCommands}'
  - '&7'

command-sub:
  - ' &8- [&f{name}](h=/{command} {name} {usage}&8- &7{description};suggest=/{command} {name})'
  - ' &7{description}'

command-argument-missing:
  - '&8[&3&l{pluginId}&8] &7指令 &f{name} &7参数不足'
  - '&8[&3&l{pluginId}&8] &7正确用法:'
  - '&8[&3&l{pluginId}&8] &7/{command} {name} {usage}&8- &7{description}'

command-argument-wrong:
  - '&8[&3&l{pluginId}&8] &7指令 &f{name} &7参数有误'
  - '&8[&3&l{pluginId}&8] &7正确用法:'
  - '&8[&3&l{pluginId}&8] &7/{command} {name} {usage}&8- &7{description}'

command-argument-unknown:
  - '&8[&3&l{pluginId}&8] &7指令 &f{name} &7不存在'
  - '&8[&3&l{pluginId}&8] &7你可能想要:'
  - '&8[&3&l{pluginId}&8] &7/{command} {similar} {usage}&8- &7{description}'

command-incorrect-sender: '&8[&3&l{pluginId}&8] &7指令 &f{name} &7只能由 &f玩家 &7执行'

# 与 TabooLib 5 不同，每个子命令必须要有描述
command-no-desc: '没有描述'

# 这里需要自己修改为自己的子命令名称，不能使用 aliases 内的名称
command-subCommands-test1-description: '测试命令 1'
command-subCommands-test1-usage: '&7[&8必填参数&7] &7<&8选填参数&7>'

# 这里需要自己修改为自己的子命令名称，不能使用 aliases 内的名称
command-subCommands-test2-description: '测试命令 2'
command-subCommands-test2-usage: ''
```

:::warning[重要]

您需要将配置中的 `test1` 和 `test2` 改为自己的子命令名称，并修改后面的描述和使用方法。

:::

## 可用变量

在语言文件中可以使用以下变量：

| 变量 | 说明 |
|-----|------|
| `{pluginId}` | 插件 ID |
| `{pluginVersion}` | 插件版本 |
| `{command}` | 命令名称 |
| `{name}` | 子命令名称 |
| `{usage}` | 使用方法 |
| `{description}` | 命令描述 |
| `{similar}` | 相似命令（用于未知命令提示） |
| `{subCommands}` | 子命令列表 |

## 多命令支持

适用于插件的命令不止一个的情况。

```kotlin
command("test") {
    createTabooLegacyStyleCommandHelper("example")
}
```

或者：

```kotlin
@CommandBody
val main = mainCommand {
    createTabooLegacyStyleCommandHelper("example")
}
```

在原来的基础上向函数内传入了一个 `"example"` 作为该命令的标记。相应的，语言配置会变成这样：

```yaml
# 仅展示部分内容
command-example-helper:
  - '&7'
  - ' &f&l{pluginId} &7v{pluginVersion}'
  - '&7'
  - ' &7命令: &f/{command} &8[...]'
  - ' &7参数:'
  - '{subCommands}'
  - '&7'

command-example-sub:
  - ' &8- [&f{name}](h=/{command} {name} {usage}&8- &7{description};suggest=/{command} {name})'
  - ' &7{description}'
```

只需要在 `command-` 后添加您括号内传入的这个标记，即可解析其他命令的命令帮助。

:::info[多命令注意]

多命令会导致语言文件过长，暂时没有想到好的处理办法。

:::

## 实际应用示例

### 基础命令系统

```kotlin
import taboolib.common.platform.command.command

@CommandBody
val mainCommand = command("myplugin") {
    createTabooLegacyStyleCommandHelper()

    // 子命令: reload
    literal("reload") {
        execute<ProxyCommandSender> { sender, _, _ ->
            sender.sendMessage("重载完成!")
        }
    }

    // 子命令: help
    literal("help") {
        execute<ProxyCommandSender> { sender, _, _ ->
            sender.sendMessage("帮助信息")
        }
    }
}
```

语言文件：

```yaml
command-subCommands-reload-description: '重载配置'
command-subCommands-reload-usage: ''

command-subCommands-help-description: '显示帮助'
command-subCommands-help-usage: ''
```

### 多命令插件

```kotlin
@CommandBody
val adminCommand = command("admin") {
    createTabooLegacyStyleCommandHelper("admin")

    literal("ban") {
        dynamic("player") {
            execute<ProxyCommandSender> { sender, context, _ ->
                val player = context["player"]
                sender.sendMessage("封禁玩家: $player")
            }
        }
    }
}

@CommandBody
val userCommand = command("user") {
    createTabooLegacyStyleCommandHelper("user")

    literal("stats") {
        execute<Player> { player, _, _ ->
            player.sendMessage("你的统计信息")
        }
    }
}
```

语言文件：

```yaml
# admin 命令
command-admin-helper:
  - '&7'
  - ' &f&l管理员命令'
  - '&7'

command-admin-subCommands-ban-description: '封禁玩家'
command-admin-subCommands-ban-usage: '&7[&8玩家名&7]'

# user 命令
command-user-helper:
  - '&7'
  - ' &f&l用户命令'
  - '&7'

command-user-subCommands-stats-description: '查看统计'
command-user-subCommands-stats-usage: ''
```

## 命令帮助效果

当玩家执行命令时，会显示如下效果：

```
ExamplePlugin v1.0.0

命令: /example [...]
参数:
  - test1
    测试命令 1
  - test2
    测试命令 2

[ExamplePlugin] 指令 sfd 不存在
[ExamplePlugin] 你可能想要:
[ExamplePlugin] test1
```

## 常见问题

### 如何自定义帮助格式？

修改语言文件中的 `command-helper` 部分即可自定义帮助页面的格式。

### 子命令没有显示描述怎么办？

确保在语言文件中添加了对应的 `command-subCommands-<子命令名>-description` 配置。

### 多命令时语言文件太长怎么办？

可以考虑将不同命令的语言配置分散到不同的语言文件中，或者使用命令组来减少重复配置。

### 能否使用别名作为子命令名称？

不能，语言文件中必须使用主命令名称，不能使用 `aliases` 内的名称。
