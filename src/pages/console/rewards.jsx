import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { TokenManager } from '@site/src/components/AuthGuard/TokenManager';
import { SponsorAPI } from '@site/src/utils/api';
import { Table, Tag, Button, Modal, Form, Input, InputNumber, message, Space, Typography, Card, Empty, Alert, Select } from 'antd';

const { Link, Text } = Typography;
const { TextArea } = Input;

export default function MyRewards() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [myRewards, setMyRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [viewingProof, setViewingProof] = useState(null);
  const [applyForm] = Form.useForm();

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
      message.error('获取奖励数据失败');
    } finally {
      setLoadingRewards(false);
    }
  };

  const handleApplyReward = async (values) => {
    try {
      const data = await SponsorAPI.applyReward({
        contributorName: values.contributorName || null,
        rewardType: values.rewardType,
        description: values.description,
        proofUrl: values.proofUrl,
        selfScore: values.selfScore,
      });

      if (data.success) {
        message.success('申请成功!您的奖励申请已提交,等待管理员审核');
        setShowRewardModal(false);
        applyForm.resetFields();
        fetchRewards();
      } else {
        message.error(data.message || '申请失败');
      }
    } catch (err) {
      message.error(err.message || '申请失败,请重试');
    }
  };

  // 复制申请格式模板到剪贴板
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
          message.success('申请格式模板已复制到剪贴板');
        })
        .catch(() => {
          message.error('复制失败,请手动复制');
        });
    } else {
      // 降级方案：使用 textarea
      const textarea = document.createElement('textarea');
      textarea.value = template;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        message.success('申请格式模板已复制到剪贴板');
      } catch (err) {
        message.error('复制失败,请手动复制');
      }
      document.body.removeChild(textarea);
    }
  };

  // 辅助函数
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // 奖励类型配置
  const rewardTypeConfig = {
    BUG_FIX: { text: '🐛 Bug 修复', color: 'red' },
    DOCUMENTATION: { text: '📚 文档贡献', color: 'blue' },
    PROMOTION: { text: '📢 推广贡献', color: 'green' },
    MAJOR_CONTRIBUTION: { text: '🏆 重大贡献', color: 'gold' },
  };

  // 表格列定义
  const columns = [
    {
      title: '贡献者',
      dataIndex: 'contributorName',
      key: 'contributorName',
      width: 150,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '奖励类型',
      dataIndex: 'rewardType',
      key: 'rewardType',
      width: 150,
      align: 'center',
      filters: [
        { text: 'Bug 修复', value: 'BUG_FIX' },
        { text: '文档贡献', value: 'DOCUMENTATION' },
        { text: '推广贡献', value: 'PROMOTION' },
        { text: '重大贡献', value: 'MAJOR_CONTRIBUTION' },
      ],
      onFilter: (value, record) => record.rewardType === value,
      render: (type) => {
        const config = rewardTypeConfig[type] || { text: type, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '贡献描述',
      dataIndex: 'description',
      key: 'description',
      width: 519,
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: '自评分',
      dataIndex: 'selfScore',
      key: 'selfScore',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.selfScore - b.selfScore,
      render: (score) => <Text strong>{score}</Text>,
    },
    {
      title: '终评分',
      dataIndex: 'finalScore',
      key: 'finalScore',
      width: 100,
      align: 'center',
      sorter: (a, b) => (a.finalScore || 0) - (b.finalScore || 0),
      render: (score) => score ? <Text strong style={{ color: 'var(--ifm-color-primary)' }}>{score}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: '奖励金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
      render: (amount) => (
        amount ? (
          <Text strong style={{ fontSize: '1.1rem', color: 'var(--ifm-color-primary)' }}>
            ¥{Number(amount).toFixed(2)}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      filters: [
        { text: '待审核', value: 'PENDING' },
        { text: '已批准', value: 'APPROVED' },
        { text: '已拒绝', value: 'REJECTED' },
        { text: '已发放', value: 'PAID' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const config = {
          PENDING: { color: 'orange', text: '⏳ 待审核' },
          APPROVED: { color: 'blue', text: '✅ 已批准' },
          REJECTED: { color: 'red', text: '❌ 已拒绝' },
          PAID: { color: 'green', text: '💰 已发放' },
        };
        const { color, text } = config[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '证明材料',
      dataIndex: 'proofUrl',
      key: 'proofUrl',
      width: 120,
      align: 'center',
      render: (url, record) => (
        url ? (
          <Button
            type="link"
            size="small"
            onClick={() => setViewingProof(record)}
          >
            📄 查看详情
          </Button>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: '管理员备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 100,
      align: 'right',
      render: (remark) => (
        remark ? (
          <Text style={{ fontSize: '0.85rem' }}>{remark}</Text>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 150,
      align: 'right',
      sorter: (a, b) => a.applyTime - b.applyTime,
      defaultSortOrder: 'descend',
      render: (timestamp) => (
        <div>
          <div>{formatDate(timestamp)}</div>
          <Text type="secondary" style={{ fontSize: '0.75rem' }}>
            {formatTime(timestamp)}
          </Text>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Layout title="我的奖励申请">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--ifm-color-emphasis-200)',
            borderTop: '4px solid var(--ifm-color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>正在加载...</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout title="我的奖励申请">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
          <h2>需要登录</h2>
          <p style={{ marginBottom: '2rem', color: 'var(--ifm-font-color-base)' }}>
            请先登录以查看您的奖励申请
          </p>
          <button
            onClick={() => window.location.href = '/console'}
            style={{
              padding: '0.75rem 2rem',
              background: 'var(--ifm-color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            前往登录
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="我的奖励申请">
      <div style={{
        minHeight: '100vh',
        background: 'var(--ifm-background-color)',
        margin: '0 calc(-1 * var(--ifm-spacing-horizontal))',
        width: 'calc(100% + 2 * var(--ifm-spacing-horizontal))',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1400px'
        }}>
          {/* 页面标题 */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>🚀 我的奖励申请</h1>
              <Space wrap>
                <Button
                  onClick={() => window.location.href = '/console'}
                >
                  ← 返回控制台
                </Button>
                <Button
                  type="primary"
                  onClick={() => setShowRewardModal(true)}
                >
                  ➕ 申请奖励
                </Button>
              </Space>
            </div>
            <Text type="secondary">查看您的所有奖励申请和审核状态</Text>
          </div>

          {/* 奖励列表 */}
          {myRewards.length === 0 && !loadingRewards ? (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size="small">
                    <Text strong style={{ fontSize: '1.2rem' }}>暂无奖励申请</Text>
                    <Text type="secondary">您还没有提交过奖励申请</Text>
                  </Space>
                }
              >
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setShowRewardModal(true)}
                >
                  提交第一笔申请
                </Button>
              </Empty>
            </Card>
          ) : (
            <Card bodyStyle={{ padding: 0 }}>
              <Table
                dataSource={myRewards}
                columns={columns}
                rowKey="id"
                loading={loadingRewards}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                }}
                scroll={{ x: 1000 }}
              />
            </Card>
          )}
        </div>
      </div>

      {/* 申请奖励模态框 */}
      <Modal
        title="🚀 申请奖励"
        open={showRewardModal}
        onCancel={() => {
          setShowRewardModal(false);
          applyForm.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Alert
          message="请如实填写您的贡献信息,管理员会根据实际情况评定奖励金额"
          type="info"
          showIcon
          style={{ marginBottom: '1.5rem' }}
        />

        <Form
          form={applyForm}
          layout="vertical"
          onFinish={handleApplyReward}
        >
          <Form.Item
            label="贡献者名称"
            name="contributorName"
            extra="留空则使用账号昵称"
          >
            <Input placeholder="请输入贡献者名称" />
          </Form.Item>

          <Form.Item
            label="奖励类型"
            name="rewardType"
            rules={[{ required: true, message: '请选择奖励类型' }]}
          >
            <Select placeholder="请选择奖励类型">
              <Select.Option value="BUG_FIX">🐛 Bug 修复</Select.Option>
              <Select.Option value="DOCUMENTATION">📚 文档贡献</Select.Option>
              <Select.Option value="PROMOTION">📢 推广贡献</Select.Option>
              <Select.Option value="MAJOR_CONTRIBUTION">🏆 重大贡献</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="贡献描述"
            name="description"
            rules={[{ required: true, message: '请输入贡献描述' }]}
            extra="详用于展示在列表里的内容,最多 100 字"
          >
            <TextArea
              placeholder="用于展示在列表里的内容"
              maxLength={100}
              rows={5}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="证明材料"
            name="proofUrl"
            rules={[
              { required: true, message: '请输入证明材料链接' },
              { type: 'url', message: '请输入有效的 URL 地址' }
            ]}
            extra={
              <div>
                <div style={{ marginBottom: '0.5rem' }}>
                  请先在 <a href="https://github.com/FxRayHughes/taboowiki/discussions/new?category=%E8%B4%A1%E7%8C%AE%E7%94%B3%E8%AF%B7" target="_blank" rel="noopener noreferrer">GitHub Discussions</a> 创建贡献申请,然后填写讨论链接
                  <br />
                  (例如: https://github.com/FxRayHughes/taboowiki/discussions/2)
                </div>
                <Button
                  size="small"
                  onClick={copyTemplateToClipboard}
                  icon={<span>📋</span>}
                >
                  复制申请格式模板
                </Button>
              </div>
            }
          >
            <Input placeholder="https://github.com/FxRayHughes/taboowiki/discussions/2" />
          </Form.Item>

          <Form.Item
            label="自评分"
            name="selfScore"
            rules={[
              { required: true, message: '请输入自评分' },
              { type: 'number', min: 0, max: 100, message: '分数必须在 0-100 之间' }
            ]}
            extra="请根据贡献价值自评分数 (0-100)"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入自评分"
              min={0}
              max={100}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setShowRewardModal(false);
                applyForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                提交申请
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看证明材料模态框 */}
      <Modal
        title="📄 证明材料详情"
        open={!!viewingProof}
        onCancel={() => setViewingProof(null)}
        footer={[
          <Button key="close" onClick={() => setViewingProof(null)}>
            关闭
          </Button>,
          viewingProof?.proofUrl && (
            <Button
              key="open"
              type="primary"
              onClick={() => window.open(viewingProof.proofUrl, '_blank')}
            >
              在新窗口打开
            </Button>
          )
        ]}
        width={700}
        destroyOnClose
      >
        {viewingProof && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">贡献者</Text>
              <div style={{ marginTop: '0.5rem' }}>
                <Text strong style={{ fontSize: '1.1rem' }}>{viewingProof.contributorName}</Text>
              </div>
            </div>

            <div>
              <Text type="secondary">奖励类型</Text>
              <div style={{ marginTop: '0.5rem' }}>
                <Tag color={rewardTypeConfig[viewingProof.rewardType]?.color}>
                  {rewardTypeConfig[viewingProof.rewardType]?.text}
                </Tag>
              </div>
            </div>

            <div>
              <Text type="secondary">贡献描述</Text>
              <div style={{
                marginTop: '0.5rem',
                padding: '1rem',
                background: 'var(--ifm-color-emphasis-100)',
                borderRadius: '6px',
                lineHeight: '1.6'
              }}>
                {viewingProof.description}
              </div>
            </div>

            <div>
              <Text type="secondary">证明材料</Text>
              <div style={{ marginTop: '0.5rem' }}>
                <Link
                  href={viewingProof.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ wordBreak: 'break-all' }}
                >
                  {viewingProof.proofUrl}
                </Link>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                <Text type="secondary">自评分</Text>
                <div style={{ marginTop: '0.5rem' }}>
                  <Text strong style={{ fontSize: '1.5rem' }}>{viewingProof.selfScore}</Text>
                  <Text type="secondary"> / 100</Text>
                </div>
              </div>

              {viewingProof.finalScore && (
                <div style={{ flex: 1 }}>
                  <Text type="secondary">终评分</Text>
                  <div style={{ marginTop: '0.5rem' }}>
                    <Text strong style={{ fontSize: '1.5rem', color: 'var(--ifm-color-primary)' }}>
                      {viewingProof.finalScore}
                    </Text>
                    <Text type="secondary"> / 100</Text>
                  </div>
                </div>
              )}

              {viewingProof.amount && (
                <div style={{ flex: 1 }}>
                  <Text type="secondary">奖励金额</Text>
                  <div style={{ marginTop: '0.5rem' }}>
                    <Text strong style={{ fontSize: '1.5rem', color: 'var(--ifm-color-success)' }}>
                      ¥{Number(viewingProof.amount).toFixed(2)}
                    </Text>
                  </div>
                </div>
              )}
            </div>

            {viewingProof.remark && (
              <div>
                <Text type="secondary">管理员备注</Text>
                <Alert
                  message={viewingProof.remark}
                  type="info"
                  style={{ marginTop: '0.5rem' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--ifm-color-emphasis-600)' }}>
              <div>
                申请时间: {formatDate(viewingProof.applyTime)} {formatTime(viewingProof.applyTime)}
              </div>
              {viewingProof.approveTime && (
                <div>
                  审核时间: {formatDate(viewingProof.approveTime)} {formatTime(viewingProof.approveTime)}
                </div>
              )}
              {viewingProof.rewardTime && (
                <div>
                  发放时间: {formatDate(viewingProof.rewardTime)} {formatTime(viewingProof.rewardTime)}
                </div>
              )}
            </div>
          </Space>
        )}
      </Modal>
    </Layout>
  );
}
