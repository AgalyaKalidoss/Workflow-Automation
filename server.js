import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import mongoose from 'mongoose';

import { Workflow, Step, Rule, Execution } from './models.js';
import { evaluateCondition } from './src/services/workflowEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  try {
    // ✅ MongoDB Connection
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(cors());
    app.use(express.json());

    // ---------------- WORKFLOWS ----------------

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

    // ---------------- STEPS ----------------

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

    // ---------------- RULES ----------------

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

    // ---------------- DASHBOARD ----------------

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

    // ---------------- EXECUTIONS ----------------

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

        runExecution(execution._id, req.body);

        res.status(201).json(execution);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // ---------------- WORKFLOW ENGINE ----------------

    async function runExecution(executionId, data) {
      let execution = await Execution.findById(executionId);
      if (!execution) return;

      const workflow = await Workflow.findById(execution.workflow_id);
      const allSteps = await Step.find({ workflow_id: workflow._id });

      let currentStepId = execution.current_step_id;
      let executionStatus = 'completed';

      while (currentStepId) {
        const step = allSteps.find(s => s._id.toString() === currentStepId);
        if (!step) {
          executionStatus = 'failed';
          break;
        }

        if (step.name === 'Task Rejection') {
          executionStatus = 'failed';
          break;
        }

        const rules = await Rule.find({ step_id: step._id }).sort({ priority: 1 });

        let nextStepId = null;

        for (const rule of rules) {
          const result =
            rule.condition === 'DEFAULT' ||
            evaluateCondition(rule.condition, data);

          if (result) {
            nextStepId = rule.next_step_id;
            break;
          }
        }

        currentStepId = nextStepId;
      }

      await Execution.findByIdAndUpdate(executionId, {
        status: executionStatus,
        ended_at: new Date()
      });
    }

    // ---------------- SEED ----------------

    async function seed() {
      const workflows = await Workflow.find();
      if (workflows.length > 0) return;

      console.log('Seeding...');

      const workflow = new Workflow({
        name: 'Expense Approval',
        version: 1,
        is_active: true,
      });

      await workflow.save();
    }

    await seed();

    // ---------------- FRONTEND ----------------

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

    // ✅ SINGLE SERVER START
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Startup Error:", error);
  }
}

startServer();
