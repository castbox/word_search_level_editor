#!/usr/bin/env node

const { networkInterfaces } = require('os');
const { spawn } = require('child_process');

// 获取本机IP地址
function getLocalIPs() {
  const nets = networkInterfaces();
  const results = [];
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // 跳过内部地址和IPv6地址
      if (net.family === 'IPv4' && !net.internal) {
        results.push({
          interface: name,
          address: net.address
        });
      }
    }
  }
  
  return results;
}

// 显示访问信息
function displayAccessInfo() {
  const ips = getLocalIPs();
  const port = process.env.PORT || 3000;
  
  console.log('\n🌟 ========================');
  console.log('🎮 Word Search Level Editor');
  console.log('🌟 ========================\n');
  
  console.log('📍 团队成员访问地址：');
  
  if (ips.length === 0) {
    console.log('❌ 未找到可用的网络接口');
    console.log('📝 请检查网络连接');
  } else {
    ips.forEach((ip, index) => {
      const url = `http://${ip.address}:${port}`;
      console.log(`\n🔗 方式${index + 1}：${url}`);
      console.log(`   网络接口：${ip.interface}`);
      console.log(`   📱 手机/平板也可访问此地址`);
    });
  }
  
  console.log('\n💡 使用说明：');
  console.log('   1. 确保团队成员与你在同一局域网');
  console.log('   2. 如果无法访问，请检查防火墙设置');
  console.log('   3. IP变化时重启此脚本即可获取新地址');
  
  console.log('\n🚀 服务器启动中...\n');
}

// 启动服务器
function startServer() {
  displayAccessInfo();
  
  // 启动主服务器
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  server.on('error', (error) => {
    console.error('❌ 服务器启动失败:', error);
  });
  
  server.on('close', (code) => {
    console.log(`\n🛑 服务器已停止 (退出码: ${code})`);
  });
  
  // 处理进程退出
  process.on('SIGINT', () => {
    console.log('\n👋 正在停止服务器...');
    server.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n👋 正在停止服务器...');
    server.kill('SIGTERM');
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { getLocalIPs, displayAccessInfo };

