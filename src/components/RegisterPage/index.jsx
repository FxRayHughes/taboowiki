import React, { useState, useEffect } from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { TokenManager } from '@site/src/components/AuthGuard/TokenManager';

/**
 * GitHub OAuth2 登录页面
 */
export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // 不再需要处理 OAuth2 回调，后端直接返回 HTML 页面
    setIsLoading(false);
  }, []);

  /**
   * 跳转到 GitHub 登录
   */
  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError('');

    const result = await TokenManager.redirectToGitHubLogin();

    if (!result) {
      setError('无法跳转到 GitHub 登录，请检查网络连接');
      setIsLoading(false);
    }
  };

  /**
   * 返回首页
   */
  const handleGoBack = () => {
    window.location.href = '/';
  };

  // 登录成功页面
  if (success) {
    const isPopup = window.opener && !window.opener.closed;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ifm-background-color)',
        padding: '1rem'
      }}>
        <div style={{
          background: 'var(--ifm-card-background-color)',
          padding: '3rem',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
          border: '1px solid var(--ifm-color-emphasis-200)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ margin: '0 0 1rem 0', color: 'var(--ifm-color-success)' }}>
            登录成功！
          </h2>
          <p style={{
            margin: '0 0 2rem 0',
            color: 'var(--ifm-font-color-base)',
            lineHeight: '1.6'
          }}>
            {isPopup ? '此窗口即将关闭...' : '欢迎回来！正在为您跳转到控制台...'}
          </p>
          <div style={{
            width: '100%',
            height: '4px',
            background: 'var(--ifm-color-emphasis-200)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'var(--ifm-color-success)',
              animation: isPopup ? 'shrink 1.5s linear forwards' : 'shrink 2s linear forwards'
            }}></div>
          </div>
        </div>

        <style>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    );
  }

  // 加载中页面
  if (isLoading && !error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ifm-background-color)',
        padding: '1rem'
      }}>
        <div style={{
          background: 'var(--ifm-card-background-color)',
          padding: '3rem',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
          border: '1px solid var(--ifm-color-emphasis-200)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid var(--ifm-color-emphasis-200)',
            borderTop: '4px solid var(--ifm-color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }}></div>
          <h3 style={{ margin: 0, color: 'var(--ifm-font-color-base)' }}>
            正在处理登录...
          </h3>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 登录页面
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--ifm-background-color)',
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--ifm-card-background-color)',
        padding: '2.5rem',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid var(--ifm-color-emphasis-200)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        {/* 头部 */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🚀</div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--ifm-heading-color)' }}>
            TabooWiki 登录
          </h1>
          <p style={{
            margin: 0,
            color: 'var(--ifm-color-emphasis-600)',
            fontSize: '0.95rem'
          }}>
            使用 GitHub 账号登录管理系统
          </p>
        </div>

        {/* 错误信息 */}
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

        {/* GitHub 登录按钮 */}
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
          {isLoading ? '正在跳转...' : '使用 GitHub 登录'}
        </button>

        {/* 返回首页 */}
        <button
          onClick={handleGoBack}
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
          ← 返回首页
        </button>

        {/* 说明信息 */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'var(--ifm-color-info-contrast-background)',
          border: '1px solid var(--ifm-color-info)',
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--ifm-color-info)', fontSize: '0.95rem' }}>
            ℹ️ 登录说明
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-700)' }}>
            <li>使用 GitHub 账号即可快速登录</li>
            <li>首次登录会自动创建账户</li>
            <li>管理员权限需要联系系统管理员设置</li>
            <li>登录后可访问控制台和管理功能</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
