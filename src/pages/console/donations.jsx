import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { TokenManager } from '@site/src/components/AuthGuard/TokenManager';
import { SponsorAPI } from '@site/src/utils/api';
import styles from './donations.module.css';

export default function MyDonations() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [myDonations, setMyDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [editingDonation, setEditingDonation] = useState(null);
  const [formData, setFormData] = useState({
    donorName: '',
    amount: '',
    message: '',
    paymentProof: '',
    contactInfo: ''
  });
  const [editMessage, setEditMessage] = useState('');
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
        fetchDonations();
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

  const fetchDonations = async () => {
    setLoadingDonations(true);
    try {
      const data = await SponsorAPI.getMyDonations();
      if (data.success) {
        setMyDonations(data.data || []);
      }
    } catch (error) {
      console.error('获取赞助数据失败:', error);
      showMessage('获取赞助数据失败', 'error');
    } finally {
      setLoadingDonations(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = '请输入有效的赞助金额';
    }

    if (!formData.paymentProof || formData.paymentProof.trim() === '') {
      newErrors.paymentProof = '请输入支付凭证';
    }

    if (formData.message && formData.message.length > 200) {
      newErrors.message = '留言不能超过 200 字';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitDonation = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const data = await SponsorAPI.submitDonation({
        donorName: formData.donorName || null,
        amount: parseFloat(formData.amount),
        message: formData.message || null,
        paymentProof: formData.paymentProof,
        contactInfo: formData.contactInfo || null,
        donationTime: Date.now()
      });

      if (data.success) {
        showMessage('提交成功!您的赞助记录已提交,等待管理员审核', 'success');
        setShowDonationModal(false);
        setFormData({ donorName: '', amount: '', message: '', paymentProof: '', contactInfo: '' });
        setErrors({});
        fetchDonations();
      } else {
        showMessage(data.message || '提交失败', 'error');
      }
    } catch (err) {
      showMessage(err.message || '提交失败,请重试', 'error');
    }
  };

  const handleEditMessage = async (e) => {
    e.preventDefault();

    if (editMessage.length > 200) {
      showMessage('留言不能超过 200 字', 'error');
      return;
    }

    try {
      const data = await SponsorAPI.editDonationMessage(editingDonation.id, editMessage);

      if (data.success) {
        showMessage('更新成功!您的留言已更新,编辑权限已用完', 'success');
        setEditingDonation(null);
        setEditMessage('');
        fetchDonations();
      } else {
        showMessage(data.message || '更新失败', 'error');
      }
    } catch (err) {
      showMessage(err.message || '更新失败,请重试', 'error');
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

  const getStatusText = (status) => {
    const config = {
      PENDING: '⏳ 待审核',
      APPROVED: '✅ 已通过',
      REJECTED: '❌ 已拒绝',
    };
    return config[status] || status;
  };

  const getStatusClass = (status) => {
    return status ? status.toLowerCase() : 'pending';
  };

  if (isLoading) {
    return (
      <Layout title="我的赞助记录">
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
      <Layout title="我的赞助记录">
        <div className={styles.container}>
          <div className={styles.notAuthenticated}>
            <div className={styles.icon}>🔐</div>
            <h2>需要登录</h2>
            <p>请先登录以查看您的赞助记录</p>
            <button onClick={() => window.location.href = '/console'} className={styles.primaryButton}>
              前往登录
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="我的赞助记录">
      <div className={styles.pageWrapper}>
        <div className={styles.pageContent}>
          {/* 页面标题 */}
          <div className={styles.pageHeader}>
            <div className={styles.headerRow}>
              <h1>💰 我的赞助记录</h1>
              <div className={styles.buttonGroup}>
                <button onClick={() => window.location.href = '/console'} className={styles.button}>
                  ← 返回控制台
                </button>
                <button onClick={() => setShowDonationModal(true)} className={styles.primaryButton}>
                  ➕ 提交赞助
                </button>
              </div>
            </div>
            <p className={styles.description}>查看您的所有赞助记录和审核状态</p>
          </div>

          {/* 赞助列表 */}
          {myDonations.length === 0 && !loadingDonations ? (
            <div className={styles.card}>
              <div className={styles.empty}>
                <p className={styles.emptyTitle}>暂无赞助记录</p>
                <p className={styles.emptySubtitle}>您还没有提交过赞助记录</p>
                <button onClick={() => setShowDonationModal(true)} className={styles.primaryButton}>
                  提交第一笔赞助
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.card}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{width: '150px'}}>赞助者</th>
                      <th style={{width: '120px', textAlign: 'right'}}>金额</th>
                      <th>留言</th>
                      <th style={{width: '120px', textAlign: 'center'}}>状态</th>
                      <th style={{width: '120px', textAlign: 'center'}}>支付凭证</th>
                      <th style={{width: '100px', textAlign: 'right'}}>管理员备注</th>
                      <th style={{width: '150px', textAlign: 'right'}}>赞助时间</th>
                      <th style={{width: '120px', textAlign: 'right'}}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingDonations ? (
                      <tr>
                        <td colSpan="8" style={{textAlign: 'center', padding: '2rem'}}>
                          <div className={styles.spinner}></div>
                        </td>
                      </tr>
                    ) : (
                      myDonations.map(record => (
                        <tr key={record.id}>
                          <td>
                            <div className={styles.donorCell}>
                              <strong>{record.donorName}</strong>
                              {record.isHighlighted && <span className={styles.highlight}>🌟</span>}
                              {record.contactInfo && (
                                <div className={styles.contact}>📞 {record.contactInfo}</div>
                              )}
                            </div>
                          </td>
                          <td style={{textAlign: 'right'}}>
                            <strong className={styles.amount}>¥{Number(record.amount).toFixed(2)}</strong>
                          </td>
                          <td>
                            {record.message ? (
                              <div>
                                <div className={styles.message}>"{record.message}"</div>
                                {record.messageEditedAt && (
                                  <div className={styles.editedTag}>
                                    已编辑于 {formatDate(record.messageEditedAt)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className={styles.muted}>无留言</span>
                            )}
                          </td>
                          <td style={{textAlign: 'center'}}>
                            <span className={`${styles.statusTag} ${styles[getStatusClass(record.status)]}`}>
                              {getStatusText(record.status)}
                            </span>
                          </td>
                          <td style={{textAlign: 'center'}}>
                            {record.paymentProof ? (
                              record.paymentProof.startsWith('http') ? (
                                <a href={record.paymentProof} target="_blank" rel="noopener noreferrer" className={styles.link}>
                                  🔗 查看
                                </a>
                              ) : (
                                <span className={styles.muted}>{record.paymentProof}</span>
                              )
                            ) : (
                              <span className={styles.muted}>-</span>
                            )}
                          </td>
                          <td style={{textAlign: 'right'}}>
                            {record.remark || <span className={styles.muted}>-</span>}
                          </td>
                          <td style={{textAlign: 'right'}}>
                            <div>{formatDate(record.donationTime)}</div>
                            <div className={styles.time}>{formatTime(record.donationTime)}</div>
                          </td>
                          <td style={{textAlign: 'right'}}>
                            {record.status === 'PENDING' ? (
                              <button
                                onClick={() => {
                                  setEditingDonation(record);
                                  setEditMessage(record.message || '');
                                }}
                                className={styles.primaryButton}
                              >
                                ✏️ 编辑留言
                              </button>
                            ) : (
                              <span className={styles.muted}>🔒 已锁定</span>
                            )}
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

      {/* 提交赞助模态框 */}
      {showDonationModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDonationModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>💰 提交赞助记录</h2>
              <button onClick={() => setShowDonationModal(false)} className={styles.closeButton}>×</button>
            </div>
            <form onSubmit={handleSubmitDonation} className={styles.form}>
              <div className={styles.formGroup}>
                <label>显示名称</label>
                <input
                  type="text"
                  value={formData.donorName}
                  onChange={(e) => setFormData({...formData, donorName: e.target.value})}
                  placeholder="请输入显示名称"
                />
                <div className={styles.hint}>留空则使用账号昵称</div>
              </div>

              <div className={styles.formGroup}>
                <label>赞助金额 *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="请输入金额（元）"
                  className={errors.amount ? styles.error : ''}
                />
                {errors.amount && <div className={styles.errorText}>{errors.amount}</div>}
              </div>

              <div className={styles.formGroup}>
                <label>留言</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="写下您的留言..."
                  maxLength={200}
                  rows={3}
                  className={errors.message ? styles.error : ''}
                />
                <div className={styles.hint}>
                  {formData.message.length}/200 字
                </div>
                {errors.message && <div className={styles.errorText}>{errors.message}</div>}
              </div>

              <div className={styles.formGroup}>
                <label>支付凭证 *</label>
                <input
                  type="text"
                  value={formData.paymentProof}
                  onChange={(e) => setFormData({...formData, paymentProof: e.target.value})}
                  placeholder="支付截图链接或订单号"
                  className={errors.paymentProof ? styles.error : ''}
                />
                {errors.paymentProof && <div className={styles.errorText}>{errors.paymentProof}</div>}
              </div>

              <div className={styles.formGroup}>
                <label>联系方式</label>
                <input
                  type="text"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
                  placeholder="请输入联系方式"
                />
                <div className={styles.hint}>QQ、微信等</div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowDonationModal(false)} className={styles.button}>
                  取消
                </button>
                <button type="submit" className={styles.primaryButton}>
                  提交
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 编辑留言模态框 */}
      {editingDonation && (
        <div className={styles.modalOverlay} onClick={() => setEditingDonation(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>📝 编辑留言</h2>
              <button onClick={() => setEditingDonation(null)} className={styles.closeButton}>×</button>
            </div>
            <div className={styles.alert}>
              ⚠️ 您只有一次编辑留言的机会,编辑后将无法再次修改
            </div>
            <form onSubmit={handleEditMessage} className={styles.form}>
              <div className={styles.formGroup}>
                <label>留言内容</label>
                <textarea
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  placeholder="写下您的留言..."
                  maxLength={200}
                  rows={5}
                />
                <div className={styles.hint}>{editMessage.length}/200 字</div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setEditingDonation(null)} className={styles.button}>
                  取消
                </button>
                <button type="submit" className={styles.primaryButton}>
                  确认修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
