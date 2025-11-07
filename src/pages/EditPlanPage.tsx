import React, { useState, useEffect } from 'react';
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
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import VoiceRecorder from '../components/VoiceRecorder';
import { travelPlanService } from '../services/supabase';
import type { TravelPlan } from '../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const EditPlanPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();

  useEffect(() => {
    if (planId) {
      loadPlan(planId);
    }
  }, [planId]);

  const loadPlan = async (id: string) => {
    try {
      setInitialLoading(true);
      const data = await travelPlanService.getPlan(id);
      
      form.setFieldsValue({
        title: data.title,
        destination: data.destination,
        dates: [dayjs(data.start_date), dayjs(data.end_date)],
        budget: data.budget,
        participants: data.participants,
        interests: data.preferences.interests,
        description: data.preferences.description || '',
      });
    } catch (error: any) {
      message.error('加载行程失败');
      console.error(error);
    } finally {
      setInitialLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    if (!planId) return;

    setLoading(true);
    try {
      const [startDate, endDate] = values.dates;
      
      const updateData = {
        title: values.title,
        destination: values.destination,
        start_date: dayjs(startDate).format('YYYY-MM-DD'),
        end_date: dayjs(endDate).format('YYYY-MM-DD'),
        budget: values.budget,
        participants: values.participants,
        preferences: {
          interests: values.interests,
          description: values.description,
        },
      };

      await travelPlanService.updatePlan(planId, updateData);
      message.success('更新成功！');
      navigate(`/plans/${planId}`);
    } catch (error: any) {
      console.error('更新行程失败:', error);
      message.error(error.message || '更新失败，请重试');
    } finally {
      setLoading(false);
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

  if (initialLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
          编辑旅行计划
        </Title>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="行程名称"
            name="title"
            rules={[{ required: true, message: '请输入行程名称' }]}
          >
            <Input placeholder="例如：东京5日游" size="large" />
          </Form.Item>

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
            <Button
              style={{ marginRight: '16px' }}
              size="large"
              onClick={() => navigate(`/plans/${planId}`)}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit" size="large" loading={loading}>
              保存更改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EditPlanPage;
