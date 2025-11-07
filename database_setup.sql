-- AI旅行规划师数据库设置脚本
-- 在Supabase管理面板的SQL编辑器中执行此脚本

-- 启用Row Level Security (RLS)
-- 用户表（通过auth.users自动创建，这里创建扩展的用户配置表）
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 旅行计划表
CREATE TABLE IF NOT EXISTS public.travel_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    participants INTEGER NOT NULL DEFAULT 1,
    preferences JSONB NOT NULL DEFAULT '{}',
    itinerary JSONB DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 费用记录表
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id UUID REFERENCES public.travel_plans(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    location TEXT DEFAULT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 启用Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略

-- 用户配置表策略
CREATE POLICY "用户只能查看和编辑自己的配置" ON public.user_profiles
    FOR ALL USING (auth.uid() = id);

-- 旅行计划表策略
CREATE POLICY "用户只能查看自己的旅行计划" ON public.travel_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的旅行计划" ON public.travel_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的旅行计划" ON public.travel_plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的旅行计划" ON public.travel_plans
    FOR DELETE USING (auth.uid() = user_id);

-- 费用记录表策略（通过旅行计划关联）
CREATE POLICY "用户只能查看自己计划的费用记录" ON public.expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.travel_plans 
            WHERE travel_plans.id = expenses.plan_id 
            AND travel_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "用户只能创建自己计划的费用记录" ON public.expenses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.travel_plans 
            WHERE travel_plans.id = expenses.plan_id 
            AND travel_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "用户只能更新自己计划的费用记录" ON public.expenses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.travel_plans 
            WHERE travel_plans.id = expenses.plan_id 
            AND travel_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "用户只能删除自己计划的费用记录" ON public.expenses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.travel_plans 
            WHERE travel_plans.id = expenses.plan_id 
            AND travel_plans.user_id = auth.uid()
        )
    );

-- 创建触发器函数更新 updated_at 字段
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为表创建更新触发器
CREATE TRIGGER on_user_profiles_updated
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_travel_plans_updated
    BEFORE UPDATE ON public.travel_plans
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_expenses_updated
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- 创建用户注册后自动创建用户配置的函数和触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 监听用户注册事件
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user();

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS travel_plans_user_id_idx ON public.travel_plans(user_id);
CREATE INDEX IF NOT EXISTS travel_plans_created_at_idx ON public.travel_plans(created_at);
CREATE INDEX IF NOT EXISTS expenses_plan_id_idx ON public.expenses(plan_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON public.expenses(date);
