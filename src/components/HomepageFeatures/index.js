import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '简单易用',
    icon: '🚀',
    description: (
      <>
        提供开箱即用的插件开发框架,通过简洁的 API 和丰富的文档,
        让您快速上手 Minecraft 插件开发。无需繁琐的配置,专注于业务逻辑实现。
      </>
    ),
  },
  {
    title: '功能强大',
    icon: '⚡',
    description: (
      <>
        内置命令系统、配置管理、数据库操作、GUI 菜单等常用功能模块,
        支持跨版本 NMS 操作,提供完善的工具链,大幅提升开发效率。
      </>
    ),
  },
  {
    title: '模块化设计',
    icon: '🔧',
    description: (
      <>
        采用模块化架构,按需加载所需功能,有效减少插件体积。
        支持 Bukkit、BungeeCord、Velocity 等多个平台,一套代码多端运行。
      </>
    ),
  },
  {
    title: '跨版本支持',
    icon: '🌐',
    description: (
      <>
        通过 NMS 代理系统实现跨版本兼容,从 1.8 到最新版本无缝支持。
        自动处理版本差异,开发者无需关心底层实现细节。
      </>
    ),
  },
  {
    title: '性能优化',
    icon: '⚙️',
    description: (
      <>
        采用高性能的事件调度器和优化的数据结构,确保插件运行流畅。
        支持异步操作和协程,充分利用多核 CPU 性能。
      </>
    ),
  },
  {
    title: '活跃社区',
    icon: '👥',
    description: (
      <>
        拥有活跃的开发者社区和完善的技术支持,
        定期更新维护,快速响应问题反馈,提供丰富的示例项目和教程。
      </>
    ),
  },
];

function Feature({title, icon, description, index}) {
  return (
    <div className={clsx('col col--4', styles.featureCol)}>
      <div className={styles.feature} style={{ '--animation-delay': `${index * 0.1}s` }}>
        <div className={styles.featureIcon}>
          <span>{icon}</span>
        </div>
        <div className={styles.featureContent}>
          <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
          <p className={styles.featureDescription}>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.featuresHeader}>
          <Heading as="h2" className={styles.sectionTitle}>
            为什么选择 TabooLib?
          </Heading>
          <p className={styles.sectionSubtitle}>
            强大的功能、优雅的设计、极致的开发体验
          </p>
        </div>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
