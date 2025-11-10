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
            "address": "详细地址（必须包含完整的省市区和街道信息）",
            "coordinates": {
              "lng": 116.397428,
              "lat": 39.90923
            },
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

**重要要求**：
1. 确保总费用不超过预算的120%
2. 根据用户兴趣安排相关活动
3. 考虑地理位置，合理安排路线
4. 提供实用的旅行建议
5. 所有价格以人民币计算
6. **每个活动的location必须包含coordinates坐标信息（lng经度, lat纬度）**
7. **地址必须完整详细，包含省市区街道信息**
8. **必须为每一天生成完整的活动安排，天数必须等于${days}天**
9. **必须直接返回纯JSON对象，不要添加任何说明文字、markdown标记或代码块符号**
10. **响应内容必须是有效的JSON格式，可以直接被JSON.parse()解析**`

}

// 调用AI生成行程
export async function generateItinerary(request: PlanningRequest): Promise<Itinerary> {
  try {
    const days = Math.ceil(
      (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / 
      (1000 * 60 * 60 * 24)
    ) + 1
    
    console.log('🎯 请求生成行程，天数:', days, '天')
    
    const prompt = generatePrompt(request)

    const requestData = {
      model: 'qwen-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一位专业的旅行规划师，擅长根据用户需求制定详细、实用的旅行计划。你必须只返回纯JSON格式的数据，不要添加任何其他文字、解释或markdown标记。'
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
      
      console.log('AI返回的原始内容:', content)
      
      // 尝试从响应中提取JSON - 使用更精确的匹配
      try {
        // 修复 AI 返回的错误 JSON 格式
        // 问题：AI 可能返回多个 "days" 数组，导致 JSON.parse 只保留最后一个
        let fixedContent = content
        
        // 检查是否有多个 "days" 字段
        const daysMatches = content.match(/"days"\s*:\s*\[/g)
        if (daysMatches && daysMatches.length > 1) {
          console.log(`⚠️ 检测到 ${daysMatches.length} 个 "days" 字段，正在合并...`)
          
          // 使用更精确的方法提取所有 days 数组
          const allDays: any[] = []
          
          // 方法1: 逐个提取每个 "days": [...] 块
          let searchPos = 0
          let extractCount = 0
          
          while (searchPos < content.length) {
            const daysStart = content.indexOf('"days"', searchPos)
            if (daysStart === -1) break
            
            const arrayStart = content.indexOf('[', daysStart)
            if (arrayStart === -1) break
            
            // 找到匹配的右括号（考虑嵌套）
            let bracketCount = 1
            let arrayEnd = arrayStart + 1
            
            while (arrayEnd < content.length && bracketCount > 0) {
              if (content[arrayEnd] === '[') bracketCount++
              else if (content[arrayEnd] === ']') bracketCount--
              arrayEnd++
            }
            
            try {
              const arrayContent = content.substring(arrayStart, arrayEnd)
              const daysArray = JSON.parse(arrayContent)
              
              if (Array.isArray(daysArray) && daysArray.length > 0 && daysArray[0].date) {
                allDays.push(...daysArray)
                extractCount++
                console.log(`  - 提取到第 ${extractCount} 个 days 数组: ${daysArray.length} 天`)
              }
            } catch (e) {
              console.warn(`  - 提取第 ${extractCount + 1} 个数组失败:`, e)
            }
            
            searchPos = arrayEnd
          }
          
          if (allDays.length > 0) {
            console.log(`✅ 成功合并 ${allDays.length} 天行程`)
            
            // 重构 JSON：创建正确的格式
            // 提取 total_cost 和 recommendations
            let totalCost = 0
            let recommendations: string[] = []
            
            const totalCostMatch = content.match(/"total_cost"\s*:\s*(\d+)/)
            if (totalCostMatch) {
              totalCost = parseInt(totalCostMatch[1])
            }
            
            const recsMatch = content.match(/"recommendations"\s*:\s*(\[[^\]]+\])/)
            if (recsMatch) {
              try {
                recommendations = JSON.parse(recsMatch[1])
              } catch (e) {
                console.warn('recommendations 解析失败')
              }
            }
            
            // 构建正确的 JSON
            fixedContent = JSON.stringify({
              days: allDays,
              total_cost: totalCost,
              recommendations: recommendations
            })
            
            console.log('✅ 已重构为正确的 JSON 格式')
          }
        }
        
        // 方法1: 直接解析整个内容
        const itinerary = JSON.parse(fixedContent)
        console.log('✅ 成功解析行程，天数:', itinerary.days?.length || 0)
        
        // 验证天数
        if (!itinerary.days || itinerary.days.length === 0) {
          throw new Error('AI 返回的行程数据为空')
        }
        if (itinerary.days.length < days) {
          console.warn(`⚠️ AI 只生成了 ${itinerary.days.length} 天，期望 ${days} 天`)
        }
        
        return itinerary as Itinerary
      } catch (e1) {
        console.log('直接解析失败，尝试提取JSON片段')
        
        try {
          // 方法2: 提取 markdown 代码块中的 JSON
          const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
          if (codeBlockMatch) {
            const itinerary = JSON.parse(codeBlockMatch[1])
            console.log('✅ 从代码块解析行程，天数:', itinerary.days?.length || 0)
            
            if (itinerary.days && itinerary.days.length < days) {
              console.warn(`⚠️ AI 只生成了 ${itinerary.days.length} 天，期望 ${days} 天`)
            }
            
            return itinerary as Itinerary
          }
          
          // 方法3: 找到第一个 { 和最后一个 } 之间的内容
          const firstBrace = content.indexOf('{')
          const lastBrace = content.lastIndexOf('}')
          
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonStr = content.substring(firstBrace, lastBrace + 1)
            
            // 尝试清理常见的 JSON 格式问题
            const cleanedJson = jsonStr
              .replace(/,(\s*[}\]])/g, '$1')  // 移除尾随逗号
              .replace(/\n/g, ' ')            // 移除换行
              .replace(/\r/g, '')             // 移除回车
              .replace(/\t/g, ' ')            // 移除制表符
            
            const itinerary = JSON.parse(cleanedJson)
            console.log('✅ 从提取片段解析行程，天数:', itinerary.days?.length || 0)
            
            if (itinerary.days && itinerary.days.length < days) {
              console.warn(`⚠️ AI 只生成了 ${itinerary.days.length} 天，期望 ${days} 天`)
            }
            
            return itinerary as Itinerary
          }
        } catch (e2) {
          console.error('JSON提取失败:', e2)
          console.error('内容片段:', content.substring(0, 500))
        }
        
        throw new Error('AI返回的格式不正确，无法解析为有效的JSON')
      }
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

请根据用户反馈优化这份旅行计划，返回优化后的完整JSON格式计划。
**重要**：直接返回纯JSON对象，保持原有的JSON结构不变，不要添加任何说明文字或markdown标记。`

    const response = await alibabaClient.post('/services/aigc/text-generation/generation', {
      model: 'qwen-turbo',
      input: {
        messages: [
          {
            role: 'system',
            content: '你是一位专业的旅行规划师，擅长根据用户反馈优化旅行计划。你必须只返回纯JSON格式的数据，不要添加任何其他文字。'
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
      
      try {
        // 使用相同的解析逻辑
        const itinerary = JSON.parse(content)
        return itinerary as Itinerary
      } catch (e1) {
        try {
          const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
          if (codeBlockMatch) {
            const itinerary = JSON.parse(codeBlockMatch[1])
            return itinerary as Itinerary
          }
          
          const firstBrace = content.indexOf('{')
          const lastBrace = content.lastIndexOf('}')
          
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonStr = content.substring(firstBrace, lastBrace + 1)
            const cleanedJson = jsonStr
              .replace(/,(\s*[}\]])/g, '$1')
              .replace(/\n/g, ' ')
              .replace(/\r/g, '')
              .replace(/\t/g, ' ')
            
            const itinerary = JSON.parse(cleanedJson)
            return itinerary as Itinerary
          }
        } catch (e2) {
          console.error('优化行程JSON解析失败:', e2)
        }
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

**重要**：直接返回纯JSON数组格式：["建议1", "建议2", ...]
不要添加任何说明文字或markdown标记。`

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
      
      try {
        return JSON.parse(content)
      } catch (e1) {
        try {
          const codeBlockMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/)
          if (codeBlockMatch) {
            return JSON.parse(codeBlockMatch[1])
          }
          
          const firstBracket = content.indexOf('[')
          const lastBracket = content.lastIndexOf(']')
          
          if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            const jsonStr = content.substring(firstBracket, lastBracket + 1)
            const cleanedJson = jsonStr
              .replace(/,(\s*])/g, '$1')
              .replace(/\n/g, ' ')
              .replace(/\r/g, '')
              .replace(/\t/g, ' ')
            
            return JSON.parse(cleanedJson)
          }
        } catch (e2) {
          console.error('旅行建议JSON解析失败:', e2)
        }
      }
    }

    return []
  } catch (error) {
    console.error('获取旅行建议失败:', error)
    return []
  }
}
