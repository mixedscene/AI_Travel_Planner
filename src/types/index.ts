// 用户类型
export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: UserPreferences;
  created_at: string;
}

// 用户偏好设置
export interface UserPreferences {
  language?: string;
  currency?: string;
  travelStyle?: 'budget' | 'comfort' | 'luxury';
  interests?: string[];
}

// 旅行计划类型
export interface TravelPlan {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  participants: number;
  preferences: TravelPreferences;
  itinerary?: Itinerary;
  created_at: string;
  updated_at: string;
}

// 旅行偏好
export interface TravelPreferences {
  interests: string[];
  transportation?: string[];
  accommodation?: string;
  activities?: string[];
  dietary?: string[];
}

// 行程安排
export interface Itinerary {
  days: DayPlan[];
  total_cost: number;
  recommendations: string[];
}

// 每日计划
export interface DayPlan {
  date: string;
  activities: Activity[];
  meals: Meal[];
  accommodation?: Accommodation;
  transportation?: Transportation[];
  daily_cost: number;
}

// 活动
export interface Activity {
  id: string;
  name: string;
  description: string;
  location: Location;
  duration: number;
  cost: number;
  category: string;
  rating?: number;
  photos?: string[];
}

// 餐厅/用餐
export interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  location: Location;
  cost: number;
  cuisine: string;
  rating?: number;
}

// 住宿
export interface Accommodation {
  id: string;
  name: string;
  type: string;
  location: Location;
  cost_per_night: number;
  rating?: number;
  amenities?: string[];
}

// 交通
export interface Transportation {
  id: string;
  type: string;
  from: Location;
  to: Location;
  cost: number;
  duration: number;
  departure_time?: string;
  arrival_time?: string;
}

// 位置信息
export interface Location {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  city: string;
  country: string;
}

// 费用记录
export interface Expense {
  id: string;
  plan_id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  location?: string;
  date: string;
  created_at: string;
}

// 费用类别
export type ExpenseCategory = 
  | 'transportation'
  | 'accommodation' 
  | 'food'
  | 'activities'
  | 'shopping'
  | 'other';

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// 语音识别结果
export interface VoiceRecognitionResult {
  text: string;
  confidence: number;
}
