import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, X, Zap } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Workflows', path: '/workflows' },
    { label: 'Execution', path: '/execute' },
    { label: 'Audit Logs', path: '/audit' },
  ];

  return (
    <div className="flex min-h-screen bg-black text-zinc-100 font-sans">
      <Sidebar />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2">
          <Zap className="text-indigo-500 w-6 h-6" />
          <span className="font-bold text-lg">FlowEngine</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-zinc-400">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black z-40 pt-20 px-6 space-y-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-xl text-lg font-medium transition-colors ${
                  isActive ? "bg-indigo-600/10 text-indigo-400" : "text-zinc-400"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}

      <main className="flex-1 p-6 md:p-10 pt-24 md:pt-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
