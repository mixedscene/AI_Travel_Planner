import React from 'react';
import { Button, Row, Col, Card, Typography, Space } from 'antd';
import { PlusOutlined, HistoryOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <PlusOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      title: '创建新行程',
      description: '使用AI智能规划您的旅行路线',
      action: () => navigate('/create-plan'),
    },
    {
      icon: <HistoryOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      title: '我的行程',
      description: '查看和管理已创建的旅行计划',
      action: () => navigate('/my-plans'),
    },
    {
      icon: <UserOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
      title: '个人中心',
      description: '管理账户信息和偏好设置',
      action: () => navigate('/profile'),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <Title level={1} style={{ color: '#1890ff' }}>
          AI旅行规划师
        </Title>
        <Paragraph style={{ fontSize: '18px', color: '#666' }}>
          让人工智能为您规划完美的旅行体验
        </Paragraph>
      </div>

      <Row gutter={[24, 24]} justify="center">
        {features.map((feature, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Card
              hoverable
              style={{ textAlign: 'center', height: '200px' }}
              bodyStyle={{ padding: '24px' }}
              onClick={feature.action}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>{feature.icon}</div>
                <Title level={4} style={{ margin: 0 }}>
                  {feature.title}
                </Title>
                <Paragraph style={{ margin: 0, color: '#666' }}>
                  {feature.description}
                </Paragraph>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ textAlign: 'center', marginTop: '48px' }}>
        <Button 
          type="primary" 
          size="large" 
          onClick={() => navigate('/create-plan')}
        >
          开始规划旅行
        </Button>
      </div>
    </div>
  );
};

export default HomePage;
