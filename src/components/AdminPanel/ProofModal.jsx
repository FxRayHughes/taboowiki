import React from 'react';
import styles from './ProofModal.module.css';

/**
 * 凭证/证明材料查看弹窗组件
 */
export default function ProofModal({ show, url, type, onClose }) {
  if (!show) return null;

  const isImage = url && /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
  const isUrl = url && /^https?:\/\//i.test(url);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{type === 'donation' ? '支付凭证' : '证明材料'}</h3>
          <button className={styles.modalClose} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {isImage ? (
            // 如果是图片,直接显示
            <div className={styles.imageContainer}>
              <img
                src={url}
                alt={type === 'donation' ? '支付凭证' : '证明材料'}
                className={styles.proofImage}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className={styles.imageError} style={{ display: 'none' }}>
                <p>图片加载失败</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  点击在新标签页中打开
                </a>
              </div>
            </div>
          ) : isUrl ? (
            // 如果是 URL 但不是图片,提供链接
            <div className={styles.linkContainer}>
              <p className={styles.urlText}>{url}</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.openLink}
              >
                在新标签页中打开
              </a>
            </div>
          ) : (
            // 如果是纯文本
            <div className={styles.textContainer}>
              <pre className={styles.proofText}>{url || '无内容'}</pre>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          {isUrl && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnSecondary}
            >
              在新标签页中打开
            </a>
          )}
          <button className={styles.btnPrimary} onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
