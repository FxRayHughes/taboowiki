/**
 * API 配置和工具函数
 */

/**
 * 获取 API 基础 URL
 */
export const getApiBaseUrl = () => {
  // if (typeof window === 'undefined') return 'http://localhost:8080';
  //
  // const hostname = window.location.hostname;
  // if (hostname === 'localhost' || hostname === '127.0.0.1') {
  //   return 'http://localhost:8080';
  // }
  // return 'http://110.42.109.37:8080';
    return 'http://110.42.109.37:8080';
};

/**
 * API 端点配置
 */
export const API_ENDPOINTS = {
  // 赞助相关 - 公开接口
  DONATIONS_PUBLIC: '/api/sponsor/donations',
  REWARDS_PUBLIC: '/api/sponsor/rewards',
  STATISTICS: '/api/sponsor/statistics',

  // 赞助相关 - 用户接口
  DONATIONS_MY: '/api/sponsor/donations/my',
  DONATIONS_SUBMIT: '/api/sponsor/donations/submit',
  DONATIONS_EDIT_MESSAGE: (id) => `/api/sponsor/donations/${id}/message`,

  // 奖励相关 - 用户接口
  REWARDS_MY_APPLICATIONS: '/api/sponsor/rewards/my-applications',
  REWARDS_APPLY: '/api/sponsor/rewards/apply',

  // 赞助相关 - 管理员接口
  ADMIN_DONATIONS: '/admin/api/sponsor/donations',
  ADMIN_DONATIONS_APPROVE: (id) => `/admin/api/sponsor/donations/${id}/approve`,
  ADMIN_DONATIONS_REJECT: (id) => `/admin/api/sponsor/donations/${id}/reject`,
  ADMIN_DONATIONS_RESET_EDIT: (id) => `/admin/api/sponsor/donations/${id}/reset-edit-permission`,

  // 奖励相关 - 管理员接口
  ADMIN_REWARDS: '/admin/api/sponsor/rewards',
  ADMIN_REWARDS_PENDING: '/admin/api/sponsor/rewards/pending',
  ADMIN_REWARDS_APPROVE: (id) => `/admin/api/sponsor/rewards/${id}/approve`,
  ADMIN_REWARDS_REJECT: (id) => `/admin/api/sponsor/rewards/${id}/reject`,
  ADMIN_REWARDS_PAY: (id) => `/admin/api/sponsor/rewards/${id}/pay`,
};

/**
 * 构建完整的 API URL
 * @param {string} endpoint - API 端点路径
 * @returns {string} 完整的 API URL
 */
export const buildApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};

/**
 * 发起 API 请求的通用函数
 * @param {string} endpoint - API 端点
 * @param {object} options - fetch 选项
 * @param {object} options.method - HTTP 方法
 * @param {object} options.headers - 请求头
 * @param {object} options.body - 请求体
 * @param {boolean} options.needAuth - 是否需要认证
 * @returns {Promise} API 响应
 */
export const apiRequest = async (endpoint, options = {}) => {
  const { method = 'GET', headers = {}, body, needAuth = false } = options;

  const url = buildApiUrl(endpoint);
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // 如果需要认证，添加 Authorization 头
  if (needAuth) {
    const { TokenManager } = await import('@site/src/components/AuthGuard/TokenManager');
    const token = TokenManager.getToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const requestOptions = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, requestOptions);
  return response.json();
};

/**
 * 赞助相关 API 封装
 */
export const SponsorAPI = {
  // 获取公开的赞助列表
  getPublicDonations: async (page = 1, size = 100) => {
    return apiRequest(`${API_ENDPOINTS.DONATIONS_PUBLIC}?page=${page}&size=${size}`);
  },

  // 获取公开的奖励列表
  getPublicRewards: async (page = 1, size = 100) => {
    return apiRequest(`${API_ENDPOINTS.REWARDS_PUBLIC}?page=${page}&size=${size}`);
  },

  // 获取统计信息
  getStatistics: async () => {
    return apiRequest(API_ENDPOINTS.STATISTICS);
  },

  // 获取我的赞助记录
  getMyDonations: async () => {
    return apiRequest(API_ENDPOINTS.DONATIONS_MY, { needAuth: true });
  },

  // 提交赞助记录
  submitDonation: async (data) => {
    return apiRequest(API_ENDPOINTS.DONATIONS_SUBMIT, {
      method: 'POST',
      body: data,
      needAuth: true,
    });
  },

  // 编辑赞助留言
  editDonationMessage: async (id, message) => {
    return apiRequest(API_ENDPOINTS.DONATIONS_EDIT_MESSAGE(id), {
      method: 'PUT',
      body: { message },
      needAuth: true,
    });
  },

  // 获取我的奖励申请
  getMyRewardApplications: async () => {
    return apiRequest(API_ENDPOINTS.REWARDS_MY_APPLICATIONS, { needAuth: true });
  },

  // 申请奖励
  applyReward: async (data) => {
    return apiRequest(API_ENDPOINTS.REWARDS_APPLY, {
      method: 'POST',
      body: data,
      needAuth: true,
    });
  },

  // 管理员：获取所有赞助记录
  adminGetAllDonations: async (status, page = 1, size = 20) => {
    const params = new URLSearchParams({ page, size });
    if (status) params.append('status', status);
    return apiRequest(`${API_ENDPOINTS.ADMIN_DONATIONS}?${params.toString()}`, { needAuth: true });
  },

  // 管理员：批准赞助
  adminApproveDonation: async (id, remark) => {
    return apiRequest(API_ENDPOINTS.ADMIN_DONATIONS_APPROVE(id), {
      method: 'PUT',
      body: { remark },
      needAuth: true,
    });
  },

  // 管理员：拒绝赞助
  adminRejectDonation: async (id, remark) => {
    return apiRequest(API_ENDPOINTS.ADMIN_DONATIONS_REJECT(id), {
      method: 'PUT',
      body: { remark },
      needAuth: true,
    });
  },

  // 管理员：重置留言编辑权限
  adminResetEditPermission: async (id, reason) => {
    return apiRequest(API_ENDPOINTS.ADMIN_DONATIONS_RESET_EDIT(id), {
      method: 'PUT',
      body: { reason },
      needAuth: true,
    });
  },

  // 管理员：获取所有奖励记录
  adminGetAllRewards: async (status, rewardType, page = 1, size = 20) => {
    const params = new URLSearchParams({ page, size });
    if (status) params.append('status', status);
    if (rewardType) params.append('rewardType', rewardType);
    return apiRequest(`${API_ENDPOINTS.ADMIN_REWARDS}?${params.toString()}`, { needAuth: true });
  },

  // 管理员：获取待审核的奖励
  adminGetPendingRewards: async (page = 1, size = 20) => {
    return apiRequest(`${API_ENDPOINTS.ADMIN_REWARDS_PENDING}?page=${page}&size=${size}`, { needAuth: true });
  },

  // 管理员：批准奖励
  adminApproveReward: async (id, amount, finalScore, remark) => {
    return apiRequest(API_ENDPOINTS.ADMIN_REWARDS_APPROVE(id), {
      method: 'PUT',
      body: { amount, finalScore, remark },
      needAuth: true,
    });
  },

  // 管理员：拒绝奖励
  adminRejectReward: async (id, remark) => {
    return apiRequest(API_ENDPOINTS.ADMIN_REWARDS_REJECT(id), {
      method: 'PUT',
      body: { remark },
      needAuth: true,
    });
  },

  // 管理员：标记奖励已发放
  adminMarkRewardAsPaid: async (id, rewardTime, remark) => {
    return apiRequest(API_ENDPOINTS.ADMIN_REWARDS_PAY(id), {
      method: 'PUT',
      body: { rewardTime, remark },
      needAuth: true,
    });
  },
};
