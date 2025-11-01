// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: 'TabooWiki',
    tagline: 'TabooLib 官方中文文档 - 现代化的 Minecraft 插件开发框架',
    favicon: 'img/favicon.ico',

    // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
    future: {
        v4: true, // Improve compatibility with the upcoming Docusaurus v4
    },

    // Set the production url of your site here
    url: 'https://taboolib.org',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'TabooLib', // Usually your GitHub org/user name.
    projectName: 'taboolib', // Usually your repo name.

    onBrokenLinks: 'throw',

    // Markdown configuration
    markdown: {
        format: 'mdx',
        mermaid: true,
        hooks: {
            onBrokenMarkdownLinks: 'warn',
        },
    },

    themes: ['@docusaurus/theme-mermaid'],

    // 中文语言支持
    i18n: {
        defaultLocale: 'zh-Hans',
        locales: ['zh-Hans'],
        localeConfigs: {
            'zh-Hans': {
                label: '简体中文',
                direction: 'ltr',
            },
        },
    },

    presets: [
        [
            'classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    sidebarPath: './sidebars.js',
                    // 编辑此页面链接
                    editUrl: 'https://github.com/FxRayHughes/taboowiki/tree/master/',
                    // 显示最后更新时间
                    showLastUpdateTime: true,
                    // 显示最后更新作者
                    showLastUpdateAuthor: true,
                    // 启用 npm2yarn 插件
                    remarkPlugins: [
                        [require('@docusaurus/remark-plugin-npm2yarn'), {sync: true}],
                    ],
                },
                blog: {
                    showReadingTime: true,
                    feedOptions: {
                        type: ['rss', 'atom'],
                        xslt: true,
                    },
                    editUrl: 'https://github.com/FxRayHughes/taboowiki/tree/master/',
                    onInlineTags: 'warn',
                    onInlineAuthors: 'warn',
                    onUntruncatedBlogPosts: 'warn',
                },
                theme: {
                    customCss: './src/css/custom.css',
                },
            }),
        ],
    ],

    themeConfig: {
        // 替换为项目的社交卡片
        image: 'img/taboolib-logo.png',
        // 颜色模式配置
        colorMode: {
            defaultMode: 'light',
            disableSwitch: false,
            respectPrefersColorScheme: false,
        },
        // Mermaid 主题配置
        mermaid: {
            theme: {light: 'neutral', dark: 'dark'},
            options: {
                look: "handDrawn",
                themeVariables: {
                    lineColor: '#0084b8'
                },
            },
        },
        // 导航栏配置
        navbar: {
            title: 'TabooWiki',
            logo: {
                alt: 'TabooLib Logo',
                src: 'img/logo.png',
            },
            items: [
                {
                    type: 'docSidebar',
                    sidebarId: 'tutorialSidebar',
                    position: 'left',
                    label: '文档',
                },
                {
                    to: '/docs/teaching',
                    label: '教学',
                    position: 'left'
                },
                {
                    to: '/blog',
                    label: '公告与日志',
                    position: 'left'
                },
                {
                    to: '/sponsor',
                    label: '为爱发电',
                    position: 'left'
                },
                {
                    type: 'search',
                    position: 'right',
                },
                {
                    href: 'https://github.com/TabooLib/taboolib',
                    label: 'GitHub',
                    position: 'right',
                },
                {
                    href: 'https://qm.qq.com/q/i4Q9SFRqq4',
                    label: 'QQ群',
                    position: 'right',
                },
                {
                    to: '/console',
                    label: '控制台',
                    position: 'right',
                },
            ],
        },
        // 页脚配置
        footer: {
            style: 'dark',
            links: [
                {
                    title: '📖 文档',
                    items: [
                        {
                            label: '快速开始',
                            to: '/docs/intro',
                        },
                        {
                            label: '命令系统',
                            to: '/docs/basic-tech/command/',
                        },
                        {
                            label: '实用工具集',
                            to: '/docs/basic-tech/utilities/',
                        },
                    ],
                },
                {
                    title: '🌐 社区',
                    items: [
                        {
                            label: 'GitHub',
                            href: 'https://github.com/TabooLib/taboolib',
                        },
                        {
                            label: 'QQ 群',
                            href: 'https://qm.qq.com/q/i4Q9SFRqq4',
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} TabooLib. Built with Docusaurus.`,
        },
        // 代码高亮配置
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
            // 添加 Kotlin 语言支持
            additionalLanguages: ['kotlin', 'java', 'groovy', 'yaml', 'json', 'bash', 'properties'],
            // 魔法注释配置 - 支持高亮、错误、警告行
            magicComments: [
                {
                    className: 'theme-code-block-highlighted-line',
                    line: 'highlight-next-line',
                    block: {start: 'highlight-start', end: 'highlight-end'},
                },
                {
                    className: 'code-block-error-line',
                    line: 'error-next-line',
                    block: {start: 'error-start', end: 'error-end'},
                },
                {
                    className: 'code-block-success-line',
                    line: 'success-next-line',
                    block: {start: 'success-start', end: 'success-end'},
                },
            ],
        },
    },
};

export default config;
