import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { TokenManager } from '@site/src/components/AuthGuard/TokenManager';
import { SponsorAPI } from '@site/src/utils/api';
import styles from './rewards.module.css';

export default function MyRewards() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [myRewards, setMyRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [viewingProof, setViewingProof] = useState(null);
  const [formData, setFormData] = useState({
    contributorName: '',
    rewardType: '',
    description: '',
    proofUrl: '',
    selfScore: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    if (!ExecutionEnvironment.canUseDOM) return;

    try {
      const hasToken = TokenManager.hasToken();
      if (!hasToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const currentUser = await TokenManager.getCurrentUser();
      if (currentUser) {
        setIsAuthenticated(true);
        fetchRewards();
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

  const fetchRewards = async () => {
    setLoadingRewards(true);
    try {
      const data = await SponsorAPI.getMyRewardApplications();
      if (data.success) {
        setMyRewards(data.data || []);
      }
    } catch (error) {
      console.error('获取奖励数据失败:', error);
      showMessage('获取奖励数据失败', 'error');
    } finally {
      setLoadingRewards(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.rewardType) {
      newErrors.rewardType = '请选择奖励类型';
    }

    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = '请输入贡献描述';
    } else if (formData.description.length > 100) {
      newErrors.description = '贡献描述不能超过 100 字';
    }

    if (!formData.proofUrl || formData.proofUrl.trim() === '') {
      newErrors.proofUrl = '请输入证明材料链接';
    } else if (!/^https?:\/\/.+/.test(formData.proofUrl)) {
      newErrors.proofUrl = '请输入有效的 URL 地址';
    }

    if (!formData.selfScore || formData.selfScore < 0 || formData.selfScore > 100) {
      newErrors.selfScore = '分数必须在 0-100 之间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplyReward = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const data = await SponsorAPI.applyReward({
        contributorName: formData.contributorName || null,
        rewardType: formData.rewardType,
        description: formData.description,
        proofUrl: formData.proofUrl,
        selfScore: parseInt(formData.selfScore),
      });

      if (data.success) {
        showMessage('申请成功!您的奖励申请已提交,等待管理员审核', 'success');
        setShowRewardModal(false);
        setFormData({ contributorName: '', rewardType: '', description: '', proofUrl: '', selfScore: '' });
        setErrors({});
        fetchRewards();
      } else {
        showMessage(data.message || '申请失败', 'error');
      }
    } catch (err) {
      showMessage(err.message || '申请失败,请重试', 'error');
    }
  };

  const copyTemplateToClipboard = () => {
    const template = `## 申请内容

**贡献类型：** 文档贡献/Bug修复/推广贡献/重大贡献

**贡献描述：**

描述你的贡献内容，请使用中文。

**证明材料：**

视情况而定

## 申请分数 - 1~100

**理由：**

- 多行描述

## 个人声明

我声明：

- ✅ 我的产出是我个人产出
- ✅ 我保证贡献内容的真实性和原创性
- ✅ 我同意将此贡献以 MIT 协议贡献给 TabooLib 项目
- ✅ 我理解最终评分由 TabooLib 开发团队根据实际情况评定`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(template)
        .then(() => {
          showMessage('申请格式模板已复制到剪贴板', 'success');
        })
        .catch(() => {
          showMessage('复制失败,请手动复制', 'error');
        });
    } else {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = template;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showMessage('申请格式模板已复制到剪贴板', 'success');
      } catch (err) {
        showMessage('复制失败,请手动复制', 'error');
      }
      document.body.removeChild(textarea);
    }
  };

  const showMessage = (text, type = 'info') => {
    const messageEl = document.createElement('div');
    messageEl.className = `${styles.message} ${styles[type]}`;
    messageEl.textContent = text;
    document.body.appendChild(messageEl);
    setTimeout(() => {
      messageEl.classList.add(styles.show);
    }, 10);
    setTimeout(() => {
      messageEl.classList.remove(styles.show);
      setTimeout(() => document.body.removeChild(messageEl), 300);
    }, 3000);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const getRewardTypeText = (type) => {
    const config = {
      BUG_FIX: '🐛 Bug 修复',
      DOCUMENTATION: '📚 文档贡献',
      PROMOTION: '📢 推广贡献',
      MAJOR_CONTRIBUTION: '🏆 重大贡献',
    };
    return config[type] || type;
  };

  const getRewardTypeClass = (type) => {
    return type ? type.toLowerCase() : '';
  };

  const getStatusText = (status) => {
    const config = {
      PENDING: '⏳ 待审核',
      APPROVED: '✅ 已批准',
      REJECTED: '❌ 已拒绝',
      PAID: '💰 已发放',
    };
    return config[status] || status;
  };

  const getStatusClass = (status) => {
    return status ? status.toLowerCase() : 'pending';
  };

  if (isLoading) {
    return (
      <Layout title="我的奖励申请">
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>正在加载...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout title="我的奖励申请">
        <div className={styles.container}>
          <div className={styles.notAuthenticated}>
            <div className={styles.icon}>🔐</div>
            <h2>需要登录</h2>
            <p>请先登录以查看您的奖励申请</p>
            <button onClick={() => window.location.href = '/console'} className={styles.primaryButton}>
              前往登录
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="我的奖励申请">
      <div className={styles.pageWrapper}>
        <div className={styles.pageContent}>
          {/* 页面标题 */}
          <div className={styles.pageHeader}>
            <div className={styles.headerRow}>
              <h1>🚀 我的奖励申请</h1>
              <div className={styles.buttonGroup}>
                <button onClick={() => window.location.href = '/console'} className={styles.button}>
                  ← 返回控制台
                </button>
                <button onClick={() => setShowRewardModal(true)} className={styles.primaryButton}>
                  ➕ 申请奖励
                </button>
              </div>
            </div>
            <p className={styles.description}>查看您的所有奖励申请和审核状态</p>
          </div>

          {/* 奖励列表 */}
          {myRewards.length === 0 && !loadingRewards ? (
            <div className={styles.card}>
              <div className={styles.empty}>
                <p className={styles.emptyTitle}>暂无奖励申请</p>
                <p className={styles.emptySubtitle}>您还没有提交过奖励申请</p>
                <button onClick={() => setShowRewardModal(true)} className={styles.primaryButton}>
                  提交第一笔申请
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.card}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{width: '150px'}}>贡献者</th>
                      <th style={{width: '150px', textAlign: 'center'}}>奖励类型</th>
                      <th>贡献描述</th>
                      <th style={{width: '100px', textAlign: 'center'}}>自评分</th>
                      <th style={{width: '100px', textAlign: 'center'}}>终评分</th>
                      <th style={{width: '120px', textAlign: 'right'}}>奖励金额</th>
                      <th style={{width: '120px', textAlign: 'center'}}>状态</th>
                      <th style={{width: '120px', textAlign: 'center'}}>证明材料</th>
                      <th style={{width: '100px', textAlign: 'right'}}>管理员备注</th>
                      <th style={{width: '150px', textAlign: 'right'}}>申请时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRewards ? (
                      <tr>
                        <td colSpan="10" style={{textAlign: 'center', padding: '2rem'}}>
                          <div className={styles.spinner}></div>
                        </td>
                      </tr>
                    ) : (
                      myRewards.map(record => (
                        <tr key={record.id}>
                          <td><strong>{record.contributorName}</strong></td>
                          <td style={{textAlign: 'center'}}>
                            <span className={`${styles.rewardTypeTag} ${styles[getRewardTypeClass(record.rewardType)]}`}>
                              {getRewardTypeText(record.rewardType)}
                            </span>
                          </td>
                          <td>{record.description}</td>
                          <td style={{textAlign: 'center'}}>
                            <strong>{record.selfScore}</strong>
                          </td>
                          <td style={{textAlign: 'center'}}>
                            {record.finalScore ? (
                              <strong className={styles.finalScore}>{record.finalScore}</strong>
                            ) : (
                              <span className={styles.muted}>-</span>
                            )}
                          </td>
                          <td style={{textAlign: 'right'}}>
                            {record.amount ? (
                              <strong className={styles.amount}>¥{Number(record.amount).toFixed(2)}</strong>
                            ) : (
                              <span className={styles.muted}>-</span>
                            )}
                          </td>
                          <td style={{textAlign: 'center'}}>
                            <span className={`${styles.statusTag} ${styles[getStatusClass(record.status)]}`}>
                              {getStatusText(record.status)}
                            </span>
                          </td>
                          <td style={{textAlign: 'center'}}>
                            {record.proofUrl ? (
                              <button onClick={() => setViewingProof(record)} className={styles.linkButton}>
                                📄 查看详情
                              </button>
                            ) : (
                              <span className={styles.muted}>-</span>
                            )}
                          </td>
                          <td style={{textAlign: 'right'}}>
                            {record.remark || <span className={styles.muted}>-</span>}
                          </td>
                          <td style={{textAlign: 'right'}}>
                            <div>{formatDate(record.applyTime)}</div>
                            <div className={styles.time}>{formatTime(record.applyTime)}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 申请奖励模态框 */}
      {showRewardModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRewardModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>🚀 申请奖励</h2>
              <button onClick={() => setShowRewardModal(false)} className={styles.closeButton}>×</button>
            </div>
            <div className={styles.alert}>
              ℹ️ 请如实填写您的贡献信息,管理员会根据实际情况评定奖励金额
              <br />
              <br />
              📅 <strong>审核流程说明：</strong>
              <br />
              1. 提交申请后等待管理员审核
              <br />
              2. 审核通过后进入 <strong>3 天公示期</strong>
              <br />
              3. 公示期结束后管理员将发放奖励
            </div>
            <form onSubmit={handleApplyReward} className={styles.form}>
              <div className={styles.formGroup}>
                <label>贡献者名称</label>
                <input
                  type="text"
                  value={formData.contributorName}
                  onChange={(e) => setFormData({...formData, contributorName: e.target.value})}
                  placeholder="请输入贡献者名称"
                />
                <div className={styles.hint}>留空则使用账号昵称</div>
              </div>

              <div className={styles.formGroup}>
                <label>奖励类型 *</label>
                <select
                  value={formData.rewardType}
                  onChange={(e) => setFormData({...formData, rewardType: e.target.value})}
                  className={errors.rewardType ? styles.error : ''}
                >
                  <option value="">请选择奖励类型</option>
                  <option value="BUG_FIX">🐛 Bug 修复</option>
                  <option value="DOCUMENTATION">📚 文档贡献</option>
                  <option value="PROMOTION">📢 推广贡献</option>
                  <option value="MAJOR_CONTRIBUTION">🏆 重大贡献</option>
                </select>
                {errors.rewardType && <div className={styles.errorText}>{errors.rewardType}</div>}
              </div>

              <div className={styles.formGroup}>
                <label>贡献描述 *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="用于展示在列表里的内容"
                  maxLength={100}
                  rows={5}
                  className={errors.description ? styles.error : ''}
                />
                <div className={styles.hint}>
                  {formData.description.length}/100 字
                </div>
                {errors.description && <div className={styles.errorText}>{errors.description}</div>}
              </div>

              <div className={styles.formGroup}>
                <label>证明材料 *</label>
                <div className={styles.hint} style={{marginBottom: '0.5rem'}}>
                  请先在 <a href="https://github.com/FxRayHughes/taboowiki/discussions/new?category=%E8%B4%A1%E7%8C%AE%E7%94%B3%E8%AF%B7" target="_blank" rel="noopener noreferrer">GitHub Discussions</a> 创建贡献申请,然后填写讨论链接
                  <br />
                  (例如: https://github.com/FxRayHughes/taboowiki/discussions/2)
                </div>
                <button type="button" onClick={copyTemplateToClipboard} className={styles.copyButton}>
                  📋 复制申请格式模板
                </button>
                <input
                  type="url"
                  value={formData.proofUrl}
                  onChange={(e) => setFormData({...formData, proofUrl: e.target.value})}
                  placeholder="https://github.com/FxRayHughes/taboowiki/discussions/2"
                  className={errors.proofUrl ? styles.error : ''}
                  style={{marginTop: '0.5rem'}}
                />
                {errors.proofUrl && <div className={styles.errorText}>{errors.proofUrl}</div>}
              </div>

              <div className={styles.formGroup}>
                <label>自评分 *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.selfScore}
                  onChange={(e) => setFormData({...formData, selfScore: e.target.value})}
                  placeholder="请输入自评分"
                  className={errors.selfScore ? styles.error : ''}
                />
                <div className={styles.hint}>请根据贡献价值自评分数 (0-100)</div>
                {errors.selfScore && <div className={styles.errorText}>{errors.selfScore}</div>}
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowRewardModal(false)} className={styles.button}>
                  取消
                </button>
                <button type="submit" className={styles.primaryButton}>
                  提交申请
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 查看证明材料模态框 */}
      {viewingProof && (
        <div className={styles.modalOverlay} onClick={() => setViewingProof(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>📄 证明材料详情</h2>
              <button onClick={() => setViewingProof(null)} className={styles.closeButton}>×</button>
            </div>
            <div className={styles.proofDetails}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>贡献者</div>
                <div className={styles.detailValue}>{viewingProof.contributorName}</div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>奖励类型</div>
                <div>
                  <span className={`${styles.rewardTypeTag} ${styles[getRewardTypeClass(viewingProof.rewardType)]}`}>
                    {getRewardTypeText(viewingProof.rewardType)}
                  </span>
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>贡献描述</div>
                <div className={styles.descriptionBox}>{viewingProof.description}</div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>证明材料</div>
                <div>
                  <a href={viewingProof.proofUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                    {viewingProof.proofUrl}
                  </a>
                </div>
              </div>

              <div className={styles.scoreRow}>
                <div className={styles.scoreItem}>
                  <div className={styles.detailLabel}>自评分</div>
                  <div className={styles.scoreValue}>{viewingProof.selfScore}<span className={styles.scoreSuffix}> / 100</span></div>
                </div>
                {viewingProof.finalScore && (
                  <div className={styles.scoreItem}>
                    <div className={styles.detailLabel}>终评分</div>
                    <div className={`${styles.scoreValue} ${styles.finalScore}`}>{viewingProof.finalScore}<span className={styles.scoreSuffix}> / 100</span></div>
                  </div>
                )}
                {viewingProof.amount && (
                  <div className={styles.scoreItem}>
                    <div className={styles.detailLabel}>奖励金额</div>
                    <div className={`${styles.scoreValue} ${styles.amount}`}>¥{Number(viewingProof.amount).toFixed(2)}</div>
                  </div>
                )}
              </div>

              {viewingProof.remark && (
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>管理员备注</div>
                  <div className={styles.alert}>{viewingProof.remark}</div>
                </div>
              )}

              <div className={styles.timeInfo}>
                <span>申请时间: {formatDate(viewingProof.applyTime)} {formatTime(viewingProof.applyTime)}</span>
                {viewingProof.approveTime && (
                  <span>审核时间: {formatDate(viewingProof.approveTime)} {formatTime(viewingProof.approveTime)}</span>
                )}
                {viewingProof.rewardTime && (
                  <span>发放时间: {formatDate(viewingProof.rewardTime)} {formatTime(viewingProof.rewardTime)}</span>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setViewingProof(null)} className={styles.button}>
                关闭
              </button>
              <button onClick={() => window.open(viewingProof.proofUrl, '_blank')} className={styles.primaryButton}>
                在新窗口打开
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
