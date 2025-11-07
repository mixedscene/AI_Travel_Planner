import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Select,
  Switch,
  Divider,
  Space,
  Avatar,
  Upload,
  message,
} from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { User } from '../types';

const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user] = useState<User>({
    id: '1',
    email: 'user@example.com',
    name: '张三',
    preferences: {
      language: 'zh-CN',
      currency: 'CNY',
      travelStyle: 'comfort',
      interests: ['food', 'culture'],
    },
    created_at: '2024-01-01',
  });

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // TODO: 更新用户信息API调用
      console.log('Update user info:', values);
      message.success('个人信息更新成功！');
    } catch (error) {
      message.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'avatar',
    listType: 'picture-card',
    className: 'avatar-uploader',
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('只能上传 JPG/PNG 格式的图片！');
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB！');
      }
      return isJpgOrPng && isLt2M;
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success('头像上传成功！');
      } else if (info.file.status === 'error') {
        message.error('头像上传失败！');
      }
    },
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
          个人中心
        </Title>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Upload {...uploadProps}>
            <Avatar size={100} icon={<UserOutlined />} style={{ marginBottom: '16px' }} />
          </Upload>
          <div>
            <Button icon={<UploadOutlined />} size="small">
              更换头像
            </Button>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            name: user.name,
            email: user.email,
            language: user.preferences?.language || 'zh-CN',
            currency: user.preferences?.currency || 'CNY',
            travelStyle: user.preferences?.travelStyle || 'comfort',
            interests: user.preferences?.interests || [],
          }}
        >
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入您的姓名' }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入您的邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input size="large" disabled />
          </Form.Item>

          <Divider>偏好设置</Divider>

          <Form.Item label="语言" name="language">
            <Select size="large">
              <Select.Option value="zh-CN">简体中文</Select.Option>
              <Select.Option value="en-US">English</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="默认货币" name="currency">
            <Select size="large">
              <Select.Option value="CNY">人民币 (¥)</Select.Option>
              <Select.Option value="USD">美元 ($)</Select.Option>
              <Select.Option value="EUR">欧元 (€)</Select.Option>
              <Select.Option value="JPY">日元 (¥)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="旅行风格" name="travelStyle">
            <Select size="large">
              <Select.Option value="budget">经济型</Select.Option>
              <Select.Option value="comfort">舒适型</Select.Option>
              <Select.Option value="luxury">豪华型</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="兴趣爱好" name="interests">
            <Select
              mode="multiple"
              size="large"
              placeholder="选择您的兴趣爱好"
              options={[
                { value: 'food', label: '美食' },
                { value: 'culture', label: '文化' },
                { value: 'nature', label: '自然风光' },
                { value: 'history', label: '历史古迹' },
                { value: 'shopping', label: '购物' },
                { value: 'nightlife', label: '夜生活' },
                { value: 'adventure', label: '冒险活动' },
                { value: 'relaxation', label: '休闲放松' },
                { value: 'anime', label: '动漫' },
                { value: 'art', label: '艺术' },
              ]}
            />
          </Form.Item>

          <Divider>通知设置</Divider>

          <Form.Item
            label="邮件通知"
            name="emailNotifications"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
            <Text type="secondary" style={{ marginLeft: '8px' }}>
              接收行程更新和旅行建议
            </Text>
          </Form.Item>

          <Form.Item
            label="推送通知"
            name="pushNotifications"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
            <Text type="secondary" style={{ marginLeft: '8px' }}>
              接收实时行程提醒
            </Text>
          </Form.Item>

          <Form.Item style={{ textAlign: 'center', marginTop: '32px' }}>
            <Space>
              <Button size="large">
                取消
              </Button>
              <Button type="primary" htmlType="submit" size="large" loading={loading}>
                保存更改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProfilePage;
