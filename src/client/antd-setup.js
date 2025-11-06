/**
 * Ant Design React 19 兼容包初始化
 * 这个文件会在客户端启动时自动加载
 */

import '@ant-design/v5-patch-for-react-19';

// 如果需要自定义渲染方法,可以使用以下代码:
// import { unstableSetRender } from 'antd';
// import { createRoot } from 'react-dom/client';
//
// unstableSetRender((node, container) => {
//   container._reactRoot ||= createRoot(container);
//   const root = container._reactRoot;
//   root.render(node);
//   return async () => {
//     await new Promise((resolve) => setTimeout(resolve, 0));
//     root.unmount();
//   };
// });
