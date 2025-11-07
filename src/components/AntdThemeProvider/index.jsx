import React from 'react';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useThemeMode } from '@site/src/hooks/useThemeMode';

/**
 * Ant Design 主题提供者组件
 * 自动同步 Docusaurus 的明亮/黑暗模式
 */
export function AntdThemeProvider({ children }) {
  const themeMode = useThemeMode();

  // Ant Design 明亮模式主题配置
  const lightTheme = {
    algorithm: theme.defaultAlgorithm,
    token: {
      colorPrimary: '#2e59a7',
      borderRadius: 6,
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorBorder: '#d9d9d9',
      colorText: 'rgba(0, 0, 0, 0.88)',
      colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
      colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
      colorTextQuaternary: 'rgba(0, 0, 0, 0.25)',
    },
  };

  // Ant Design 黑暗模式主题配置
  const darkTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: '#5b8dd6',
      borderRadius: 6,
      colorBgContainer: '#141414',
      colorBgElevated: '#1f1f1f',
      colorBorder: '#424242',
      colorText: 'rgba(255, 255, 255, 0.85)',
      colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
      colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
      colorTextQuaternary: 'rgba(255, 255, 255, 0.25)',
    },
  };

  const currentTheme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ConfigProvider
      locale={zhCN}
      theme={currentTheme}
    >
      {children}
    </ConfigProvider>
  );
}
