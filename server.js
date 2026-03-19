import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { Workflow, Step, Rule, Execution } from './models.js';
import { evaluateCondition } from './src/services/workflowEngine.js';
import mongoose from 'mongoose';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {

  // ✅ Connect to MongoDB ONLY ONCE
  await mongoose.connect("mongodb://127.0.0.1:27017/workflowDB");
  console.log("MongoDB Connected");

  const app = express();
const PORT = process.env.PORT || 3000;
  app.use(cors());
  app.use(express.json());
  // --- Workflows API ---
  app.post('/api/workflows', async (req, res) => {
    try {
      const workflow = new Workflow(req.body);
      await workflow.save();
      res.status(201).json(workflow);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/workflows', async (req, res) => {
    try {
      const workflows = await Workflow.find().sort({ created_at: -1 });
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/workflows/:id', async (req, res) => {
    try {
      const workflow = await Workflow.findById(req.params.id);
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/workflows/:id', async (req, res) => {
    try {
      const workflow = await Workflow.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/workflows/:id', async (req, res) => {
    try {
      await Workflow.findByIdAndDelete(req.params.id);
      await Step.deleteMany({ workflow_id: req.params.id });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Steps API ---
  app.get('/api/workflows/:workflowId/steps', async (req, res) => {
    try {
      const steps = await Step.find({ workflow_id: req.params.workflowId }).sort({ order: 1 });
      res.json(steps);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/workflows/:workflowId/steps', async (req, res) => {
    try {
      const step = new Step({ ...req.body, workflow_id: req.params.workflowId });
      await step.save();
      res.status(201).json(step);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/steps/:id', async (req, res) => {
    try {
      const step = await Step.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(step);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/steps/:id', async (req, res) => {
    try {
      await Step.findByIdAndDelete(req.params.id);
      await Rule.deleteMany({ step_id: req.params.id });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Rules API ---
  app.get('/api/steps/:stepId/rules', async (req, res) => {
    try {
      const rules = await Rule.find({ step_id: req.params.stepId }).sort({ priority: 1 });
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/steps/:stepId/rules', async (req, res) => {
    try {
      const rule = new Rule({ ...req.body, step_id: req.params.stepId });
      await rule.save();
      res.status(201).json(rule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/rules/:id', async (req, res) => {
    try {
      const rule = await Rule.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(rule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/rules/:id', async (req, res) => {
    try {
      await Rule.findByIdAndDelete(req.params.id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Executions API ---
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const total_workflows = await Workflow.countDocuments();
      const total_executions = await Execution.countDocuments();
      const successful_executions = await Execution.countDocuments({ status: 'completed' });
      const failed_executions = await Execution.countDocuments({ status: 'failed' });
      
      res.json({
        total_workflows,
        total_executions,
        successful_executions,
        failed_executions
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/executions', async (req, res) => {
    try {
      const executions = await Execution.find().sort({ started_at: -1 });
      res.json(executions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/executions/:id', async (req, res) => {
    try {
      const execution = await Execution.findById(req.params.id);
      res.json(execution);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/workflows/:workflowId/execute', async (req, res) => {
    try {
      const workflow = await Workflow.findById(req.params.workflowId);
      if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

      const execution = new Execution({
        workflow_id: workflow._id,
        workflow_version: workflow.version,
        status: 'in_progress',
        data: req.body,
        current_step_id: workflow.start_step_id,
        logs: [{ timestamp: new Date(), message: 'Execution started', type: 'info' }]
      });
      await execution.save();

      // Run execution in background
      runExecution(execution._id, req.body);

      res.status(201).json(execution);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/executions/:id/retry', async (req, res) => {
    try {
      const execution = await Execution.findById(req.params.id);
      if (!execution) return res.status(404).json({ error: 'Execution not found' });

      execution.status = 'in_progress';
      execution.retries += 1;
      execution.logs.push({ timestamp: new Date(), message: `Retrying execution (Attempt ${execution.retries})`, type: 'info' });
      await execution.save();

      runExecution(execution._id, execution.data);
      res.json(execution);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/executions/:id/cancel', async (req, res) => {
    try {
      const execution = await Execution.findById(req.params.id);
      if (!execution) return res.status(404).json({ error: 'Execution not found' });

      execution.status = 'canceled';
      execution.ended_at = new Date();
      execution.logs.push({ timestamp: new Date(), message: 'Execution canceled by user', type: 'error' });
      await execution.save();

      res.json(execution);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  async function runExecution(executionId, data) {
    let execution = await Execution.findById(executionId);
    if (!execution) return;

    const workflow = await Workflow.findById(execution.workflow_id);
    if (!workflow) return;

    const allSteps = await Step.find({ workflow_id: workflow._id });
    let currentStepId = execution.current_step_id;
    const logs = [...execution.logs];
    
    let iterations = 0;
    const MAX_ITERATIONS = 20;
    let executionStatus = 'completed';

    while (currentStepId && iterations < MAX_ITERATIONS) {
      const startTime = Date.now();
      
      // Check if canceled
      const currentExec = await Execution.findById(executionId);
      if (currentExec.status === 'canceled') {
        executionStatus = 'canceled';
        break;
      }

      iterations++;
      const step = allSteps.find(s => s._id.toString() === currentStepId);
      if (!step) {
        logs.push({ 
          step_name: 'Unknown', 
          status: 'error', 
          message: `Step ${currentStepId} not found`,
          timestamp: new Date() 
        });
        executionStatus = 'failed';
        break;
      }

      // Check if this is a rejection step
      if (step.name === 'Task Rejection') {
        executionStatus = 'failed';
      }
      
      const rules = await Rule.find({ step_id: step._id }).sort({ priority: 1 });
      
      let nextStepId = null;
      let selectedRule = null;
      const evaluatedRules = [];

      for (const rule of rules) {
        const result = evaluateCondition(rule.condition, data);
        evaluatedRules.push({ rule: rule.condition, result });
        if (result) {
          nextStepId = rule.next_step_id;
          selectedRule = rule;
          break;
        }
      }

      let nextStepName = 'None';
      if (nextStepId) {
        const nextStep = allSteps.find(s => s._id.toString() === nextStepId);
        if (nextStep) nextStepName = nextStep.name;
      }

      const duration = `${(Date.now() - startTime) / 1000} seconds`;
      
      logs.push({
        step_name: step.name,
        step_type: step.step_type,
        evaluated_rules: evaluatedRules,
        selected_next_step: nextStepName,
        status: 'completed',
        duration: duration,
        timestamp: new Date()
      });

      if (executionStatus === 'failed') {
        currentStepId = null;
      } else {
        currentStepId = nextStepId;
      }

      // Update execution state
      await Execution.findByIdAndUpdate(executionId, { current_step_id: currentStepId, logs });
      
      // Artificial delay for visibility
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (iterations >= MAX_ITERATIONS && currentStepId) {
      logs.push({ 
        step_name: 'System', 
        status: 'error', 
        message: 'Maximum iterations reached. Potential infinite loop.',
        timestamp: new Date() 
      });
      executionStatus = 'failed';
    }

    const finalExec = await Execution.findById(executionId);
    if (finalExec.status !== 'canceled') {
      await Execution.findByIdAndUpdate(executionId, { 
        status: executionStatus, 
        ended_at: new Date() 
      });
    }
  }

  // --- Seeding Logic ---
  async function seed() {
    const workflows = await Workflow.find();
    if (workflows.length > 0) return;

    console.log('Seeding sample workflow...');
    
    const workflow = new Workflow({
      name: 'Expense Approval',
      version: 1,
      is_active: true,
      input_schema: {
        amount: { type: 'number', required: true },
        country: { type: 'string', required: true },
        priority: { type: 'string', required: true }
      }
    });
    await workflow.save();

    const step1 = new Step({ workflow_id: workflow._id, name: 'Manager Approval', step_type: 'approval', order: 1 });
    const step2 = new Step({ workflow_id: workflow._id, name: 'Finance Notification', step_type: 'notification', order: 2 });
    const step3 = new Step({ workflow_id: workflow._id, name: 'CEO Approval', step_type: 'approval', order: 3 });
    const step4 = new Step({ workflow_id: workflow._id, name: 'Task Rejection', step_type: 'task', order: 4 });

    await Promise.all([step1.save(), step2.save(), step3.save(), step4.save()]);

    await Workflow.findByIdAndUpdate(workflow._id, { start_step_id: step1._id.toString() });

    await new Rule({ step_id: step1._id, condition: 'amount > 100 && country == "US" && priority == "High"', next_step_id: step2._id.toString(), priority: 1 }).save();
    await new Rule({ step_id: step1._id, condition: 'amount <= 100', next_step_id: '', priority: 2 }).save();
    await new Rule({ step_id: step1._id, condition: 'priority == "Low" && country != "US"', next_step_id: step4._id.toString(), priority: 3 }).save();
    await new Rule({ step_id: step1._id, condition: 'DEFAULT', next_step_id: step4._id.toString(), priority: 4 }).save();

    await new Rule({ step_id: step2._id, condition: 'DEFAULT', next_step_id: step3._id.toString(), priority: 1 }).save();
    await new Rule({ step_id: step3._id, condition: 'DEFAULT', next_step_id: '', priority: 1 }).save();

    console.log('Seeding complete.');
  }

  await seed();

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
