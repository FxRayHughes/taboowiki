import React from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const TechStack = [
  {
    category: '编程语言',
    icon: '💻',
    items: [
      { name: 'Kotlin', description: '现代 JVM 语言' },
      { name: 'Java', description: '传统 JVM 语言' },
    ],
  },
  {
    category: '支持平台',
    icon: '🎮',
    items: [
      { name: 'Bukkit/Spigot', description: '1.8-1.21+' },
      { name: 'Paper/Folia', description: '高性能服务端' },
      { name: 'BungeeCord', description: '代理服务器' },
      { name: 'Velocity', description: '现代代理' },
    ],
  },
  {
    category: '核心特性',
    icon: '⚡',
    items: [
      { name: '命令系统', description: 'DSL 风格的命令框架' },
      { name: '配置管理', description: '类型安全的配置操作' },
      { name: '数据库', description: 'SQL/NoSQL 支持' },
      { name: 'GUI 菜单', description: '可视化界面构建' },
      { name: 'NMS 代理', description: '跨版本兼容' },
      { name: '事件系统', description: '高性能事件调度' },
    ],
  },
];

function TechCategory({ category, icon, items, index }) {
  return (
    <div className={clsx('col col--4', styles.techCol)}>
      <div
        className={styles.techCard}
        style={{
          '--animation-delay': `${index * 0.15}s`,
        }}
      >
        <div className={styles.techHeader}>
          <div className={styles.techIcon}>
            <span>{icon}</span>
          </div>
          <Heading as="h3" className={styles.techTitle}>
            {category}
          </Heading>
        </div>
        <ul className={styles.techList}>
          {items.map((item, idx) => (
            <li key={idx} className={styles.techItem}>
              <div className={styles.techItemDot}></div>
              <div className={styles.techItemContent}>
                <strong>{item.name}</strong>
                <span>{item.description}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function HomepageTechStack() {
  return (
    <section className={styles.techStack}>
      <div className="container">
        <div className={styles.header}>
          <Heading as="h2" className={styles.sectionTitle}>
            完整的技术生态
          </Heading>
          <p className={styles.sectionSubtitle}>
            支持多种平台,提供丰富的功能模块,满足各类开发需求
          </p>
        </div>

        <div className="row">
          {TechStack.map((props, idx) => (
            <TechCategory key={idx} {...props} index={idx} />
          ))}
        </div>

        <div className={styles.cta}>
          <Link
            className={clsx('button button--primary button--lg', styles.ctaButton)}
            to="/docs/intro"
          >
            立即开始使用 →
          </Link>
          <Link
            className={clsx('button button--outline button--lg', styles.ctaButtonOutline)}
            to="/blog"
          >
            查看更新日志
          </Link>
        </div>
      </div>
    </section>
  );
}
