#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PUSH_DIR = path.join(__dirname, 'push');
const BUILD_DIR = path.join(__dirname, 'build');  // Docusaurus 默认输出目录
const TAR_NAME = 'taboowiki.tar.gz';
const TAR_PATH = path.join(PUSH_DIR, TAR_NAME);
const HASH_FILE = path.join(PUSH_DIR, 'latest.hash');

console.log('🚀 Starting build process...\n');

// 1. 执行 docusaurus build
try {
    console.log('📦 Running docusaurus build...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed\n');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

// 2. 创建 push 目录
if (!fs.existsSync(PUSH_DIR)) {
    fs.mkdirSync(PUSH_DIR, { recursive: true });
    console.log('📁 Created push directory');
}

// 3. 计算构建产物的 hash
console.log('🔍 Calculating build hash...');
const hash = crypto.createHash('sha256');
function hashDirectory(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    files.sort((a, b) => a.name.localeCompare(b.name));

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            hashDirectory(fullPath);
        } else {
            const content = fs.readFileSync(fullPath);
            hash.update(file.name);
            hash.update(content);
        }
    }
}

hashDirectory(BUILD_DIR);
const currentHash = hash.digest('hex');

// 4. 检查是否有变化
let previousHash = '';
if (fs.existsSync(HASH_FILE)) {
    previousHash = fs.readFileSync(HASH_FILE, 'utf8').trim();
}

if (currentHash === previousHash) {
    console.log('ℹ️  No changes detected. Skipping packaging.');
    console.log('💡 Tip: Commit other changes without triggering deployment.\n');
    process.exit(0);
}

console.log('✨ Changes detected, creating package...\n');

// 5. 打包构建产物
try {
    console.log(`📦 Creating package: ${TAR_NAME}`);
    execSync(`tar -czf "${TAR_PATH}" -C "${BUILD_DIR}" .`, { stdio: 'inherit' });
    console.log('✅ Package created\n');
} catch (error) {
    console.error('❌ Packaging failed:', error.message);
    process.exit(1);
}

// 6. 保存新的 hash
fs.writeFileSync(HASH_FILE, currentHash);
console.log('💾 Saved build hash\n');

// 7. 显示文件信息
const stats = fs.statSync(TAR_PATH);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
console.log('📊 Package Info:');
console.log(`   File: ${TAR_NAME}`);
console.log(`   Size: ${sizeMB} MB`);
console.log(`   Hash: ${currentHash.slice(0, 16)}...`);
console.log('\n✅ Build and packaging complete!');
console.log('💡 Next: Commit and push the changes to trigger deployment.\n');
