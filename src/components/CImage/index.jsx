import React, { useState, useEffect, useRef } from 'react';
import './styles.css';

/**
 * CImage - 自定义图片组件
 * 简化图片引用，只需要提供图片 ID
 * 支持双击查看大图，包含放大/缩小/关闭/拖拽功能
 *
 * 功能：
 * - 双击图片打开预览
 * - ESC 关闭预览
 * - Ctrl/Cmd + 加号 放大
 * - Ctrl/Cmd + 减号 缩小
 * - Ctrl/Cmd + 0 重置缩放和位置
 * - 点击背景关闭预览
 * - 鼠标拖拽移动图片
 * - 鼠标滚轮缩放图片（30% ~ 500%）
 *
 * 用法：
 * <CImage id="8483B4C09F4B31698CFDD96A15A21964" alt="构建刷新" />
 * <CImage id="8483B4C09F4B31698CFDD96A15A21964" alt="构建刷新" title="自定义标题" zoom="80%" />
 */
function CImage({ id, alt = '图片', title, zoom = '100%' }) {
  // 状态管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imageRef = useRef(null);

  // 图片基础 URL
  const baseUrl = 'https://openlist.maplex.top/p/image/';
  const imageUrl = `${baseUrl}${id}.png`;
  const imageTitle = title || alt;

  // 打开模态框
  const openModal = () => {
    setIsModalOpen(true);
    setScale(1); // 重置缩放
    setPosition({ x: 0, y: 0 }); // 重置位置
    document.body.style.overflow = 'hidden'; // 禁止页面滚动
  };

  // 关闭模态框
  const closeModal = () => {
    setIsModalOpen(false);
    setIsDragging(false);
    document.body.style.overflow = 'auto'; // 恢复页面滚动
  };

  // 放大
  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.25, 5)); // 最大 5 倍 (500%)
  };

  // 缩小
  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.25, 0.3)); // 最小 0.3 倍 (30%)
  };

  // 重置缩放和位置
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // 滚轮缩放
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1; // 向下滚动缩小，向上滚动放大
    setScale(prevScale => {
      const newScale = prevScale + delta;
      return Math.max(0.3, Math.min(5, newScale)); // 限制在 30% ~ 500%
    });
  };

  // 鼠标按下开始拖拽
  const handleMouseDown = (e) => {
    if (e.target === imageRef.current) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  };

  // 鼠标移动
  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  // 鼠标松开
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 键盘快捷键
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e) => {
      // ESC 关闭
      if (e.key === 'Escape') {
        closeModal();
        return;
      }

      // Ctrl/Cmd + 加号/等号 放大
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        zoomIn();
        return;
      }

      // Ctrl/Cmd + 减号 缩小
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        zoomOut();
        return;
      }

      // Ctrl/Cmd + 0 重置
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        resetZoom();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  // 鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // 阻止事件冒泡
  const handleModalClick = (e) => {
    // 点击背景关闭
    if (e.target.className === 'cimage-modal') {
      closeModal();
    }
  };

  return (
    <>
      {/* 缩略图 */}
      <img
        src={imageUrl}
        alt={alt}
        title={`${imageTitle} (双击查看大图)`}
        loading="lazy"
        onDoubleClick={openModal}
        style={{
          maxWidth: zoom,
          height: 'auto',
          borderRadius: '4px',
          boxShadow: '1px 2px 8px rgba(0,0,0,0.1)',
          cursor: 'zoom-in',
          transition: 'transform 0.2s',
        }}
        className="cimage-thumbnail"
      />

      {/* 模态框 */}
      {isModalOpen && (
        <div className="cimage-modal" onClick={handleModalClick}>
          <div className="cimage-modal-content">
            {/* 控制按钮组 */}
            <div className="cimage-controls">
              <button
                className="cimage-btn cimage-btn-zoom-out"
                onClick={zoomOut}
                title="缩小 (Ctrl/Cmd + -)"
                disabled={scale <= 0.3}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              <button
                className="cimage-btn cimage-btn-reset"
                onClick={resetZoom}
                title="重置缩放和位置 (Ctrl/Cmd + 0)"
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                className="cimage-btn cimage-btn-zoom-in"
                onClick={zoomIn}
                title="放大 (Ctrl/Cmd + +)"
                disabled={scale >= 5}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="11" y1="8" x2="11" y2="14" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              <button
                className="cimage-btn cimage-btn-close"
                onClick={closeModal}
                title="关闭 (ESC)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 图片容器 */}
            <div className="cimage-image-container" onWheel={handleWheel}>
              <img
                ref={imageRef}
                src={imageUrl}
                alt={alt}
                title={imageTitle}
                onMouseDown={handleMouseDown}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.3s ease',
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
                className="cimage-modal-image"
                draggable={false}
              />
            </div>

            {/* 图片说明 */}
            {alt && (
              <div className="cimage-caption">
                {alt}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default CImage;
