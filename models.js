import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema({
  name: { type: String, required: true },
  version: { type: Number, default: 1 },
  is_active: { type: Boolean, default: true },
  input_schema: { type: Object, default: {} },
  start_step_id: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export const Workflow = mongoose.model('Workflow', workflowSchema);

const stepSchema = new mongoose.Schema({
  workflow_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
  name: { type: String, required: true },
  step_type: { type: String, enum: ['task', 'approval', 'notification'], required: true },
  order: { type: Number, required: true },
  metadata: { type: Object, default: {} },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export const Step = mongoose.model('Step', stepSchema);

const ruleSchema = new mongoose.Schema({
  step_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Step', required: true },
  condition: { type: String, required: true },
  next_step_id: { type: String, default: '' },
  priority: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export const Rule = mongoose.model('Rule', ruleSchema);

const executionSchema = new mongoose.Schema({
  workflow_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
  workflow_version: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed', 'canceled'], default: 'pending' },
  data: { type: Object, default: {} },
  logs: { type: Array, default: [] }, // Store detailed log objects
  current_step_id: { type: String, default: '' },
  retries: { type: Number, default: 0 },
  triggered_by: { type: String, default: 'system' },
  started_at: { type: Date, default: Date.now },
  ended_at: { type: Date }
});

export const Execution = mongoose.model('Execution', executionSchema);
