import { useState, useCallback, useRef } from 'react'
import { message } from 'antd'
import { voiceRecognition } from '../services/xfyun'

interface UseVoiceInputOptions {
  onResult?: (text: string) => void
  onError?: (error: string) => void
  onStart?: () => void
  onStop?: () => void
}

export const useVoiceInput = (options: UseVoiceInputOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recognizedText, setRecognizedText] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = useCallback(async () => {
    if (isRecording) {
      message.warning('已在录音中')
      return
    }

    try {
      setRecognizedText('')
      setRecordingTime(0)

      await voiceRecognition.startRecording(
        (text) => {
          setRecognizedText((prev) => prev + text)
          options.onResult?.(text)
        },
        (error) => {
          message.error(`语音识别失败：${error}`)
          options.onError?.(error)
          stopRecording()
        }
      )

      setIsRecording(true)
      options.onStart?.()
      message.success('开始录音，请说话...')

      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error: any) {
      message.error(error.message || '启动录音失败，请检查麦克风权限')
      options.onError?.(error.message || '启动录音失败')
    }
  }, [isRecording, options])

  const stopRecording = useCallback(() => {
    if (!isRecording) return

    voiceRecognition.stopRecording()
    setIsRecording(false)
    options.onStop?.()

    // 停止计时
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (recognizedText) {
      message.success('录音结束')
    } else {
      message.warning('未识别到语音内容')
    }

    setRecordingTime(0)
  }, [isRecording, recognizedText, options])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  const clearText = useCallback(() => {
    setRecognizedText('')
  }, [])

  return {
    isRecording,
    recognizedText,
    recordingTime,
    startRecording,
    stopRecording,
    toggleRecording,
    clearText,
  }
}
