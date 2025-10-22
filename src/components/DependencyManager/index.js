import React, { useState } from 'react';
import styles from './styles.module.css';

const DependencyManager = () => {
    // 默认依赖数据
    const defaultDependencies = [
        // 核心文件 - Bukkit
        {
            id: 'nms-all',
            name: 'NMS All',
            category: '核心文件 - Bukkit',
            groupId: 'ink.ptms',
            artifactId: 'nms-all',
            version: '1.0.0',
            scope: 'compileOnly',
            description: 'NMS 跨版本工具，用于 NMS 开发',
            repository: 'taboolib-repo'
        },
        // 核心文件 - BungeeCord
        {
            id: 'bungeecord-core',
            name: 'BungeeCord 核心',
            category: '核心文件 - BungeeCord',
            groupId: 'net.md_5.bungee',
            artifactId: 'BungeeCord',
            version: '1',
            scope: 'compileOnly',
            description: 'BungeeCord 核心文件',
            repository: 'taboolib-repo'
        },
        // Gson
        {
            id: 'gson',
            name: 'Gson',
            category: 'Gson',
            groupId: 'com.google.code.gson',
            artifactId: 'gson',
            version: '2.10.1',
            scope: 'compileOnly',
            description: 'Google JSON 序列化库',
            repository: 'mavenCentral'
        },
        // KotlinX 相关
        {
            id: 'kotlinx-coroutines-core',
            name: 'Coroutines Core',
            category: 'KotlinX',
            groupId: 'org.jetbrains.kotlinx',
            artifactId: 'kotlinx-coroutines-core',
            version: '1.8.1',
            scope: 'compileOnly',
            description: 'Kotlin 协程核心库',
            repository: 'mavenCentral'
        },
        {
            id: 'kotlinx-serialization-core',
            name: 'Serialization Core',
            category: 'KotlinX 序列化',
            groupId: 'org.jetbrains.kotlinx',
            artifactId: 'kotlinx-serialization-core-jvm',
            version: '1.9.0',
            scope: 'compileOnly',
            description: 'Kotlin 序列化核心库（必选）',
            repository: 'mavenCentral',
            required: false,
            isTransitive: false
        },
        {
            id: 'kotlinx-serialization-json',
            name: 'Serialization JSON',
            category: 'KotlinX 序列化',
            groupId: 'org.jetbrains.kotlinx',
            artifactId: 'kotlinx-serialization-json-jvm',
            version: '1.9.0',
            scope: 'compileOnly',
            description: 'Kotlin 序列化 JSON 支持（可选）',
            repository: 'mavenCentral',
            isTransitive: false
        },
        {
            id: 'kotlinx-serialization-protobuf',
            name: 'Serialization Protobuf',
            category: 'KotlinX 序列化',
            groupId: 'org.jetbrains.kotlinx',
            artifactId: 'kotlinx-serialization-protobuf-jvm',
            version: '1.9.0',
            scope: 'compileOnly',
            description: 'Kotlin 序列化 Protobuf 支持（可选）',
            repository: 'mavenCentral',
            isTransitive: false
        },
        {
            id: 'kotlinx-datetime',
            name: 'DateTime',
            category: 'KotlinX',
            groupId: 'org.jetbrains.kotlinx',
            artifactId: 'kotlinx-datetime',
            version: '0.5.0',
            scope: 'compileOnly',
            description: 'Kotlin 日期时间库',
            repository: 'mavenCentral'
        },
        // TabooLib 扩展
        {
            id: 'arim',
            name: 'Arim',
            category: 'TabooLib 扩展',
            groupId: 'top.maplex.arim',
            artifactId: 'Arim',
            version: '1.3.2',
            scope: 'taboo',
            description: '综合拓展',
            repository: 'maplex-repo'
        }
    ];

    // 仓库配置
    const repositories = {
        'mavenCentral': {
            name: 'Maven中央库',
            url: 'https://repo.maven.apache.org/maven2/'
        },
        'taboolib-repo': {
            name: 'TabooLib资源库',
            url: 'https://repo.tabooproject.org/repository/releases/'
        },
        'maplex-repo': {
            name: '枫溪资源库',
            url: 'https://nexus.maplex.top/repository/maven-public/'
        }
    };

    // 状态管理
    const [dependencies, setDependencies] = useState(defaultDependencies);
    // 自动选中所有必选依赖
    const [selectedDeps, setSelectedDeps] = useState(
        defaultDependencies.filter(d => d.required).map(d => d.id)
    );
    const [expandedCategories, setExpandedCategories] = useState(['核心文件 - Bukkit']);
    const [expandedDeps, setExpandedDeps] = useState([]);
    const [copySuccess, setCopySuccess] = useState(false);
    const [buildType, setBuildType] = useState('kts');

    // Core 版本选择器状态
    const [coreVersions, setCoreVersions] = useState([]);
    const [coreVersionInput, setCoreVersionInput] = useState('');
    const [coreSubType, setCoreSubType] = useState('both'); // 'both', 'universal', 'mapped'

    // 添加核心版本
    const addCoreVersion = () => {
        const input = coreVersionInput.trim();
        if (!input) return;

        // 解析版本号，支持格式：1.20.6, 12006
        let versionCode = input;
        if (input.includes('.')) {
            // 格式：1.20.6 -> 12006
            const parts = input.split('.');
            if (parts.length >= 2) {
                versionCode = parts.map((p, i) => {
                    if (i === 0) return p.padStart(1, '0');
                    return p.padStart(2, '0');
                }).join('').replace(/^0+/, '1');
            }
        }

        if (!coreVersions.includes(versionCode)) {
            setCoreVersions([...coreVersions, versionCode]);
        }
        setCoreVersionInput('');
    };

    // 移除核心版本
    const removeCoreVersion = (version) => {
        setCoreVersions(coreVersions.filter(v => v !== version));
    };

    // 版本号转显示文本
    const versionCodeToDisplay = (code) => {
        // 12006 -> 1.20.6
        const str = code.toString();
        if (str.length >= 5) {
            const major = str[0];
            const minor = parseInt(str.substring(1, 3));
            const patch = parseInt(str.substring(3));
            return `${major}.${minor}.${patch}`;
        }
        return code;
    };

    // 按分类分组依赖
    const groupedDeps = dependencies.reduce((acc, dep) => {
        if (!acc[dep.category]) {
            acc[dep.category] = [];
        }
        acc[dep.category].push(dep);
        return acc;
    }, {});

    // 分类顺序
    const categoryOrder = [
        '核心文件 - Bukkit',
        '核心文件 - BungeeCord',
        'Gson',
        'KotlinX',
        'KotlinX 序列化',
        'TabooLib 扩展',
        '其他依赖'
    ];

    // 切换依赖选择
    const toggleDep = (depId) => {
        const dep = dependencies.find(d => d.id === depId);

        // 必选依赖不能取消选择
        if (dep && dep.required) {
            return;
        }

        setSelectedDeps(prev => {
            if (prev.includes(depId)) {
                return prev.filter(id => id !== depId);
            } else {
                return [...prev, depId];
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

    // 切换依赖详情展开
    const toggleDepDetails = (depId) => {
        setExpandedDeps(prev => {
            if (prev.includes(depId)) {
                return prev.filter(id => id !== depId);
            } else {
                return [...prev, depId];
            }
        });
    };

    // 生成依赖代码
    const generateDependencyCode = () => {
        const selectedDepObjects = dependencies.filter(d => selectedDeps.includes(d.id));

        // 收集需要的仓库（不包括 TabooLib 仓库，因为它不需要显式写出）
        const requiredRepos = new Set(selectedDepObjects.map(d => d.repository).filter(repo => repo !== 'taboolib-repo'));

        if (buildType === 'kts') {
            // Kotlin DSL
            let code = '';

            // 只在需要时添加仓库配置
            if (requiredRepos.size > 0) {
                code += '// 仓库配置\nrepositories {\n';
                requiredRepos.forEach(repoKey => {
                    const repo = repositories[repoKey];
                    if (repoKey === 'mavenCentral') {
                        code += '    mavenCentral()\n';
                    } else if (repo) {
                        code += `    maven("${repo.url}")\n`;
                    }
                });
                code += '}\n\n';
            }

            code += '// 依赖配置\ndependencies {\n';

            // 添加核心文件版本
            coreVersions.forEach(versionCode => {
                const versionNum = parseInt(versionCode);
                // 1.17.1 之前的版本不支持子类型
                if (versionNum < 11701) {
                    code += `    compileOnly("ink.ptms.core:v${versionCode}:${versionCode}")\n`;
                } else {
                    // 1.17.1 及以后的版本支持 universal 和 mapped
                    if (coreSubType === 'both') {
                        code += `    compileOnly("ink.ptms.core:v${versionCode}:${versionCode}:universal")\n`;
                        code += `    compileOnly("ink.ptms.core:v${versionCode}:${versionCode}:mapped")\n`;
                    } else if (coreSubType === 'universal') {
                        code += `    compileOnly("ink.ptms.core:v${versionCode}:${versionCode}:universal")\n`;
                    } else if (coreSubType === 'mapped') {
                        code += `    compileOnly("ink.ptms.core:v${versionCode}:${versionCode}:mapped")\n`;
                    }
                }
            });

            // 添加其他依赖
            selectedDepObjects.forEach(dep => {
                if (dep.isTransitive === false) {
                    code += `    ${dep.scope}("${dep.groupId}:${dep.artifactId}:${dep.version}") { isTransitive = false }\n`;
                } else {
                    code += `    ${dep.scope}("${dep.groupId}:${dep.artifactId}:${dep.version}")\n`;
                }
            });
            code += '}';
            return code;
        } else {
            // Groovy DSL
            let code = '';

            // 只在需要时添加仓库配置
            if (requiredRepos.size > 0) {
                code += '// 仓库配置\nrepositories {\n';
                requiredRepos.forEach(repoKey => {
                    const repo = repositories[repoKey];
                    if (repoKey === 'mavenCentral') {
                        code += '    mavenCentral()\n';
                    } else if (repo) {
                        code += `    maven { url '${repo.url}' }\n`;
                    }
                });
                code += '}\n\n';
            }

            code += '// 依赖配置\ndependencies {\n';

            // 添加核心文件版本
            coreVersions.forEach(versionCode => {
                const versionNum = parseInt(versionCode);
                // 1.17.1 之前的版本不支持子类型
                if (versionNum < 11701) {
                    code += `    compileOnly 'ink.ptms.core:v${versionCode}:${versionCode}'\n`;
                } else {
                    // 1.17.1 及以后的版本支持 universal 和 mapped
                    if (coreSubType === 'both') {
                        code += `    compileOnly 'ink.ptms.core:v${versionCode}:${versionCode}:universal'\n`;
                        code += `    compileOnly 'ink.ptms.core:v${versionCode}:${versionCode}:mapped'\n`;
                    } else if (coreSubType === 'universal') {
                        code += `    compileOnly 'ink.ptms.core:v${versionCode}:${versionCode}:universal'\n`;
                    } else if (coreSubType === 'mapped') {
                        code += `    compileOnly 'ink.ptms.core:v${versionCode}:${versionCode}:mapped'\n`;
                    }
                }
            });

            // 添加其他依赖
            selectedDepObjects.forEach(dep => {
                if (dep.isTransitive === false) {
                    code += `    ${dep.scope}('${dep.groupId}:${dep.artifactId}:${dep.version}') { transitive = false }\n`;
                } else {
                    code += `    ${dep.scope} '${dep.groupId}:${dep.artifactId}:${dep.version}'\n`;
                }
            });
            code += '}';
            return code;
        }
    };

    // 获取构建文件名
    const getBuildFileName = () => {
        return buildType === 'kts' ? 'build.gradle.kts' : 'build.gradle';
    };

    // 复制到剪贴板
    const copyToClipboard = () => {
        const code = generateDependencyCode();
        navigator.clipboard.writeText(code).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    return (
        <div className={styles.dependencyManager}>
            <div className={styles.container}>
                {/* 左侧：依赖选择列表 */}
                <div className={styles.depList}>
                    <div className={styles.header}>
                        <h3>📚 选择项目依赖</h3>
                        <p className={styles.description}>
                            选择你需要的依赖，系统会自动生成配置代码
                        </p>
                    </div>

                    <div className={styles.categories}>
                        {categoryOrder.map(category => {
                            const categoryDeps = groupedDeps[category];
                            if (!categoryDeps) return null;

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
                                            ({categoryDeps.filter(d => selectedDeps.includes(d.id)).length}/{categoryDeps.length})
                                        </span>
                                    </div>

                                    {isExpanded && (
                                        <>
                                            {category === '核心文件 - Bukkit' && (
                                                <>
                                                    <div className={styles.coreVersionSelector}>
                                                        <div className={styles.coreInputGroup}>
                                                            <input
                                                                type="text"
                                                                className={styles.coreInput}
                                                                placeholder="输入版本号，如 1.20.6 或 12006"
                                                                value={coreVersionInput}
                                                                onChange={(e) => setCoreVersionInput(e.target.value)}
                                                                onKeyPress={(e) => e.key === 'Enter' && addCoreVersion()}
                                                            />
                                                            <button
                                                                className={styles.addButton}
                                                                onClick={addCoreVersion}
                                                            >
                                                                添加 Core
                                                            </button>
                                                        </div>
                                                        <div className={styles.subTypeSelector}>
                                                            <label className={styles.subTypeOption}>
                                                                <input
                                                                    type="radio"
                                                                    name="coreSubType"
                                                                    value="both"
                                                                    checked={coreSubType === 'both'}
                                                                    onChange={(e) => setCoreSubType(e.target.value)}
                                                                />
                                                                <span>两者都包含</span>
                                                            </label>
                                                            <label className={styles.subTypeOption}>
                                                                <input
                                                                    type="radio"
                                                                    name="coreSubType"
                                                                    value="universal"
                                                                    checked={coreSubType === 'universal'}
                                                                    onChange={(e) => setCoreSubType(e.target.value)}
                                                                />
                                                                <span>仅 Universal</span>
                                                            </label>
                                                            <label className={styles.subTypeOption}>
                                                                <input
                                                                    type="radio"
                                                                    name="coreSubType"
                                                                    value="mapped"
                                                                    checked={coreSubType === 'mapped'}
                                                                    onChange={(e) => setCoreSubType(e.target.value)}
                                                                />
                                                                <span>仅 Mapped</span>
                                                            </label>
                                                        </div>
                                                        {coreVersions.length > 0 && (
                                                            <div className={styles.selectedVersions}>
                                                                <span className={styles.selectedLabel}>已选择的 Core 版本：</span>
                                                                {coreVersions.map(version => (
                                                                    <span key={version} className={styles.versionTag}>
                                                                        {versionCodeToDisplay(version)}
                                                                        <button
                                                                            className={styles.removeTag}
                                                                            onClick={() => removeCoreVersion(version)}
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                            <div className={styles.depItems}>
                                            {categoryDeps.map(dep => {
                                                const isSelected = selectedDeps.includes(dep.id);
                                                const isDetailsExpanded = expandedDeps.includes(dep.id);

                                                return (
                                                    <div key={dep.id} className={styles.depItem}>
                                                        <div className={styles.depHeader}>
                                                            <label className={styles.depLabel}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleDep(dep.id)}
                                                                    className={styles.depCheckbox}
                                                                    disabled={dep.required}
                                                                />
                                                                <span className={styles.depName}>
                                                                    {dep.name}
                                                                    <span className={styles.scopeBadge}>{dep.scope}</span>
                                                                    {dep.required && (
                                                                        <span className={styles.requiredBadge}>必选</span>
                                                                    )}
                                                                    {dep.recommended && (
                                                                        <span className={styles.recommendedBadge}>推荐</span>
                                                                    )}
                                                                </span>
                                                            </label>
                                                            <button
                                                                className={styles.detailsButton}
                                                                onClick={() => toggleDepDetails(dep.id)}
                                                            >
                                                                {isDetailsExpanded ? '收起' : '详情'}
                                                            </button>
                                                        </div>

                                                        <p className={styles.depDescription}>
                                                            {dep.description}
                                                        </p>

                                                        {isDetailsExpanded && (
                                                            <div className={styles.depDetails}>
                                                                <div className={styles.depInfo}>
                                                                    <strong>坐标信息：</strong>
                                                                    <code>{dep.groupId}:{dep.artifactId}:{dep.version}</code>
                                                                </div>
                                                                <div className={styles.depInfo}>
                                                                    <strong>作用域：</strong>
                                                                    <code>{dep.scope}</code>
                                                                </div>
                                                                <div className={styles.depInfo}>
                                                                    <strong>仓库：</strong>
                                                                    <code>{repositories[dep.repository]?.name || dep.repository}</code>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 右侧：生成的代码 */}
                <div className={styles.codePanel}>
                    <div className={styles.codePanelHeader}>
                        <h3>📋 生成的依赖配置</h3>
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
                        <span>已选择 <strong>{selectedDeps.length + coreVersions.length}</strong> 个依赖</span>
                        {coreVersions.length > 0 && (
                            <span className={styles.coreCount}>（含 {coreVersions.length} 个 Core 版本）</span>
                        )}
                    </div>

                    <pre className={styles.codeBlock}>
                        <code>{(selectedDeps.length > 0 || coreVersions.length > 0) ? generateDependencyCode() : '// 请先选择依赖或添加 Core 版本'}</code>
                    </pre>

                    <div className={styles.codeHint}>
                        <p>💡 将以上代码添加到你的 <code>{getBuildFileName()}</code> 文件中</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DependencyManager;
