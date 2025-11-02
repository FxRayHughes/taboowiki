import React, { useState } from 'react';
import { formatDate, getStatusText, getRewardTypeText } from './utils';
import ProofModal from './ProofModal';
import styles from './RewardsReview.module.css';

/**
 * 奖励审批组件
 */
export default function RewardsReview({
  rewards,
  loading,
  statusFilter,
  typeFilter,
  currentPage,
  totalPages,
  onStatusChange,
  onTypeChange,
  onPageChange,
  onApprove,
  onReject,
  onMarkPaid,
}) {
  const [showProofModal, setShowProofModal] = useState(false);
  const [currentProof, setCurrentProof] = useState(null);

  const getStatusClass = (status) => {
    const classMap = {
      'PENDING': styles.statusPending,
      'APPROVED': styles.statusApproved,
      'REJECTED': styles.statusRejected,
      'PAID': styles.statusPaid,
    };
    return classMap[status] || '';
  };

  const handleViewProof = (proofUrl) => {
    setCurrentProof(proofUrl);
    setShowProofModal(true);
  };

  const closeProofModal = () => {
    setShowProofModal(false);
    setCurrentProof(null);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 公示期提示 */}
      {statusFilter === 'APPROVED' && (
        <div className={styles.infoBox}>
          📅 <strong>公示期说明：</strong> 奖励申请通过后需要 <strong>3 天公示期</strong>，公示期结束后请点击"标记已发放"按钮完成发放流程。
        </div>
      )}

      {/* 筛选器 */}
      <div className={styles.filters}>
        <label>
          状态筛选:
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className={styles.select}
          >
            <option value="">全部</option>
            <option value="PENDING">待审核</option>
            <option value="APPROVED">已通过</option>
            <option value="REJECTED">已拒绝</option>
            <option value="PAID">已发放</option>
          </select>
        </label>
        <label>
          类型筛选:
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className={styles.select}
          >
            <option value="">全部</option>
            <option value="BUG_FIX">Bug 修复</option>
            <option value="FEATURE">新功能</option>
            <option value="DOCUMENTATION">文档贡献</option>
            <option value="OPTIMIZATION">性能优化</option>
            <option value="OTHER">其他贡献</option>
          </select>
        </label>
      </div>

      {/* 表格 */}
      {rewards.length === 0 ? (
        <div className={styles.empty}>
          <p>暂无奖励申请</p>
        </div>
      ) : (
        <>
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>贡献者</th>
                  <th>奖励类型</th>
                  <th>描述</th>
                  <th>证明材料</th>
                  <th>自评分</th>
                  <th>最终评分</th>
                  <th>奖励金额</th>
                  <th>状态</th>
                  <th>申请时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((reward) => (
                  <tr key={reward.id}>
                    <td>{reward.id}</td>
                    <td>{reward.contributorName || '-'}</td>
                    <td>{getRewardTypeText(reward.rewardType)}</td>
                    <td className={styles.description}>
                      {reward.description}
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewProof(reward.proofUrl)}
                        className={styles.btnView}
                      >
                        查看证明
                      </button>
                    </td>
                    <td>{reward.selfScore || '-'}</td>
                    <td>{reward.finalScore || '-'}</td>
                    <td className={styles.amount}>
                      {reward.amount ? `¥${reward.amount.toFixed(2)}` : '-'}
                    </td>
                    <td>
                      <span
                        className={`${styles.status} ${getStatusClass(
                          reward.status
                        )}`}
                      >
                        {getStatusText(reward.status)}
                      </span>
                    </td>
                    <td className={styles.dateTime}>
                      {formatDate(reward.createdTime)}
                    </td>
                    <td>
                      {reward.status === 'PENDING' && (
                        <div className={styles.actions}>
                          <button
                            className={styles.btnApprove}
                            onClick={() => onApprove(reward)}
                          >
                            通过
                          </button>
                          <button
                            className={styles.btnReject}
                            onClick={() => onReject(reward)}
                          >
                            拒绝
                          </button>
                        </div>
                      )}
                      {reward.status === 'APPROVED' && (
                        <button
                          className={styles.btnPay}
                          onClick={() => onMarkPaid(reward)}
                        >
                          标记已发放
                        </button>
                      )}
                      {reward.status === 'PAID' && (
                        <span className={styles.textMuted}>已完成</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={styles.btnPage}
              >
                上一页
              </button>
              <span className={styles.pageInfo}>
                第 {currentPage} / {totalPages} 页
              </span>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={styles.btnPage}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {/* 证明材料查看弹窗 */}
      <ProofModal
        show={showProofModal}
        url={currentProof}
        type="reward"
        onClose={closeProofModal}
      />
    </div>
  );
}
