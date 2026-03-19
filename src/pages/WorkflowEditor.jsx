import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, ArrowLeft, Plus, Trash2, Settings, List, 
  ChevronRight, GitMerge, MessageSquare, CheckSquare,
  GripVertical
} from 'lucide-react';
import { 
  createWorkflow, 
  updateWorkflow,
  getWorkflow,
  getSteps, 
  createStep,
  updateStep,
  deleteStep,
  getRules, 
  createRule,
  updateRule,
  deleteRule
} from '../services/api';

export default function WorkflowEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [workflow, setWorkflow] = useState({
    name: '',
    version: 1,
    is_active: true,
    input_schema: {},
    start_step_id: ''
  });

  const [steps, setSteps] = useState([]);
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStepModal, setShowStepModal] = useState(false);
  const [newStep, setNewStep] = useState({ name: '', step_type: 'task', order: 1 });

  const fetchSteps = async () => {
    if (id) {
      const stps = await getSteps(id);
      setSteps(stps);
    }
  };

  useEffect(() => {
    if (!isNew) {
      const fetchData = async () => {
        const wf = await getWorkflow(id);
        setWorkflow(wf);
        await fetchSteps();
        setLoading(false);
      };
      fetchData();
    } else {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    if (selectedStepId) {
      getRules(selectedStepId).then(setRules);
    } else {
      setRules([]);
    }
  }, [selectedStepId]);

  const saveWorkflow = async () => {
    if (isNew) {
      const created = await createWorkflow(workflow);
      navigate(`/workflows/${created._id}`);
    } else {
      await updateWorkflow(id, workflow);
    }
  };

  const handleAddStep = async () => {
    if (!newStep.name.trim()) {
      alert('Step name is required');
      return;
    }

    let workflowId = id;
    if (isNew) {
      if (!workflow.name.trim()) {
        alert('Please enter a workflow name first');
        return;
      }
      const createdWf = await createWorkflow(workflow);
      workflowId = createdWf._id;
      setWorkflow(createdWf);
      navigate(`/workflows/${workflowId}`, { replace: true });
    }

    const created = await createStep(workflowId, {
      ...newStep,
      order: steps.length + 1
    });
    
    // Update local state for immediate feedback
    setSteps([...steps, created]);
    setShowStepModal(false);
    setNewStep({ name: '', step_type: 'task', order: steps.length + 2 });
    setSelectedStepId(created._id);
  };

  const updateStepData = async (stepId, updates) => {
    const updated = await updateStep(stepId, updates);
    setSteps(steps.map(s => s._id === stepId ? updated : s));
  };

  const addRule = async () => {
    if (!selectedStepId) return;
    const newRule = await createRule(selectedStepId, {
      condition: 'amount > 0',
      next_step_id: '',
      priority: rules.length + 1
    });
    setRules([...rules, newRule]);
  };

  const updateRuleData = async (ruleId, updates) => {
    const updated = await updateRule(ruleId, updates);
    setRules(rules.map(r => r._id === ruleId ? updated : r));
  };

  const handleDeleteStep = async (stepId) => {
    // window.confirm is restricted in iframes, removing for immediate fix
    await deleteStep(stepId);
    await fetchSteps();
    if (selectedStepId === stepId) setSelectedStepId(null);
  };

  const handleDeleteRule = async (ruleId) => {
    await deleteRule(ruleId);
    setRules(rules.filter(r => r._id !== ruleId));
  };

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500">Loading editor...</div>;

  const selectedStep = steps.find(s => s._id === selectedStepId);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/workflows')} className="p-2 hover:bg-zinc-900 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">{isNew ? 'Create Workflow' : workflow.name}</h2>
            <p className="text-zinc-500 text-sm">Configure steps and automation rules.</p>
          </div>
        </div>
        <button 
          onClick={saveWorkflow}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 w-full md:w-auto justify-center"
        >
          <Save className="w-5 h-5" />
          {isNew ? 'Create Workflow' : 'Save Workflow'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Workflow Settings & Steps */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-4 h-4 text-zinc-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Workflow Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 ml-1">Workflow Name</label>
                <input 
                  type="text" 
                  value={workflow.name || ''} 
                  onChange={e => setWorkflow({...workflow, name: e.target.value})}
                  placeholder="e.g. Expense Approval"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 ml-1">Version</label>
                  <input 
                    type="number" 
                    value={workflow.version || 1} 
                    onChange={e => setWorkflow({...workflow, version: parseInt(e.target.value) || 1})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 ml-1">Status</label>
                  <select 
                    value={workflow.is_active ? 'active' : 'draft'}
                    onChange={e => setWorkflow({...workflow, is_active: e.target.value === 'active'})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 ml-1">Start Step</label>
                <select 
                  value={workflow.start_step_id || ''}
                  disabled={steps.length === 0}
                  onChange={async (e) => {
                    const newStartStepId = e.target.value;
                    setWorkflow({...workflow, start_step_id: newStartStepId});
                    if (!isNew) {
                      await updateWorkflow(id, {...workflow, start_step_id: newStartStepId});
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors appearance-none disabled:opacity-50"
                >
                  <option value="">Select Start Step</option>
                  {steps.map(s => (
                    <option key={s._id} value={s._id}>{s.name || 'Unnamed Step'}</option>
                  ))}
                </select>
                {steps.length === 0 && (
                  <p className="text-[10px] text-rose-500 mt-1 ml-1">Please create at least one step before selecting the start step.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 ml-1">Input Schema (JSON)</label>
                <textarea 
                  value={JSON.stringify(workflow.input_schema || {}, null, 2)} 
                  onChange={e => {
                    try {
                      setWorkflow({...workflow, input_schema: JSON.parse(e.target.value)});
                    } catch (err) {
                      // Silently fail while typing
                    }
                  }}
                  rows={8}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors font-mono text-xs"
                  placeholder='{ "amount": { "type": "number" } }'
                />
              </div>
            </div>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-zinc-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Steps</h3>
              </div>
              <button onClick={() => setShowStepModal(true)} className="text-indigo-400 hover:text-indigo-300 p-1">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step._id}
                  className={`w-full group rounded-2xl border transition-all overflow-hidden ${
                    selectedStepId === step._id 
                      ? "bg-indigo-600/10 border-indigo-500/50" 
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between p-4">
                    <button
                      onClick={() => setSelectedStepId(step._id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selectedStepId === step._id ? "bg-indigo-600 text-white" : "bg-zinc-800"
                      }`}>
                        {step.step_type === 'approval' ? <CheckSquare className="w-4 h-4" /> : 
                         step.step_type === 'notification' ? <MessageSquare className="w-4 h-4" /> : 
                         <GitMerge className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className={`font-semibold text-sm block ${selectedStepId === step._id ? "text-indigo-400" : "text-zinc-200"}`}>
                          {step.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{step.step_type}</span>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedStepId(step._id)}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteStep(step._id)}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {steps.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-zinc-800 rounded-2xl">
                  <p className="text-zinc-600 text-sm">No steps added yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Step Modal */}
        {showStepModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Add New Step</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 ml-1">Step Name</label>
                  <input 
                    type="text" 
                    value={newStep.name || ''}
                    onChange={e => setNewStep({...newStep, name: e.target.value})}
                    placeholder="e.g. Manager Approval"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 ml-1">Step Type</label>
                  <select 
                    value={newStep.step_type || 'task'}
                    onChange={e => setNewStep({...newStep, step_type: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                  >
                    <option value="task">Task</option>
                    <option value="approval">Approval</option>
                    <option value="notification">Notification</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowStepModal(false)}
                    className="flex-1 px-6 py-2.5 rounded-xl font-bold text-zinc-400 hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddStep}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all"
                  >
                    Add Step
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right: Step Configuration & Rules */}
        <div className="lg:col-span-8">
          {selectedStep ? (
            <div className="space-y-8">
              <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Step Configuration</h3>
                    <p className="text-zinc-500 text-sm">Define what happens in this step.</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteStep(selectedStepId)}
                    className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 ml-1">Step Name</label>
                    <input 
                      type="text" 
                      value={selectedStep.name || ''} 
                      onChange={e => updateStepData(selectedStep._id, { name: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-1.5 ml-1">Step Type</label>
                    <select 
                      value={selectedStep.step_type || 'task'} 
                      onChange={e => updateStepData(selectedStep._id, { step_type: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                    >
                      <option value="task">Task</option>
                      <option value="approval">Approval</option>
                      <option value="notification">Notification</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Automation Rules</h3>
                    <p className="text-zinc-500 text-sm">Rules are evaluated in priority order.</p>
                  </div>
                  <button onClick={addRule} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all">
                    <Plus className="w-4 h-4" />
                    Add Rule
                  </button>
                </div>

                <div className="space-y-4">
                  {rules.map((rule, index) => (
                    <div key={rule._id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex gap-6 items-start group">
                      <div className="mt-2 text-zinc-600 group-hover:text-zinc-400 transition-colors cursor-grab">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 ml-1">Condition</label>
                            <input 
                              type="text" 
                              value={rule.condition || ''} 
                              onChange={e => updateRuleData(rule._id, { condition: e.target.value })}
                              placeholder="e.g. amount > 100"
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 ml-1">Priority</label>
                            <input 
                              type="number" 
                              value={rule.priority || 0} 
                              onChange={e => updateRuleData(rule._id, { priority: parseInt(e.target.value) || 0 })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 ml-1">Next Step</label>
                          <select 
                            value={rule.next_step_id || ''} 
                            onChange={e => updateRuleData(rule._id, { next_step_id: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                          >
                            <option value="">End Workflow</option>
                            {steps.filter(s => s._id !== selectedStepId).map(s => (
                              <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteRule(rule._id)}
                        className="mt-6 text-zinc-600 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {rules.length === 0 && (
                    <div className="text-center py-12 bg-zinc-950/50 border-2 border-dashed border-zinc-800 rounded-3xl">
                      <p className="text-zinc-600">No rules defined for this step.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-[40px] p-12 text-center">
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4">
                <List className="w-8 h-8 opacity-20" />
              </div>
              <h3 className="text-lg font-bold text-zinc-400 mb-2">No Step Selected</h3>
              <p className="max-w-xs">Select a step from the list or create a new one to start configuring rules.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
