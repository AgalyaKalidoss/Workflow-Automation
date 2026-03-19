import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GitBranch, Play, History, Settings, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: GitBranch, label: 'Workflows', path: '/workflows' },
  { icon: Play, label: 'Execution', path: '/execute' },
  { icon: History, label: 'Audit Logs', path: '/audit' },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen sticky top-0 hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Zap className="text-white w-6 h-6" />
        </div>
        <h1 className="font-bold text-xl text-zinc-100 tracking-tight">FlowEngine</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-indigo-600/10 text-indigo-400" 
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-900">
        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-zinc-300 font-medium">All systems go</span>
          </div>
        </div>
      </div>
    </div>
  );
}
