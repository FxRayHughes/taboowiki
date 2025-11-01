/**
 * Token 管理工具类
 * 用于处理 JWT Token 的存储、验证和管理
 */
export class TokenManager {
  static TOKEN_KEY = 'taboowiki_token';
  static API_URL = 'http://localhost:8080'; // 可以根据环境

  /**
   * 保存 Token
   */
  static saveToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  /**
   * 获取 Token
   */
  static getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * 移除 Token
   */
  static removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  /**
   * 检查 Token 是否存在
   */
  static hasToken() {
    return !!this.getToken();
  }

  /**
   * 验证 Token 是否有效
   */
  static async validateToken() {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const response = await fetch(`${this.API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.success && data.user?.isAdmin;
      }

      // Token 无效，移除本地存储
      this.removeToken();
      return false;
    } catch (error) {
      console.error('Token 验证失败:', error);
      this.removeToken();
      return false;
    }
  }

  /**
   * 发送验证码
   */
  static async sendVerificationCode(email) {
    try {
      console.log('发送验证码请求:', {
        url: `${this.API_URL}/api/auth/send-verification-code`,
        email: email
      });

      const response = await fetch(`${this.API_URL}/api/auth/send-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('发送验证码响应:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('发送验证码数据:', data);

      if (data.success) {
        return {
          success: true,
          message: data.message || '验证码已发送到您的邮箱',
          remainingCooldownSeconds: data.remainingCooldownSeconds || 60
        };
      }

      return {
        success: false,
        message: data.message || '发送验证码失败',
        errorCode: data.errorCode || 'SEND_FAILED',
        remainingCooldownSeconds: data.remainingCooldownSeconds
      };
    } catch (error) {
      console.error('发送验证码失败:', error);
      console.error('错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      let errorMessage = '网络错误，请重试';
      let errorCode = 'NETWORK_ERROR';

      if (error.message.includes('Failed to fetch')) {
        errorMessage = '无法连接到服务器，请检查后端服务是否启动';
        errorCode = 'CONNECTION_FAILED';
      } else if (error.message.includes('CORS')) {
        errorMessage = '跨域请求被阻止，请联系管理员配置 CORS';
        errorCode = 'CORS_ERROR';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = '网络连接错误，请检查网络连接';
        errorCode = 'NETWORK_CONNECTION_ERROR';
      }

      return { success: false, message: errorMessage, errorCode };
    }
  }

  /**
   * 验证验证码
   */
  static async verifyCode(email, code) {
    try {
      const response = await fetch(`${this.API_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          message: data.message || '验证码正确',
          verifiedToken: data.verifiedToken // 用于后续注册的临时令牌
        };
      }

      return {
        success: false,
        message: data.message || '验证码错误',
        errorCode: data.errorCode || 'CODE_INCORRECT',
        remainingAttempts: data.remainingAttempts
      };
    } catch (error) {
      console.error('验证码验证失败:', error);
      return { success: false, message: '网络错误，请重试', errorCode: 'NETWORK_ERROR' };
    }
  }

  /**
   * 用户注册（带验证码）
   */
  static async registerWithVerification(username, password, email, verifiedToken) {
    try {
      const response = await fetch(`${this.API_URL}/api/auth/register-with-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email, verifiedToken }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          message: data.message || '注册成功！',
          user: data.user
        };
      }

      return {
        success: false,
        message: data.message || '注册失败',
        errorCode: data.errorCode || 'REGISTRATION_FAILED'
      };
    } catch (error) {
      console.error('注册失败:', error);
      return { success: false, message: '网络错误，请重试', errorCode: 'NETWORK_ERROR' };
    }
  }

  /**
   * 用户注册（兼容原有方法）
   */
  static async register(username, password, email) {
    try {
      const response = await fetch(`${this.API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          message: data.message || '注册成功！',
          user: data.user
        };
      }

      return { success: false, message: data.message || '注册失败' };
    } catch (error) {
      console.error('注册失败:', error);
      return { success: false, message: '网络错误，请重试' };
    }
  }

  /**
   * 获取 GitHub OAuth2 登录URL
   */
  static async getGitHubOAuthUrl() {
    // 直接构建 GitHub OAuth URL，redirect_uri 指向前端回调页面
    const clientId = 'Ov23li2MIRnkuL9KBrac';

    // 根据当前环境自动判断回调地址
    const redirectUri = `https://taboowiki.maplex.top/auth/oauth-callback`;

    const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return { success: true, oauthUrl };
  }

  /**
   * 跳转到 GitHub OAuth2 登录（使用弹窗）
   */
  static async redirectToGitHubLogin() {
    const result = await this.getGitHubOAuthUrl();

    if (result.success && result.oauthUrl) {
      // 计算弹窗位置（屏幕居中）
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      console.log('打开 GitHub OAuth 弹窗:', result.oauthUrl);

      // 打开弹窗
      const popup = window.open(
        result.oauthUrl,
        'GitHub OAuth2 Login',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      // 监听弹窗消息
      return new Promise((resolve) => {
        const messageHandler = (event) => {
          console.log('父窗口收到消息:', event.data, 'origin:', event.origin);

          // 不验证 origin，因为消息来自后端（不同域名）
          // 但验证消息格式
          if (!event.data || !event.data.type) {
            console.warn('消息格式不正确，忽略');
            return;
          }

          // 检查是否是 OAuth 成功消息
          if (event.data.type === 'OAUTH_SUCCESS') {
            console.log('收到 OAUTH_SUCCESS 消息');
            window.removeEventListener('message', messageHandler);

            // 保存 token 和用户信息
            if (event.data.token) {
              console.log('保存 token');
              this.saveToken(event.data.token);
            }
            if (event.data.user) {
              console.log('保存用户信息:', event.data.user);
              localStorage.setItem('taboowiki_user', JSON.stringify(event.data.user));
            }

            // 关闭弹窗
            if (popup && !popup.closed) {
              console.log('关闭弹窗');
              popup.close();
            }

            console.log('resolve 成功');
            resolve({ success: true, user: event.data.user });
          } else if (event.data.type === 'OAUTH_ERROR') {
            console.log('收到 OAUTH_ERROR 消息');
            window.removeEventListener('message', messageHandler);

            // 关闭弹窗
            if (popup && !popup.closed) {
              popup.close();
            }

            resolve({ success: false, message: event.data.message || 'OAuth2 登录失败' });
          }
        };

        console.log('添加 message 事件监听器');
        window.addEventListener('message', messageHandler);

        // 检测弹窗是否被关闭（用户手动关闭）
        const checkClosed = setInterval(() => {
          if (popup && popup.closed) {
            console.log('弹窗被手动关闭');
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            resolve({ success: false, message: '登录已取消' });
          }
        }, 1000);
      });
    } else {
      console.error('无法获取 GitHub 登录链接:', result.message);
      return { success: false, message: result.message || '无法获取登录链接' };
    }
  }

  /**
   * 登录用户（保留用于兼容性，不建议使用）
   * @deprecated 请使用 GitHub OAuth2 登录
   */
  static async login(username, password) {
    console.warn('用户名密码登录已废弃，请使用 GitHub OAuth2 登录');
    try {
      const response = await fetch(`${this.API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        this.saveToken(data.token);
        return { success: true, user: data.user };
      }

      return { success: false, message: data.message || '登录失败' };
    } catch (error) {
      console.error('登录失败:', error);
      return { success: false, message: '网络错误，请重试' };
    }
  }

  /**
   * 登出用户
   */
  static logout() {
    this.removeToken();
    // 可以调用后端的登出接口
    // fetch(`${this.API_URL}/api/auth/logout`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.getToken()}`,
    //   },
    // }).catch(console.error);
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser() {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${this.API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.success ? data.user : null;
      }

      return null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  /**
   * 获取管理员用户信息
   */
  static async getAdminProfile() {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: '未登录' };
    }

    try {
      const response = await fetch(`${this.API_URL}/admin/api/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取管理员信息失败:', error);
      return { success: false, message: '网络错误', errorCode: 'NETWORK_ERROR' };
    }
  }

  /**
   * 获取所有管理员列表
   */
  static async getAllAdmins() {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: '未登录' };
    }

    try {
      const response = await fetch(`${this.API_URL}/admin/api/admins`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取管理员列表失败:', error);
      return { success: false, message: '网络错误', errorCode: 'NETWORK_ERROR' };
    }
  }

  /**
   * 获取所有用户列表
   */
  static async getAllUsers() {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: '未登录' };
    }

    try {
      const response = await fetch(`${this.API_URL}/admin/api/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return { success: false, message: '网络错误', errorCode: 'NETWORK_ERROR' };
    }
  }

  /**
   * 根据ID获取用户详情
   */
  static async getUserById(userId) {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: '未登录' };
    }

    try {
      const response = await fetch(`${this.API_URL}/admin/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取用户详情失败:', error);
      return { success: false, message: '网络错误', errorCode: 'NETWORK_ERROR' };
    }
  }

  /**
   * 更新用户状态
   */
  static async updateUserStatus(userId, status) {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: '未登录' };
    }

    try {
      const response = await fetch(`${this.API_URL}/admin/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('更新用户状态失败:', error);
      return { success: false, message: '网络错误', errorCode: 'NETWORK_ERROR' };
    }
  }

  /**
   * 设置用户管理员权限
   */
  static async setUserAdminStatus(userId, isAdmin) {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: '未登录' };
    }

    try {
      const response = await fetch(`${this.API_URL}/admin/api/users/${userId}/admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAdmin }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('设置管理员权限失败:', error);
      return { success: false, message: '网络错误', errorCode: 'NETWORK_ERROR' };
    }
  }

  /**
   * 删除用户
   */
  static async deleteUser(userId) {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: '未登录' };
    }

    try {
      const response = await fetch(`${this.API_URL}/admin/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('删除用户失败:', error);
      return { success: false, message: '网络错误', errorCode: 'NETWORK_ERROR' };
    }
  }

  /**
   * 检查用户是否为管理员
   */
  static async isAdmin() {
    const user = await this.getCurrentUser();
    return user?.isAdmin || false;
  }

  /**
   * 刷新 Token
   */
  static async refreshToken() {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const response = await fetch(`${this.API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.token) {
        this.saveToken(data.token);
        return true;
      }

      this.removeToken();
      return false;
    } catch (error) {
      console.error('Token 刷新失败:', error);
      this.removeToken();
      return false;
    }
  }

  /**
   * 获取认证头
   */
  static getAuthHeader() {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * 为 API 请求添加认证头
   */
  static addAuthHeader(headers = {}) {
    const authHeader = this.getAuthHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    return headers;
  }

  /**
   * 发起认证请求
   */
  static async fetchWithAuth(url, options = {}) {
    const headers = this.addAuthHeader({
      'Content-Type': 'application/json',
      ...options.headers,
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 如果返回 401，尝试刷新 Token
    if (response.status === 401) {
      const refreshSuccess = await this.refreshToken();
      if (refreshSuccess) {
        // 重新发起请求
        const newHeaders = this.addAuthHeader({
          'Content-Type': 'application/json',
          ...options.headers,
        });

        return fetch(url, {
          ...options,
          headers: newHeaders,
        });
      }
    }

    return response;
  }
}

export default TokenManager;
