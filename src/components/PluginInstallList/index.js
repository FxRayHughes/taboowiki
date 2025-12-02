import React, { useState } from 'react';
import styles from './styles.module.css';

const PluginInstallList = () => {
    // 默认模块数据
    const defaultModules = [
        {
            id: 'Basic',
            name: 'Basic',
            category: '核心模块',
            required: true,
            description: '配置文件，任务链',
            features: [
                '配置文件管理',
                '任务链系统',
                '基础工具类',
                '插件生命周期管理'
            ]
        },
        // 平台模块
        {
            id: 'Bukkit',
            name: 'Bukkit',
            category: '平台模块',
            required: false,
            description: '包含 Bukkit 平台的启动项',
            features: [
                'Bukkit/Spigot 平台支持',
                '事件监听器',
                '命令注册',
                '插件消息通道'
            ]
        },
        {
            id: 'BungeeCord',
            name: 'BungeeCord',
            category: '平台模块',
            required: false,
            description: '包含 BungeeCord 平台的启动项',
            features: [
                'BungeeCord 代理服务器支持',
                '跨服通信',
                '玩家管理',
                '服务器切换'
            ]
        },
        {
            id: 'Velocity',
            name: 'Velocity',
            category: '平台模块',
            required: false,
            description: '包含 Velocity 平台的启动项',
            features: [
                'Velocity 代理服务器支持',
                '现代化 API',
                '高性能设计',
                '插件兼容性'
            ]
        },
        {
            id: 'AfyBroker',
            name: 'AfyBroker',
            category: '平台模块',
            required: false,
            description: '包含 AfyBroker 平台的启动项',
            features: [
                'AfyBroker 平台支持',
                '消息代理',
                '跨平台通信',
                '事件分发'
            ]
        },
        {
            id: 'App',
            name: 'App',
            category: '平台模块',
            required: false,
            description: '可独立运行的 Java 程序',
            features: [
                '独立应用程序',
                '无需 Minecraft 服务器',
                '命令行工具',
                '自定义程序入口'
            ]
        },
        // Bukkit 扩展模块
        {
            id: 'BukkitHook',
            name: 'BukkitHook',
            category: 'Bukkit 扩展',
            required: false,
            description: 'Bukkit 与 Vault、PlaceholderAPI 等插件交互',
            features: [
                'Vault 经济系统',
                'PlaceholderAPI 支持',
                'WorldGuard 区域保护',
                'LuckPerms 权限系统'
            ]
        },
        {
            id: 'BukkitUtil',
            name: 'BukkitUtil',
            category: 'Bukkit 扩展',
            required: false,
            description: 'Bukkit 扩展工具',
            features: [
                'Bukkit 工具类',
                'XSeries 支持',
                'Minecraft 聊天',
                '国际化'
            ]
        },
        {
            id: 'BukkitUI',
            name: 'BukkitUI',
            category: 'Bukkit 扩展',
            required: false,
            description: 'Bukkit 箱子菜单',
            features: [
                '箱子 GUI 界面',
                '物品构建器',
                '点击事件处理',
                '多版本兼容'
            ]
        },
        {
            id: 'BukkitNavigation',
            name: 'BukkitNavigation',
            category: 'Bukkit 扩展',
            required: false,
            description: 'Bukkit 寻路工具',
            features: [
                'A* 寻路算法',
                '路径优化',
                '障碍物检测',
                '实体导航'
            ]
        },
        {
            id: 'BukkitFakeOp',
            name: 'BukkitFakeOp',
            category: 'Bukkit 扩展',
            required: false,
            description: 'Bukkit 虚拟 OP 工具',
            features: [
                '临时 OP 权限',
                '权限模拟',
                '命令执行',
                '安全控制'
            ]
        },
        {
            id: 'XSeries',
            name: 'XSeries',
            category: 'Bukkit 扩展',
            required: false,
            description: 'XSeries 跨版本兼容库',
            features: [
                'XMaterial 材质枚举',
                'XSound 声音枚举',
                'XEnchantment 附魔枚举',
                'XPotion 药水枚举'
            ]
        },
        {
            id: 'BukkitNMS',
            name: 'BukkitNMS',
            category: 'Bukkit 扩展',
            required: false,
            description: 'Bukkit NMS 工具',
            features: [
                'NMS 版本适配',
                '底层 API 访问',
                '反射工具',
                '代理系统'
            ]
        },
        {
            id: 'BukkitNMSUtil',
            name: 'BukkitNMSUtil',
            category: 'Bukkit 扩展',
            required: false,
            description: 'Bukkit NMS 扩展工具',
            features: [
                'NMS 工具集',
                '数据包操作',
                '实体操作',
                '物品操作'
            ]
        },
        {
            id: 'BukkitNMSItemTag',
            name: 'BukkitNMSItemTag',
            category: 'Bukkit 扩展',
            required: false,
            description: 'Bukkit NMS ItemTag 工具',
            features: [
                'NBT 标签操作',
                '物品数据存储',
                '跨版本兼容',
                '数据序列化'
            ]
        },
        {
            id: 'BukkitNMSDataSerializer',
            name: 'BukkitNMSDataSerializer',
            category: 'Bukkit 扩展',
            required: false,
            description: 'Bukkit NMS 数据序列化工具',
            features: [
                '数据序列化',
                'Base64 编码',
                '对象存储',
                '跨版本支持'
            ]
        },
        {
            id: 'BukkitNMSEntityAI',
            name: 'BukkitNMSEntityAI',
            category: 'Bukkit 扩展',
            required: false,
            description: 'Bukkit NMS 实体 AI',
            features: [
                '实体 AI 控制',
                '目标选择器',
                '路径导航',
                '行为定制'
            ]
        },
        // 数据库模块
        {
            id: 'Database',
            name: 'Database',
            category: '数据库',
            required: false,
            description: '数据库管理系统',
            features: [
                'SQL 数据库支持',
                'SQLite 本地数据库',
                'MySQL 远程数据库',
                'MongoDB 支持'
            ]
        },
        {
            id: 'DatabasePlayer',
            name: 'DatabasePlayer',
            category: '数据库',
            required: false,
            description: '玩家数据库',
            features: [
                '玩家数据管理',
                '自动创建表',
                '数据缓存',
                '异步操作'
            ]
        },
        {
            id: 'DatabasePlayerRedis',
            name: 'DatabasePlayerRedis',
            category: '数据库',
            required: false,
            description: '玩家 Redis 数据库',
            features: [
                'Redis 缓存',
                '玩家数据同步',
                '跨服数据共享',
                '高性能访问'
            ]
        },
        {
            id: 'AlkaidRedis',
            name: 'AlkaidRedis',
            category: '数据库',
            required: false,
            description: 'Alkaid Redis 客户端',
            features: [
                'Redis 连接',
                '简单 API',
                '连接池管理',
                '异步操作'
            ]
        },
        {
            id: 'LettuceRedis',
            name: 'LettuceRedis',
            category: '数据库',
            required: false,
            description: 'Lettuce Redis 客户端',
            features: [
                'Lettuce 框架',
                '响应式编程',
                '集群支持',
                '高级功能'
            ]
        },
        {
            id: 'IOC',
            name: 'IOC',
            category: '数据库',
            required: false,
            description: '依赖注入容器',
            features: [
                '依赖注入',
                '自动装配',
                '生命周期管理',
                'Bean 容器'
            ]
        },
        {
            id: 'Ptc',
            name: 'Ptc',
            category: '数据库',
            required: false,
            description: 'Persistent Container 持久化容器',
            features: [
                '数据持久化',
                '自动保存',
                '配置管理',
                '类型安全'
            ]
        },
        {
            id: 'PtcObject',
            name: 'PtcObject',
            category: '数据库',
            required: false,
            description: 'Persistent Container With Object',
            features: [
                '对象持久化',
                'JSON 序列化',
                '自动映射',
                '嵌套对象支持'
            ]
        },
        // Minecraft 功能模块
        {
            id: 'MinecraftChat',
            name: 'MinecraftChat',
            category: 'Minecraft 功能',
            required: false,
            description: 'Minecraft 文本工具',
            features: [
                '文本组件构建',
                '悬停和点击事件',
                'RGB 颜色支持',
                '渐变色文本'
            ]
        },
        {
            id: 'MinecraftEffect',
            name: 'MinecraftEffect',
            category: 'Minecraft 功能',
            required: false,
            description: 'Minecraft 效果工具',
            features: [
                '粒子效果',
                '音效播放',
                '药水效果',
                '视觉特效'
            ]
        },
        {
            id: 'CommandHelper',
            name: 'CommandHelper',
            category: 'Minecraft 功能',
            required: false,
            description: '指令帮助系统',
            features: [
                '命令构建器',
                '参数解析',
                '子命令支持',
                '权限检查'
            ]
        },
        {
            id: 'I18n',
            name: 'I18n',
            category: 'Minecraft 功能',
            required: false,
            description: '国际化接口',
            features: [
                '多语言支持',
                '语言文件管理',
                'PlaceholderAPI 集成',
                '变量替换'
            ]
        },
        {
            id: 'Kether',
            name: 'Kether',
            category: 'Minecraft 功能',
            required: false,
            description: 'Kether 脚本引擎',
            features: [
                '自定义脚本语言',
                '动作系统',
                '条件判断',
                '变量系统'
            ]
        },
        {
            id: 'Metrics',
            name: 'Metrics',
            category: 'Minecraft 功能',
            required: false,
            description: 'BStats 数据统计',
            features: [
                '插件使用统计',
                '服务器信息收集',
                '自定义图表',
                '匿名数据上报'
            ]
        },
        {
            id: 'Porticus',
            name: 'Porticus',
            category: 'Minecraft 功能',
            required: false,
            description: 'BungeeCord 通讯',
            features: [
                '跨服消息传递',
                '玩家传送',
                '数据同步',
                '子服务器管理'
            ]
        },
        // 脚本模块
        {
            id: 'JavaScript',
            name: 'JavaScript',
            category: '脚本引擎',
            required: false,
            description: 'Javascript 脚本环境',
            features: [
                'JavaScript 支持',
                'Nashorn/GraalVM',
                '脚本热加载',
                'Java 互操作'
            ]
        },
        {
            id: 'Jexl',
            name: 'Jexl',
            category: '脚本引擎',
            required: false,
            description: 'Jexl 表达式引擎',
            features: [
                'Jexl 表达式',
                '条件判断',
                '变量计算',
                '简单脚本'
            ]
        }
    ];

    // 状态管理
    const [modules, setModules] = useState(defaultModules);
    const [selectedModules, setSelectedModules] = useState(['Basic']);
    const [expandedCategories, setExpandedCategories] = useState([]);
    const [expandedModules, setExpandedModules] = useState([]);
    const [copySuccess, setCopySuccess] = useState(false);
    const [buildType, setBuildType] = useState('kts'); // 'kts' 或 'groovy'
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');
    const [taboolibVersion, setTaboolibVersion] = useState(''); // TabooLib 版本号

    // 按分类分组模块
    const groupedModules = modules.reduce((acc, module) => {
        if (!acc[module.category]) {
            acc[module.category] = [];
        }
        acc[module.category].push(module);
        return acc;
    }, {});

    // 分类顺序
    const categoryOrder = [
        '核心模块',
        '平台模块',
        'Bukkit 扩展',
        '数据库',
        'Minecraft 功能',
        '脚本引擎',
        '其他模块'
    ];

    // 切换模块选择
    const toggleModule = (moduleId) => {
        if (moduleId === 'Basic') return; // Basic 模块必选

        setSelectedModules(prev => {
            if (prev.includes(moduleId)) {
                return prev.filter(id => id !== moduleId);
            } else {
                return [...prev, moduleId];
            }
        });
    };

    // 切换分类展开
    const toggleCategory = (category) => {
        setExpandedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    // 切换模块详情展开
    const toggleModuleDetails = (moduleId) => {
        setExpandedModules(prev => {
            if (prev.includes(moduleId)) {
                return prev.filter(id => id !== moduleId);
            } else {
                return [...prev, moduleId];
            }
        });
    };

    // 生成安装代码
    const generateInstallCode = () => {
        const sortedModules = selectedModules.sort();
        const versionString = taboolibVersion || ''; // 使用获取的版本或空字符串

        if (buildType === 'kts') {
            // Kotlin DSL
            return `taboolib {
            env {
        install(${sortedModules.join(', ')})
    }

    version {
        taboolib = "${versionString}"${!versionString ? ' // 手动填入最新版本或点击更新按钮' : ''}
        coroutines = "1.8.1"
    }
}`;
        } else {
            // Groovy DSL
            return `taboolib {
    install ${sortedModules.join(', ')}

    version {
        taboolib = '${versionString}'${!versionString ? ' // 手动填入最新版本或点击更新按钮' : ''}
        coroutines = '1.8.1'
    }
}`;
        }
    };

    // 获取构建文件名
    const getBuildFileName = () => {
        return buildType === 'kts' ? 'build.gradle.kts' : 'build.gradle';
    };

    // 复制到剪贴板
    const copyToClipboard = () => {
        const code = generateInstallCode();
        navigator.clipboard.writeText(code).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    // 从 GitHub 更新模块列表
    const updateModulesFromGitHub = async () => {
        setIsUpdating(true);
        setUpdateMessage('正在获取最新模块列表和版本信息...');

        try {
            // 并行请求模块列表和版本信息
            const [modulesResponse, versionResponse] = await Promise.all([
                fetch('https://raw.githubusercontent.com/TabooLib/taboolib-gradle-plugin/2.1.0/src/main/kotlin/io/izzel/taboolib/gradle/ModuleName.kt'),
                fetch('https://api.github.com/repos/TabooLib/TabooLib/releases/latest')
            ]);

            if (!modulesResponse.ok) {
                throw new Error(`模块列表获取失败: ${modulesResponse.status}`);
            }

            if (!versionResponse.ok) {
                throw new Error(`版本信息获取失败: ${versionResponse.status}`);
            }

            // 解析模块列表
            const modulesText = await modulesResponse.text();
            const varPattern = /val\s+([A-Z][a-zA-Z0-9]*)\s*=/g;
            const matches = [...modulesText.matchAll(varPattern)];

            if (matches.length === 0) {
                throw new Error('未能解析模块数据');
            }

            const fetchedModuleNames = matches.map(match => match[1]);

            // 解析版本信息
            const versionData = await versionResponse.json();
            const version = versionData.tag_name; // 例如: "6.2.3-18c77c6a"

            // 更新现有模块列表，保留已有的描述和特性
            const updatedModules = defaultModules.filter(m =>
                fetchedModuleNames.includes(m.name)
            );

            // 添加新发现的模块（使用默认描述）
            fetchedModuleNames.forEach(name => {
                if (!updatedModules.find(m => m.name === name)) {
                    updatedModules.push({
                        id: name,
                        name: name,
                        category: '其他模块',
                        required: name === 'Basic',
                        description: `${name} 模块`,
                        features: ['详细信息待更新']
                    });
                }
            });

            setModules(updatedModules);
            setTaboolibVersion(version);
            setUpdateMessage(`✓ 成功更新！\n共 ${fetchedModuleNames.length} 个模块，TabooLib 版本: ${version}`);

            // 3秒后清除提示
            setTimeout(() => {
                setUpdateMessage('');
            }, 3000);

        } catch (error) {
            console.error('更新失败:', error);
            setUpdateMessage(`✗ 更新失败: ${error.message}`);

            setTimeout(() => {
                setUpdateMessage('');
            }, 5000);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className={styles.pluginInstallList}>
            <div className={styles.container}>
                {/* 左侧：模块选择列表 */}
                <div className={styles.moduleList}>
                    <div className={styles.header}>
                        <div className={styles.headerTop}>
                            <h3>📦 选择 TabooLib 模块</h3>
                            <button
                                className={styles.updateButton}
                                onClick={updateModulesFromGitHub}
                                disabled={isUpdating}
                            >
                                {isUpdating ? '🔄 更新中...' : '🔄 更新模块列表'}
                            </button>
                        </div>
                        {updateMessage && (
                            <div className={`${styles.updateMessage} ${updateMessage.startsWith('✓') ? styles.success : styles.error}`}>
                                {updateMessage}
                            </div>
                        )}
                        <p className={styles.description}>
                            选择你需要的模块，系统会自动生成配置代码
                        </p>
                    </div>

                    <div className={styles.categories}>
                        {categoryOrder.map(category => {
                            const categoryModules = groupedModules[category];
                            if (!categoryModules) return null;

                            const isExpanded = expandedCategories.includes(category);

                            return (
                                <div key={category} className={styles.category}>
                                    <div
                                        className={styles.categoryHeader}
                                        onClick={() => toggleCategory(category)}
                                    >
                                        <span className={styles.categoryIcon}>
                                            {isExpanded ? '▼' : '▶'}
                                        </span>
                                        <span className={styles.categoryName}>{category}</span>
                                        <span className={styles.categoryCount}>
                                            ({categoryModules.filter(m => selectedModules.includes(m.id)).length}/{categoryModules.length})
                                        </span>
                                    </div>

                                    {isExpanded && (
                                        <div className={styles.moduleItems}>
                                            {categoryModules.map(module => {
                                                const isSelected = selectedModules.includes(module.id);
                                                const isDetailsExpanded = expandedModules.includes(module.id);

                                                return (
                                                    <div key={module.id} className={styles.moduleItem}>
                                                        <div className={styles.moduleHeader}>
                                                            <label className={styles.moduleLabel}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    disabled={module.required}
                                                                    onChange={() => toggleModule(module.id)}
                                                                    className={styles.moduleCheckbox}
                                                                />
                                                                <span className={styles.moduleName}>
                                                                    {module.name}
                                                                    {module.required && (
                                                                        <span className={styles.requiredBadge}>必选</span>
                                                                    )}
                                                                </span>
                                                            </label>
                                                            <button
                                                                className={styles.detailsButton}
                                                                onClick={() => toggleModuleDetails(module.id)}
                                                            >
                                                                {isDetailsExpanded ? '收起' : '详情'}
                                                            </button>
                                                        </div>

                                                        <p className={styles.moduleDescription}>
                                                            {module.description}
                                                        </p>

                                                        {isDetailsExpanded && (
                                                            <div className={styles.moduleFeatures}>
                                                                <strong>主要特性：</strong>
                                                                <ul>
                                                                    {module.features.map((feature, index) => (
                                                                        <li key={index}>{feature}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 右侧：生成的代码 */}
                <div className={styles.codePanel}>
                    <div className={styles.codePanelHeader}>
                        <h3>📋 生成的配置代码</h3>
                        <button
                            className={styles.copyButton}
                            onClick={copyToClipboard}
                        >
                            {copySuccess ? '✓ 已复制' : '📋 复制代码'}
                        </button>
                    </div>

                    {/* 构建类型选择 */}
                    <div className={styles.buildTypeSelector}>
                        <button
                            className={`${styles.buildTypeButton} ${buildType === 'kts' ? styles.active : ''}`}
                            onClick={() => setBuildType('kts')}
                        >
                            Kotlin DSL (.kts)
                        </button>
                        <button
                            className={`${styles.buildTypeButton} ${buildType === 'groovy' ? styles.active : ''}`}
                            onClick={() => setBuildType('groovy')}
                        >
                            Groovy DSL (.gradle)
                        </button>
                    </div>

                    <div className={styles.selectedInfo}>
                        <span>已选择 <strong>{selectedModules.length}</strong> 个模块</span>
                    </div>

                    <pre className={styles.codeBlock}>
                        <code>{generateInstallCode()}</code>
                    </pre>

                    <div className={styles.codeHint}>
                        <p>💡 将以上代码添加到你的 <code>{getBuildFileName()}</code> 文件中</p>
                        <p>💡 要使用最新的TabooLib版本哦</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PluginInstallList;
