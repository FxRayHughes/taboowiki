/**
 * 管理员面板工具函数
 */

/**
 * 获取状态文本
 */
export const getStatusText = (status) => {
  const statusMap = {
    'PENDING': '待审核',
    'APPROVED': '已通过',
    'REJECTED': '已拒绝',
    'PAID': '已发放',
  };
  return statusMap[status] || status;
};

/**
 * 获取奖励类型文本
 */
export const getRewardTypeText = (type) => {
  const typeMap = {
    'BUG_FIX': 'Bug 修复',
    'FEATURE': '新功能',
    'DOCUMENTATION': '文档贡献',
    'OPTIMIZATION': '性能优化',
    'OTHER': '其他贡献',
  };
  return typeMap[type] || type;
};

/**
 * 格式化日期时间
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 显示消息提示
 */
export const showMessage = (text, type = 'info') => {
  // 简单的消息提示实现
  // TODO: 可以替换为更好的 toast 组件
  alert(text);
};
