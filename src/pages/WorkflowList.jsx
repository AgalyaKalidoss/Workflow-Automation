import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, GitBranch, Play, MoreVertical, Activity, CheckCircle2, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { getWorkflows, deleteWorkflow } from '../services/api';
import { format } from 'date-fns';

export default function WorkflowList() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkflows = () => {
    setLoading(true);
    getWorkflows().then(data => {
      setWorkflows(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleDelete = async (id) => {
    // window.confirm is restricted in iframes, removing for immediate fix
    await deleteWorkflow(id);
    fetchWorkflows();
  };

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredWorkflows = workflows.filter(wf => {
    const matchesSearch = wf.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'active' ? wf.is_active : !wf.is_active);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Workflows</h2>
          <p className="text-zinc-400">Manage and monitor your automated processes.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text" 
              placeholder="Search workflows..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <select 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors appearance-none text-zinc-400"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
          <Link 
            to="/workflows/new"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 justify-center"
          >
            <Plus className="w-5 h-5" />
            New Workflow
          </Link>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-zinc-900/80 text-zinc-500 text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Workflow</th>
                <th className="px-6 py-4">Version</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Loading workflows...</td></tr>
              ) : filteredWorkflows.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No workflows found.</td></tr>
              ) : filteredWorkflows.map((wf) => (
                <tr key={wf._id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors">
                        <GitBranch className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-zinc-200">{wf.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 font-mono text-sm">v{wf.version}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${wf.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
                      {wf.is_active ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {format(new Date(wf.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/execute/${wf._id}`} title="Execute" className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all">
                        <Play className="w-4 h-4" />
                      </Link>
                      <Link to={`/workflows/${wf._id}`} title="Edit" className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(wf._id)}
                        title="Delete"
                        className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
