import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Typography,
  Space,
  Tag,
  Empty,
  Row,
  Col,
  Statistic,
  Spin,
  message,
  Modal,
} from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { travelPlanService } from '../services/supabase';
import type { TravelPlan } from '../types';

const { Title, Text } = Typography;
const { confirm } = Modal;

const MyPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载用户的旅行计划
  useEffect(() => {
    if (user) {
      loadPlans();
    }
  }, [user]);

  const loadPlans = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await travelPlanService.getUserPlans(user.id);
      setPlans(data || []);
    } catch (error: any) {
      message.error('加载行程失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (planId: string) => {
    navigate(`/plans/${planId}`);
  };

  const handleEdit = (planId: string) => {
    navigate(`/plans/${planId}/edit`);
  };

  const handleDelete = (planId: string) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个旅行计划吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await travelPlanService.deletePlan(planId);
          message.success('删除成功');
          loadPlans(); // 重新加载列表
        } catch (error: any) {
          message.error('删除失败');
          console.error(error);
        }
      },
    });
  };

  const renderPlanActions = (plan: TravelPlan) => [
    <Button
      key="view"
      type="text"
      icon={<EyeOutlined />}
      onClick={() => handleView(plan.id)}
    >
      查看
    </Button>,
    <Button
      key="edit"
      type="text"
      icon={<EditOutlined />}
      onClick={() => handleEdit(plan.id)}
    >
      编辑
    </Button>,
    <Button
      key="delete"
      type="text"
      danger
      icon={<DeleteOutlined />}
      onClick={() => handleDelete(plan.id)}
    >
      删除
    </Button>,
  ];

  const renderPlanCard = (plan: TravelPlan) => (
    <List.Item actions={renderPlanActions(plan)}>
      <Card style={{ width: '100%' }} styles={{ body: { padding: '16px' } }}>
        <Row gutter={16}>
          <Col span={16}>
            <Space direction="vertical" size="small">
              <Title level={4} style={{ margin: 0 }}>
                {plan.title}
              </Title>
              <Text type="secondary">{plan.destination}</Text>
              <Space wrap>
                <Space>
                  <CalendarOutlined />
                  <Text>
                    {plan.start_date} 至 {plan.end_date}
                  </Text>
                </Space>
                <Space>
                  <UserOutlined />
                  <Text>{plan.participants} 人</Text>
                </Space>
                <Space>
                  <DollarOutlined />
                  <Text>¥{plan.budget.toLocaleString()}</Text>
                </Space>
              </Space>
              <div>
                {plan.preferences.interests.map((interest) => (
                  <Tag key={interest} color="blue">
                    {interest}
                  </Tag>
                ))}
              </div>
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical" size="small" style={{ textAlign: 'right', width: '100%' }}>
              <Text type="secondary">创建时间</Text>
              <Text>{new Date(plan.created_at).toLocaleDateString()}</Text>
            </Space>
          </Col>
        </Row>
      </Card>
    </List.Item>
  );

  // 计算统计数据
  const statistics = [
    {
      title: '总行程数',
      value: plans.length,
      suffix: '个',
    },
    {
      title: '已完成',
      value: plans.filter(plan => new Date(plan.end_date) < new Date()).length,
      suffix: '个',
    },
    {
      title: '进行中',
      value: plans.filter(plan => {
        const now = new Date();
        return new Date(plan.start_date) <= now && new Date(plan.end_date) >= now;
      }).length,
      suffix: '个',
    },
    {
      title: '计划中',
      value: plans.filter(plan => new Date(plan.start_date) > new Date()).length,
      suffix: '个',
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>正在加载您的旅行计划...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>我的旅行计划</Title>
        
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          {statistics.map((stat, index) => (
            <Col span={6} key={index}>
              <Card>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  suffix={stat.suffix}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {plans.length > 0 ? (
        <List
          itemLayout="vertical"
          dataSource={plans}
          renderItem={renderPlanCard}
        />
      ) : (
        <Card>
          <Empty
            description="您还没有创建任何旅行计划"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/create-plan')}>
              创建第一个计划
            </Button>
          </Empty>
        </Card>
      )}
    </div>
  );
};

export default MyPlansPage;
