import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 开始打包 Tabr Chrome 扩展...');

// 1. 确保构建是最新的
console.log('📦 执行生产构建...');
try {
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}

// 2. 创建发布目录
const releaseDir = join(projectRoot, 'release');
const tempDir = join(releaseDir, 'temp');

if (existsSync(releaseDir)) {
  console.log('🗑️  清理旧的发布目录...');
  execSync(`rm -rf ${releaseDir}`, { cwd: projectRoot });
}

mkdirSync(releaseDir, { recursive: true });
mkdirSync(tempDir, { recursive: true });

// 3. 复制必要文件
console.log('📋 复制必要文件...');

// 复制构建后的文件
const distDir = join(projectRoot, 'dist');
if (!existsSync(distDir)) {
  console.error('❌ dist 目录不存在，请先运行 npm run build');
  process.exit(1);
}

copyDirectory(distDir, join(tempDir, 'dist'));

// 复制 manifest.json
copyFileSync(join(projectRoot, 'manifest.json'), join(tempDir, 'manifest.json'));

// 复制 public 目录（如果存在图标）
const publicDir = join(projectRoot, 'public');
if (existsSync(publicDir)) {
  copyDirectory(publicDir, join(tempDir, 'public'));
} else {
  console.log('⚠️  public 目录不存在，请添加应用图标');
}

// 4. 创建发布信息文件
console.log('📝 创建发布信息...');
const packageJson = JSON.parse(
  readFileSync(join(projectRoot, 'package.json'), 'utf8')
);

const manifest = JSON.parse(
  readFileSync(join(tempDir, 'manifest.json'), 'utf8')
);

const releaseInfo = {
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  buildTime: new Date().toISOString(),
  files: listFiles(tempDir, tempDir),
  packageVersion: packageJson.version
};

writeFileSync(
  join(tempDir, 'release-info.json'),
  JSON.stringify(releaseInfo, null, 2)
);

// 5. 创建 zip 包
console.log('🗜️  创建 zip 包...');
const zipName = `tabr-extension-v${manifest.version}.zip`;
const zipPath = join(releaseDir, zipName);

try {
  execSync(`cd ${tempDir} && zip -r ../${zipName} .`, { stdio: 'inherit' });
  console.log(`✅ 打包完成: ${zipPath}`);
} catch (error) {
  console.error('❌ 打包失败:', error.message);
  process.exit(1);
}

// 6. 验证 zip 包
console.log('🔍 验证 zip 包...');
try {
  const output = execSync(`unzip -l ${zipPath}`, { encoding: 'utf8' });
  const fileCount = output.split('\n').filter(line => line.trim() && !line.includes('Archive:') && !line.includes('files')).length - 1;
  console.log(`📊 zip 包包含 ${fileCount} 个文件`);
} catch (error) {
  console.error('❌ zip 包验证失败:', error.message);
}

// 7. 清理临时文件
console.log('🧹 清理临时文件...');
execSync(`rm -rf ${tempDir}`);

// 8. 显示总结
console.log('\n🎉 打包完成！');
console.log('📋 发布清单:');
console.log(`   扩展名称: ${manifest.name}`);
console.log(`   版本号: ${manifest.version}`);
console.log(`   文件大小: ${getFileSize(zipPath)}`);
console.log(`   包位置: ${zipPath}`);
console.log('\n📝 下一步操作:');
console.log('   1. 访问 https://chrome.google.com/webstore/devconsole/');
console.log('   2. 点击 "Add new item"');
console.log(`   3. 上传 ${zipName}`);
console.log('   4. 填写商店页面信息');
console.log('   5. 提交审核');

// 工具函数
function copyDirectory(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const items = readdirSync(src);
  for (const item of items) {
    const srcPath = join(src, item);
    const destPath = join(dest, item);
    
    if (statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function listFiles(dir, baseDir) {
  const files = [];
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const relativePath = fullPath.replace(baseDir + '/', '');
    
    if (statSync(fullPath).isDirectory()) {
      files.push(...listFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

function getFileSize(filePath) {
  const stats = statSync(filePath);
  const bytes = stats.size;
  
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
} 