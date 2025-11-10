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
  Space,
  Tag,
} from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import VoiceRecorder from '../components/VoiceRecorder';
import { generateItinerary } from '../services/alibaba';
import { travelPlanService } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { geocode } from '../services/amap';

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
      });

      message.success({ content: '行程生成成功！', key: 'generating' });

      // 为没有坐标的地点补充坐标信息
      console.log('🗺️ 开始补充坐标信息...');
      for (const day of itinerary.days) {
        for (const activity of day.activities || []) {
          if (activity.location && (!activity.location.coordinates || !activity.location.coordinates.lng)) {
            const address = `${activity.location.city || values.destination}${activity.location.address || activity.location.name}`;
            console.log('🔍 查询地址:', address);
            try {
              const coords = await geocode(address);
              if (coords) {
                activity.location.coordinates = coords;
                console.log('✅ 坐标已补充:', activity.name, coords);
              } else {
                console.warn('⚠️ 坐标查询失败:', activity.name);
              }
            } catch (error) {
              console.error('❌ 坐标查询错误:', error);
            }
          }
        }
      }

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
    console.log('🎤 语音识别结果:', text);
    
    // 解析目的地（如：去北京、去日本东京）
    let destination = form.getFieldValue('destination');
    const destMatch = text.match(/去([\u4e00-\u9fa5A-Za-z\s]+?)(?:玩|旅游|旅行|吧|。|，|,|!|$)/);
    if (!destination && destMatch && destMatch[1]) {
      destination = destMatch[1].trim();
      console.log('✅ 识别到目的地:', destination);
    }

    // 解析同行人数（如：3人、两个人、一个人）
    let participants = form.getFieldValue('participants');
    const numWordMap: Record<string, number> = { 一: 1, 两: 2, 俩: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
    const peopleDigit = text.match(/(\d+)\s*[个]?人/);
    const peopleWord = text.match(/([一两俩二三四五六七八九十])\s*[个]?人/);
    if (!participants) {
      if (peopleDigit) {
        participants = parseInt(peopleDigit[1], 10);
        console.log('✅ 识别到人数:', participants);
      } else if (peopleWord && numWordMap[peopleWord[1]]) {
        participants = numWordMap[peopleWord[1]];
        console.log('✅ 识别到人数:', participants);
      }
    }

    // 解析预算（如：预算1万、预算10000、8000元、一万块）
    let budget = form.getFieldValue('budget');
    
    // 多种匹配模式
    const budgetPatterns = [
      /预算[是]?\s*([\d.]+)\s*([万千块元])/,           // "预算1万元"
      /预算[是]?\s*([一二三四五六七八九十百千万]+)/,    // "预算一万"
      /([\d.]+)\s*([万千])[块元]?/,                     // "1万元"
      /([\d.]+)\s*[块元]/,                              // "10000元"
      /([一二三四五六七八九十]+)[万千][块元]?/,         // "一万块"
    ];
    
    let budgetMatch = null;
    for (const pattern of budgetPatterns) {
      budgetMatch = text.match(pattern);
      if (budgetMatch) {
        console.log('💰 预算匹配模式:', pattern.source, '匹配结果:', budgetMatch[0]);
        break;
      }
    }
    
    if (!budget && budgetMatch) {
      let val = 0;
      const numStr = budgetMatch[1];
      
      // 处理阿拉伯数字
      if (/^\d+/.test(numStr)) {
        val = parseFloat(numStr);
      } else {
        // 处理中文数字
        const chineseToNum: Record<string, number> = {
          '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
          '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
        };
        
        // 处理 "一万"、"两万" 等
        for (const [key, value] of Object.entries(chineseToNum)) {
          if (numStr.startsWith(key)) {
            val = value;
            break;
          }
        }
        
        // 如果没有匹配到，尝试识别 "万"、"千"
        if (val === 0 && numStr.includes('万')) val = 1;
        if (val === 0 && numStr.includes('千')) val = 1;
      }
      
      // 识别单位
      const unit = budgetMatch[2] || text.slice(budgetMatch.index! + budgetMatch[0].length, budgetMatch.index! + budgetMatch[0].length + 1);
      let factor = 1;
      
      if (unit === '万' || text.includes('万')) factor = 10000;
      else if (unit === '千' || text.includes('千')) factor = 1000;
      else if (unit === '块' || unit === '元') factor = 1;
      
      if (val > 0) {
        budget = Math.round(val * factor);
        console.log('✅ 识别到预算:', budget, '元 (原文:', budgetMatch[0], ', 数值:', val, ', 单位:', unit, ', 倍数:', factor, ')');
      }
    }
    
    // 如果还是没识别到，输出调试信息
    if (!budget) {
      console.log('❌ 未能识别预算，原文:', text);
      console.log('   尝试手动查找数字:', text.match(/\d+/g));
    }

    // 解析日期或天数（如：5月1日到5月5日、5天、三天）
    let dates = form.getFieldValue('dates');
    const year = dayjs().year();
    const range1 = text.match(/(\d{1,2})月(\d{1,2})日?到(\d{1,2})月(\d{1,2})日?/);
    const range2 = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})\s*(到|至|~)\s*(\d{4})-(\d{1,2})-(\d{1,2})/);
    const daysDigit = text.match(/(\d+)\s*天/);
    const daysWord = text.match(/([一二三四五六七八九十])\s*天/);
    const wordToNum: Record<string, number> = numWordMap;
    if (!dates) {
      if (range2) {
        const s = dayjs(`${range2[1]}-${range2[2]}-${range2[3]}`);
        const e = dayjs(`${range2[5]}-${range2[6]}-${range2[7]}`);
        if (s.isValid() && e.isValid() && e.isAfter(s)) {
          dates = [s, e];
          console.log('✅ 识别到日期范围:', dates[0].format('YYYY-MM-DD'), '至', dates[1].format('YYYY-MM-DD'));
        }
      } else if (range1) {
        const s = dayjs(`${year}-${parseInt(range1[1])}-${parseInt(range1[2])}`);
        const e = dayjs(`${year}-${parseInt(range1[3])}-${parseInt(range1[4])}`);
        if (s.isValid() && e.isValid() && e.isAfter(s)) {
          dates = [s, e];
          console.log('✅ 识别到日期范围:', dates[0].format('YYYY-MM-DD'), '至', dates[1].format('YYYY-MM-DD'));
        }
      } else if (daysDigit || daysWord) {
        const n = daysDigit ? parseInt(daysDigit[1], 10) : wordToNum[daysWord![1]];
        if (n && n > 0) {
          const start = dayjs().add(1, 'day').startOf('day');
          const end = start.add(n - 1, 'day');
          dates = [start, end];
          console.log('✅ 识别到天数:', n, '天');
        }
      }
    }

    // 解析兴趣偏好
    let interests = form.getFieldValue('interests') || [];
    const interestKeywords: Record<string, string> = {
      '美食': 'food',
      '吃': 'food',
      '文化': 'culture',
      '自然': 'nature',
      '风景': 'nature',
      '历史': 'history',
      '古迹': 'history',
      '购物': 'shopping',
      '买': 'shopping',
      '夜生活': 'nightlife',
      '酒吧': 'nightlife',
      '冒险': 'adventure',
      '刺激': 'adventure',
      '放松': 'relaxation',
      '休闲': 'relaxation',
      '动漫': 'anime',
      '艺术': 'art',
    };
    
    for (const [keyword, value] of Object.entries(interestKeywords)) {
      if (text.includes(keyword) && !interests.includes(value)) {
        interests.push(value);
        console.log('✅ 识别到兴趣:', keyword);
      }
    }

    // 显示识别结果提示
    const recognized: string[] = [];
    if (destination) recognized.push(`目的地: ${destination}`);
    if (dates) recognized.push(`日期: ${dates[0].format('MM-DD')} 至 ${dates[1].format('MM-DD')}`);
    if (budget) recognized.push(`预算: ¥${budget.toLocaleString()}`);
    if (participants) recognized.push(`人数: ${participants}人`);
    if (interests.length > 0) recognized.push(`兴趣: ${interests.length}项`);
    
    console.log('📊 识别结果汇总:', recognized);
    
    if (recognized.length > 0) {
      message.success({
        content: `已识别：${recognized.join('，')}`,
        duration: 3,
      });
    } else {
      message.info('未识别到有效信息，请重新说一次');
    }

    form.setFieldsValue({
      ...(destination ? { destination } : {}),
      ...(participants ? { participants } : {}),
      ...(budget ? { budget } : {}),
      ...(dates ? { dates } : {}),
      ...(interests.length > 0 ? { interests } : {}),
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

          <Divider>
            <Space>
              <Text type="secondary">💡 快捷输入</Text>
            </Space>
          </Divider>

          <div style={{ 
            background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
          }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong style={{ fontSize: '16px' }}>🎤 语音输入</Text>
                <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
                  点击下方按钮，说出旅行计划，系统会自动识别并填入相应字段
                </Text>
              </div>
              <VoiceRecorder 
                onResult={handleVoiceResult}
                buttonText="开始语音输入"
                buttonSize="large"
              />
              <div style={{ 
                background: 'white',
                padding: '12px',
                borderRadius: '6px',
                border: '1px dashed #d9d9d9',
              }}>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  💬 <strong>示例：</strong>"我想去北京玩5天，预算1万元，两个人，喜欢历史文化"
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  系统会自动识别：<Tag color="blue">目的地</Tag><Tag color="green">日期</Tag><Tag color="orange">预算</Tag><Tag color="purple">人数</Tag>
                </Text>
              </div>
            </Space>
          </div>

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
