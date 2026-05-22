import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartSidebar } from './CartSidebar';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <CartSidebar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            borderRadius: '16px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          },
          success: {
            iconTheme: { primary: '#34d399', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#fff' },
          },
        }}
      />
    </div>
  );
}
