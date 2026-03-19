import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Terminal, CheckCircle2, XCircle, Loader2, GitBranch, ArrowRight, Activity } from 'lucide-react';
import { getWorkflows, executeWorkflow, getExecution } from '../services/api';

export default function ExecutionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [inputData, setInputData] = useState('{\n  "amount": 150,\n  "country": "US",\n  "priority": "High"\n}');
  const [executing, setExecuting] = useState(false);
  const [execution, setExecution] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchWorkflowsData = async () => {
      const wfs = await getWorkflows();
      const activeWfs = wfs.filter(w => w.is_active);
      setWorkflows(activeWfs);
      if (id) {
        const selected = activeWfs.find(w => w._id === id);
        if (selected) setSelectedWorkflow(selected);
      } else if (activeWfs.length > 0) {
        setSelectedWorkflow(activeWfs[0]);
      }
    };
    fetchWorkflowsData();
  }, [id]);

  // Poll for execution updates
  useEffect(() => {
    let interval;
    if (execution && execution.status === 'in_progress') {
      interval = setInterval(async () => {
        const updated = await getExecution(execution._id);
        setExecution(updated);
        setLogs(updated.logs || []);
        if (updated.status !== 'in_progress') {
          clearInterval(interval);
          setExecuting(false);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [execution]);

  const runWorkflow = async () => {
    if (!selectedWorkflow) return;
    
    setExecuting(true);
    setLogs([]);
    setExecution(null);

    try {
      const data = JSON.parse(inputData);
      const exec = await executeWorkflow(selectedWorkflow._id, data);
      setExecution(exec);
    } catch (e) {
      setLogs([{ timestamp: new Date().toISOString(), message: `Execution failed: ${e.message}`, type: 'error' }]);
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Execute Workflow</h2>
        <p className="text-zinc-400">Trigger a workflow and monitor its execution in real-time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2 ml-1">Select Workflow</label>
              <select 
                value={selectedWorkflow?._id || ''}
                onChange={e => setSelectedWorkflow(workflows.find(w => w._id === e.target.value) || null)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
              >
                {workflows.map(w => (
                  <option key={w._id} value={w._id}>{w.name} (v{w.version})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2 ml-1">Input Data (JSON)</label>
              <textarea 
                value={inputData}
                onChange={e => setInputData(e.target.value)}
                rows={10}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm"
              />
            </div>

            <button 
              onClick={runWorkflow}
              disabled={executing || !selectedWorkflow}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
            >
              {executing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
              {executing ? 'Executing...' : 'Start Workflow'}
            </button>
          </section>
        </div>

        {/* Right: Real-time Logs */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Execution Console</span>
              </div>
              {execution && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-mono">{execution._id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${execution.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : execution.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    {execution.status}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {logs.length === 0 && !executing && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                  <Activity className="w-12 h-12 opacity-10" />
                  <p>Ready for execution</p>
                </div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="relative pl-8 border-l border-zinc-800 last:border-0 pb-8 last:pb-0">
                  <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Step {i + 1}</span>
                        <h4 className="text-lg font-bold text-white">{log.step_name}</h4>
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase font-bold">{log.step_type}</span>
                      </div>
                      <span className="text-xs text-zinc-600 font-mono">{log.duration}</span>
                    </div>

                    {log.evaluated_rules && log.evaluated_rules.length > 0 && (
                      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50 space-y-2">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Rules Evaluated</p>
                        {log.evaluated_rules.map((rule, ri) => (
                          <div key={ri} className="flex items-center justify-between text-xs">
                            <code className="text-zinc-400">{rule.rule}</code>
                            <span className={rule.result ? "text-emerald-400 font-bold" : "text-zinc-600"}>
                              {rule.result ? "TRUE" : "FALSE"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-500">Selected next step:</span>
                      <span className={`font-bold ${log.selected_next_step === 'Task Rejection' ? 'text-rose-400' : log.selected_next_step === 'None' ? 'text-zinc-500' : 'text-indigo-400'}`}>
                        {log.selected_next_step}
                      </span>
                    </div>

                    {log.message && (
                      <div className={`text-sm p-3 rounded-lg ${log.status === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-zinc-900 text-zinc-400'}`}>
                        {log.message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {executing && (
                <div className="relative pl-8 animate-pulse">
                  <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-indigo-500/50" />
                  <div className="text-indigo-400 font-bold">Processing next step...</div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
