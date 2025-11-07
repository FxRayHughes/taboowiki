import React, {useEffect, useState} from 'react';
import Layout from '@theme/Layout';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import {TokenManager} from '@site/src/components/AuthGuard/TokenManager';
import {SponsorAPI} from '@site/src/utils/api';
import {AntdThemeProvider} from '@site/src/components/AntdThemeProvider';
import {
    Alert,
    Button,
    Card,
    Empty,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    DollarOutlined,
    EditOutlined,
    LinkOutlined,
    LockOutlined,
    PlusOutlined,
    StarFilled
} from '@ant-design/icons';
import {SimpleEditor} from '@site/src/components/tiptap-templates/simple/simple-editor'

const {Title, Text, Paragraph} = Typography;
const {TextArea} = Input;

export default function MyDonations() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [myDonations, setMyDonations] = useState([]);
    const [loadingDonations, setLoadingDonations] = useState(false);
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [editingDonation, setEditingDonation] = useState(null);
    const [form] = Form.useForm();
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
                message.success('提交成功！您的赞助记录已提交，等待管理员审核');
                setShowDonationModal(false);
                form.resetFields();
                fetchDonations();
            } else {
                message.error(data.message || '提交失败');
            }
        } catch (err) {
            message.error(err.message || '提交失败，请重试');
        }
    };

    const handleEditMessage = async (values) => {
        try {
            const data = await SponsorAPI.editDonationMessage(editingDonation.id, values.message);

            if (data.success) {
                message.success('更新成功！您的留言已更新，编辑权限已用完');
                setEditingDonation(null);
                editForm.resetFields();
                fetchDonations();
            } else {
                message.error(data.message || '更新失败');
            }
        } catch (err) {
            message.error(err.message || '更新失败，请重试');
        }
    };

    const getStatusTag = (status) => {
        const config = {
            PENDING: {color: 'processing', icon: <ClockCircleOutlined/>, text: '待审核'},
            APPROVED: {color: 'success', icon: <CheckCircleOutlined/>, text: '已通过'},
            REJECTED: {color: 'error', icon: <CloseCircleOutlined/>, text: '已拒绝'},
        };
        const statusConfig = config[status] || config.PENDING;
        return (
            <Tag icon={statusConfig.icon} color={statusConfig.color}>
                {statusConfig.text}
            </Tag>
        );
    };

    const columns = [
        {
            title: '赞助者',
            dataIndex: 'donorName',
            key: 'donorName',
            width: 180,
            align: 'center',
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Space>
                        <Text strong>{text}</Text>
                        {record.isHighlighted && (
                            <Tooltip title="精选赞助">
                                <StarFilled style={{color: '#faad14'}}/>
                            </Tooltip>
                        )}
                    </Space>
                    {record.contactInfo && (
                        <Text type="secondary" style={{fontSize: '12px'}}>
                            📞 {record.contactInfo}
                        </Text>
                    )}
                </Space>
            ),
        },
        {
            title: '金额',
            dataIndex: 'amount',
            key: 'amount',
            width: 120,
            align: 'center',
            render: (amount) => (
                <Text strong style={{color: '#52c41a', fontSize: '16px'}}>
                    ¥{Number(amount).toFixed(2)}
                </Text>
            ),
        },
        {
            title: '留言',
            dataIndex: 'message',
            key: 'message',
            align: 'center',
            render: (message, record) => (
                <div style={{textAlign: 'left'}}>
                    <Space direction="vertical" size={4}>
                        {message ? (
                            <>
                                <Paragraph ellipsis={{rows: 2, expandable: true}} style={{marginBottom: 0}}>
                                    "{message}"
                                </Paragraph>
                                {record.messageEditedAt && (
                                    <Text type="secondary" style={{fontSize: '12px'}}>
                                        已编辑于 {new Date(record.messageEditedAt).toLocaleDateString('zh-CN')}
                                    </Text>
                                )}
                            </>
                        ) : (
                            <Text type="secondary">无留言</Text>
                        )}
                    </Space>
                </div>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            align: 'center',
            render: (status) => getStatusTag(status),
        },
        {
            title: '支付凭证',
            dataIndex: 'paymentProof',
            key: 'paymentProof',
            width: 120,
            align: 'center',
            render: (proof) => {
                if (!proof) return <Text type="secondary">-</Text>;
                if (proof.startsWith('http')) {
                    return (
                        <Button
                            type="link"
                            icon={<LinkOutlined/>}
                            href={proof}
                            target="_blank"
                            size="small"
                        >
                            查看
                        </Button>
                    );
                }
                return <Text type="secondary">{proof}</Text>;
            },
        },
        {
            title: '管理员备注',
            dataIndex: 'remark',
            key: 'remark',
            width: 150,
            align: 'center',
            render: (remark) => remark || <Text type="secondary">-</Text>,
        },
        {
            title: '赞助时间',
            dataIndex: 'donationTime',
            key: 'donationTime',
            width: 150,
            align: 'center',
            render: (time) => (
                <Space direction="vertical" size={0}>
                    <Text>{new Date(time).toLocaleDateString('zh-CN')}</Text>
                    <Text type="secondary" style={{fontSize: '12px'}}>
                        {new Date(time).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}
                    </Text>
                </Space>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 120,
            align: 'center',
            render: (_, record) => {
                if (record.status === 'PENDING') {
                    return (
                        <Button
                            type="primary"
                            icon={<EditOutlined/>}
                            size="small"
                            onClick={() => {
                                setEditingDonation(record);
                                editForm.setFieldsValue({message: record.message || ''});
                            }}
                        >
                            编辑留言
                        </Button>
                    );
                }
                return (
                    <Tooltip title="审核后无法编辑">
                        <Tag icon={<LockOutlined/>} color="default">
                            已锁定
                        </Tag>
                    </Tooltip>
                );
            },
        },
    ];

    if (isLoading) {
        return (
            <Layout title="我的赞助记录">
                <div className="console-page-wrapper">
                    <AntdThemeProvider>
                        <div className="console-page-container" style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '60vh'
                        }}>
                            <Spin size="large" tip="正在加载..."/>
                        </div>
                    </AntdThemeProvider>
                </div>
            </Layout>
        );
    }

    if (!isAuthenticated) {
        return (
            <Layout title="我的赞助记录">
                <div className="console-page-wrapper">
                    <AntdThemeProvider>
                        <div className="console-page-container" style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '60vh'
                        }}>
                            <Card style={{maxWidth: 500, textAlign: 'center'}}>
                                <Space direction="vertical" size="large">
                                    <div style={{fontSize: '64px'}}>🔐</div>
                                    <Title level={2}>需要登录</Title>
                                    <Paragraph>请先登录以查看您的赞助记录</Paragraph>
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={() => window.location.href = '/console'}
                                    >
                                        前往登录
                                    </Button>
                                </Space>
                            </Card>
                        </div>
                    </AntdThemeProvider>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="我的赞助记录">
            <div className="console-page-wrapper">
                <AntdThemeProvider>
                    <div className="console-page-container"
                         style={{padding: '24px', maxWidth: '1250px', margin: '0 auto'}}>
                        {/* 页面标题 */}
                        <div style={{marginBottom: 24}}>
                            <Space direction="vertical" size="middle" style={{width: '100%'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <Space>
                                        <DollarOutlined style={{fontSize: '32px', color: '#52c41a'}}/>
                                        <Title level={2} style={{margin: 0}}>我的赞助记录</Title>
                                    </Space>
                                    <Space>
                                        <Button
                                            icon={<ArrowLeftOutlined/>}
                                            onClick={() => window.location.href = '/console'}
                                        >
                                            返回控制台
                                        </Button>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined/>}
                                            onClick={() => setShowDonationModal(true)}
                                        >
                                            提交赞助
                                        </Button>
                                    </Space>
                                </div>
                                <Text type="secondary">查看您的所有赞助记录和审核状态</Text>
                            </Space>
                        </div>

                        {/* 赞助列表 */}
                        <Table
                            columns={columns}
                            dataSource={myDonations}
                            rowKey="id"
                            loading={loadingDonations}
                            locale={{
                                emptyText: (
                                    <Empty
                                        description="暂无赞助记录"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    >
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined/>}
                                            onClick={() => setShowDonationModal(true)}
                                        >
                                            提交第一笔赞助
                                        </Button>
                                    </Empty>
                                ),
                            }}
                            pagination={{
                                pageSize: 50,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50', '100'],
                                showTotal: (total) => `共 ${total} 条记录`,
                            }}
                            scroll={{x: 1200}}
                        />
                    </div>

                    {/* 提交赞助模态框 */}
                    <Modal
                        title={
                            <Space>
                                <DollarOutlined style={{color: '#52c41a'}}/>
                                <span>提交赞助记录</span>
                            </Space>
                        }
                        open={showDonationModal}
                        onCancel={() => {
                            setShowDonationModal(false);
                            form.resetFields();
                        }}
                        footer={null}
                        width={600}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmitDonation}
                            autoComplete="off"
                        >
                            <Form.Item
                                label="显示名称"
                                name="donorName"
                                tooltip="留空则使用账号昵称"
                            >
                                <Input placeholder="请输入显示名称"/>
                            </Form.Item>

                            <Form.Item
                                label="赞助金额"
                                name="amount"
                                rules={[
                                    {required: true, message: '请输入赞助金额'},
                                    {type: 'number', min: 0.01, message: '金额必须大于 0'},
                                ]}
                            >
                                <InputNumber
                                    style={{width: '100%'}}
                                    prefix="¥"
                                    min={0.01}
                                    step={0.01}
                                    precision={2}
                                    placeholder="请输入金额（元）"
                                />
                            </Form.Item>

                            <Form.Item
                                label="留言"
                                name="message"
                                rules={[
                                    {max: 200, message: '留言不能超过 200 字'},
                                ]}
                            >
                                <TextArea
                                    placeholder="写下您的留言，这里的内容用于在列表中对外展示。"
                                    maxLength={200}
                                    showCount
                                    rows={4}
                                />
                            </Form.Item>

                            <Form.Item
                                label="支付凭证"
                                name="paymentProof"
                                rules={[
                                    {required: true, message: '请输入支付凭证'},
                                ]}
                            >
                                <SimpleEditor placeholder="支付截图链接或订单号"/>
                            </Form.Item>

                            <Form.Item
                                label="联系方式"
                                name="contactInfo"
                                tooltip="QQ、微信等"
                            >
                                <Input placeholder="请输入联系方式"/>
                            </Form.Item>

                            <Form.Item style={{marginBottom: 0, textAlign: 'right'}}>
                                <Space>
                                    <Button onClick={() => {
                                        setShowDonationModal(false);
                                        form.resetFields();
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
                        title={
                            <Space>
                                <EditOutlined style={{color: '#1890ff'}}/>
                                <span>编辑留言</span>
                            </Space>
                        }
                        open={!!editingDonation}
                        onCancel={() => {
                            setEditingDonation(null);
                            editForm.resetFields();
                        }}
                        footer={null}
                        width={600}
                    >
                        <Alert
                            message="注意"
                            description="您只有一次编辑留言的机会，编辑后将无法再次修改"
                            type="warning"
                            showIcon
                            style={{marginBottom: 16}}
                        />
                        <Form
                            form={editForm}
                            layout="vertical"
                            onFinish={handleEditMessage}
                            autoComplete="off"
                        >
                            <Form.Item
                                label="留言内容"
                                name="message"
                                rules={[
                                    {max: 200, message: '留言不能超过 200 字'},
                                ]}
                            >
                                <TextArea
                                    placeholder="写下您的留言..."
                                    maxLength={200}
                                    showCount
                                    rows={6}
                                />
                            </Form.Item>

                            <Form.Item style={{marginBottom: 0, textAlign: 'right'}}>
                                <Space>
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
                </AntdThemeProvider>
            </div>
        </Layout>
    );
}
