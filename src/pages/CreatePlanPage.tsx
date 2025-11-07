import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  Button,
  Typography,
  Divider,
  Row,
  Col,
  message,
  Spin,
} from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import VoiceRecorder from '../components/VoiceRecorder';
import { generateItinerary } from '../services/alibaba';
import { travelPlanService } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const CreatePlanPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    if (!user) {
      message.error('请先登录');
      return;
    }

    console.log('Form values:', values);
    setLoading(true);
    setGenerating(true);

    try {
      // 格式化日期
      const [startDate, endDate] = values.dates;
      const formattedStartDate = dayjs(startDate).format('YYYY-MM-DD');
      const formattedEndDate = dayjs(endDate).format('YYYY-MM-DD');

      // 调用AI生成行程
      message.loading({ content: '正在使用AI生成旅行计划...', key: 'generating', duration: 0 });
      
      const itinerary = await generateItinerary({
        destination: values.destination,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        budget: values.budget,
        participants: values.participants,
        interests: values.interests,
        description: values.description,
      });

      message.success({ content: '行程生成成功！', key: 'generating' });

      // 保存到数据库
      const planData = {
        user_id: user.id,
        title: `${values.destination}${Math.ceil((new Date(formattedEndDate).getTime() - new Date(formattedStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}日游`,
        destination: values.destination,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        budget: values.budget,
        participants: values.participants,
        preferences: {
          interests: values.interests,
          description: values.description,
        },
        itinerary: itinerary,
        status: 'planned' as const,
      };

      const savedPlan = await travelPlanService.createPlan(planData);
      
      message.success('旅行计划已保存！');
      
      // 跳转到行程详情页
      navigate(`/plans/${savedPlan.id}`);
    } catch (error: any) {
      console.error('生成行程失败:', error);
      message.error({ 
        content: error.message || '生成行程失败，请重试', 
        key: 'generating' 
      });
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const handleVoiceResult = (text: string) => {
    // 将语音识别结果追加到描述字段
    const currentDesc = form.getFieldValue('description') || '';
    form.setFieldsValue({
      description: currentDesc + text,
    });
  };

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current.valueOf() < Date.now();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Spin spinning={generating} tip="AI正在为您生成个性化旅行计划，请稍候...">
        <Card>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
            创建旅行计划
          </Title>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="目的地"
                name="destination"
                rules={[{ required: true, message: '请输入旅行目的地' }]}
              >
                <Input placeholder="例如：日本东京" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="旅行日期"
                name="dates"
                rules={[{ required: true, message: '请选择旅行日期' }]}
              >
                <RangePicker 
                  style={{ width: '100%' }}
                  size="large"
                  disabledDate={disabledDate}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="预算 (人民币)"
                name="budget"
                rules={[{ required: true, message: '请输入旅行预算' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="10000"
                  size="large"
                  min={0}
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\¥\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="同行人数"
                name="participants"
                rules={[{ required: true, message: '请选择同行人数' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="1"
                  size="large"
                  min={1}
                  max={20}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="旅行兴趣偏好"
            name="interests"
            rules={[{ required: true, message: '请选择您的兴趣偏好' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择您感兴趣的活动"
              size="large"
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

          <Divider />

          <Form.Item
            label="详细需求"
            name="description"
            extra={
              <div style={{ marginTop: '8px' }}>
                <VoiceRecorder 
                  onResult={handleVoiceResult}
                  buttonText="语音输入需求"
                  buttonSize="small"
                />
                <Text type="secondary" style={{ marginLeft: '8px' }}>
                  点击按钮开始语音输入，说话内容会自动填入下方文本框
                </Text>
              </div>
            }
          >
            <TextArea
              rows={4}
              placeholder="例如：我想去日本，5天，预算1万元，喜欢美食和动漫，带孩子..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button type="primary" htmlType="submit" size="large" loading={loading}>
              开始AI智能规划
            </Button>
          </Form.Item>
        </Form>
      </Card>
      </Spin>
    </div>
  );
};

export default CreatePlanPage;
