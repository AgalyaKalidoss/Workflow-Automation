import React, { useEffect, useState } from 'react';
import { History, CheckCircle2, XCircle, Clock, Search, Filter, RotateCcw, Ban, Eye } from 'lucide-react';
import { getExecutions, retryExecution, cancelExecution } from '../services/api';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function AuditLogs() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExecutions().then(data => {
      setExecutions(data);
      setLoading(false);
    });
  }, []);

  const handleRetry = async (id) => {
    await retryExecution(id);
    const data = await getExecutions();
    setExecutions(data);
  };

  const handleCancel = async (id) => {
    await cancelExecution(id);
    const data = await getExecutions();
    setExecutions(data);
  };

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredExecutions = executions.filter(exec => {
    const matchesSearch = exec._id.toLowerCase().includes(search.toLowerCase()) || 
                         exec.triggered_by.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Audit Logs</h2>
          <p className="text-zinc-400">Track every execution and rule evaluation in detail.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search executions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors appearance-none text-zinc-400"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-zinc-900/80 text-zinc-500 text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Execution ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Started At</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Triggered By</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">Loading logs...</td></tr>
              ) : filteredExecutions.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">No execution history found.</td></tr>
              ) : filteredExecutions.map((exec) => (
                <tr key={exec._id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-zinc-300">#{exec._id.slice(-8)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {exec.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : 
                       exec.status === 'failed' ? <XCircle className="w-4 h-4 text-rose-500" /> : 
                       exec.status === 'canceled' ? <Ban className="w-4 h-4 text-zinc-500" /> :
                       <Clock className="w-4 h-4 text-indigo-500" />}
                      <span className={`text-xs font-bold uppercase ${exec.status === 'completed' ? 'text-emerald-400' : exec.status === 'failed' ? 'text-rose-400' : exec.status === 'canceled' ? 'text-zinc-500' : 'text-indigo-400'}`}>
                        {exec.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {format(new Date(exec.started_at), 'MMM d, HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {exec.ended_at ? `${Math.round((new Date(exec.ended_at) - new Date(exec.started_at)) / 1000)}s` : '--'}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">{exec.triggered_by}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/execute/${exec.workflow_id}`} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-indigo-400 transition-colors" title="View Details">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {exec.status === 'failed' && (
                        <button onClick={() => handleRetry(exec._id)} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-emerald-400 transition-colors" title="Retry">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      {exec.status === 'in_progress' && (
                        <button onClick={() => handleCancel(exec._id)} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors" title="Cancel">
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
