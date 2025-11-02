import React from 'react';
import styles from './ReviewModal.module.css';

/**
 * 审批弹窗组件
 */
export default function ReviewModal({
  show,
  item,
  action,
  remark,
  amount,
  score,
  processing,
  onRemarkChange,
  onAmountChange,
  onScoreChange,
  onConfirm,
  onClose,
}) {
  if (!show) return null;

  const getTitle = () => {
    switch (action) {
      case 'approve':
        return '审批通过';
      case 'reject':
        return '拒绝申请';
      case 'pay':
        return '标记已发放';
      default:
        return '审批操作';
    }
  };

  const isRewardApprove = item?.type === 'reward' && action === 'approve';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{getTitle()}</h3>
          <button className={styles.modalClose} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {isRewardApprove && (
            <>
              <div className={styles.formGroup}>
                <label>奖励金额 (必填) *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => onAmountChange(e.target.value)}
                  placeholder="请输入奖励金额"
                  className={styles.input}
                  step="0.01"
                  min="0"
                />
              </div>
              <div className={styles.formGroup}>
                <label>最终评分 (0-100)</label>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => onScoreChange(e.target.value)}
                  placeholder="请输入最终评分"
                  className={styles.input}
                  min="0"
                  max="100"
                />
              </div>
            </>
          )}

          <div className={styles.formGroup}>
            <label>备注 (选填)</label>
            <textarea
              value={remark}
              onChange={(e) => onRemarkChange(e.target.value)}
              placeholder="请输入备注信息"
              className={styles.textarea}
              rows="4"
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={processing}
          >
            取消
          </button>
          <button
            className={styles.btnPrimary}
            onClick={onConfirm}
            disabled={processing}
          >
            {processing ? '处理中...' : '确认'}
          </button>
        </div>
      </div>
    </div>
  );
}
