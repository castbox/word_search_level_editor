const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class AuthManager {
  constructor() {
    this.sessions = new Map();
    this.authConfig = this.loadAuthConfig();
  }

  loadAuthConfig() {
    try {
      const configPath = process.env.CONFIGS_DIR 
        ? path.join(process.env.CONFIGS_DIR, 'auth-config.json')
        : path.join(__dirname, '..', 'config', 'auth-config.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      console.log('🔐 权限配置已加载');
      return config;
    } catch (error) {
      console.log('⚠️  权限验证已禁用 - 未找到配置文件');
      return {
        auth: { enabled: false },
        users: []
      };
    }
  }

  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  // 认证中间件
  requireAuth(permission = 'read') {
    return (req, res, next) => {
      if (!this.authConfig.auth.enabled) {
        return next();
      }

      const sessionId = req.headers['x-session-id'] || req.query.sessionId;
      if (!sessionId) {
        return res.status(401).json({ 
          error: '需要登录', 
          code: 'AUTH_REQUIRED',
          authType: 'users'
        });
      }

      const session = this.sessions.get(sessionId);
      if (!session || Date.now() > session.expiresAt) {
        if (session) this.sessions.delete(sessionId);
        return res.status(401).json({ 
          error: '会话已过期', 
          code: 'SESSION_EXPIRED' 
        });
      }

      if (!session.user.permissions.includes(permission)) {
        return res.status(403).json({ 
          error: '权限不足', 
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permission,
          userPermissions: session.user.permissions
        });
      }

      req.user = session.user;
      req.sessionId = sessionId;
      
      // 刷新会话过期时间
      session.expiresAt = Date.now() + this.authConfig.auth.sessionTimeout;
      
      next();
    };
  }

  // 登录验证
  async authenticate(username, password) {
    // 用户名密码模式
    const user = this.authConfig.users.find(u => 
      u.username === username && u.password === password
    );
    
    if (!user) {
      return { success: false, error: '用户名或密码错误', code: 'INVALID_CREDENTIALS' };
    }
    
    const sessionId = this.generateSessionId();
    const userInfo = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      permissions: user.permissions
    };
    
    this.sessions.set(sessionId, {
      user: userInfo,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.authConfig.auth.sessionTimeout
    });
    
    console.log(`🔑 用户 ${username} (${user.role}) 登录成功`);
    return { success: true, sessionId, user: userInfo };
  }

  // 登出
  logout(sessionId) {
    if (sessionId && this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId);
      console.log('🚪 用户登出');
      return { success: true, message: '登出成功' };
    }
    return { success: false, message: '无效会话' };
  }

  // 检查认证状态
  checkAuthStatus(sessionId) {
    if (!this.authConfig.auth.enabled) {
      return { 
        authRequired: false, 
        message: '权限验证已禁用' 
      };
    }
    
    if (!sessionId) {
      return { 
        authRequired: true, 
        authenticated: false,
        authType: 'users',
        message: '需要登录' 
      };
    }
    
    const session = this.sessions.get(sessionId);
    if (!session || Date.now() > session.expiresAt) {
      if (session) this.sessions.delete(sessionId);
      return { 
        authRequired: true, 
        authenticated: false,
        authType: 'users',
        message: '会话已过期' 
      };
    }
    
    return { 
      authRequired: true,
      authenticated: true,
      user: session.user,
      expiresAt: session.expiresAt,
      message: '已登录'
    };
  }

  // 用户是否可以访问指定关卡
  canAccessLevel(user, levelCreatorId) {
    if (!user || !this.authConfig.auth.enabled) {
      return true; // 权限未启用时允许访问
    }

    // 管理员可以查看所有关卡
    if (user.role === 'admin' || user.permissions.includes('view_all')) {
      return true;
    }

    // 用户只能查看自己创建的关卡
    return user.id === levelCreatorId;
  }

  // 获取用户信息
  getUserById(userId) {
    return this.authConfig.users.find(u => u.id === userId);
  }

  // 清理过期会话
  cleanExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

module.exports = AuthManager;
