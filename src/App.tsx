import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import './styles/globals.css';

export default function App() {
  return (
    <BrowserRouter basename="/assistencia-tecnica">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
