import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Scanner } from './pages/Scanner';
import { Verification } from './pages/Verification';
import { Routine } from './pages/Routine';
import { Pharmacies } from './pages/Pharmacies';
import { PriceComparison } from './pages/PriceComparison';
import { Cart } from './pages/Cart';
import { Orders } from './pages/Orders';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { PrescriptionHistory } from './pages/PrescriptionHistory';
import { PrescriptionComparison } from './pages/PrescriptionComparison';

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
            <Route path="/prescriptions" element={<PrescriptionHistory />} />
            <Route path="/prescriptions/compare/:newId/:baseId" element={<PrescriptionComparison />} />
            <Route path="/routine" element={<Routine />} />
            <Route path="/pharmacies" element={<Pharmacies />} />
            <Route path="/compare" element={<PriceComparison />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
