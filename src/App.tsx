import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Scanner } from './pages/Scanner';
import { Verification } from './pages/Verification';
import { Routine } from './pages/Routine';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scan" element={<Scanner />} />
            <Route path="/verify/:id" element={<Verification />} />
            <Route path="/routine" element={<Routine />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
