import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Space,
  Tag,
  Divider,
  Row,
  Col,
  Timeline,
  Statistic,
  Button,
  Empty,
  Spin,
  message,
  Descriptions,
} from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  StarOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { travelPlanService } from '../services/supabase';
import type { TravelPlan, DayPlan } from '../types';
import dayjs from 'dayjs';
import Map from '../components/Map';
import ErrorBoundary from '../components/ErrorBoundary';

const { Title, Text, Paragraph } = Typography;

const PlanDetailPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (planId) {
      loadPlan(planId);
    }
  }, [planId]);

  const loadPlan = async (id: string) => {
    try {
      setLoading(true);
      const data = await travelPlanService.getPlan(id);
      console.log('📋 加载的行程数据:', data);
      console.log('📅 行程天数:', data.itinerary?.days?.length || 0);
      if (data.itinerary?.days) {
        console.log('📌 每天活动数:', data.itinerary.days.map((d: any, i: number) => 
          `第${i+1}天: ${d.activities?.length || 0}个活动`
        ));
      }
      setPlan(data);
    } catch (error: any) {
      message.error('加载行程失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderDayPlan = (dayPlan: DayPlan, index: number) => {
    return (
      <Card key={index} style={{ marginBottom: '24px' }}>
        <Title level={4}>
          第{index + 1}天 - {dayjs(dayPlan.date).format('YYYY年MM月DD日')}
        </Title>

        <Divider orientation="left">
          <Space>
            <EnvironmentOutlined />
            <Text strong>活动安排</Text>
          </Space>
        </Divider>

        <Timeline 
          mode="left"
          items={dayPlan.activities?.map((activity, idx) => ({
            key: idx,
            label: <Text type="secondary">{activity.duration}分钟</Text>,
            children: (
              <Card size="small" style={{ marginBottom: '8px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Text strong>{activity.name}</Text>
                    {activity.rating && (
                      <Tag color="gold">
                        <StarOutlined /> {activity.rating}
                      </Tag>
                    )}
                    <Tag>{activity.category}</Tag>
                  </Space>
                  <Text type="secondary">{activity.description}</Text>
                  <Space>
                    <EnvironmentOutlined />
                    <Text type="secondary">{activity.location?.address || '地址未知'}</Text>
                  </Space>
                  <Text type="warning">费用：¥{activity.cost}</Text>
                </Space>
              </Card>
            )
          })) || []}
        />

        <Divider orientation="left">
          <Space>
            <ClockCircleOutlined />
            <Text strong>用餐</Text>
          </Space>
        </Divider>

        <Row gutter={[16, 16]}>
          {dayPlan.meals?.map((meal, idx) => (
            <Col span={8} key={idx}>
              <Card size="small">
                <Space direction="vertical">
                  <Tag color="blue">{meal.type}</Tag>
                  <Text strong>{meal.name}</Text>
                  <Text type="secondary">{meal.cuisine}</Text>
                  <Text type="warning">¥{meal.cost}</Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {dayPlan.accommodation && (
          <>
            <Divider orientation="left">住宿</Divider>
            <Card size="small">
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="酒店名称">
                  {dayPlan.accommodation.name}
                </Descriptions.Item>
                <Descriptions.Item label="类型">
                  {dayPlan.accommodation.type}
                </Descriptions.Item>
                <Descriptions.Item label="地址">
                  {dayPlan.accommodation.location.address}
                </Descriptions.Item>
                <Descriptions.Item label="每晚费用">
                  ¥{dayPlan.accommodation.cost_per_night}
                </Descriptions.Item>
                <Descriptions.Item label="评分">
                  <Tag color="gold">
                    <StarOutlined /> {dayPlan.accommodation.rating}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="设施">
                  {dayPlan.accommodation.amenities?.join('、')}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </>
        )}

        <Divider />
        <Text strong>当日费用：¥{dayPlan.daily_cost}</Text>
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Empty description="未找到行程" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space style={{ marginBottom: '16px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/my-plans')}
        >
          返回我的行程
        </Button>
        <Button
          type="primary"
          onClick={() => navigate(`/plans/${planId}/expenses`)}
        >
          费用管理
        </Button>
      </Space>

      <Card>
        <Title level={2}>{plan.title}</Title>
        
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Statistic
              title="目的地"
              value={plan.destination}
              prefix={<EnvironmentOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="出行日期"
              value={`${plan.start_date} ~ ${plan.end_date}`}
              prefix={<CalendarOutlined />}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="同行人数"
              value={plan.participants}
              suffix="人"
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="预算"
              value={plan.budget}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Col>
        </Row>

        <Divider />

        <div>
          <Text strong>兴趣偏好：</Text>
          <div style={{ marginTop: '8px' }}>
            {plan.preferences.interests.map((interest) => (
              <Tag key={interest} color="blue">
                {interest}
              </Tag>
            ))}
          </div>
        </div>

        {plan.itinerary?.recommendations && (
          <>
            <Divider />
            <div>
              <Text strong>旅行建议：</Text>
              <ul>
                {plan.itinerary.recommendations.map((tip, idx) => (
                  <li key={idx}>
                    <Text>{tip}</Text>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </Card>

      <Divider />

      {plan.itinerary?.days && plan.itinerary.days.length > 0 && (
        <>
          <Title level={3}>行程地图</Title>
          <Card style={{ marginBottom: '24px' }}>
            <ErrorBoundary fallback={<div style={{ padding: '50px', textAlign: 'center' }}>地图加载失败，请检查网络连接</div>}>
              <Map
                center={
                  plan.itinerary.days[0]?.activities?.[0]?.location?.coordinates || 
                  { lng: 116.397428, lat: 39.90923 }
                }
                markers={plan.itinerary.days.flatMap((day) =>
                  (day.activities || [])
                    .filter(activity => activity.location?.coordinates?.lng && activity.location?.coordinates?.lat)
                    .map((activity) => ({
                      position: activity.location.coordinates,
                      title: activity.name,
                      content: activity.description,
                    }))
                )}
                path={plan.itinerary.days.flatMap((day) =>
                  (day.activities || [])
                    .filter(a => a.location?.coordinates?.lng && a.location?.coordinates?.lat)
                    .map(a => a.location!.coordinates!)
                )}
                style={{ width: '100%', height: '500px' }}
              />
            </ErrorBoundary>
          </Card>
        </>
      )}

      <Title level={3}>详细行程</Title>
      
      {plan.itinerary?.days && plan.itinerary.days.length > 0 ? (
        <>
          {console.log('🎯 开始渲染行程，总天数:', plan.itinerary.days.length)}
          {plan.itinerary.days.map((dayPlan, index) => {
            console.log(`🔄 渲染第${index + 1}天:`, dayPlan);
            return renderDayPlan(dayPlan, index);
          })}
        </>
      ) : (
        <Empty description="暂无行程安排" />
      )}

      {plan.itinerary?.total_cost && (
        <Card style={{ marginTop: '24px', background: '#f0f5ff' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="预计总费用"
                value={plan.itinerary.total_cost}
                prefix="¥"
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="预算剩余"
                value={plan.budget - plan.itinerary.total_cost}
                prefix="¥"
                valueStyle={{
                  color: plan.budget - plan.itinerary.total_cost >= 0 ? '#3f8600' : '#cf1322',
                }}
              />
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default PlanDetailPage;
