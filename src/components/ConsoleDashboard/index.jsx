import React, { useState, useEffect } from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { TokenManager } from '@site/src/components/AuthGuard/TokenManager';

/**
 * 控制台仪表板组件
 */
export default function ConsoleDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    if (!ExecutionEnvironment.canUseDOM) return;

    try {
      // 检查是否有 Token
      const hasToken = TokenManager.hasToken();

      if (!hasToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // 验证 Token 并获取用户信息
      const currentUser = await TokenManager.getCurrentUser();

      // 只要有有效的用户信息就允许访问控制台
      if (currentUser) {
        setIsAuthenticated(true);
        setUser(currentUser);

        // 管理员可以看到系统统计信息
        if (currentUser.isAdmin) {
          fetchSystemStats();
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('认证检查失败:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      // 模拟系统统计数据
      setSystemStats({
        totalUsers: 1234,
        activeUsers: 567,
        todayRegistrations: 23,
        totalDocuments: 456,
        systemHealth: 98.5,
        lastBackup: new Date().toLocaleDateString(),
        uptime: '15天 8小时'
      });
    } catch (error) {
      console.error('获取系统统计失败:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await TokenManager.redirectToGitHubLogin();

      if (result.success) {
        // 登录成功，刷新认证状态
        setIsAuthenticated(true);
        setUser(result.user);
        setShowLoginModal(false);
        fetchSystemStats();
        return { success: true };
      } else {
        return { success: false, message: result.message || '登录失败' };
      }
    } catch (error) {
      console.error('登录失败:', error);
      return { success: false, message: '网络错误，请重试' };
    }
  };

  const handleLogout = () => {
    TokenManager.logout();
    setIsAuthenticated(false);
    setUser(null);
    setSystemStats(null);
  };

  const handleRefreshStats = () => {
    fetchSystemStats();
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--ifm-color-emphasis-200)',
          borderTop: '4px solid var(--ifm-color-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        <p>正在加载控制台...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
        <h2>需要管理员登录</h2>
        <p style={{ marginBottom: '2rem', color: 'var(--ifm-font-color-base)' }}>
          请登录您的管理员账户以访问控制台功能
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowLoginModal(true)}
            style={{
              padding: '0.75rem 2rem',
              background: 'var(--ifm-color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            立即登录
          </button>
        </div>

        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--ifm-background-color)',
      margin: '0 calc(-1 * var(--ifm-spacing-horizontal))',
      width: 'calc(100% + 2 * var(--ifm-spacing-horizontal))'
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        background: 'var(--ifm-card-background-color)',
        borderBottom: '1px solid var(--ifm-color-emphasis-200)',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user?.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt={user.username}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '2px solid var(--ifm-color-primary)',
                  objectFit: 'cover'
                }}
              />
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--ifm-heading-color)' }}>
                {user?.nickname || user?.username}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-600)' }}>
                {user?.isAdmin ? '🔑 系统管理员' : '👤 普通用户'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {user?.isAdmin && (
              <button
                onClick={handleRefreshStats}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'var(--ifm-color-emphasis-100)',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
              >
                🔄 刷新
              </button>
            )}
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1.25rem',
                background: 'var(--ifm-color-danger)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              退出登录
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div style={{
        padding: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem'
      }}>

        {/* 用户信息卡片 */}
        <div style={{
          background: 'var(--ifm-card-background-color)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--ifm-color-emphasis-200)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          gridColumn: 'span 1'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--ifm-heading-color)', fontSize: '1.1rem' }}>
            📋 账户信息
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <span style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.85rem' }}>用户名</span>
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: '500' }}>{user?.username || '未知'}</p>
            </div>
            <div>
              <span style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.85rem' }}>昵称</span>
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: '500' }}>{user?.nickname || '未设置'}</p>
            </div>
            <div>
              <span style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.85rem' }}>GitHub</span>
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: '500' }}>
                {user?.githubUrl ? (
                  <a
                    href={user.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--ifm-color-primary)', textDecoration: 'none' }}
                  >
                    @{user.githubUsername}
                  </a>
                ) : (
                  <span style={{ color: 'var(--ifm-color-emphasis-600)' }}>未绑定</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 系统信息卡片 */}
        <div style={{
          background: 'var(--ifm-card-background-color)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--ifm-color-emphasis-200)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          gridColumn: 'span 1'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>🔧 系统信息</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <span style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.85rem' }}>系统运行时间</span>
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: '500' }}>{systemStats?.uptime || '未知'}</p>
            </div>
            <div>
              <span style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.85rem' }}>API 状态</span>
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: '500', color: 'var(--ifm-color-success)' }}>✅ 正常运行</p>
            </div>
            <div>
              <span style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.85rem' }}>Token 状态</span>
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: '500', color: 'var(--ifm-color-success)' }}>✅ 有效</p>
            </div>
          </div>
        </div>

        {/* 快速操作区域 - 占满整行 */}
        <div style={{
          background: 'var(--ifm-card-background-color)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid var(--ifm-color-emphasis-200)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          gridColumn: '1 / -1'
        }}>
          <h3 style={{ margin: '0 0 1.25rem 0', color: 'var(--ifm-heading-color)', fontSize: '1.1rem' }}>🚀 快速操作</h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {/* 所有用户都可以访问 */}
            <QuickActionCard
              title="浏览文档"
              description="查看 TabooLib 官方文档"
              icon="📚"
              href="/docs/intro"
            />
            <QuickActionCard
              title="我的赞助"
              description="查看我的赞助记录"
              icon="💰"
              href="/console/donations"
            />
            <QuickActionCard
              title="我的奖励"
              description="查看我的奖励申请"
              icon="🚀"
              href="/console/rewards"
            />

            {/* 管理员专属功能 */}
            {user?.isAdmin && (
              <>
                <QuickActionCard
                  title="审批管理"
                  description="审批赞助和奖励申请"
                  icon="✅"
                  href="/console/admin"
                />
                <QuickActionCard
                  title="用户管理"
                  description="管理系统用户、权限和设置"
                  icon="🔑"
                  href="/admin/user-management"
                />
                <QuickActionCard
                  title="系统设置"
                  description="配置系统参数和功能设置"
                  icon="⚙️"
                  href="/admin/system-settings"
                />
                <QuickActionCard
                  title="日志查看"
                  description="查看系统日志和错误信息"
                  icon="📝"
                  onClick={() => alert('日志功能开发中...')}
                />
              </>
            )}
          </div>
        </div>

      </div>

        {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}

/**
 * 统计卡片组件
 */
function StatCard({ icon, label, value }) {
  return (
    <div style={{
      background: 'var(--ifm-card-background-color)',
      padding: '1.5rem',
      borderRadius: '8px',
      textAlign: 'center',
      border: '1px solid var(--ifm-color-emphasis-200)',
      transition: 'transform 0.2s ease'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--ifm-color-primary)', marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem' }}>
        {label}
      </div>
    </div>
  );
}

/**
 * 快速操作卡片组件
 */
function QuickActionCard({ title, description, icon, href, onClick }) {
  const handleClick = onClick || (() => {
    if (href) {
      window.location.href = href;
    }
  });

  return (
    <div
      onClick={handleClick}
      style={{
        background: 'var(--ifm-card-background-color)',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid var(--ifm-color-emphasis-200)',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--ifm-heading-color)' }}>{title}</h3>
      <p style={{ margin: 0, color: 'var(--ifm-color-emphasis-600)', fontSize: '0.9rem' }}>
        {description}
      </p>
    </div>
  );
}

/**
 * GitHub OAuth2 登录模态框组件
 */
function LoginModal({ onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError('');

    const result = await TokenManager.redirectToGitHubLogin();

    if (!result.success) {
      setError(result.message || '无法跳转到 GitHub 登录，请检查网络连接');
      setIsLoading(false);
    } else {
      // 登录成功，刷新页面
      window.location.reload();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--ifm-card-background-color)',
        padding: '2.5rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '450px',
        border: '1px solid var(--ifm-color-emphasis-200)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: 'var(--ifm-heading-color)' }}>管理员登录</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--ifm-color-emphasis-600)'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
          <p style={{ margin: 0, color: 'var(--ifm-color-emphasis-600)', lineHeight: '1.6' }}>
            使用 GitHub 账号登录管理控制台
          </p>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--ifm-color-emphasis-500)', fontSize: '0.85rem' }}>
            将在新窗口中打开 GitHub 授权页面
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--ifm-color-danger-contrast-background)',
            border: '1px solid var(--ifm-color-danger)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: 'var(--ifm-color-danger)'
          }}>
            <strong>❌ 登录失败</strong>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              {error}
            </p>
          </div>
        )}

        <button
          onClick={handleGitHubLogin}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '1rem',
            background: isLoading ? 'var(--ifm-color-emphasis-300)' : '#24292e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.05rem',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            transition: 'background-color 0.2s ease',
            marginBottom: '1rem'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) e.currentTarget.style.background = '#2c3137';
          }}
          onMouseLeave={(e) => {
            if (!isLoading) e.currentTarget.style.background = '#24292e';
          }}
        >
          <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          {isLoading ? '正在打开登录窗口...' : '使用 GitHub 登录'}
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--ifm-color-emphasis-100)',
            border: '1px solid var(--ifm-color-emphasis-300)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            color: 'var(--ifm-font-color-base)'
          }}
        >
          取消
        </button>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'var(--ifm-color-info-contrast-background)',
          border: '1px solid var(--ifm-color-info)',
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--ifm-color-info)', fontSize: '0.95rem' }}>
            ℹ️ 管理员权限说明
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-700)' }}>
            <li>使用 GitHub 账号登录</li>
            <li>仅限具有管理员权限的账户访问</li>
            <li>如需申请管理员权限，请联系系统管理员</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
