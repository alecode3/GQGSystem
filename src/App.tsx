import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { VentasPage } from './pages/VentasPage';
import { NuevaVentaPage } from './pages/NuevaVentaPage';
import { CuentasCobrarPage } from './pages/CuentasCobrarPage';
import { PlazosPage } from './pages/PlazosPage';

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* Dashboard General */}
          <Route index element={<DashboardPage />} />
          
          {/* Rutas de Ventas */}
          <Route path="ventas" element={<VentasPage />} />
          <Route path="ventas/nueva" element={<NuevaVentaPage />} />
          
          {/* Rutas de Plazos */}
          <Route path="plazos" element={<PlazosPage />} />
          
          {/* Rutas de Cuentas a Cobrar */}
          <Route path="cuentas-cobrar" element={<CuentasCobrarPage />} />
          
          {/* Fallback Redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
