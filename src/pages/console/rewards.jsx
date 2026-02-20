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
    Descriptions,
    Empty,
    Form,
    Input,
    message,
    Modal,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Typography
} from 'antd';
import {
    ArrowLeftOutlined,
    BookOutlined,
    BugOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    CopyOutlined,
    DollarOutlined,
    FileTextOutlined,
    LinkOutlined,
    PlusOutlined,
    RocketOutlined,
    SoundOutlined,
    TrophyOutlined
} from '@ant-design/icons';

const {Title, Text, Paragraph} = Typography;
const {TextArea} = Input;
const {Option} = Select;

export default function MyRewards() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [myRewards, setMyRewards] = useState([]);
    const [loadingRewards, setLoadingRewards] = useState(false);
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [viewingProof, setViewingProof] = useState(null);
    const [form] = Form.useForm();

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
            });

            if (data.success) {
                message.success('申请成功！您的奖励申请已提交，等待管理员审核');
                setShowRewardModal(false);
                form.resetFields();
                fetchRewards();
            } else {
                message.error(data.message || '申请失败');
            }
        } catch (err) {
            message.error(err.message || '申请失败，请重试');
        }
    };

    const copyTemplateToClipboard = () => {
        const template = `## 申请内容

**贡献类型：** 文档贡献/Bug修复/推广贡献/重大贡献

**贡献描述：**

描述你的贡献内容，请使用中文。

**证明材料：**

视情况而定

## 个人声明

我声明：

- ✅ 我的产出是我个人产出
- ✅ 我保证贡献内容的真实性和原创性
- ✅ 我同意将此贡献以 MIT 协议贡献给 TabooLib 项目
- ✅ 我理解奖励金额由 TabooLib 开发团队根据贡献质量评定`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(template)
                .then(() => {
                    message.success('申请格式模板已复制到剪贴板');
                })
                .catch(() => {
                    message.error('复制失败，请手动复制');
                });
        } else {
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
                message.error('复制失败，请手动复制');
            }
            document.body.removeChild(textarea);
        }
    };

    const getRewardTypeIcon = (type) => {
        const config = {
            BUG_FIX: <BugOutlined/>,
            DOCUMENTATION: <BookOutlined/>,
            PROMOTION: <SoundOutlined/>,
            MAJOR_CONTRIBUTION: <TrophyOutlined/>,
        };
        return config[type] || <FileTextOutlined/>;
    };

    const getRewardTypeTag = (type) => {
        const config = {
            BUG_FIX: {color: 'error', text: 'Bug 修复'},
            DOCUMENTATION: {color: 'blue', text: '文档贡献'},
            PROMOTION: {color: 'purple', text: '推广贡献'},
            MAJOR_CONTRIBUTION: {color: 'gold', text: '重大贡献'},
        };
        const typeConfig = config[type] || {color: 'default', text: type};
        return (
            <Tag icon={getRewardTypeIcon(type)} color={typeConfig.color}>
                {typeConfig.text}
            </Tag>
        );
    };

    const getStatusTag = (status) => {
        const config = {
            PENDING: {color: 'processing', icon: <ClockCircleOutlined/>, text: '待审核'},
            APPROVED: {color: 'success', icon: <CheckCircleOutlined/>, text: '已批准'},
            REJECTED: {color: 'error', icon: <CloseCircleOutlined/>, text: '已拒绝'},
            PAID: {color: 'cyan', icon: <DollarOutlined/>, text: '已发放'},
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
            title: '贡献者',
            dataIndex: 'contributorName',
            key: 'contributorName',
            width: 150,
            align: 'center',
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: '奖励类型',
            dataIndex: 'rewardType',
            key: 'rewardType',
            width: 150,
            align: 'center',
            render: (type) => getRewardTypeTag(type),
        },
        {
            title: '贡献描述',
            dataIndex: 'description',
            key: 'description',
            align: 'center',
            render: (description) => (
                <div style={{textAlign: 'left'}}>
                    <Paragraph ellipsis={{rows: 2, expandable: true}} style={{marginBottom: 0}}>
                        {description}
                    </Paragraph>
                </div>
            ),
        },
        {
            title: '奖励金额',
            dataIndex: 'amount',
            key: 'amount',
            width: 120,
            align: 'center',
            render: (amount) =>
                amount ? (
                    <Text strong style={{color: '#52c41a', fontSize: '16px'}}>
                        ¥{Number(amount).toFixed(2)}
                    </Text>
                ) : (
                    <Text type="secondary">-</Text>
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
            title: '证明材料',
            dataIndex: 'proofUrl',
            key: 'proofUrl',
            width: 120,
            align: 'center',
            render: (proofUrl, record) =>
                proofUrl ? (
                    <Button
                        type="link"
                        icon={<FileTextOutlined/>}
                        size="small"
                        onClick={() => setViewingProof(record)}
                    >
                        查看详情
                    </Button>
                ) : (
                    <Text type="secondary">-</Text>
                ),
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
            title: '申请时间',
            dataIndex: 'applyTime',
            key: 'applyTime',
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
    ];

    if (isLoading) {
        return (
            <Layout title="我的奖励申请">
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
            <Layout title="我的奖励申请">
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
                                    <Paragraph>请先登录以查看您的奖励申请</Paragraph>
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
        <Layout title="我的奖励申请">
            <div className="console-page-wrapper">
                <AntdThemeProvider>
                    <div className="console-page-container"
                         style={{padding: '24px', maxWidth: '1480px', margin: '0 auto'}}>
                        {/* 页面标题 */}
                        <div style={{marginBottom: 24}}>
                            <Space direction="vertical" size="middle" style={{width: '100%'}}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <Space>
                                        <RocketOutlined style={{fontSize: '32px', color: '#1890ff'}}/>
                                        <Title level={2} style={{margin: 0}}>我的奖励申请</Title>
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
                                            onClick={() => setShowRewardModal(true)}
                                        >
                                            申请奖励
                                        </Button>
                                    </Space>
                                </div>
                                <Text type="secondary">查看您的所有奖励申请和审核状态</Text>
                            </Space>
                        </div>

                        {/* 奖励列表 */}
                        <Table
                            columns={columns}
                            dataSource={myRewards}
                            rowKey="id"
                            loading={loadingRewards}
                            locale={{
                                emptyText: (
                                    <Empty
                                        description="暂无奖励申请"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    >
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined/>}
                                            onClick={() => setShowRewardModal(true)}
                                        >
                                            提交第一笔申请
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
                            scroll={{x: 1400}}
                        />
                    </div>

                    {/* 申请奖励模态框 */}
                    <Modal
                        title={
                            <Space>
                                <RocketOutlined style={{color: '#1890ff'}}/>
                                <span>申请奖励</span>
                            </Space>
                        }
                        open={showRewardModal}
                        onCancel={() => {
                            setShowRewardModal(false);
                            form.resetFields();
                        }}
                        footer={null}
                        width={700}
                    >
                        <Alert
                            message="审核流程说明"
                            description={
                                <div>
                                    <p style={{marginBottom: 8}}>请如实填写您的贡献信息，管理员将根据贡献质量评定奖励金额（赞助池余额的 0% ~ 25%）</p>
                                    <ol style={{paddingLeft: 20, marginBottom: 0}}>
                                        <li>提交申请后等待管理员审核</li>
                                        <li>审核通过后进入 <Text strong>3 天公示期</Text></li>
                                        <li>公示期结束后管理员将发放奖励</li>
                                    </ol>
                                </div>
                            }
                            type="info"
                            showIcon
                            style={{marginBottom: 16}}
                        />

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleApplyReward}
                            autoComplete="off"
                        >
                            <Form.Item
                                label="贡献者名称"
                                name="contributorName"
                                tooltip="留空则使用账号昵称"
                            >
                                <Input placeholder="请输入贡献者名称"/>
                            </Form.Item>

                            <Form.Item
                                label="奖励类型"
                                name="rewardType"
                                rules={[{required: true, message: '请选择奖励类型'}]}
                            >
                                <Select placeholder="请选择奖励类型">
                                    <Option value="BUG_FIX">
                                        <Space><BugOutlined/>Bug 修复</Space>
                                    </Option>
                                    <Option value="DOCUMENTATION">
                                        <Space><BookOutlined/>文档贡献</Space>
                                    </Option>
                                    <Option value="PROMOTION">
                                        <Space><SoundOutlined/>推广贡献</Space>
                                    </Option>
                                    <Option value="MAJOR_CONTRIBUTION">
                                        <Space><TrophyOutlined/>重大贡献</Space>
                                    </Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="贡献描述"
                                name="description"
                                rules={[
                                    {required: true, message: '请输入贡献描述'},
                                    {max: 100, message: '贡献描述不能超过 100 字'},
                                ]}
                            >
                                <TextArea
                                    placeholder="用于展示在列表里的内容"
                                    maxLength={100}
                                    showCount
                                    rows={4}
                                />
                            </Form.Item>

                            <Form.Item
                                label="证明材料"
                                name="proofUrl"
                                rules={[
                                    {required: true, message: '请输入证明材料链接'},
                                    {type: 'url', message: '请输入有效的 URL 地址'},
                                ]}
                            >
                                <div>
                                    <Alert
                                        message={
                                            <span>
                    请先在 <a href="https://github.com/FxRayHughes/taboowiki/discussions/new?category=%E8%B4%A1%E7%8C%AE%E7%94%B3%E8%AF%B7"
                              target="_blank" rel="noopener noreferrer">GitHub Discussions</a> 创建贡献申请，然后填写讨论链接
                    <br/>
                    (例如: https://github.com/FxRayHughes/taboowiki/discussions/2)
                  </span>
                                        }
                                        type="info"
                                        showIcon
                                        style={{marginBottom: 8}}
                                    />
                                    <Button
                                        icon={<CopyOutlined/>}
                                        onClick={copyTemplateToClipboard}
                                        style={{marginBottom: 8}}
                                    >
                                        复制申请格式模板
                                    </Button>
                                    <Input
                                        placeholder="https://github.com/FxRayHughes/taboowiki/discussions/2"
                                    />
                                </div>
                            </Form.Item>

                            <Form.Item style={{marginBottom: 0, textAlign: 'right'}}>
                                <Space>
                                    <Button onClick={() => {
                                        setShowRewardModal(false);
                                        form.resetFields();
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
                        title={
                            <Space>
                                <FileTextOutlined style={{color: '#1890ff'}}/>
                                <span>证明材料详情</span>
                            </Space>
                        }
                        open={!!viewingProof}
                        onCancel={() => setViewingProof(null)}
                        footer={[
                            <Button key="visit" type="primary" icon={<LinkOutlined/>} href={viewingProof?.proofUrl}
                                    target="_blank">
                                访问链接
                            </Button>,
                            <Button key="close" onClick={() => setViewingProof(null)}>
                                关闭
                            </Button>
                        ]}
                        width={600}
                    >
                        {viewingProof && (
                            <Descriptions column={1} bordered>
                                <Descriptions.Item label="贡献者">
                                    {viewingProof.contributorName}
                                </Descriptions.Item>
                                <Descriptions.Item label="奖励类型">
                                    {getRewardTypeTag(viewingProof.rewardType)}
                                </Descriptions.Item>
                                <Descriptions.Item label="贡献描述">
                                    {viewingProof.description}
                                </Descriptions.Item>
                                <Descriptions.Item label="奖励金额">
                                    {viewingProof.amount ? (
                                        <Text strong
                                              style={{color: '#52c41a'}}>¥{Number(viewingProof.amount).toFixed(2)}</Text>
                                    ) : (
                                        <Text type="secondary">待确定</Text>
                                    )}
                                </Descriptions.Item>
                                <Descriptions.Item label="证明材料">
                                    <a href={viewingProof.proofUrl} target="_blank" rel="noopener noreferrer">
                                        {viewingProof.proofUrl}
                                    </a>
                                </Descriptions.Item>
                            </Descriptions>
                        )}
                    </Modal>
                </AntdThemeProvider>
            </div>
        </Layout>
    );
}
