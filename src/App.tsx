import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AuthProvider } from './hooks/useAuth'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import CreatePlanPage from './pages/CreatePlanPage'
import MyPlansPage from './pages/MyPlansPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import PlanDetailPage from './pages/PlanDetailPage'
import ExpensesPage from './pages/ExpensesPage'
import EditPlanPage from './pages/EditPlanPage'
import './App.css'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/create-plan" element={<CreatePlanPage />} />
                      <Route path="/my-plans" element={<MyPlansPage />} />
                      <Route path="/plans/:planId" element={<PlanDetailPage />} />
                      <Route path="/plans/:planId/edit" element={<EditPlanPage />} />
                      <Route path="/plans/:planId/expenses" element={<ExpensesPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </ConfigProvider>
  )
}

export default App
