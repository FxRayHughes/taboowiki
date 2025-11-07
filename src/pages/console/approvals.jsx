import React, {useEffect, useState} from 'react';
import Layout from '@theme/Layout';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import {TokenManager} from '@site/src/components/AuthGuard/TokenManager';
import {SponsorAPI} from '@site/src/utils/api';
import {AntdThemeProvider} from '@site/src/components/AntdThemeProvider';
import dayjs from 'dayjs';
import {
    Button,
    Card,
    DatePicker,
    Descriptions,
    Divider,
    Empty,
    Form,
    Image,
    Input,
    InputNumber,
    message,
    Modal,
    Space,
    Spin,
    Table,
    Tabs,
    Tag,
    Tooltip,
    Typography
} from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    CheckOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    CloseOutlined,
    DollarOutlined,
    EditOutlined,
    EyeOutlined,
    GiftOutlined,
    ReloadOutlined,
    SafetyOutlined,
    StarFilled,
    TrophyOutlined
} from '@ant-design/icons';

const {Title, Text, Paragraph} = Typography;
const {TextArea} = Input;

export default function Approvals() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState('donations');

    // 赞助审批相关
    const [donations, setDonations] = useState([]);
    const [loadingDonations, setLoadingDonations] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [donationAction, setDonationAction] = useState(null); // 'approve' | 'reject'
    const [donationForm] = Form.useForm();

    // 奖励审批相关
    const [rewards, setRewards] = useState([]);
    const [loadingRewards, setLoadingRewards] = useState(false);
    const [selectedReward, setSelectedReward] = useState(null);
    const [rewardAction, setRewardAction] = useState(null); // 'approve' | 'reject' | 'pay'
    const [rewardForm] = Form.useForm();
    const [payForm] = Form.useForm();

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
                // 检查用户是否为管理员
                if (currentUser.isAdmin) {
                    setIsAdmin(true);
                    fetchDonations();
                    fetchRewards();
                } else {
                    setIsAdmin(false);
                }
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
            // 获取所有赞助记录，不过滤状态
            const data = await SponsorAPI.adminGetAllDonations();
            console.log('赞助数据:', data);
            if (data.success) {
                const donations = data.data?.content || data.data?.items || [];
                // 按时间排序，最新的在最上面
                const sortedDonations = donations.sort((a, b) =>
                    new Date(b.donationTime).getTime() - new Date(a.donationTime).getTime()
                );
                setDonations(sortedDonations);
            }
        } catch (error) {
            console.error('获取赞助数据失败:', error);
            message.error('获取赞助数据失败');
        } finally {
            setLoadingDonations(false);
        }
    };

    const fetchRewards = async () => {
        setLoadingRewards(true);
        try {
            // 获取所有奖励申请，不过滤状态
            const data = await SponsorAPI.adminGetAllRewards();
            console.log('奖励数据:', data);
            if (data.success) {
                const rewards = data.data?.content || data.data?.items || [];
                // 按时间排序，最新的在最上面
                const sortedRewards = rewards.sort((a, b) => {
                    const timeA = new Date(a.submittedAt || a.applyTime).getTime();
                    const timeB = new Date(b.submittedAt || b.applyTime).getTime();
                    return timeB - timeA;
                });
                setRewards(sortedRewards);
            }
        } catch (error) {
            console.error('获取奖励数据失败:', error);
            message.error('获取奖励数据失败');
        } finally {
            setLoadingRewards(false);
        }
    };

    const handleDonationApprove = async (values) => {
        try {
            const data = await SponsorAPI.adminApproveDonation(selectedDonation.id, values.remark);
            if (data.success) {
                message.success('审批成功');
                setSelectedDonation(null);
                setDonationAction(null);
                donationForm.resetFields();
                fetchDonations();
            } else {
                message.error(data.message || '审批失败');
            }
        } catch (error) {
            message.error('审批失败，请重试');
        }
    };

    const handleDonationReject = async (values) => {
        try {
            const data = await SponsorAPI.adminRejectDonation(selectedDonation.id, values.remark);
            if (data.success) {
                message.success('已拒绝');
                setSelectedDonation(null);
                setDonationAction(null);
                donationForm.resetFields();
                fetchDonations();
            } else {
                message.error(data.message || '操作失败');
            }
        } catch (error) {
            message.error('操作失败，请重试');
        }
    };

    const handleRewardApprove = async (values) => {
        try {
            const data = await SponsorAPI.adminApproveReward(
                selectedReward.id,
                values.amount,
                values.finalScore,
                values.remark
            );
            if (data.success) {
                message.success('审批成功');
                setSelectedReward(null);
                setRewardAction(null);
                rewardForm.resetFields();
                fetchRewards();
            } else {
                message.error(data.message || '审批失败');
            }
        } catch (error) {
            message.error('审批失败，请重试');
        }
    };

    const handleRewardReject = async (values) => {
        try {
            const data = await SponsorAPI.adminRejectReward(selectedReward.id, values.remark);
            if (data.success) {
                message.success('已拒绝');
                setSelectedReward(null);
                setRewardAction(null);
                rewardForm.resetFields();
                fetchRewards();
            } else {
                message.error(data.message || '操作失败');
            }
        } catch (error) {
            message.error('操作失败，请重试');
        }
    };

    const handleRewardPay = async (values) => {
        try {
            // DatePicker 返回的是 dayjs 对象，需要转换为时间戳
            const rewardTime = values.rewardTime ? values.rewardTime.valueOf() : Date.now();

            const data = await SponsorAPI.adminMarkRewardAsPaid(
                selectedReward.id,
                rewardTime,
                values.remark
            );
            if (data.success) {
                message.success('标记为已发放');
                setSelectedReward(null);
                setRewardAction(null);
                payForm.resetFields();
                fetchRewards();
            } else {
                message.error(data.message || '操作失败');
            }
        } catch (error) {
            message.error('操作失败，请重试');
        }
    };

    const getStatusTag = (status) => {
        const config = {
            PENDING: {color: 'processing', icon: <ClockCircleOutlined/>, text: '待审核'},
            APPROVED: {color: 'success', icon: <CheckCircleOutlined/>, text: '已通过'},
            REJECTED: {color: 'error', icon: <CloseCircleOutlined/>, text: '已拒绝'},
            // 奖励特有状态
            PAID: {color: 'success', icon: <CheckCircleOutlined/>, text: '已发放'},
        };
        const statusConfig = config[status] || config.PENDING;
        return (
            <Tag icon={statusConfig.icon} color={statusConfig.color}>
                {statusConfig.text}
            </Tag>
        );
    };

    const getRewardTypeTag = (type) => {
        const config = {
            BUG_FIX: {color: 'error', text: 'Bug 修复'},
            DOCUMENTATION: {color: 'blue', text: '文档贡献'},
            PROMOTION: {color: 'purple', text: '推广贡献'},
            MAJOR_CONTRIBUTION: {color: 'gold', text: '重大贡献'},
        };
        const typeConfig = config[type] || {color: 'default', text: type};
        return <Tag color={typeConfig.color}>{typeConfig.text}</Tag>;
    };

    // 赞助审批表格列
    const donationColumns = [
        {
            title: '赞助者',
            dataIndex: 'donorName',
            key: 'donorName',
            width: 150,
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    {record.contactInfo && (
                        <Text type="secondary" style={{fontSize: '12px'}}>
                            {record.contactInfo}
                        </Text>
                    )}
                </Space>
            ),
        },
        {
            title: '金额',
            dataIndex: 'amount',
            key: 'amount',
            width: 100,
            render: (amount) => (
                <Text strong style={{color: '#52c41a', fontSize: '16px'}}>
                    ¥{Number(amount).toFixed(2)}
                </Text>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => getStatusTag(status),
        },
        {
            title: '留言',
            dataIndex: 'message',
            key: 'message',
            ellipsis: true,
            render: (message) => message || <Text type="secondary">无留言</Text>,
        },
        {
            title: '支付凭证',
            dataIndex: 'paymentProof',
            key: 'paymentProof',
            width: 100,
            render: (proof) => {
                if (!proof) return <Text type="secondary">-</Text>;
                return (
                    <Button
                        type="link"
                        icon={<EyeOutlined/>}
                        size="small"
                        onClick={() => {
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = proof;
                            const imgTags = tempDiv.querySelectorAll('img');
                            if (imgTags.length > 0) {
                                Modal.info({
                                    title: '支付凭证',
                                    content: <Image src={imgTags[0].src} style={{width: '100%'}}/>,
                                    width: 600,
                                });
                            } else {
                                Modal.info({
                                    title: '支付凭证',
                                    content: <div dangerouslySetInnerHTML={{__html: proof}}/>,
                                });
                            }
                        }}
                    >
                        查看
                    </Button>
                );
            },
        },
        {
            title: '提交时间',
            dataIndex: 'donationTime',
            key: 'donationTime',
            width: 160,
            render: (time) => new Date(time).toLocaleString('zh-CN'),
        },
        {
            title: '操作',
            key: 'action',
            width: 180,
            fixed: 'right',
            render: (_, record) => {
                if (record.status === 'PENDING') {
                    return (
                        <Space size="small">
                            <Button
                                type="primary"
                                size="small"
                                icon={<CheckOutlined/>}
                                onClick={() => {
                                    setSelectedDonation(record);
                                    setDonationAction('approve');
                                }}
                            >
                                通过
                            </Button>
                            <Button
                                danger
                                size="small"
                                icon={<CloseOutlined/>}
                                onClick={() => {
                                    setSelectedDonation(record);
                                    setDonationAction('reject');
                                }}
                            >
                                拒绝
                            </Button>
                        </Space>
                    );
                }
                return getStatusTag(record.status);
            },
        },
    ];

    // 奖励审批表格列
    const rewardColumns = [
        {
            title: '贡献者',
            dataIndex: 'contributorName',
            key: 'contributorName',
            width: 120,
            render: (text) => <Text strong>{text || '未知'}</Text>,
        },
        {
            title: '类型',
            dataIndex: 'rewardType',
            key: 'rewardType',
            width: 120,
            render: (type) => getRewardTypeTag(type),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => getStatusTag(status),
        },
        {
            title: '自评分',
            dataIndex: 'selfScore',
            key: 'selfScore',
            width: 80,
            render: (score) => (
                <Tag color="blue">{score} 分</Tag>
            ),
        },
        {
            title: '最终评分',
            dataIndex: 'finalScore',
            key: 'finalScore',
            width: 80,
            render: (score) => score ? <Tag color="green">{score} 分</Tag> : <Text type="secondary">-</Text>,
        },
        {
            title: '奖励金额',
            dataIndex: 'amount',
            key: 'amount',
            width: 100,
            render: (amount) => amount ? (
                <Text strong style={{color: '#faad14'}}>¥{Number(amount).toFixed(2)}</Text>
            ) : <Text type="secondary">-</Text>,
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (desc) => (
                <Tooltip title={desc}>
                    <Paragraph
                        ellipsis={{rows: 2}}
                        style={{marginBottom: 0, maxWidth: 300}}
                    >
                        {desc}
                    </Paragraph>
                </Tooltip>
            ),
        },
        {
            title: '证明材料',
            dataIndex: 'proofUrl',
            key: 'proofUrl',
            width: 100,
            render: (proofUrl, record) => {
                if (!proofUrl) return <Text type="secondary">-</Text>;
                return (
                    <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined/>}
                        onClick={() => {
                            Modal.info({
                                title: '证明材料',
                                content: <div dangerouslySetInnerHTML={{__html: proofUrl}} style={{maxHeight: 400, overflow: 'auto'}}/>,
                                width: 700,
                            });
                        }}
                    >
                        查看
                    </Button>
                );
            },
        },
        {
            title: '提交时间',
            dataIndex: 'applyTime',
            key: 'applyTime',
            width: 160,
            render: (time) => new Date(time).toLocaleString('zh-CN'),
        },
        {
            title: '操作',
            key: 'action',
            width: 180,
            fixed: 'right',
            render: (_, record) => {
                // 待审核状态：显示通过/拒绝按钮
                if (record.status === 'PENDING') {
                    return (
                        <Space size="small">
                            <Button
                                type="primary"
                                size="small"
                                icon={<CheckOutlined/>}
                                onClick={() => {
                                    setSelectedReward(record);
                                    setRewardAction('approve');
                                    rewardForm.setFieldsValue({
                                        finalScore: record.selfScore,
                                        amount: record.selfScore * 10, // 默认 1分 = 10元
                                    });
                                }}
                            >
                                通过
                            </Button>
                            <Button
                                danger
                                size="small"
                                icon={<CloseOutlined/>}
                                onClick={() => {
                                    setSelectedReward(record);
                                    setRewardAction('reject');
                                }}
                            >
                                拒绝
                            </Button>
                        </Space>
                    );
                }
                // 待发放状态（APPROVED）：显示标记发放按钮
                if (record.status === 'APPROVED') {
                    return (
                        <Button
                            type="primary"
                            size="small"
                            icon={<DollarOutlined/>}
                            onClick={() => {
                                setSelectedReward(record);
                                setRewardAction('pay');
                            }}
                        >
                            标记发放
                        </Button>
                    );
                }
                // 其他状态：显示状态标签
                return getStatusTag(record.status);
            },
        },
    ];

    if (isLoading) {
        return (
            <Layout title="审批管理">
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

    if (!isAuthenticated || !isAdmin) {
        return (
            <Layout title="审批管理">
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
                                    <Title level={2}>权限不足</Title>
                                    <Paragraph>您需要管理员权限才能访问此页面</Paragraph>
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={() => window.location.href = '/console'}
                                    >
                                        返回控制台
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
        <Layout title="审批管理">
            <div className="console-page-wrapper">
                <AntdThemeProvider>
                    <div className="console-page-container"
                         style={{padding: '24px', maxWidth: '1400px', margin: '0 auto'}}>
                        {/* 页面标题 */}
                        <div style={{marginBottom: 24}}>
                            <Space direction="vertical" size="middle" style={{width: '100%'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <Space>
                                        <SafetyOutlined style={{fontSize: '32px', color: '#1890ff'}}/>
                                        <Title level={2} style={{margin: 0}}>审批管理</Title>
                                    </Space>
                                    <Space>
                                        <Button
                                            icon={<ReloadOutlined/>}
                                            onClick={() => {
                                                if (activeTab === 'donations') {
                                                    fetchDonations();
                                                } else {
                                                    fetchRewards();
                                                }
                                            }}
                                        >
                                            刷新
                                        </Button>
                                        <Button
                                            icon={<ArrowLeftOutlined/>}
                                            onClick={() => window.location.href = '/console'}
                                        >
                                            返回控制台
                                        </Button>
                                    </Space>
                                </div>
                                <Text type="secondary">审核用户提交的赞助记录和奖励申请</Text>
                            </Space>
                        </div>

                        {/* 审批标签页 */}
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            items={[
                                {
                                    key: 'donations',
                                    label: (
                                        <span>
                                            <DollarOutlined/>
                                            赞助审批
                                            {donations.length > 0 && (
                                                <Tag color="processing" style={{marginLeft: 8}}>
                                                    {donations.length}
                                                </Tag>
                                            )}
                                        </span>
                                    ),
                                    children: (
                                        <Table
                                            columns={donationColumns}
                                            dataSource={donations}
                                            rowKey="id"
                                            loading={loadingDonations}
                                            locale={{
                                                emptyText: (
                                                    <Empty
                                                        description="暂无待审批的赞助"
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                    />
                                                ),
                                            }}
                                            pagination={{
                                                pageSize: 20,
                                                showSizeChanger: true,
                                                pageSizeOptions: ['10', '20', '50'],
                                                showTotal: (total) => `共 ${total} 条记录`,
                                            }}
                                            scroll={{x: 1200}}
                                        />
                                    ),
                                },
                                {
                                    key: 'rewards',
                                    label: (
                                        <span>
                                            <TrophyOutlined/>
                                            奖励审批
                                            {rewards.length > 0 && (
                                                <Tag color="processing" style={{marginLeft: 8}}>
                                                    {rewards.length}
                                                </Tag>
                                            )}
                                        </span>
                                    ),
                                    children: (
                                        <Table
                                            columns={rewardColumns}
                                            dataSource={rewards}
                                            rowKey="id"
                                            loading={loadingRewards}
                                            locale={{
                                                emptyText: (
                                                    <Empty
                                                        description="暂无待审批的奖励"
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                    />
                                                ),
                                            }}
                                            pagination={{
                                                pageSize: 20,
                                                showSizeChanger: true,
                                                pageSizeOptions: ['10', '20', '50'],
                                                showTotal: (total) => `共 ${total} 条记录`,
                                            }}
                                            scroll={{x: 1200}}
                                        />
                                    ),
                                },
                            ]}
                        />
                    </div>

                    {/* 赞助审批模态框 */}
                    <Modal
                        title={
                            <Space>
                                {donationAction === 'approve' ? <CheckCircleOutlined style={{color: '#52c41a'}}/> :
                                    <CloseCircleOutlined style={{color: '#ff4d4f'}}/>}
                                <span>{donationAction === 'approve' ? '通过赞助' : '拒绝赞助'}</span>
                            </Space>
                        }
                        open={!!selectedDonation}
                        onCancel={() => {
                            setSelectedDonation(null);
                            setDonationAction(null);
                            donationForm.resetFields();
                        }}
                        footer={null}
                        width={600}
                    >
                        {selectedDonation && (
                            <>
                                <Descriptions
                                    bordered
                                    size="small"
                                    column={1}
                                    style={{marginBottom: 16}}
                                >
                                    <Descriptions.Item label="赞助者">{selectedDonation.donorName}</Descriptions.Item>
                                    <Descriptions.Item label="金额">
                                        <Text strong style={{color: '#52c41a', fontSize: '16px'}}>
                                            ¥{Number(selectedDonation.amount).toFixed(2)}
                                        </Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="留言">
                                        {selectedDonation.message || <Text type="secondary">无留言</Text>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="联系方式">
                                        {selectedDonation.contactInfo || <Text type="secondary">未提供</Text>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="提交时间">
                                        {new Date(selectedDonation.donationTime).toLocaleString('zh-CN')}
                                    </Descriptions.Item>
                                </Descriptions>

                                {/* 支付凭证 - 使用富文本显示 */}
                                {selectedDonation.paymentProof && (
                                    <Card
                                        title="支付凭证"
                                        size="small"
                                        style={{marginBottom: 16}}
                                        bodyStyle={{maxHeight: 400, overflow: 'auto'}}
                                    >
                                        <div
                                            dangerouslySetInnerHTML={{__html: selectedDonation.paymentProof}}
                                            style={{
                                                wordBreak: 'break-word',
                                                '& img': {
                                                    maxWidth: '100%',
                                                    height: 'auto'
                                                }
                                            }}
                                        />
                                    </Card>
                                )}

                                <Divider/>

                                <Form
                                    form={donationForm}
                                    layout="vertical"
                                    onFinish={donationAction === 'approve' ? handleDonationApprove : handleDonationReject}
                                >
                                    <Form.Item
                                        label="备注"
                                        name="remark"
                                        rules={donationAction === 'reject' ? [
                                            {required: true, message: '拒绝时必须填写原因'}
                                        ] : []}
                                    >
                                        <TextArea
                                            placeholder={donationAction === 'approve' ? '可选填写备注信息' : '请说明拒绝原因'}
                                            rows={4}
                                        />
                                    </Form.Item>

                                    <Form.Item style={{marginBottom: 0, textAlign: 'right'}}>
                                        <Space>
                                            <Button onClick={() => {
                                                setSelectedDonation(null);
                                                setDonationAction(null);
                                                donationForm.resetFields();
                                            }}>
                                                取消
                                            </Button>
                                            <Button
                                                type={donationAction === 'approve' ? 'primary' : 'default'}
                                                danger={donationAction === 'reject'}
                                                htmlType="submit"
                                            >
                                                {donationAction === 'approve' ? '确认通过' : '确认拒绝'}
                                            </Button>
                                        </Space>
                                    </Form.Item>
                                </Form>
                            </>
                        )}
                    </Modal>

                    {/* 奖励审批模态框（通过/拒绝） */}
                    <Modal
                        title={
                            <Space>
                                {rewardAction === 'approve' ? <CheckCircleOutlined style={{color: '#52c41a'}}/> :
                                    <CloseCircleOutlined style={{color: '#ff4d4f'}}/>}
                                <span>{rewardAction === 'approve' ? '通过奖励申请' : '拒绝奖励申请'}</span>
                            </Space>
                        }
                        open={!!selectedReward && rewardAction !== 'pay'}
                        onCancel={() => {
                            setSelectedReward(null);
                            setRewardAction(null);
                            rewardForm.resetFields();
                        }}
                        footer={null}
                        width={700}
                    >
                        {selectedReward && (
                            <>
                                <Descriptions
                                    bordered
                                    size="small"
                                    column={1}
                                    style={{marginBottom: 16}}
                                >
                                    <Descriptions.Item label="贡献者">
                                        {selectedReward.contributorName || '未知'}
                                    </Descriptions.Item>
                                    <Descriptions.Item
                                        label="类型">{getRewardTypeTag(selectedReward.rewardType)}</Descriptions.Item>
                                    <Descriptions.Item label="自评分">
                                        <Tag color="blue">{selectedReward.selfScore} 分</Tag>
                                    </Descriptions.Item>
                                    {selectedReward.finalScore && (
                                        <Descriptions.Item label="最终评分">
                                            <Tag color="green">{selectedReward.finalScore} 分</Tag>
                                        </Descriptions.Item>
                                    )}
                                    {selectedReward.amount && (
                                        <Descriptions.Item label="奖励金额">
                                            <Text strong style={{color: '#faad14'}}>
                                                ¥{Number(selectedReward.amount).toFixed(2)}
                                            </Text>
                                        </Descriptions.Item>
                                    )}
                                    <Descriptions.Item label="描述">
                                        {selectedReward.description}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="提交时间">
                                        {new Date(selectedReward.applyTime || selectedReward.submittedAt).toLocaleString('zh-CN')}
                                    </Descriptions.Item>
                                </Descriptions>

                                {/* 证明材料 - 富文本显示 */}
                                {selectedReward.proofUrl && (
                                    <Card
                                        title="证明材料"
                                        size="small"
                                        style={{marginBottom: 16}}
                                        bodyStyle={{maxHeight: 400, overflow: 'auto'}}
                                    >
                                        <div
                                            dangerouslySetInnerHTML={{__html: selectedReward.proofUrl}}
                                            style={{
                                                wordBreak: 'break-word',
                                                '& img': {
                                                    maxWidth: '100%',
                                                    height: 'auto'
                                                }
                                            }}
                                        />
                                    </Card>
                                )}

                                <Divider/>

                                <Form
                                    form={rewardForm}
                                    layout="vertical"
                                    onFinish={rewardAction === 'approve' ? handleRewardApprove : handleRewardReject}
                                >
                                    {rewardAction === 'approve' && (
                                        <>
                                            <Form.Item
                                                label="最终评分"
                                                name="finalScore"
                                                rules={[
                                                    {required: true, message: '请输入最终评分'},
                                                    {type: 'number', min: 0, max: 100, message: '评分范围 0-100'},
                                                ]}
                                            >
                                                <InputNumber
                                                    style={{width: '100%'}}
                                                    min={0}
                                                    max={100}
                                                    placeholder="请输入最终评分（0-100）"
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                label="奖励金额"
                                                name="amount"
                                                rules={[
                                                    {required: true, message: '请输入奖励金额'},
                                                    {type: 'number', min: 0, message: '金额必须大于 0'},
                                                ]}
                                            >
                                                <InputNumber
                                                    style={{width: '100%'}}
                                                    prefix="¥"
                                                    min={0}
                                                    step={10}
                                                    precision={2}
                                                    placeholder="请输入奖励金额（元）"
                                                />
                                            </Form.Item>
                                        </>
                                    )}

                                    <Form.Item
                                        label="备注"
                                        name="remark"
                                        rules={rewardAction === 'reject' ? [
                                            {required: true, message: '拒绝时必须填写原因'}
                                        ] : []}
                                    >
                                        <TextArea
                                            placeholder={rewardAction === 'approve' ? '可选填写备注信息' : '请说明拒绝原因'}
                                            rows={4}
                                        />
                                    </Form.Item>

                                    <Form.Item style={{marginBottom: 0, textAlign: 'right'}}>
                                        <Space>
                                            <Button onClick={() => {
                                                setSelectedReward(null);
                                                setRewardAction(null);
                                                rewardForm.resetFields();
                                            }}>
                                                取消
                                            </Button>
                                            <Button
                                                type={rewardAction === 'approve' ? 'primary' : 'default'}
                                                danger={rewardAction === 'reject'}
                                                htmlType="submit"
                                            >
                                                {rewardAction === 'approve' ? '确认通过' : '确认拒绝'}
                                            </Button>
                                        </Space>
                                    </Form.Item>
                                </Form>
                            </>
                        )}
                    </Modal>

                    {/* 奖励标记发放模态框 */}
                    <Modal
                        title={
                            <Space>
                                <DollarOutlined style={{color: '#52c41a'}}/>
                                <span>标记为已发放</span>
                            </Space>
                        }
                        open={!!selectedReward && rewardAction === 'pay'}
                        onCancel={() => {
                            setSelectedReward(null);
                            setRewardAction(null);
                            payForm.resetFields();
                        }}
                        footer={null}
                        width={600}
                    >
                        {selectedReward && (
                            <>
                                <Descriptions
                                    bordered
                                    size="small"
                                    column={1}
                                    style={{marginBottom: 16}}
                                >
                                    <Descriptions.Item label="贡献者">
                                        {selectedReward.contributorName || '未知'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="类型">
                                        {getRewardTypeTag(selectedReward.rewardType)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="最终评分">
                                        <Tag color="green">{selectedReward.finalScore} 分</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="奖励金额">
                                        <Text strong style={{color: '#faad14'}}>
                                            ¥{Number(selectedReward.amount).toFixed(2)}
                                        </Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="描述">
                                        {selectedReward.description}
                                    </Descriptions.Item>
                                </Descriptions>

                                <Divider/>

                                <Form
                                    form={payForm}
                                    layout="vertical"
                                    onFinish={handleRewardPay}
                                    initialValues={{
                                        rewardTime: dayjs()
                                    }}
                                >
                                    <Form.Item
                                        label="发放时间"
                                        name="rewardTime"
                                        rules={[
                                            {required: true, message: '请选择发放时间'}
                                        ]}
                                    >
                                        <DatePicker
                                            showTime
                                            style={{width: '100%'}}
                                            placeholder="请选择发放时间"
                                            format="YYYY-MM-DD HH:mm:ss"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="备注"
                                        name="remark"
                                    >
                                        <TextArea
                                            placeholder="可选填写备注信息（如支付渠道、交易单号等）"
                                            rows={4}
                                        />
                                    </Form.Item>

                                    <Form.Item style={{marginBottom: 0, textAlign: 'right'}}>
                                        <Space>
                                            <Button onClick={() => {
                                                setSelectedReward(null);
                                                setRewardAction(null);
                                                payForm.resetFields();
                                            }}>
                                                取消
                                            </Button>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                            >
                                                确认发放
                                            </Button>
                                        </Space>
                                    </Form.Item>
                                </Form>
                            </>
                        )}
                    </Modal>
                </AntdThemeProvider>
            </div>
        </Layout>
    );
}
