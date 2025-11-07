const http = require('http');
const axios = require('axios');

const PORT = 3000;

// 导入API处理函数
const generateItinerary = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const { messages, model = 'qwen-turbo' } = JSON.parse(body);

      if (!messages || !Array.isArray(messages)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Invalid request body' }));
        return;
      }

      // 检查API密钥
      const apiKey = process.env.ALIBABA_API_KEY;
      if (!apiKey) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'API key not configured' }));
        return;
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
      );

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(response.data));
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);

      if (error.response) {
        // API返回错误
        res.statusCode = error.response.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: error.response.data?.message || 'API request failed',
          details: error.response.data
        }));
      } else if (error.code === 'ECONNABORTED') {
        // 超时错误
        res.statusCode = 408;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Request timeout' }));
      } else {
        // 其他错误
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    }
  });
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  if (req.url === '/generate-itinerary' || req.url === '/generate-itinerary/') {
    generateItinerary(req, res);
  } else if (req.url === '/health' || req.url === '/health/') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`✅ API服务运行在 http://localhost:${PORT}`);
});

