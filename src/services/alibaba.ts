import axios from 'axios'
import { config } from '../config/env'
import type { TravelPlan, Itinerary } from '../types'

// 检查是否在开发环境
const isDev = import.meta.env.DEV
const isProduction = import.meta.env.PROD

// 阿里云百炼API服务
const alibabaClient = axios.create({
  // 开发环境使用代理，生产环境使用Vercel Functions
  baseURL: isDev ? '/api/alibaba' : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 开发环境才添加Authorization头
if (isDev) {
  alibabaClient.defaults.headers['Authorization'] = `Bearer ${config.alibaba.apiKey}`
}

interface PlanningRequest {
  destination: string
  startDate: string
  endDate: string
  budget: number
  participants: number
  interests: string[]
  description?: string
}

// 生成行程规划提示词
function generatePrompt(request: PlanningRequest): string {
  const days = Math.ceil(
    (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / 
    (1000 * 60 * 60 * 24)
  ) + 1

  return `你是一位专业的旅行规划师，请根据以下信息为用户制定详细的旅行计划：

目的地：${request.destination}
旅行时长：${days}天（${request.startDate} 至 ${request.endDate}）
旅行预算：${request.budget}元人民币
同行人数：${request.participants}人
兴趣偏好：${request.interests.join('、')}
${request.description ? `详细需求：${request.description}` : ''}

请按照以下JSON格式返回详细的旅行计划：

{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "name": "活动名称",
          "description": "活动描述",
          "location": {
            "name": "地点名称",
            "address": "详细地址",
            "city": "城市",
            "country": "国家"
          },
          "duration": 120,
          "cost": 100,
          "category": "景点/娱乐/文化等",
          "rating": 4.5
        }
      ],
      "meals": [
        {
          "name": "餐厅名称",
          "type": "breakfast/lunch/dinner",
          "location": {
            "name": "餐厅名称",
            "address": "地址",
            "city": "城市",
            "country": "国家"
          },
          "cost": 50,
          "cuisine": "菜系",
          "rating": 4.0
        }
      ],
      "accommodation": {
        "name": "酒店名称",
        "type": "酒店/民宿/青旅",
        "location": {
          "name": "酒店名称",
          "address": "地址",
          "city": "城市",
          "country": "国家"
        },
        "cost_per_night": 300,
        "rating": 4.5,
        "amenities": ["WiFi", "早餐", "停车"]
      },
      "daily_cost": 500
    }
  ],
  "total_cost": 5000,
  "recommendations": [
    "建议1：提前预订景点门票可节省时间",
    "建议2：建议购买当地交通卡",
    "建议3：注意天气变化"
  ]
}

要求：
1. 确保总费用不超过预算的120%
2. 根据用户兴趣安排相关活动
3. 考虑地理位置，合理安排路线
4. 提供实用的旅行建议
5. 所有价格以人民币计算
6. 只返回JSON数据，不要包含其他说明文字`
}

// 调用AI生成行程
export async function generateItinerary(request: PlanningRequest): Promise<Itinerary> {
  try {
    const prompt = generatePrompt(request)

    const requestData = {
      model: 'qwen-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一位专业的旅行规划师，擅长根据用户需求制定详细、实用的旅行计划。'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    }

    // 根据环境选择不同的请求路径
    const endpoint = isDev ? '/services/aigc/text-generation/generation' : '/generate-itinerary'
    
    const response = await alibabaClient.post(endpoint, isDev ? {
      ...requestData,
      input: {
        messages: requestData.messages
      },
      parameters: {
        result_format: 'message',
        max_tokens: 4000,
        temperature: 0.7,
      }
    } : requestData)

    if (response.data.output && response.data.output.choices && response.data.output.choices[0]) {
      const content = response.data.output.choices[0].message.content
      
      // 尝试从响应中提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const itinerary = JSON.parse(jsonMatch[0])
        return itinerary as Itinerary
      }
      
      throw new Error('AI返回的格式不正确')
    }

    throw new Error('AI生成失败')
  } catch (error: any) {
    console.error('AI生成行程失败:', error)
    throw new Error(error.response?.data?.message || error.message || 'AI生成行程失败')
  }
}

// 优化行程（根据用户反馈调整）
export async function optimizeItinerary(
  currentPlan: TravelPlan,
  feedback: string
): Promise<Itinerary> {
  try {
    const prompt = `当前有一份旅行计划如下：
${JSON.stringify(currentPlan.itinerary, null, 2)}

用户反馈：${feedback}

请根据用户反馈优化这份旅行计划，返回优化后的完整JSON格式计划。保持原有的JSON结构不变。`

    const response = await alibabaClient.post('/services/aigc/text-generation/generation', {
      model: 'qwen-turbo',
      input: {
        messages: [
          {
            role: 'system',
            content: '你是一位专业的旅行规划师，擅长根据用户反馈优化旅行计划。'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      parameters: {
        result_format: 'message',
        max_tokens: 4000,
        temperature: 0.7,
      }
    })

    if (response.data.output && response.data.output.choices && response.data.output.choices[0]) {
      const content = response.data.output.choices[0].message.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const itinerary = JSON.parse(jsonMatch[0])
        return itinerary as Itinerary
      }
    }

    throw new Error('优化失败')
  } catch (error: any) {
    console.error('优化行程失败:', error)
    throw new Error(error.response?.data?.message || error.message || '优化行程失败')
  }
}

// 获取旅行建议
export async function getTravelTips(destination: string): Promise<string[]> {
  try {
    const prompt = `请为前往${destination}旅行的游客提供5-10条实用的旅行建议，包括但不限于：
- 最佳旅行时间
- 当地交通方式
- 必备物品
- 文化习俗注意事项
- 安全提示
- 美食推荐
- 购物建议

请以JSON数组格式返回：["建议1", "建议2", ...]`

    const response = await alibabaClient.post('/services/aigc/text-generation/generation', {
      model: 'qwen-turbo',
      input: {
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      parameters: {
        result_format: 'message',
        max_tokens: 1000,
      }
    })

    if (response.data.output && response.data.output.choices && response.data.output.choices[0]) {
      const content = response.data.output.choices[0].message.content
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }

    return []
  } catch (error) {
    console.error('获取旅行建议失败:', error)
    return []
  }
}
