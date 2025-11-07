import CryptoJS from 'crypto-js'
import { config } from '../config/env'

// 科大讯飞语音识别服务
export class XfyunVoiceRecognition {
  private socket: WebSocket | null = null
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private processor: ScriptProcessorNode | null = null
  private isRecording = false
  private resultCallback: ((text: string) => void) | null = null
  private errorCallback: ((error: string) => void) | null = null
  private audioBuffer: Int16Array[] = []
  private frameSize = 1280 // 40ms的音频数据 (16000 * 0.04 = 640样本 * 2字节 = 1280字节)

  constructor() {
    // 初始化
  }

  // 音频重采样到16kHz
  private resample(audioData: Float32Array, origSampleRate: number, targetSampleRate: number = 16000): Float32Array {
    if (origSampleRate === targetSampleRate) {
      return audioData
    }
    
    const sampleRateRatio = origSampleRate / targetSampleRate
    const newLength = Math.round(audioData.length / sampleRateRatio)
    const result = new Float32Array(newLength)
    
    let offsetResult = 0
    let offsetBuffer = 0
    
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio)
      let accum = 0
      let count = 0
      
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < audioData.length; i++) {
        accum += audioData[i]
        count++
      }
      
      result[offsetResult] = accum / count
      offsetResult++
      offsetBuffer = nextOffsetBuffer
    }
    
    return result
  }

  // 转换为16位PCM
  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length)
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]))
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    return output
  }

  // 转换为Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  // 检查配置是否完整
  private checkConfig(): boolean {
    const { appId, apiKey, apiSecret } = config.xfyun
    return !!(appId && apiKey && apiSecret)
  }

  // 生成WebSocket URL
  private getWebSocketUrl(): string {
    const { appId, apiKey, apiSecret } = config.xfyun
    
    if (!this.checkConfig()) {
      throw new Error('科大讯飞语音识别配置不完整，请检查环境变量')
    }
    
    const url = 'wss://iat-api.xfyun.cn/v2/iat'
    const host = 'iat-api.xfyun.cn'
    const date = new Date().toUTCString()
    const algorithm = 'hmac-sha256'
    const headers = 'host date request-line'
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret)
    const signature = CryptoJS.enc.Base64.stringify(signatureSha)
    const authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
    const authorization = btoa(authorizationOrigin)

    return `${url}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`
  }

  // 开始录音
  async startRecording(
    onResult: (text: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (this.isRecording) {
      throw new Error('已在录音中')
    }

    // 检查配置
    if (!this.checkConfig()) {
      throw new Error('科大讯飞语音识别配置不完整，请在环境变量中配置 VITE_XFYUN_APP_ID、VITE_XFYUN_API_KEY、VITE_XFYUN_API_SECRET')
    }

    // 检查HTTPS环境
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      throw new Error('语音识别功能需要在HTTPS环境或localhost下使用')
    }

    this.resultCallback = onResult
    this.errorCallback = onError

    try {
      // 请求麦克风权限 - 优化音频约束
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,  // 回声消除
          noiseSuppression: true,  // 噪音抑制
          autoGainControl: true,   // 自动增益控制
        }
      })

      // 创建音频上下文
      this.audioContext = new AudioContext()
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)

      // 创建处理器 - 使用较小的缓冲区以减少延迟
      this.processor = this.audioContext.createScriptProcessor(1024, 1, 1)
      this.audioBuffer = []

      // 连接WebSocket
      this.socket = new WebSocket(this.getWebSocketUrl())

      this.socket.onopen = () => {
        console.log('WebSocket连接成功')
        this.isRecording = true

        // 发送开始参数 - 优化业务参数提高识别精度
        const params = {
          common: {
            app_id: config.xfyun.appId,
          },
          business: {
            language: 'zh_cn',        // 中文
            domain: 'iat',            // 通用领域
            accent: 'mandarin',       // 普通话
            vad_eos: 2000,           // 静音检测时长2秒（更敏感）
            dwa: 'wpgs',             // 动态修正
            ptt: 0,                  // 标点符号
            rlang: 'zh-cn',          // 语言区域
            nunum: 0,                // 将数字转为阿拉伯数字
            speex_size: 0,           // 不使用speex压缩
          },
          data: {
            status: 0,
            format: 'audio/L16;rate=16000',
            encoding: 'raw',
          },
        }

        try {
          const paramsStr = JSON.stringify(params)
          console.log('发送参数:', paramsStr)
          this.socket?.send(paramsStr)
        } catch (error) {
          console.error('发送参数失败:', error)
          this.errorCallback?.('发送参数失败')
          this.stopRecording()
        }
      }

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.code !== 0) {
          this.errorCallback?.(data.message || '识别错误')
          this.stopRecording()
          return
        }

        if (data.data && data.data.result) {
          const result = data.data.result
          
          // 提取文本
          let text = ''
          result.ws.forEach((item: any) => {
            if (item.cw && item.cw.length > 0) {
              text += item.cw[0].w
            }
          })
          
          // 只在最终结果时返回（rst="rlt"表示最终结果，不是中间的pgs结果）
          // 这样可以避免重复累加中间的替换结果
          if (result.rst === 'rlt' && text.trim()) {
            this.resultCallback?.(text)
          }
        }
      }

      this.socket.onerror = () => {
        this.errorCallback?.('WebSocket连接错误')
        this.stopRecording()
      }

      this.socket.onclose = () => {
        console.log('WebSocket连接关闭')
      }

      // 处理音频数据
      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording || !this.socket) return

        const inputData = e.inputBuffer.getChannelData(0)
        
        // 获取实际采样率
        const sampleRate = this.audioContext?.sampleRate || 48000
        
        // 重采样到16kHz
        const resampled = this.resample(inputData, sampleRate, 16000)
        
        // 转换为16位PCM
        const pcmData = this.floatTo16BitPCM(resampled)
        
        // 累积音频数据
        this.audioBuffer.push(pcmData)
        
        // 计算累积的数据量
        const totalSamples = this.audioBuffer.reduce((sum, arr) => sum + arr.length, 0)
        
        // 当累积足够数据时发送（约40ms的音频）
        if (totalSamples >= 640) {  // 16000 * 0.04 = 640样本
          // 合并音频数据
          const mergedData = new Int16Array(totalSamples)
          let offset = 0
          for (const chunk of this.audioBuffer) {
            mergedData.set(chunk, offset)
            offset += chunk.length
          }
          
          // 清空缓冲区
          this.audioBuffer = []
          
          // 发送音频数据
          if (this.socket.readyState === WebSocket.OPEN) {
            try {
              const audioBase64 = this.arrayBufferToBase64(mergedData.buffer)
              const frame = {
                data: {
                  status: 1,
                  format: 'audio/L16;rate=16000',
                  encoding: 'raw',
                  audio: audioBase64
                }
              }
              this.socket.send(JSON.stringify(frame))
            } catch (error) {
              console.error('发送音频数据失败:', error)
            }
          }
        }
      }

      source.connect(this.processor)
      this.processor.connect(this.audioContext.destination)
    } catch (error: any) {
      this.errorCallback?.(error.message || '启动录音失败')
      this.stopRecording()
      throw error
    }
  }

  // 停止录音
  stopRecording(): void {
    this.isRecording = false

    // 发送剩余的音频数据
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.audioBuffer.length > 0) {
      try {
        const totalSamples = this.audioBuffer.reduce((sum, arr) => sum + arr.length, 0)
        const mergedData = new Int16Array(totalSamples)
        let offset = 0
        for (const chunk of this.audioBuffer) {
          mergedData.set(chunk, offset)
          offset += chunk.length
        }
        
        const audioBase64 = this.arrayBufferToBase64(mergedData.buffer)
        const frame = {
          data: {
            status: 1,
            format: 'audio/L16;rate=16000',
            encoding: 'raw',
            audio: audioBase64
          }
        }
        this.socket.send(JSON.stringify(frame))
      } catch (error) {
        console.error('发送剩余音频数据失败:', error)
      }
    }
    
    // 清空音频缓冲区
    this.audioBuffer = []

    // 发送结束标志
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const endParams = {
        data: {
          status: 2,
          format: 'audio/L16;rate=16000',
          encoding: 'raw',
        },
      }
      this.socket.send(JSON.stringify(endParams))
    }

    // 清理资源
    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    if (this.socket) {
      setTimeout(() => {
        this.socket?.close()
        this.socket = null
      }, 1000)
    }
  }

  // 检查是否正在录音
  isActive(): boolean {
    return this.isRecording
  }
}

// 创建单例实例
export const voiceRecognition = new XfyunVoiceRecognition()
