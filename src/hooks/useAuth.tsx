import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { authService } from '../services/supabase'
import { message } from 'antd'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取当前用户
    authService.getCurrentUser().then(user => {
      setUser(user)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // 监听认证状态变化
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      await authService.signIn(email, password)
      message.success('登录成功！')
    } catch (error: any) {
      message.error(error.message || '登录失败，请重试')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true)
      await authService.signUp(email, password, name)
      message.success('注册成功！请查看邮件激活账户')
    } catch (error: any) {
      message.error(error.message || '注册失败，请重试')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await authService.signOut()
      message.success('已安全退出')
    } catch (error: any) {
      message.error(error.message || '退出登录失败')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email)
      message.success('重置密码邮件已发送，请查收')
    } catch (error: any) {
      message.error(error.message || '发送重置邮件失败')
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
