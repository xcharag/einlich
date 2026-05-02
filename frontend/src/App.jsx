import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Jugadores from './pages/Jugadores';
import Hinchas from './pages/Hinchas';
import Reportes from './pages/Reportes';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/jugadores" replace />} />
            <Route path="/jugadores" element={<Jugadores />} />
            <Route path="/hinchas" element={<Hinchas />} />
            <Route path="/reportes" element={<Reportes />} />
          </Routes>
          <a
            href="https://xchar.site"
            target="_blank"
            rel="noopener noreferrer"
            className="dev-credit"
          >
            Desarrollado por <strong>@XCHAR</strong>
          </a>
        </main>
      </div>
    </BrowserRouter>
  );
}
