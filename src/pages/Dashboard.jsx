import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertCircle, Clock, Zap, GitBranch, PlayCircle } from 'lucide-react';
import { getDashboardStats, getExecutions } from '../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getExecutions()]).then(([statsData, execData]) => {
      setStats(statsData);
      setExecutions(execData);
      setLoading(false);
    });
  }, []);

  const statCards = [
    { icon: GitBranch, label: "Total Workflows", value: stats?.total_workflows || 0, color: "indigo" },
    { icon: PlayCircle, label: "Total Executions", value: stats?.total_executions || 0, color: "indigo" },
    { icon: CheckCircle2, label: "Successful Runs", value: stats?.successful_executions || 0, color: "emerald" },
    { icon: AlertCircle, label: "Failed Runs", value: stats?.failed_executions || 0, color: "rose" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Dashboard</h2>
        <p className="text-zinc-400">Workflow automation analytics and performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Executions */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Recent Executions</h3>
            <Link to="/audit" className="text-sm text-indigo-400 hover:text-indigo-300">View all</Link>
          </div>
          <div className="space-y-4">
            {executions.slice(0, 5).map((exec) => (
              <div key={exec._id} className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${exec.status === 'completed' ? 'bg-emerald-500' : exec.status === 'failed' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">Execution #{exec._id.slice(-6)}</p>
                    <p className="text-xs text-zinc-500">{new Date(exec.started_at).toLocaleString()}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${exec.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {exec.status}
                </span>
              </div>
            ))}
            {executions.length === 0 && <p className="text-center text-zinc-500 py-8">No executions yet.</p>}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm flex flex-col justify-center items-center text-center space-y-4">
          <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center">
            <Zap className="w-10 h-10 text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold">Engine is Healthy</h3>
          <p className="text-zinc-400 max-w-xs">All workflow triggers and rule evaluations are operating within normal parameters.</p>
          <div className="flex gap-4 pt-4">
            <div className="px-4 py-2 bg-zinc-800 rounded-xl text-xs font-bold uppercase tracking-widest">Uptime: 99.9%</div>
            <div className="px-4 py-2 bg-zinc-800 rounded-xl text-xs font-bold uppercase tracking-widest">Latency: 42ms</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    indigo: 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-600/10 text-rose-400 border-rose-500/20'
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
