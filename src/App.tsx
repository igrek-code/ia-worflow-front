import { Layout } from 'antd'
import { Navigate, Route, Routes } from 'react-router-dom'
import BoardPage from './pages/BoardPage'

export default function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>IA Workflow</span>
      </Layout.Header>
      <Layout.Content style={{ padding: 24 }}>
        <Routes>
          <Route path="/" element={<BoardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout.Content>
    </Layout>
  )
}
