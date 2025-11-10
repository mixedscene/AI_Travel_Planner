import React, { useState } from 'react';
import {
  Layout as AntLayout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Space,
} from 'antd';
import {
  HomeOutlined,
  PlusOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import type { MenuProps } from 'antd';
import { useAuth } from '../hooks/useAuth';

const { Header, Content, Sider } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/'),
    },
    {
      key: '/create-plan',
      icon: <PlusOutlined />,
      label: '创建行程',
      onClick: () => navigate('/create-plan'),
    },
    {
      key: '/my-plans',
      icon: <HistoryOutlined />,
      label: '我的行程',
      onClick: () => navigate('/my-plans'),
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: async () => {
        try {
          await signOut();
          navigate('/login');
        } catch (error) {
          console.error('Logout error:', error);
        }
      },
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh', background: 'var(--app-bg, #f7f8fa)' }}>
      <Sider
        theme="light"
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          borderRight: '1px solid #f0f0f0',
          background: 'linear-gradient(180deg, #ffffff 0%, #fafbff 100%)',
        }}
      >
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'linear-gradient(135deg, #8ec5fc 0%, #e0c3fc 100%)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1f1f1f',
          fontWeight: 'bold',
        }}>
          {!collapsed && 'AI旅行规划师'}
        </div>
        
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      
      <AntLayout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s', background: 'transparent' }}>
        <Header style={{ 
          padding: '0 24px', 
          background: 'linear-gradient(90deg, #ffffff 0%, #f6f9ff 100%)', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        }}>
          <Space>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
          </Space>
          
          <Space>
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button type="text" style={{ height: 'auto', padding: '4px 8px' }}>
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span>{user?.user_metadata?.name || user?.email || '用户'}</span>
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{ 
          margin: 0, 
          minHeight: 280,
          background: 'var(--app-bg, #f7f8fa)',
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
