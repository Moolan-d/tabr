import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// 修复 dist/src/newtab.html 中的资源路径
const htmlPath = join(process.cwd(), 'dist/src/newtab.html');

try {
  let htmlContent = readFileSync(htmlPath, 'utf8');
  
  // 将绝对路径 /assets/ 替换为相对路径 ../assets/
  htmlContent = htmlContent.replace(/src="\/assets\//g, 'src="../assets/');
  htmlContent = htmlContent.replace(/href="\/assets\//g, 'href="../assets/');
  
  writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log('✅ HTML 文件路径已修复');
} catch (error) {
  console.error('❌ 修复路径失败:', error.message);
} 