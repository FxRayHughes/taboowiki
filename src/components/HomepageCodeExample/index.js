import React, { useState } from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import styles from './styles.module.css';

const codeExamples = [
  {
    title: '命令系统',
    icon: '⚡',
    description: '使用 DSL 语法快速构建命令系统',
    code: `@CommandHeader("taboolib", ["tl"])
object ExampleCommand {
    @CommandBody
    val give = subCommand {
        dynamic("user") {
            suggestion<Player> { _, _ ->
                listOf("player1", "player2")
            }
            execute<Player> { sender, context, _ ->
                val user = context["user"]
                sender.sendMessage("Hello, \${user}!")
            }
        }
    }
}`,
    language: 'kotlin',
  },
  {
    title: '配置管理',
    icon: '📝',
    description: '类型安全的配置文件操作',
    code: `@Config("config.yml")
lateinit var config: YamlConfiguration
    private set

fun loadConfig() {
    config.reload()
    val message = config.getString("message")
    val enabled = config.getBoolean("enabled")
}`,
    language: 'kotlin',
  },
  {
    title: 'NMS 代理',
    icon: '🔧',
    description: '跨版本 NMS 操作,自动适配',
    code: `val nms = nmsProxy<NMSMessage>()

// 发送 ActionBar
nms.sendActionBar(player, "Hello World")

// 发送 Title
nms.sendTitle(
    player,
    title = "Welcome",
    subtitle = "to TabooLib",
    fadeIn = 10,
    stay = 70,
    fadeOut = 20
)`,
    language: 'kotlin',
  },
];

export default function HomepageCodeExample() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className={styles.codeExample}>
      <div className="container">
        <div className={styles.header}>
          <Heading as="h2" className={styles.sectionTitle}>
            简洁优雅的 API 设计
          </Heading>
          <p className={styles.sectionSubtitle}>
            通过现代化的 DSL 语法,让插件开发更加直观和高效
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.tabs}>
            {codeExamples.map((example, idx) => (
              <button
                key={idx}
                className={clsx(styles.tab, {
                  [styles.tabActive]: activeTab === idx,
                })}
                onClick={() => setActiveTab(idx)}
                style={{ '--tab-index': idx }}
              >
                <span className={styles.tabIcon}>{example.icon}</span>
                <span className={styles.tabTitle}>{example.title}</span>
              </button>
            ))}
          </div>

          <div className={styles.codeContainer}>
            {codeExamples.map((example, idx) => (
              <div
                key={idx}
                className={clsx(styles.codePanel, {
                  [styles.codePanelActive]: activeTab === idx,
                })}
              >
                <div className={styles.codeHeader}>
                  <span className={styles.codeIcon}>{example.icon}</span>
                  <div>
                    <h3 className={styles.codeTitle}>{example.title}</h3>
                    <p className={styles.codeDescription}>
                      {example.description}
                    </p>
                  </div>
                </div>
                <div className={styles.codeBlock}>
                  <CodeBlock language={example.language}>
                    {example.code}
                  </CodeBlock>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
