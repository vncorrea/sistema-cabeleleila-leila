import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { BookAppointmentPage } from '@/pages/BookAppointmentPage'
import { ClientAreaPage } from '@/pages/ClientAreaPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { HomePage } from '@/pages/HomePage'
import { EquipePage } from '@/pages/EquipePage'
import { LoginPage } from '@/pages/LoginPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { UsuariosPage } from '@/pages/UsuariosPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/agendar" element={<BookAppointmentPage />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/historico" element={<HistoryPage />} />
        <Route path="/equipe" element={<EquipePage />} />
        <Route path="/cliente" element={<ClientAreaPage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  )
}

export default App
