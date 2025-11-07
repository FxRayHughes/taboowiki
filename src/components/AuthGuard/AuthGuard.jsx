import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { getApiBaseUrl } from '@site/src/utils/api';

/**
 * 认证守卫组件 - 保护需要登录才能访问的页面
 */
export default function AuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();
  const location = useLocation();
  const { siteConfig } = useDocusaurusContext();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    // 当未认证时，隐藏右侧目录
    if (!isLoading && !isAuthenticated && ExecutionEnvironment.canUseDOM) {
      // 隐藏目录相关元素
      const rightSidebar = document.querySelector('.theme-doc-sidebar-container');
      const colCol2 = document.querySelector('.col.col--2');
      const tableOfContents = document.querySelector('.table-of-contents.table-of-contents__left-border');
      const tocDesktop = document.querySelector('.theme-doc-toc-desktop');
      const mainContent = document.querySelector('main');

      if (rightSidebar) {
        rightSidebar.style.display = 'none';
      }
      if (colCol2) {
        colCol2.style.display = 'none';
      }
      if (tableOfContents) {
        tableOfContents.style.display = 'none';
      }
      if (tocDesktop) {
        tocDesktop.style.display = 'none';
      }
      if (mainContent) {
        mainContent.style.maxWidth = '100%';
        mainContent.style.paddingRight = '2rem';
      }

      // 返回清理函数，在组件卸载时恢复显示
      return () => {
        if (rightSidebar) {
          rightSidebar.style.display = '';
        }
        if (colCol2) {
          colCol2.style.display = '';
        }
        if (tableOfContents) {
          tableOfContents.style.display = '';
        }
        if (tocDesktop) {
          tocDesktop.style.display = '';
        }
        if (mainContent) {
          mainContent.style.maxWidth = '';
          mainContent.style.paddingRight = '';
        }
      };
    }
  }, [isLoading, isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      // 检查本地存储中是否有 Token
      const token = localStorage.getItem('taboowiki_token');

      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // 验证 Token 是否有效
      const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.success && data.user?.isAdmin);
      } else {
        // Token 无效，清除本地存储
        localStorage.removeItem('taboowiki_token');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('认证检查失败:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    // 跳转到控制台页面进行登录
    history.push('/console');
  };

  const handleGoBack = () => {
    // 如果有历史记录，返回上一页，否则跳转到首页
    if (history.length > 1) {
      history.goBack();
    } else {
      history.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="auth-guard-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>正在验证身份...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-guard-container">
        <div className="auth-guard-content">
          <div className="auth-icon">🔒</div>
          <h2>需要管理员权限</h2>
          <p>此页面仅限管理员访问，请先登录您的管理员账户。</p>

          <div className="auth-actions">
            <button
              className="auth-button primary"
              onClick={handleLogin}
            >
              前往登录
            </button>
            <button
              className="auth-button secondary"
              onClick={handleGoBack}
            >
              返回上一页
            </button>
          </div>

          <div className="auth-help">
            <h3>需要帮助？</h3>
            <ul>
              <li>确认您具有管理员权限</li>
              <li>检查 Token 是否已过期</li>
              <li>尝试重新登录获取新的 Token</li>
              <li>如果问题持续，请联系技术支持</li>
            </ul>
          </div>

          <div className="auth-info">
            <details>
              <summary>技术信息</summary>
              <div className="tech-details">
                <p><strong>当前路径:</strong> {location.pathname}</p>
                <p><strong>API 地址:</strong> {getApiBaseUrl()}</p>
                <p><strong>Token 状态:</strong> {localStorage.getItem('taboowiki_token') ? '存在但可能无效' : '未找到'}</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
