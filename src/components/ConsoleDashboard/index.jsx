import React, { useState, useEffect } from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { TokenManager } from '@site/src/components/AuthGuard/TokenManager';
import { SponsorAPI } from '@site/src/utils/api';
import { AntdThemeProvider } from '@site/src/components/AntdThemeProvider';
import {
  Card,
  Statistic,
  Row,
  Col,
  Avatar,
  Button,
  Spin,
  Space,
  Typography,
  Divider,
  Modal,
  Alert,
  Tag,
  Badge,
  Tooltip,
  Grid
} from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  TrophyOutlined,
  GithubOutlined,
  LogoutOutlined,
  ReloadOutlined,
  BookOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  CrownOutlined,
  FileTextOutlined,
  LockOutlined,
  RightOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

/**
 * 控制台仪表板组件 - 使用 Ant Design
 */
export default function ConsoleDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const screens = useBreakpoint();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
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
        setUser(currentUser);
        fetchUserStats();
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

  const fetchUserStats = async () => {
    setStatsLoading(true);
    try {
      const [donationsData, rewardsData] = await Promise.all([
        SponsorAPI.getMyDonations(),
        SponsorAPI.getMyRewardApplications()
      ]);

      const donations = donationsData.success ? donationsData.data : [];
      const rewards = rewardsData.success ? rewardsData.data : [];

      const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
      const totalRewarded = rewards
        .filter(r => r.status === 'PAID')
        .reduce((sum, r) => sum + (r.amount || 0), 0);

      setUserStats({
        totalDonated,
        totalRewarded,
        donationCount: donations.length,
        contributionCount: rewards.length,
        rewardedCount: rewards.filter(r => r.status === 'PAID').length,
        pendingRewards: rewards.filter(r => r.status === 'PENDING').length,
        approvedRewards: rewards.filter(r => r.status === 'APPROVED').length
      });
    } catch (error) {
      console.error('获取用户统计失败:', error);
      setUserStats({
        totalDonated: 0,
        totalRewarded: 0,
        donationCount: 0,
        contributionCount: 0,
        rewardedCount: 0,
        pendingRewards: 0,
        approvedRewards: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await TokenManager.redirectToGitHubLogin();
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
        setShowLoginModal(false);
        fetchUserStats();
      }
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '您确定要退出登录吗？',
      okText: '确认退出',
      cancelText: '取消',
      onOk() {
        TokenManager.logout();
        setIsAuthenticated(false);
        setUser(null);
        setUserStats(null);
      }
    });
  };

  const handleRefreshStats = () => {
    fetchUserStats();
  };

  if (isLoading) {
    return (
      <div className="console-page-wrapper">
        <AntdThemeProvider>
          <div
            className="console-page-container"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '60vh'
            }}
          >
            <Spin size="large" tip="正在加载控制台..." />
          </div>
        </AntdThemeProvider>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="console-page-wrapper">
        <AntdThemeProvider>
          <div
            className="console-page-container"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '60vh',
              padding: '24px'
            }}
          >
            <Card style={{ maxWidth: 500, textAlign: 'center' }}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ fontSize: '64px' }}>🔐</div>
                <Title level={2}>需要登录</Title>
                <Paragraph type="secondary">
                  请登录您的账户以访问控制台功能
                </Paragraph>
                <Button
                  type="primary"
                  size="large"
                  icon={<GithubOutlined />}
                  onClick={() => setShowLoginModal(true)}
                  style={{ width: '100%' }}
                >
                  使用 GitHub 登录
                </Button>
              </Space>
            </Card>
          </div>

          {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
        </AntdThemeProvider>
      </div>
    );
  }

  return (
    <div className="console-page-wrapper">
      <AntdThemeProvider>
        <div className="console-page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          {/* 顶部用户信息栏 */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col>
                <Badge
                  count={user?.isAdmin ? <CrownOutlined style={{ color: '#faad14' }} /> : 0}
                  offset={[-5, 5]}
                >
                  <Avatar
                    size={64}
                    src={user?.avatarUrl}
                    icon={<UserOutlined />}
                  />
                </Badge>
              </Col>
              <Col flex="auto">
                <Space direction="vertical" size={0}>
                  <Space>
                    <Title level={4} style={{ margin: 0 }}>
                      {user?.nickname || user?.username}
                    </Title>
                    {user?.isAdmin && (
                      <Tag icon={<CrownOutlined />} color="gold">
                        管理员
                      </Tag>
                    )}
                  </Space>
                  <Space>
                    <Text type="secondary">@{user?.username}</Text>
                    {user?.githubUsername && (
                      <Tooltip title="GitHub 主页">
                        <a
                          href={user.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'inherit' }}
                        >
                          <GithubOutlined /> @{user.githubUsername}
                        </a>
                      </Tooltip>
                    )}
                  </Space>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Tooltip title="刷新数据">
                    <Button
                      icon={<ReloadOutlined spin={statsLoading} />}
                      onClick={handleRefreshStats}
                      loading={statsLoading}
                    >
                      刷新
                    </Button>
                  </Tooltip>
                  <Button
                    danger
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                  >
                    退出
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 统计卡片 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="赞助次数"
                  value={userStats?.donationCount ?? 0}
                  suffix="次"
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                  loading={statsLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="累计赞助"
                  value={userStats?.totalDonated ?? 0}
                  prefix="¥"
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                  loading={statsLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="贡献申请"
                  value={userStats?.contributionCount ?? 0}
                  suffix="次"
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                  loading={statsLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="累计奖励"
                  value={userStats?.totalRewarded ?? 0}
                  prefix="¥"
                  precision={2}
                  valueStyle={{ color: '#faad14' }}
                  loading={statsLoading}
                />
              </Card>
            </Col>
          </Row>

          {/* 待处理提醒 */}
          {userStats?.pendingRewards > 0 && (
            <Alert
              message={`您有 ${userStats.pendingRewards} 个待审核的奖励申请`}
              type="info"
              showIcon
              closable
              style={{ marginBottom: 24 }}
            />
          )}

          {/* 快速操作 */}
          <Card title={<><RocketOutlined /> 快速操作</>}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <QuickActionCard
                  icon={<BookOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
                  title="浏览文档"
                  description="查看 TabooLib 官方文档"
                  onClick={() => (window.location.href = '/docs/intro')}
                />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <QuickActionCard
                  icon={<DollarOutlined style={{ fontSize: 32, color: '#52c41a' }} />}
                  title="我的赞助"
                  description="查看我的赞助记录"
                  onClick={() => (window.location.href = '/console/donations')}
                />
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <QuickActionCard
                  icon={<RocketOutlined style={{ fontSize: 32, color: '#faad14' }} />}
                  title="我的奖励"
                  description="查看我的奖励申请"
                  onClick={() => (window.location.href = '/console/rewards')}
                />
              </Col>

              {user?.isAdmin && (
                <>
                  <Col xs={24} sm={12} lg={8}>
                    <QuickActionCard
                      icon={<CheckCircleOutlined style={{ fontSize: 32, color: '#13c2c2' }} />}
                      title="审批管理"
                      description="审批赞助和奖励申请"
                      onClick={() => (window.location.href = '/console/approvals')}
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <QuickActionCard
                      icon={<LockOutlined style={{ fontSize: 32, color: '#722ed1' }} />}
                      title="用户管理"
                      description="管理系统用户和权限"
                      onClick={() => Modal.info({ title: '开发中', content: '用户管理功能正在开发中...' })}
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <QuickActionCard
                      icon={<SettingOutlined style={{ fontSize: 32, color: '#eb2f96' }} />}
                      title="系统设置"
                      description="配置系统参数和功能"
                      onClick={() => Modal.info({ title: '开发中', content: '系统设置功能正在开发中...' })}
                    />
                  </Col>
                </>
              )}
            </Row>
          </Card>
        </div>
      </AntdThemeProvider>
    </div>
  );
}

/**
 * 快速操作卡片组件
 */
function QuickActionCard({ icon, title, description, badge, onClick }) {
  return (
    <Card
      hoverable
      onClick={onClick}
      style={{ height: '100%' }}
      bodyStyle={{ height: '100%' }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {icon}
          {badge !== undefined && badge > 0 && (
            <Badge count={badge} overflowCount={99} />
          )}
        </div>
        <div>
          <Title level={5} style={{ margin: '0 0 8px 0' }}>
            {title}
            <RightOutlined style={{ fontSize: 12, marginLeft: 8, opacity: 0.5 }} />
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {description}
          </Text>
        </div>
      </Space>
    </Card>
  );
}

/**
 * GitHub OAuth2 登录模态框组件
 */
function LoginModal({ onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError('');

    const result = await TokenManager.redirectToGitHubLogin();

    if (!result.success) {
      setError(result.message || '无法跳转到 GitHub 登录，请检查网络连接');
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <LockOutlined />
          <span>管理员登录</span>
        </Space>
      }
      open={true}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔐</div>
          <Paragraph type="secondary">
            使用 GitHub 账号登录管理控制台
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 12 }}>
            将在新窗口中打开 GitHub 授权页面
          </Text>
        </div>

        {error && (
          <Alert
            message="登录失败"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError('')}
          />
        )}

        <Button
          type="primary"
          size="large"
          icon={<GithubOutlined />}
          onClick={handleGitHubLogin}
          loading={isLoading}
          block
          style={{
            height: 48,
            fontSize: 16,
            background: '#24292e',
            borderColor: '#24292e'
          }}
        >
          {isLoading ? '正在打开登录窗口...' : '使用 GitHub 登录'}
        </Button>

        <Alert
          message="管理员权限说明"
          description={
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
              <li>使用 GitHub 账号登录</li>
              <li>仅限具有管理员权限的账户访问</li>
              <li>如需申请管理员权限，请联系系统管理员</li>
            </ul>
          }
          type="info"
          showIcon
        />
      </Space>
    </Modal>
  );
}
