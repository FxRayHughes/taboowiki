import React, { useState, useEffect } from 'react';
import styles from './SponsorList.module.css';
import { SponsorAPI } from '@site/src/utils/api';

const SponsorList = () => {
  const [donations, setDonations] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取赞助数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 并行请求三个接口
        const [donationsData, rewardsData, statsData] = await Promise.all([
          SponsorAPI.getPublicDonations(1, 100),
          SponsorAPI.getPublicRewards(1, 100),
          SponsorAPI.getStatistics()
        ]);

        if (donationsData.success) {
          setDonations(donationsData.data.items || []);
        }

        if (rewardsData.success) {
          setRewards(rewardsData.data.items || []);
        }

        if (statsData.success) {
          setStatistics(statsData.data);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch sponsor data:', err);
        setError('加载赞助数据失败,请稍后重试');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 格式化金额
  const formatAmount = (amount) => {
    return `¥${Number(amount).toFixed(2)}`;
  };

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
              <div className={styles.statValue}>
                {formatAmount(statistics.totalDonations)}
              </div>
              <div className={styles.statLabel}>现金支持总额</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎁</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {formatAmount(statistics.totalRewards)}
              </div>
              <div className={styles.statLabel}>已发放奖励</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                {formatAmount(statistics.balance)}
              </div>
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
                <div key={reward.id} className={styles.tableRow}>
                  <div className={styles.nameCell} style={{ flex: 1 }} data-label="贡献者">
                    {reward.contributorName}
                  </div>
                  <div className={styles.descriptionCell} style={{ flex: 2 }} data-label="贡献内容">
                    {reward.description}
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
    </div>
  );
};

export default SponsorList;
