import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { TokenManager } from '@site/src/components/AuthGuard/TokenManager';
import { SponsorAPI } from '@site/src/utils/api';
import { Table, Tag, Button, Modal, Form, Input, InputNumber, message, Space, Typography, Card, Empty, Alert } from 'antd';

const { Link, Text } = Typography;
const { TextArea } = Input;

export default function MyDonations() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [myDonations, setMyDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [editingDonation, setEditingDonation] = useState(null);
  const [submitForm] = Form.useForm();
  const [editForm] = Form.useForm();

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
      message.error('获取赞助数据失败');
    } finally {
      setLoadingDonations(false);
    }
  };

  const handleSubmitDonation = async (values) => {
    try {
      const data = await SponsorAPI.submitDonation({
        donorName: values.donorName || null,
        amount: values.amount,
        message: values.message || null,
        paymentProof: values.paymentProof,
        contactInfo: values.contactInfo || null,
        donationTime: Date.now()
      });

      if (data.success) {
        message.success('提交成功!您的赞助记录已提交,等待管理员审核');
        setShowDonationModal(false);
        submitForm.resetFields();
        fetchDonations();
      } else {
        message.error(data.message || '提交失败');
      }
    } catch (err) {
      message.error(err.message || '提交失败,请重试');
    }
  };

  const handleEditMessage = async (values) => {
    try {
      const data = await SponsorAPI.editDonationMessage(editingDonation.id, values.message);

      if (data.success) {
        message.success('更新成功!您的留言已更新,编辑权限已用完');
        setEditingDonation(null);
        editForm.resetFields();
        fetchDonations();
      } else {
        message.error(data.message || '更新失败');
      }
    } catch (err) {
      message.error(err.message || '更新失败,请重试');
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

  // 表格列定义
  const columns = [
    {
      title: '赞助者',
      dataIndex: 'donorName',
      key: 'donorName',
      width: 150,
      render: (text, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Text strong>{text}</Text>
            {record.isHighlighted && <span style={{ fontSize: '1.2rem' }}>🌟</span>}
          </div>
          {record.contactInfo && (
            <Text type="secondary" style={{ fontSize: '0.85rem' }}>
              📞 {record.contactInfo}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.amount - b.amount,
      render: (amount) => (
        <Text strong style={{ fontSize: '1.1rem', color: 'var(--ifm-color-primary)' }}>
          ¥{Number(amount).toFixed(2)}
        </Text>
      ),
    },
    {
      title: '留言',
      dataIndex: 'message',
      key: 'message',
      width: 519,
      render: (message, record) => (
        message ? (
          <div>
            <div style={{ fontStyle: 'italic', lineHeight: '1.5' }}>
              "{message}"
            </div>
            {record.messageEditedAt && (
              <Text type="secondary" style={{ fontSize: '0.8rem' }}>
                已编辑于 {formatDate(record.messageEditedAt)}
              </Text>
            )}
          </div>
        ) : (
          <Text type="secondary">无留言</Text>
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
        { text: '已通过', value: 'APPROVED' },
        { text: '已拒绝', value: 'REJECTED' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const config = {
          PENDING: { color: 'orange', text: '⏳ 待审核' },
          APPROVED: { color: 'green', text: '✅ 已通过' },
          REJECTED: { color: 'red', text: '❌ 已拒绝' },
        };
        const { color, text } = config[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '支付凭证',
      dataIndex: 'paymentProof',
      key: 'paymentProof',
      width: 120,
      align: 'center',
      render: (proof) => (
        proof ? (
          proof.startsWith('http') ? (
            <Link href={proof} target="_blank" rel="noopener noreferrer">
              🔗 查看
            </Link>
          ) : (
            <Text type="secondary" style={{ fontSize: '0.85rem' }}>
              {proof}
            </Text>
          )
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
      title: '赞助时间',
      dataIndex: 'donationTime',
      key: 'donationTime',
      width: 150,
      align: 'right',
      sorter: (a, b) => a.donationTime - b.donationTime,
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
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'right',
      render: (_, record) => (
        record.status === 'PENDING' ? (
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setEditingDonation(record);
              editForm.setFieldsValue({ message: record.message || '' });
            }}
          >
            ✏️ 编辑留言
          </Button>
        ) : (
          <Text type="secondary" style={{ fontSize: '0.85rem' }}>
            🔒 已锁定
          </Text>
        )
      ),
    },
  ];

  if (isLoading) {
    return (
      <Layout title="我的赞助记录">
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
      <Layout title="我的赞助记录">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
          <h2>需要登录</h2>
          <p style={{ marginBottom: '2rem', color: 'var(--ifm-font-color-base)' }}>
            请先登录以查看您的赞助记录
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
    <Layout title="我的赞助记录">
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
              <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>💰 我的赞助记录</h1>
              <Space wrap>
                <Button
                  onClick={() => window.location.href = '/console'}
                >
                  ← 返回控制台
                </Button>
                <Button
                  type="primary"
                  onClick={() => setShowDonationModal(true)}
                >
                  ➕ 提交赞助
                </Button>
              </Space>
            </div>
            <Text type="secondary">查看您的所有赞助记录和审核状态</Text>
          </div>

          {/* 赞助列表 */}
          {myDonations.length === 0 && !loadingDonations ? (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size="small">
                    <Text strong style={{ fontSize: '1.2rem' }}>暂无赞助记录</Text>
                    <Text type="secondary">您还没有提交过赞助记录</Text>
                  </Space>
                }
              >
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setShowDonationModal(true)}
                >
                  提交第一笔赞助
                </Button>
              </Empty>
            </Card>
          ) : (
            <Card bodyStyle={{ padding: 0 }}>
              <Table
                dataSource={myDonations}
                columns={columns}
                rowKey="id"
                loading={loadingDonations}
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

      {/* 提交赞助模态框 */}
      <Modal
        title="💰 提交赞助记录"
        open={showDonationModal}
        onCancel={() => {
          setShowDonationModal(false);
          submitForm.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={submitForm}
          layout="vertical"
          onFinish={handleSubmitDonation}
        >
          <Form.Item
            label="显示名称"
            name="donorName"
            extra="留空则使用账号昵称"
          >
            <Input placeholder="请输入显示名称" />
          </Form.Item>

          <Form.Item
            label="赞助金额"
            name="amount"
            rules={[
              { required: true, message: '请输入赞助金额' },
              { type: 'number', min: 0.01, message: '金额必须大于 0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入金额（元）"
              min={0.01}
              step={0.01}
              precision={2}
              prefix="¥"
            />
          </Form.Item>

          <Form.Item
            label="留言"
            name="message"
            extra="最多 200 字"
          >
            <TextArea
              placeholder="写下您的留言..."
              maxLength={200}
              rows={3}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="支付凭证"
            name="paymentProof"
            rules={[{ required: true, message: '请输入支付凭证' }]}
          >
            <Input placeholder="支付截图链接或订单号" />
          </Form.Item>

          <Form.Item
            label="联系方式"
            name="contactInfo"
            extra="QQ、微信等"
          >
            <Input placeholder="请输入联系方式" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setShowDonationModal(false);
                submitForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑留言模态框 */}
      <Modal
        title="📝 编辑留言"
        open={!!editingDonation}
        onCancel={() => {
          setEditingDonation(null);
          editForm.resetFields();
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Alert
          message="您只有一次编辑留言的机会,编辑后将无法再次修改"
          type="warning"
          showIcon
          style={{ marginBottom: '1.5rem' }}
        />

        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditMessage}
        >
          <Form.Item
            label="留言内容"
            name="message"
            extra="最多 200 字"
          >
            <TextArea
              placeholder="写下您的留言..."
              maxLength={200}
              rows={5}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setEditingDonation(null);
                editForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确认修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
