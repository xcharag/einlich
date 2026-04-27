import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Jugadores from './pages/Jugadores';
import Hinchas from './pages/Hinchas';
import Reportes from './pages/Reportes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/jugadores" replace />} />
        <Route path="/jugadores" element={<Jugadores />} />
        <Route path="/hinchas" element={<Hinchas />} />
        <Route path="/reportes" element={<Reportes />} />
      </Routes>
    </BrowserRouter>
  );
}
