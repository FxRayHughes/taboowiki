import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { TokenManager } from '@site/src/components/AuthGuard/TokenManager';

/**
 * GitHub OAuth2 回调处理页面
 *
 * 此页面负责：
 * 1. 接收 GitHub OAuth 重定向带来的 code 参数
 * 2. 调用后端 API 用 code 换取 token
 * 3. 通过 postMessage 将结果发送给父窗口（如果是弹窗）
 * 4. 或者直接跳转到控制台（如果不是弹窗）
 */
export default function OAuthCallback() {
  const [status, setStatus] = useState('正在处理登录...');
  const [message, setMessage] = useState('请稍候，正在验证您的身份信息');
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // 从 URL 获取参数
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      // 检查是否有错误
      if (error) {
        showError(`GitHub 授权被拒绝: ${error}`);
        return;
      }

      // 检查是否有授权码
      if (!code) {
        showError('未收到授权码，请重试');
        return;
      }

      // 调用后端 API
      setMessage('正在与服务器通信...');

      const apiBaseUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:8080'
        : 'http://110.42.109.37:8080';

      const apiUrl = `${apiBaseUrl}/api/auth/oauth2/success?code=${encodeURIComponent(code)}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`服务器响应错误: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.token) {
        // 登录成功
        setStatus('登录成功！');
        setMessage('正在跳转...');
        setIsSuccess(true);

        // 检查是否在弹窗中
        const isPopup = window.opener && !window.opener.closed;

        if (isPopup) {
          // 如果是弹窗，发送消息给父窗口
          window.opener.postMessage({
            type: 'OAUTH_SUCCESS',
            token: data.token,
            user: data.user
          }, '*');

          // // 等待消息发送后关闭窗口
          // setTimeout(() => {
          //   window.close();
          // }, 500);
        } else {
          // 如果不是弹窗，保存 token 并跳转
          TokenManager.saveToken(data.token);
          localStorage.setItem('taboowiki_user', JSON.stringify(data.user));

          // setTimeout(() => {
          //   window.location.href = '/console';
          // }, 1000);
        }
      } else {
        showError(data.message || '登录失败，请重试');
      }
    } catch (err) {
      console.error('OAuth 处理失败:', err);
      showError(`网络错误: ${err.message}`);
    }
  };

  const showError = (errorMessage) => {
    setStatus('登录失败');
    setMessage(errorMessage);
    setIsError(true);

    // 3 秒后尝试关闭窗口或跳转
    setTimeout(() => {
      if (window.opener && !window.opener.closed) {
        window.close();
      } else {
        window.location.href = '/';
      }
    }, 3000);
  };

  return (
    <Layout
      title="OAuth2 登录处理中..."
      description="GitHub OAuth2 登录回调处理页面"
      noFooter
    >
      <div style={{
        minHeight: 'calc(100vh - var(--ifm-navbar-height))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '1rem'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'white',
          padding: '3rem',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%'
        }}>
          {/* 加载动画或成功图标 */}
          {!isError && !isSuccess && (
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid rgba(0, 0, 0, 0.1)',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1.5rem'
            }}></div>
          )}

          {isSuccess && (
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          )}

          {isError && (
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          )}

          <h2 style={{
            margin: '0 0 1rem 0',
            color: isError ? '#e53e3e' : '#333'
          }}>
            {status}
          </h2>

          <p style={{
            margin: 0,
            color: '#666',
            lineHeight: '1.6'
          }}>
            {message}
          </p>

          {isError && (
            <div style={{
              color: '#e53e3e',
              background: '#fff5f5',
              border: '1px solid #fc8181',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1rem'
            }}>
              <strong>错误详情</strong>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                {message}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Layout>
  );
}
