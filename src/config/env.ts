// 环境变量配置
export const config = {
  // Supabase配置
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  
  // 阿里云百炼配置
  alibaba: {
    apiKey: import.meta.env.VITE_ALIBABA_API_KEY || '',
    apiUrl: import.meta.env.VITE_ALIBABA_API_URL || 'https://dashscope.aliyuncs.com/api/v1',
  },
  
  // 科大讯飞语音识别配置
  xfyun: {
    appId: import.meta.env.VITE_XFYUN_APP_ID || '',
    apiKey: import.meta.env.VITE_XFYUN_API_KEY || '',
    apiSecret: import.meta.env.VITE_XFYUN_API_SECRET || '',
  },
  
  // 高德地图配置
  amap: {
    key: import.meta.env.VITE_AMAP_KEY || '',
    securityCode: import.meta.env.VITE_AMAP_SECURITY_CODE || '',
  },
}

// 检查必要的环境变量
export const validateConfig = () => {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_ALIBABA_API_KEY',
    'VITE_AMAP_KEY',
  ];
  
  const missingVars = requiredEnvVars.filter(
    varName => !import.meta.env[varName]
  );
  
  if (missingVars.length > 0) {
    console.warn('Missing required environment variables:', missingVars);
  }
  
  return missingVars.length === 0;
};
