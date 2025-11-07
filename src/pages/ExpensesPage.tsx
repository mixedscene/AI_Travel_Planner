import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Space,
  Statistic,
  Row,
  Col,
  Tag,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { expenseService } from '../services/supabase';
import VoiceRecorder from '../components/VoiceRecorder';
import type { Expense, ExpenseCategory } from '../types';

const { TextArea } = Input;

const ExpensesPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (planId) {
      loadExpenses();
    }
  }, [planId]);

  const loadExpenses = async () => {
    if (!planId) return;
    
    try {
      setLoading(true);
      const data = await expenseService.getPlanExpenses(planId);
      setExpenses(data);
    } catch (error) {
      message.error('加载费用记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    form.setFieldsValue({
      ...expense,
      date: dayjs(expense.date),
    });
    setModalVisible(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await expenseService.deleteExpense(expenseId);
      message.success('删除成功');
      loadExpenses();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    if (!planId) return;

    try {
      const expenseData = {
        ...values,
        plan_id: planId,
        date: dayjs(values.date).format('YYYY-MM-DD'),
      };

      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, expenseData);
        message.success('更新成功');
      } else {
        await expenseService.addExpense(expenseData);
        message.success('添加成功');
      }

      setModalVisible(false);
      loadExpenses();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleVoiceResult = (text: string) => {
    const currentDesc = form.getFieldValue('description') || '';
    form.setFieldsValue({
      description: currentDesc + text,
    });
  };

  const getCategoryColor = (category: ExpenseCategory): string => {
    const colors: Record<ExpenseCategory, string> = {
      transportation: 'blue',
      accommodation: 'green',
      food: 'orange',
      activities: 'purple',
      shopping: 'magenta',
      other: 'default',
    };
    return colors[category];
  };

  const getCategoryLabel = (category: ExpenseCategory): string => {
    const labels: Record<ExpenseCategory, string> = {
      transportation: '交通',
      accommodation: '住宿',
      food: '餐饮',
      activities: '活动',
      shopping: '购物',
      other: '其他',
    };
    return labels[category];
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (category: ExpenseCategory) => (
        <Tag color={getCategoryColor(category)}>{getCategoryLabel(category)}</Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Expense) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditExpense(record)}
          >
            编辑
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteExpense(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryStats = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总支出"
              value={totalExpense}
              prefix="¥"
              precision={2}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="记录数" value={expenses.length} suffix="条" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均支出"
              value={expenses.length > 0 ? totalExpense / expenses.length : 0}
              prefix="¥"
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最高单笔"
              value={expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0}
              prefix="¥"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="费用记录"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddExpense}>
            添加费用
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={expenses}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingExpense ? '编辑费用' : '添加费用'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="category"
            label="类别"
            rules={[{ required: true, message: '请选择类别' }]}
          >
            <Select>
              <Select.Option value="transportation">交通</Select.Option>
              <Select.Option value="accommodation">住宿</Select.Option>
              <Select.Option value="food">餐饮</Select.Option>
              <Select.Option value="activities">活动</Select.Option>
              <Select.Option value="shopping">购物</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              prefix="¥"
            />
          </Form.Item>

          <Form.Item
            name="date"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="location" label="地点">
            <Input placeholder="可选" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
            extra={
              <div style={{ marginTop: '8px' }}>
                <VoiceRecorder
                  onResult={handleVoiceResult}
                  buttonText="语音输入"
                  buttonSize="small"
                />
              </div>
            }
          >
            <TextArea rows={4} placeholder="描述这笔费用..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
