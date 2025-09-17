// 环境变量加载器 - 在 server.js 开头引入
// 使用方法: 在 server.js 第一行添加 require('./load-env');

const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envFiles = [
    '.env.local',
    '.env.production',
    '.env'
  ];

  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, envFile);
    if (fs.existsSync(envPath)) {
      console.log(`📁 加载环境配置文件: ${envFile}`);
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=');
          
          if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
            console.log(`   ✅ ${key.trim()} = ${process.env[key.trim()]}`);
          }
        }
      });
      
      return true;
    }
  }
  
  console.log('⚠️  未找到环境配置文件，使用默认配置');
  return false;
}

// 自动加载
loadEnvFile();

module.exports = { loadEnvFile };
