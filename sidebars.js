// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.

 @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
    // 文档侧边栏
    tutorialSidebar: [
        'intro',

        // ========================================
        // 快速上手
        // ========================================
        {
            type: 'category',
            label: '👋🏻 快速上手',
            collapsed: false,
            items: [
                'start-hand/taboo-plugin/index',
                'start-hand/create-manually/index',
                'start-hand/paper-compat/index',
                'start-hand/taboostart/index',
            ]
        },

        // ========================================
        // 基础技术 - 按功能域分层
        // ========================================
        {
            type: 'category',
            label: '📚 基础技术',
            collapsed: true,
            items: [
                // 配置与国际化
                {
                    type: 'category',
                    label: '📝 配置与国际化',
                    collapsed: true,
                    items: [
                        'basic-tech/config/index',              // 配置文件
                        'basic-tech/language/index',            // 语言文件
                    ]
                },

                // 命令与事件
                {
                    type: 'category',
                    label: '⚡ 命令与事件',
                    collapsed: true,
                    items: [
                        'basic-tech/command/index',             // 命令系统
                        'basic-tech/event-manager/index',       // 事件管理
                        'basic-tech/scheduler/index',           // 调度器 & 协程
                    ]
                },

                // 界面与交互
                {
                    type: 'category',
                    label: '🎨 界面与交互',
                    collapsed: true,
                    items: [
                        'basic-tech/chest-menu/index',          // 箱子菜单
                        'basic-tech/item-builder/index',        // 物品构建器
                        'basic-tech/input-catcher/index',       // 输入捕获器
                        'basic-tech/papi/index',                // PlaceholderAPI
                    ]
                },

                // NMS 与跨版本
                {
                    type: 'category',
                    label: '🔧 NMS 与跨版本',
                    collapsed: true,
                    items: [
                        'basic-tech/nms-proxy/index',           // NMS 代理系统
                        'basic-tech/reflex/index',              // 反射工具
                        'basic-tech/packet/index',              // 数据包系统
                        'basic-tech/dynamic-dependency/index',  // 动态依赖加载
                    ]
                },

                // 游戏功能
                {
                    type: 'category',
                    label: '🎮 游戏功能',
                    collapsed: true,
                    items: [
                        'basic-tech/database/index',            // 数据库
                        'basic-tech/vault/index',               // Vault 经济
                        'basic-tech/effect/index',              // 药水效果管理
                        'basic-tech/ai/index',                  // 实体 AI 控制
                        'basic-tech/navigation/index',          // 寻路导航系统
                        'basic-tech/fake-op/index',             // 假 OP 系统
                    ]
                },

                // 通用工具
                {
                    type: 'category',
                    label: '🛠️ 通用工具',
                    collapsed: true,
                    items: [
                        'basic-tech/bukkit-util/index',         // Bukkit 工具集
                        'basic-tech/utilities/index',           // 工具集
                        'basic-tech/supplier-lazy/index',       // SupplierLazy 延迟加载
                        'basic-tech/demand/index',              // 条件判断
                        'basic-tech/self-awake/index',          // 自唤醒机制
                        'basic-tech/player-session-map/index',  // 玩家会话管理
                    ]
                },
            ],
        },

        // ========================================
        // 进阶技术
        // ========================================
        {
            type: 'category',
            label: '✨ 进阶技术',
            collapsed: true,
            items: [
                // 数据存储
                {
                    type: 'category',
                    label: '💾 数据存储',
                    collapsed: true,
                    items: [
                        'expanding-technology/player-database/index',        // 简单数据库
                        'expanding-technology/persistent-container/index',   // PTC Object ORM
                        'expanding-technology/database-ioc/index',          // Database IOC
                        'expanding-technology/alkaid-redis/index',          // Alkaid Redis
                        'expanding-technology/lettuce-redis/index',         // Lettuce Redis
                    ]
                },

                // 脚本引擎
                {
                    type: 'category',
                    label: '📜 脚本引擎',
                    collapsed: true,
                    items: [
                        'advanced-skills/script-kether/index',              // Kether 脚本
                        'advanced-skills/script-javascript/index',          // JavaScript 脚本
                        'advanced-skills/script-jexl/index',               // JEXL 表达式
                    ]
                },

                // 类加载与序列化
                {
                    type: 'category',
                    label: '🔗 类加载与序列化',
                    collapsed: true,
                    items: [
                        'advanced-skills/isolated-classloader/index',       // 隔离类加载器
                        'advanced-skills/kotlinx-serialization/index',     // Kotlinx 序列化
                    ]
                },
            ],
        },

        // ========================================
        // 拓展技术
        // ========================================
        {
            type: 'category',
            label: '🎠 拓展技术',
            collapsed: true,
            items: [
                'expanding-technology/create-expansion/index',
                {
                    type: 'category',
                    label: '🏙️ Arim 工具箱',
                    collapsed: true,
                    link: {
                        type: 'doc',
                        id: 'expanding-technology/arim/index'
                    },
                    items: [
                        'expanding-technology/arim/condition-evaluator/index',
                        'expanding-technology/arim/fixed-calculator/index',
                        'expanding-technology/arim/variable-calculator/index',
                        'expanding-technology/arim/item-match/index',
                        'expanding-technology/arim/entity-match/index',
                        'expanding-technology/arim/glow/index',
                        'expanding-technology/arim/weight-random/index',
                        'expanding-technology/arim/item-manager/index',
                        'expanding-technology/arim/folder-reader/index',
                        'expanding-technology/arim/menu-helper/index',
                        'expanding-technology/arim/command-helper/index',
                        'expanding-technology/arim/gson-utils/index',
                    ],
                },
                {
                    type: 'category',
                    label: '🧩 TabooLib IoC',
                    collapsed: true,
                    link: {
                        type: 'doc',
                        id: 'expanding-technology/taboolib-ioc/index'
                    },
                    items: [
                        'expanding-technology/taboolib-ioc/getting-started/index',
                        'expanding-technology/taboolib-ioc/advanced/index',
                        'expanding-technology/taboolib-ioc/api/index',
                        'expanding-technology/taboolib-ioc/architecture/index',
                        'expanding-technology/taboolib-ioc/examples/index',
                        'expanding-technology/taboolib-ioc/faq/index',
                    ],
                },
                'expanding-technology/universal-mythic/index',
            ],
        },
    ],

    // 教学侧边栏 - 暂时为空，后续添加教学内容
    teachingSidebar: [
        {
            type: 'autogenerated',
            dirName: 'teaching',
        },
    ],
};

export default sidebars;
