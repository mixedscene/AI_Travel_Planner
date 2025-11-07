import React, { useState, useEffect } from 'react'
import { Button, message, Tooltip } from 'antd'
import { AudioOutlined, LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { voiceRecognition } from '../services/xfyun'
import { config } from '../config/env'

interface VoiceRecorderProps {
  onResult: (text: string) => void
  buttonText?: string
  buttonSize?: 'small' | 'middle' | 'large'
  buttonType?: 'default' | 'primary' | 'dashed' | 'link' | 'text'
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onResult,
  buttonText,
  buttonSize = 'middle',
  buttonType = 'default',
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recognizedText, setRecognizedText] = useState('')
  const [isConfigured, setIsConfigured] = useState(false)

  // 检查配置
  useEffect(() => {
    const checkConfig = () => {
      const { appId, apiKey, apiSecret } = config.xfyun
      setIsConfigured(!!(appId && apiKey && apiSecret))
    }
    checkConfig()
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      setRecordingTime(0)
    }

    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [isRecording])

  const handleStartRecording = async () => {
    if (!isConfigured) {
      message.error('语音识别功能未配置，请在环境变量中配置科大讯飞相关参数')
      return
    }

    try {
      setRecognizedText('')
      
      await voiceRecognition.startRecording(
        (text) => {
          // 处理识别结果
          setRecognizedText((prev) => prev + text)
          onResult(text)
        },
        (error) => {
          message.error(`语音识别失败：${error}`)
          setIsRecording(false)
        }
      )

      setIsRecording(true)
      message.success('开始录音，请说话...')
    } catch (error: any) {
      message.error(error.message || '启动录音失败，请检查麦克风权限')
    }
  }

  const handleStopRecording = () => {
    voiceRecognition.stopRecording()
    setIsRecording(false)
    
    if (recognizedText) {
      message.success('录音结束')
    } else {
      message.warning('未识别到语音内容')
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTooltipTitle = () => {
    if (!isConfigured) {
      return '语音识别功能未配置'
    }
    if (isRecording) {
      return `录音中 ${formatTime(recordingTime)}`
    }
    return '点击开始语音输入'
  }

  return (
    <Tooltip title={getTooltipTitle()}>
      <Button
        type={isRecording ? 'primary' : buttonType}
        size={buttonSize}
        icon={isRecording ? <LoadingOutlined /> : (isConfigured ? <AudioOutlined /> : <ExclamationCircleOutlined />)}
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        danger={isRecording}
        disabled={!isConfigured}
      >
        {buttonText || (isRecording ? '停止录音' : '语音输入')}
      </Button>
    </Tooltip>
  )
}

export default VoiceRecorder
