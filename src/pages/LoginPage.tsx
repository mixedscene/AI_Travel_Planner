import React, { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Divider,
  Row,
  Col,
} from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const { Title, Text } = Typography

const LoginPage: React.FC = () => {
  const [form] = Form.useForm()
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      if (isRegister) {
        await signUp(values.email, values.password, values.name)
      } else {
        await signIn(values.email, values.password)
        navigate('/')
      }
    } catch (error) {
      console.error('Authentication error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <Row justify="center" style={{ width: '100%' }}>
        <Col xs={22} sm={16} md={12} lg={8} xl={6}>
          <Card style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Title level={2} style={{ color: '#1890ff', margin: 0 }}>
                AI旅行规划师
              </Title>
              <Text type="secondary">
                {isRegister ? '创建账户' : '登录您的账户'}
              </Text>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
            >
              {isRegister && (
                <Form.Item
                  label="姓名"
                  name="name"
                  rules={[{ required: true, message: '请输入您的姓名' }]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="请输入姓名"
                    size="large"
                  />
                </Form.Item>
              )}

              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="请输入邮箱"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="密码"
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                  size="large"
                />
              </Form.Item>

              {isRegister && (
                <Form.Item
                  label="确认密码"
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve()
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'))
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="请再次输入密码"
                    size="large"
                  />
                </Form.Item>
              )}

              <Form.Item style={{ marginBottom: '12px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  block
                >
                  {isRegister ? '注册' : '登录'}
                </Button>
              </Form.Item>

              {!isRegister && (
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <Link to="/reset-password">
                    <Text type="secondary">忘记密码？</Text>
                  </Link>
                </div>
              )}

              <Divider>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {isRegister ? '已有账户？' : '还没有账户？'}
                </Text>
              </Divider>

              <Button
                type="link"
                block
                onClick={() => {
                  setIsRegister(!isRegister)
                  form.resetFields()
                }}
              >
                {isRegister ? '登录' : '注册账户'}
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default LoginPage
