import { createClient } from '@supabase/supabase-js'
import { config } from '../config/env'

// 创建Supabase客户端
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
)

// 认证服务
export const authService = {
  // 注册
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    })
    
    if (error) {
      throw error
    }
    
    return data
  },

  // 登录
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      throw error
    }
    
    return data
  },

  // 退出登录
  async signOut() {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw error
    }
  },

  // 获取当前用户
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw error
    }
    
    return user
  },

  // 监听认证状态变化
  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
  },

  // 重置密码
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    if (error) {
      throw error
    }
  }
}

// 旅行计划服务
export const travelPlanService = {
  // 创建旅行计划
  async createPlan(plan: any) {
    const { data, error } = await supabase
      .from('travel_plans')
      .insert(plan)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return data
  },

  // 获取用户的旅行计划列表
  async getUserPlans(userId: string) {
    const { data, error } = await supabase
      .from('travel_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw error
    }
    
    return data
  },

  // 获取单个旅行计划
  async getPlan(planId: string) {
    const { data, error } = await supabase
      .from('travel_plans')
      .select('*')
      .eq('id', planId)
      .single()
    
    if (error) {
      throw error
    }
    
    return data
  },

  // 更新旅行计划
  async updatePlan(planId: string, updates: any) {
    const { data, error } = await supabase
      .from('travel_plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return data
  },

  // 删除旅行计划
  async deletePlan(planId: string) {
    const { error } = await supabase
      .from('travel_plans')
      .delete()
      .eq('id', planId)
    
    if (error) {
      throw error
    }
  }
}

// 费用记录服务
export const expenseService = {
  // 添加费用记录
  async addExpense(expense: any) {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return data
  },

  // 获取计划的费用记录
  async getPlanExpenses(planId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('plan_id', planId)
      .order('date', { ascending: false })
    
    if (error) {
      throw error
    }
    
    return data
  },

  // 更新费用记录
  async updateExpense(expenseId: string, updates: any) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return data
  },

  // 删除费用记录
  async deleteExpense(expenseId: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
    
    if (error) {
      throw error
    }
  }
}
