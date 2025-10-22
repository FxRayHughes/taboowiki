import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '🚀 简单易用',
    description: (
      <>
        TabooLib 提供开箱即用的插件开发框架，通过简洁的 API 和丰富的文档，
        让您快速上手 Minecraft 插件开发。
      </>
    ),
  },
  {
    title: '⚡ 功能强大',
    description: (
      <>
        内置命令系统、配置管理、数据库操作、GUI 菜单等常用功能模块，
        支持跨版本 NMS 操作，大幅提升开发效率。
      </>
    ),
  },
  {
    title: '🔧 模块化设计',
    description: (
      <>
        采用模块化架构，按需加载所需功能，减少插件体积。
        支持 Bukkit、BungeeCord、Velocity 等多个平台。
      </>
    ),
  },
];

function Feature({title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
