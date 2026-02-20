import React, { useState, useEffect } from 'react';
import styles from './SponsorList.module.css';
import { SponsorAPI } from '@site/src/utils/api';

const GITHUB_TOKEN = atob('Z2l0aHViX3BhdF8xMUFHQUdOVFEwZHJSR0JUek9WSXJ1X1dESE1VNWpKazJrWkZNb0lYZ0dYTXo0NjNscDJGUUtxOTRKSUR3RGRoNVFRTVRCRklOWndRcEkyWGI3');

const SponsorList = () => {
  const [donations, setDonations] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Discussion 弹窗相关
  const [discussionModal, setDiscussionModal] = useState({
    visible: false, loading: false, discussion: null, error: null, rawValue: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [donationsData, rewardsData, statsData] = await Promise.all([
        SponsorAPI.getPublicDonations(1, 100),
        SponsorAPI.getPublicRewards(1, 100),
        SponsorAPI.getStatistics()
      ]);
      if (donationsData.success) setDonations(donationsData.data.items || []);
      if (rewardsData.success) setRewards(rewardsData.data.items || []);
      if (statsData.success) setStatistics(statsData.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch sponsor data:', err);
      setError('加载赞助数据失败,请稍后重试');
      setLoading(false);
    }
  };

  // 解析 Discussion 引用：支持 URL 或纯数字编号
  const parseDiscussionRef = (value) => {
    if (!value) return null;
    const urlMatch = value.match(/github\.com\/([^/]+)\/([^/]+)\/discussions\/(\d+)/);
    if (urlMatch) {
      return { owner: urlMatch[1], repo: urlMatch[2], number: parseInt(urlMatch[3], 10) };
    }
    const numMatch = value.trim().match(/^(\d+)$/);
    if (numMatch) {
      return { owner: 'TabooLib', repo: 'taboolib', number: parseInt(numMatch[1], 10) };
    }
    return null;
  };

  // 通过 GitHub GraphQL API 获取 Discussion 内容
  const fetchDiscussionContent = async (proofValue, token) => {
    const ref = parseDiscussionRef(proofValue);
    if (!ref) return { error: '无法解析证明链接，请确认格式为 GitHub Discussion 链接或编号' };
    const query = `
      query GetDiscussion($owner: String!, $name: String!, $number: Int!) {
        repository(owner: $owner, name: $name) {
          discussion(number: $number) {
            title bodyHTML createdAt url
            author { login avatarUrl }
          }
        }
      }
    `;
    try {
      const resp = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `bearer ${token}` },
        body: JSON.stringify({ query, variables: { owner: ref.owner, name: ref.repo, number: ref.number } }),
      });
      const data = await resp.json();
      if (data.errors) return { error: data.errors[0]?.message || 'GraphQL 查询失败' };
      const discussion = data.data?.repository?.discussion;
      if (!discussion) return { error: `未找到 Discussion #${ref.number}` };
      return { discussion };
    } catch (err) {
      return { error: `网络请求失败: ${err.message}` };
    }
  };

  const openDiscussionModal = async (proofValue) => {
    setDiscussionModal({ visible: true, loading: true, discussion: null, error: null, rawValue: proofValue });
    const result = await fetchDiscussionContent(proofValue, GITHUB_TOKEN);
    if (result.error) {
      setDiscussionModal(prev => ({ ...prev, loading: false, error: result.error }));
    } else {
      setDiscussionModal(prev => ({ ...prev, loading: false, discussion: result.discussion }));
    }
  };

  const closeDiscussionModal = () => {
    setDiscussionModal({ visible: false, loading: false, discussion: null, error: null, rawValue: null });
  };

  // 格式化金额
  const formatAmount = (amount) => `¥${Number(amount).toFixed(2)}`;

  // 格式化时间
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (loading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  return (
    <div className={styles.sponsorContainer}>
      {error && <div className={styles.error}>{error}</div>}

      {/* 统计信息 */}
      {statistics && (
        <div className={styles.statistics}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💵</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{formatAmount(statistics.totalDonations)}</div>
              <div className={styles.statLabel}>现金支持总额</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎁</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{formatAmount(statistics.totalRewards)}</div>
              <div className={styles.statLabel}>已发放奖励</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{formatAmount(statistics.balance)}</div>
              <div className={styles.statLabel}>当前奖池余额</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{statistics.rewardCount}</div>
              <div className={styles.statLabel}>推动支持条目</div>
            </div>
          </div>
        </div>
      )}

      {/* 现金支持列表 */}
      {donations.length > 0 && (
        <div className={styles.sponsorSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>💰</span>
            <h3 className={styles.sectionTitle}>现金支持</h3>
          </div>
          <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
              <div className={styles.headerCell} style={{ flex: 1 }}>赞助者</div>
              <div className={styles.headerCell} style={{ flex: 2 }}>留言</div>
              <div className={styles.headerCell} style={{ width: '150px', textAlign: 'right' }}>赞助金额</div>
              <div className={styles.headerCell} style={{ width: '150px', textAlign: 'right' }}>赞助时间</div>
            </div>
            <div className={styles.tableBody}>
              {donations.map((donation) => (
                <div
                  key={donation.id}
                  className={`${styles.tableRow} ${donation.isHighlighted ? styles.highlighted : ''}`}
                >
                  <div className={styles.nameCell} style={{ flex: 1 }} data-label="赞助者">
                    {donation.donorName}
                  </div>
                  <div className={styles.messageCell} style={{ flex: 2 }} data-label="留言">
                    {donation.message || '感谢支持！'}
                  </div>
                  <div className={styles.amountCell} style={{ width: '150px', textAlign: 'right' }} data-label="赞助金额">
                    {formatAmount(donation.amount)}
                  </div>
                  <div className={styles.dateCell} style={{ width: '150px', textAlign: 'right' }} data-label="赞助时间">
                    {formatDate(donation.donationTime)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 推动支持列表 */}
      {rewards.length > 0 && (
        <div className={styles.sponsorSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>🚀</span>
            <h3 className={styles.sectionTitle}>推动支持</h3>
          </div>
          <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
              <div className={styles.headerCell} style={{ flex: 1 }}>贡献者</div>
              <div className={styles.headerCell} style={{ flex: 2 }}>贡献内容</div>
              <div className={styles.headerCell} style={{ width: '150px', textAlign: 'right' }}>奖励金额</div>
              <div className={styles.headerCell} style={{ width: '150px', textAlign: 'right' }}>发放时间</div>
            </div>
            <div className={styles.tableBody}>
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className={`${styles.tableRow} ${reward.proofUrl ? styles.tableRowClickable : ''}`}
                  onClick={() => reward.proofUrl && openDiscussionModal(reward.proofUrl)}
                >
                  <div className={styles.nameCell} style={{ flex: 1 }} data-label="贡献者">
                    {reward.contributorName}
                  </div>
                  <div className={styles.descriptionCell} style={{ flex: 2 }} data-label="贡献内容">
                    {reward.description}
                    {reward.proofUrl && (
                      <span className={styles.proofBadge}>🔗 查看详情</span>
                    )}
                  </div>
                  <div className={styles.amountCell} style={{ width: '150px', textAlign: 'right' }} data-label="奖励金额">
                    {formatAmount(reward.amount)}
                  </div>
                  <div className={styles.dateCell} style={{ width: '150px', textAlign: 'right' }} data-label="发放时间">
                    {formatDate(reward.rewardTime)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 无数据提示 */}
      {!loading && donations.length === 0 && rewards.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ifm-color-emphasis-600)' }}>
          暂无赞助记录
        </div>
      )}

      {/* Discussion 详情弹窗 */}
      {discussionModal.visible && (
        <div className={styles.modalOverlay} onClick={closeDiscussionModal}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            {/* 弹窗头部 */}
            <div className={styles.modalHeader}>
              <div>
                {discussionModal.discussion ? (
                  <>
                    <div className={styles.modalTitle}>{discussionModal.discussion.title}</div>
                    <div className={styles.modalMeta}>
                      {discussionModal.discussion.author?.avatarUrl && (
                        <img
                          src={discussionModal.discussion.author.avatarUrl}
                          alt=""
                          className={styles.modalAvatar}
                        />
                      )}
                      <span>{discussionModal.discussion.author?.login}</span>
                      <span>·</span>
                      <span>{new Date(discussionModal.discussion.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </>
                ) : (
                  <div className={styles.modalTitle}>贡献申请详情</div>
                )}
              </div>
              <button className={styles.modalClose} onClick={closeDiscussionModal}>×</button>
            </div>

            {/* 弹窗内容 */}
            <div className={styles.modalBody}>
              {discussionModal.loading && (
                <div className={styles.modalLoading}>正在加载 Discussion 内容...</div>
              )}

              {!discussionModal.loading && discussionModal.error && (
                <div className={styles.modalError}>{discussionModal.error}</div>
              )}

              {!discussionModal.loading && discussionModal.discussion && (
                <div
                  className={styles.discussionBody}
                  dangerouslySetInnerHTML={{ __html: discussionModal.discussion.bodyHTML }}
                />
              )}
            </div>

            {/* 弹窗底部 */}
            <div className={styles.modalFooter}>
              {discussionModal.discussion && (
                <a
                  href={discussionModal.discussion.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                >
                  🔗 在 GitHub 中查看
                </a>
              )}
              <button className={`${styles.modalBtn} ${styles.modalBtnDefault}`} onClick={closeDiscussionModal}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SponsorList;
