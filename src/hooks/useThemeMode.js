import { useState, useEffect } from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

/**
 * Hook to get current Docusaurus theme mode (light/dark)
 * @returns {'light' | 'dark'} Current theme mode
 */
export function useThemeMode() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (!ExecutionEnvironment.canUseDOM) {
      return;
    }

    // 获取初始主题
    const getTheme = () => {
      return document.documentElement.getAttribute('data-theme') || 'light';
    };

    setTheme(getTheme());

    // 监听主题变化
    const observer = new MutationObserver(() => {
      setTheme(getTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
