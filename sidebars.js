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
        // 👋🏻 快速上手
        // ========================================
        {
            type: 'category',
            label: '👋🏻 快速上手',
            collapsed: false,
            items: [
                'start-hand/taboo-plugin/index',
                'start-hand/create-manually/index',
                'start-hand/paper-compat/index',
                'start-hand/taboostart/index'
            ]
        },

        // ========================================
        // 📚 基础技术 - 按功能域分层
        // ========================================
        {
            type: 'category',
            label: '📚 基础技术',
            collapsed: true,
            items: [
                // 🔥 核心基础 - 必学模块
                {
                    type: 'category',
                    label: '🔥 核心基础',
                    collapsed: true,
                    items: [
                        'basic-tech/config/index',              // 配置文件
                        'basic-tech/language/index',            // 语言文件
                        'basic-tech/scheduler/index',           // 调度器 & 协程
                        'basic-tech/event-manager/index',       // 事件管理
                        'basic-tech/command/index',             // 命令系统
                    ]
                },

                // 🎨 UI & 交互 - 界面相关
                {
                    type: 'category',
                    label: '🎨 UI & 交互',
                    collapsed: true,
                    items: [
                        'basic-tech/chest-menu/index',          // 箱子菜单
                        'basic-tech/item-builder/index',        // 物品构建器
                        'basic-tech/input-catcher/index',       // 输入捕获器
                        'basic-tech/papi/index',                // PlaceholderAPI
                    ]
                },

                // ⚡ 底层技术 - 跨版本 & NMS
                {
                    type: 'category',
                    label: '⚡ 底层技术',
                    collapsed: true,
                    items: [
                        'basic-tech/nms-proxy/index',           // NMS 代理系统
                        'basic-tech/reflex/index',              // 反射工具
                        'basic-tech/packet/index',              // 数据包系统
                        'basic-tech/dynamic-dependency/index',  // 动态依赖加载
                    ]
                },

                // 🛠️ 专用工具 - 特定场景
                {
                    type: 'category',
                    label: '🛠️ 专用工具',
                    collapsed: true,
                    items: [
                        'basic-tech/database/index',            // 数据库
                        'basic-tech/utilities/index',           // 工具集
                        'basic-tech/demand/index',              // 条件判断
                        'basic-tech/self-awake/index',          // 自唤醒机制
                        'basic-tech/vault/index',               // Vault 经济
                        'basic-tech/effect/index',              // 药水效果管理
                        'basic-tech/ai/index',                  // 实体 AI 控制
                        'basic-tech/navigation/index',          // 寻路导航系统
                        'basic-tech/fake-op/index',             // 假 OP 系统
                        'basic-tech/bukkit-util/index',         // Bukkit 工具集
                        'basic-tech/player-session-map/index',  // 玩家会话管理
                    ]
                },
            ],
        },

        // ========================================
        // ✨ 进阶技术
        // ========================================
        {
            type: 'category',
            label: '✨ 进阶技术',
            collapsed: true,
            items: [
                'advanced-skills/isolated-classloader/index',
                'advanced-skills/script-javascript/index',
                'advanced-skills/script-jexl/index',
                'advanced-skills/script-kether/index',
                'advanced-skills/kotlinx-serialization/index'
            ],
        },

        // ========================================
        // 🎠 拓展技术
        // ========================================
        {
            type: 'category',
            label: '🎠 拓展技术',
            collapsed: true,
            items: [
                'expanding-technology/create-expansion/index',
                // Arim 工具箱 - 默认折叠减少干扰
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
                // 其他扩展技术
                'expanding-technology/player-database/index',
                'expanding-technology/persistent-container/index',
                'expanding-technology/universal-mythic/index',
                'expanding-technology/alkaid-redis/index',
                'expanding-technology/lettuce-redis/index',
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
