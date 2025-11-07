import axios from 'axios'

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { messages, model = 'qwen-turbo' } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request body' })
    }

    // 检查API密钥
    const apiKey = process.env.ALIBABA_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' })
    }

    // 调用阿里云百炼API
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model,
        input: {
          messages
        },
        parameters: {
          result_format: 'message',
          temperature: 0.7,
          max_tokens: 4000,
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30秒超时
      }
    )

    res.status(200).json(response.data)
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message)
    
    if (error.response) {
      // API返回错误
      res.status(error.response.status).json({
        error: error.response.data?.message || 'API request failed',
        details: error.response.data
      })
    } else if (error.code === 'ECONNABORTED') {
      // 超时错误
      res.status(408).json({ error: 'Request timeout' })
    } else {
      // 其他错误
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
