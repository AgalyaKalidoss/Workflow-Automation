export const getWorkflows = async () => {
  const res = await fetch('/api/workflows');
  return res.json();
};

export const getWorkflow = async (id) => {
  const res = await fetch(`/api/workflows/${id}`);
  return res.json();
};

export const createWorkflow = async (workflow) => {
  const res = await fetch('/api/workflows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow)
  });
  return res.json();
};

export const updateWorkflow = async (id, workflow) => {
  const res = await fetch(`/api/workflows/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow)
  });
  return res.json();
};

export const deleteWorkflow = async (id) => {
  await fetch(`/api/workflows/${id}`, {
    method: 'DELETE'
  });
};

// Steps
export const getSteps = async (workflowId) => {
  const res = await fetch(`/api/workflows/${workflowId}/steps`);
  return res.json();
};

export const createStep = async (workflowId, step) => {
  const res = await fetch(`/api/workflows/${workflowId}/steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(step)
  });
  return res.json();
};

export const updateStep = async (id, step) => {
  const res = await fetch(`/api/steps/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(step)
  });
  return res.json();
};

export const deleteStep = async (id) => {
  await fetch(`/api/steps/${id}`, {
    method: 'DELETE'
  });
};

// Rules
export const getRules = async (stepId) => {
  const res = await fetch(`/api/steps/${stepId}/rules`);
  return res.json();
};

export const createRule = async (stepId, rule) => {
  const res = await fetch(`/api/steps/${stepId}/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule)
  });
  return res.json();
};

export const updateRule = async (id, rule) => {
  const res = await fetch(`/api/rules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule)
  });
  return res.json();
};

export const deleteRule = async (id) => {
  await fetch(`/api/rules/${id}`, {
    method: 'DELETE'
  });
};

// Executions
export const getDashboardStats = async () => {
  const res = await fetch('/api/dashboard/stats');
  return res.json();
};

export const getExecutions = async () => {
  const res = await fetch('/api/executions');
  return res.json();
};

export const getExecution = async (id) => {
  const res = await fetch(`/api/executions/${id}`);
  return res.json();
};

export const executeWorkflow = async (workflowId, data) => {
  const res = await fetch(`/api/workflows/${workflowId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const retryExecution = async (id) => {
  const res = await fetch(`/api/executions/${id}/retry`, {
    method: 'POST'
  });
  return res.json();
};

export const cancelExecution = async (id) => {
  const res = await fetch(`/api/executions/${id}/cancel`, {
    method: 'POST'
  });
  return res.json();
};
