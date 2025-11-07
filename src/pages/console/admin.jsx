import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { TokenManager } from '@site/src/components/AuthGuard/TokenManager';
import { SponsorAPI } from '@site/src/utils/api';
import { AntdThemeProvider } from '@site/src/components/AntdThemeProvider';
import DonationsReview from '@site/src/components/AdminPanel/DonationsReview';
import RewardsReview from '@site/src/components/AdminPanel/RewardsReview';
import ReviewModal from '@site/src/components/AdminPanel/ReviewModal';
import { showMessage } from '@site/src/components/AdminPanel/utils';
import styles from './admin.module.css';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('donations');

  // 赞助相关状态
  const [donations, setDonations] = useState([]);
  const [donationsPage, setDonationsPage] = useState(1);
  const [donationsTotalPages, setDonationsTotalPages] = useState(1);
  const [donationsStatus, setDonationsStatus] = useState('PENDING');
  const [loadingDonations, setLoadingDonations] = useState(false);

  // 奖励相关状态
  const [rewards, setRewards] = useState([]);
  const [rewardsPage, setRewardsPage] = useState(1);
  const [rewardsTotalPages, setRewardsTotalPages] = useState(1);
  const [rewardsStatus, setRewardsStatus] = useState('PENDING');
  const [rewardsType, setRewardsType] = useState('');
  const [loadingRewards, setLoadingRewards] = useState(false);

  // 审批操作相关状态
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);
  const [reviewRemark, setReviewRemark] = useState('');
  const [reviewAmount, setReviewAmount] = useState('');
  const [reviewScore, setReviewScore] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'donations') {
        fetchDonations();
      } else if (activeTab === 'rewards') {
        fetchRewards();
      }
    }
  }, [activeTab, donationsPage, donationsStatus, rewardsPage, rewardsStatus, rewardsType, isAdmin]);

  const checkAuthAndLoadData = async () => {
    if (!ExecutionEnvironment.canUseDOM) return;

    try {
      const hasToken = TokenManager.hasToken();
      if (!hasToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const currentUser = await TokenManager.getCurrentUser();
      if (currentUser && currentUser.isAdmin) {
        setIsAuthenticated(true);
        setIsAdmin(true);
      } else {
        setIsAuthenticated(!!currentUser);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('认证检查失败:', error);
      setIsAuthenticated(false);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDonations = async () => {
    setLoadingDonations(true);
    try {
      const data = await SponsorAPI.adminGetAllDonations(donationsStatus, donationsPage, 20);
      if (data.success) {
        setDonations(data.data.items || []);
        setDonationsTotalPages(data.data.totalPages || 1);
      } else {
        showMessage('获取赞助记录失败: ' + data.message, 'error');
      }
    } catch (error) {
      console.error('获取赞助记录失败:', error);
      showMessage('获取赞助记录失败', 'error');
    } finally {
      setLoadingDonations(false);
    }
  };

  const fetchRewards = async () => {
    setLoadingRewards(true);
    try {
      const data = await SponsorAPI.adminGetAllRewards(rewardsStatus, rewardsType, rewardsPage, 20);
      if (data.success) {
        setRewards(data.data.items || []);
        setRewardsTotalPages(data.data.totalPages || 1);
      } else {
        showMessage('获取奖励记录失败: ' + data.message, 'error');
      }
    } catch (error) {
      console.error('获取奖励记录失败:', error);
      showMessage('获取奖励记录失败', 'error');
    } finally {
      setLoadingRewards(false);
    }
  };

  const openReviewModal = (item, action, type) => {
    setReviewingItem({ ...item, type });
    setReviewAction(action);
    setReviewRemark('');
    setReviewAmount(type === 'reward' && action === 'approve' ? '' : '');
    setReviewScore(type === 'reward' && action === 'approve' ? item.selfScore || '' : '');
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewingItem(null);
    setReviewAction(null);
    setReviewRemark('');
    setReviewAmount('');
    setReviewScore('');
  };

  const handleReview = async () => {
    if (!reviewingItem || !reviewAction) return;

    setProcessing(true);
    try {
      let result;
      const type = reviewingItem.type;

      if (type === 'donation') {
        if (reviewAction === 'approve') {
          result = await SponsorAPI.adminApproveDonation(reviewingItem.id, reviewRemark);
        } else if (reviewAction === 'reject') {
          result = await SponsorAPI.adminRejectDonation(reviewingItem.id, reviewRemark);
        }
      } else if (type === 'reward') {
        if (reviewAction === 'approve') {
          const amount = parseFloat(reviewAmount);
          const score = reviewScore ? parseInt(reviewScore) : null;

          if (!amount || amount <= 0) {
            showMessage('请输入有效的奖励金额', 'error');
            setProcessing(false);
            return;
          }

          result = await SponsorAPI.adminApproveReward(reviewingItem.id, amount, score, reviewRemark);
        } else if (reviewAction === 'reject') {
          result = await SponsorAPI.adminRejectReward(reviewingItem.id, reviewRemark);
        } else if (reviewAction === 'pay') {
          result = await SponsorAPI.adminMarkRewardAsPaid(reviewingItem.id, new Date().toISOString(), reviewRemark);
        }
      }

      if (result && result.success) {
        showMessage(result.message || '操作成功', 'success');
        closeReviewModal();
        // 刷新列表
        if (type === 'donation') {
          fetchDonations();
        } else {
          fetchRewards();
        }
      } else {
        showMessage(result?.message || '操作失败', 'error');
      }
    } catch (error) {
      console.error('审批操作失败:', error);
      showMessage('操作失败: ' + error.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Layout title="管理员控制台" description="赞助与奖励审批管理">
        <AntdThemeProvider>
          <div className={styles.container}>
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>加载中...</p>
            </div>
          </div>
        </AntdThemeProvider>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout title="管理员控制台" description="赞助与奖励审批管理">
        <AntdThemeProvider>
          <div className={styles.container}>
            <div className={styles.authPrompt}>
              <h2>需要登录</h2>
              <p>请先登录后访问管理员控制台</p>
              <button
                className={styles.btnPrimary}
                onClick={() => window.location.href = '/console'}
              >
                前往登录
              </button>
            </div>
          </div>
        </AntdThemeProvider>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout title="管理员控制台" description="赞助与奖励审批管理">
        <AntdThemeProvider>
          <div className={styles.container}>
            <div className={styles.authPrompt}>
              <h2>权限不足</h2>
              <p>此页面仅限管理员访问</p>
              <button
                className={styles.btnPrimary}
                onClick={() => window.location.href = '/console'}
              >
                返回控制台
              </button>
            </div>
          </div>
        </AntdThemeProvider>
      </Layout>
    );
  }

  return (
    <Layout title="管理员控制台" description="赞助与奖励审批管理">
      <AntdThemeProvider>
        <div className={styles.container}>
        <div className={styles.header}>
          <h1>管理员控制台</h1>
          <p className={styles.subtitle}>赞助与奖励审批管理</p>
        </div>

        {/* 标签页切换 */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'donations' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('donations')}
          >
            赞助审批
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'rewards' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('rewards')}
          >
            奖励审批
          </button>
        </div>

        {/* 赞助审批页面 */}
        {activeTab === 'donations' && (
          <DonationsReview
            donations={donations}
            loading={loadingDonations}
            statusFilter={donationsStatus}
            currentPage={donationsPage}
            totalPages={donationsTotalPages}
            onStatusChange={(status) => {
              setDonationsStatus(status);
              setDonationsPage(1);
            }}
            onPageChange={setDonationsPage}
            onApprove={(donation) => openReviewModal(donation, 'approve', 'donation')}
            onReject={(donation) => openReviewModal(donation, 'reject', 'donation')}
          />
        )}

        {/* 奖励审批页面 */}
        {activeTab === 'rewards' && (
          <RewardsReview
            rewards={rewards}
            loading={loadingRewards}
            statusFilter={rewardsStatus}
            typeFilter={rewardsType}
            currentPage={rewardsPage}
            totalPages={rewardsTotalPages}
            onStatusChange={(status) => {
              setRewardsStatus(status);
              setRewardsPage(1);
            }}
            onTypeChange={(type) => {
              setRewardsType(type);
              setRewardsPage(1);
            }}
            onPageChange={setRewardsPage}
            onApprove={(reward) => openReviewModal(reward, 'approve', 'reward')}
            onReject={(reward) => openReviewModal(reward, 'reject', 'reward')}
            onMarkPaid={(reward) => openReviewModal(reward, 'pay', 'reward')}
          />
        )}

        {/* 审批弹窗 */}
        <ReviewModal
          show={showReviewModal}
          item={reviewingItem}
          action={reviewAction}
          remark={reviewRemark}
          amount={reviewAmount}
          score={reviewScore}
          processing={processing}
          onRemarkChange={setReviewRemark}
          onAmountChange={setReviewAmount}
          onScoreChange={setReviewScore}
          onConfirm={handleReview}
          onClose={closeReviewModal}
        />
      </div>
      </AntdThemeProvider>
    </Layout>
  );
}
