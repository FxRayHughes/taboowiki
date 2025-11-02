import React, { useState } from 'react';
import { formatDate, getStatusText } from './utils';
import ProofModal from './ProofModal';
import styles from './DonationsReview.module.css';

/**
 * 赞助审批组件
 */
export default function DonationsReview({
  donations,
  loading,
  statusFilter,
  currentPage,
  totalPages,
  onStatusChange,
  onPageChange,
  onApprove,
  onReject,
}) {
  const [showProofModal, setShowProofModal] = useState(false);
  const [currentProof, setCurrentProof] = useState(null);

  const getStatusClass = (status) => {
    const classMap = {
      'PENDING': styles.statusPending,
      'APPROVED': styles.statusApproved,
      'REJECTED': styles.statusRejected,
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
          </select>
        </label>
      </div>

      {/* 表格 */}
      {donations.length === 0 ? (
        <div className={styles.empty}>
          <p>暂无赞助记录</p>
        </div>
      ) : (
        <>
          <div className={styles.table}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>赞助者</th>
                  <th>金额</th>
                  <th>留言</th>
                  <th>支付凭证</th>
                  <th>状态</th>
                  <th>提交时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((donation) => (
                  <tr key={donation.id}>
                    <td>{donation.id}</td>
                    <td>{donation.donorName || '匿名'}</td>
                    <td className={styles.amount}>
                      ¥{donation.amount?.toFixed(2)}
                    </td>
                    <td className={styles.message}>
                      {donation.message || '-'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewProof(donation.paymentProof)}
                        className={styles.btnView}
                      >
                        查看凭证
                      </button>
                    </td>
                    <td>
                      <span
                        className={`${styles.status} ${getStatusClass(
                          donation.status
                        )}`}
                      >
                        {getStatusText(donation.status)}
                      </span>
                    </td>
                    <td className={styles.dateTime}>
                      {formatDate(donation.createdTime)}
                    </td>
                    <td>
                      {donation.status === 'PENDING' ? (
                        <div className={styles.actions}>
                          <button
                            className={styles.btnApprove}
                            onClick={() => onApprove(donation)}
                          >
                            通过
                          </button>
                          <button
                            className={styles.btnReject}
                            onClick={() => onReject(donation)}
                          >
                            拒绝
                          </button>
                        </div>
                      ) : (
                        <span className={styles.textMuted}>已审批</span>
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

      {/* 凭证查看弹窗 */}
      <ProofModal
        show={showProofModal}
        url={currentProof}
        type="donation"
        onClose={closeProofModal}
      />
    </div>
  );
}
