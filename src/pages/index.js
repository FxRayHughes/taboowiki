import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import HomepageStats from '@site/src/components/HomepageStats';
import HomepageTechStack from '@site/src/components/HomepageTechStack';
import HomepageCodeExample from '@site/src/components/HomepageCodeExample';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className={styles.heroBackground}></div>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroLogo}>
            <span className={styles.logoIcon}>
                <img src="/img/favicon.png" alt="TabooLib Logo" />
            </span>
          </div>
          <Heading as="h1" className={styles.heroTitle}>
            {siteConfig.title}
          </Heading>
          <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
          <p className={styles.heroDescription}>
            功能强大、模块化设计、简单易用的 Minecraft 插件开发框架
          </p>
          <div className={styles.buttons}>
            <Link
              className={clsx('button button--primary button--lg', styles.buttonPrimary)}
              to="/docs/intro">
              开始使用 →
            </Link>
            <Link
              className={clsx('button button--outline button--lg', styles.buttonSecondary)}
              to="https://github.com/TabooLib/taboolib">
              <svg className={styles.githubIcon} viewBox="0 0 16 16" width="20" height="20">
                <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
              </svg>
              <span>GitHub</span>
            </Link>
            <Link
              className={clsx('button button--outline button--lg', styles.buttonSecondary)}
              to="https://qm.qq.com/q/i4Q9SFRqq4">
              <span>QQ 群</span>
            </Link>
          </div>
        </div>
      </div>
      <div className={styles.heroWave}>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
        </svg>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - 现代化的 Minecraft 插件开发框架`}
      description="TabooLib 是一个现代化的 Minecraft 插件开发框架，提供丰富的工具和组件，简化插件开发流程。">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <HomepageCodeExample />
        <HomepageTechStack />
      </main>
    </Layout>
  );
}
