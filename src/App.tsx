import { Navigate, Route, Routes } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { SkillDetailPage } from './pages/SkillDetailPage'
import { SkillLibraryPage } from './pages/SkillLibraryPage'

function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content-shell">
        <Routes>
          <Route path="/" element={<SkillLibraryPage />} />
          <Route path="/skills/:skillId" element={<SkillDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
