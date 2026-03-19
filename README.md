# 🚀 Workflow Automation Engine

A full-stack Workflow Automation Engine that allows users to create workflows, define rule-based logic, execute processes, and monitor execution logs in real time.

---

## 📌 Overview

This application simulates real-world business workflows such as approval systems, notifications, and task handling.

Users can:

* Create workflows
* Add steps dynamically
* Define conditional rules
* Execute workflows with input data
* Track execution logs step-by-step

---

## 🧠 Key Features

* Dynamic workflow creation
* Step types: Task, Approval, Notification
* Rule-based decision engine
* Execution tracking with logs
* Retry & cancel execution
* Dashboard with stats
* Clean UI using TailwindCSS

---

## 🏗️ Tech Stack

### Frontend + Backend (Single App)

* React (Vite)
* Node.js
* Express.js

### Database

* MongoDB (Local)

---

## 📂 Project Structure

```bash
WORKFLOW-AUTOMATION-ENGINE/
│
├── src/
│   ├── components/      # UI Components
│   ├── pages/           # Page-level components
│   ├── services/        # API & workflow logic
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── server.js            # Express backend server
├── models.js            # MongoDB schemas
├── index.html           # Entry HTML (Vite)
├── vite.config.js       # Vite configuration
├── package.json
├── .env.example
├── README.md
```

---

## ⚙️ How It Works

Workflow → Steps → Rules → Execution → Logs

* **Workflow**: Main process
* **Steps**: Actions in workflow
* **Rules**: Conditions to decide next step
* **Execution**: Running instance
* **Logs**: Track decisions and flow

---

## 🔁 Sample Workflow

Expense Approval Flow:

Submit Request
↓
Manager Approval
↓
Finance Notification
↓
CEO Approval
↓
Completed / Rejected

---

## 🧩 Rule Engine Logic

* Rules are evaluated by **priority**
* First matching condition is selected
* If no match → DEFAULT rule executes

### Example:

```js
amount > 10000 && country == "US"
priority == "Low"
DEFAULT
```

---

## 🛠️ Installation & Setup (Local)

### 1. Clone Repository

```bash
git clone https://github.com/your-username/workflow-automation-engine.git
cd workflow-automation-engine
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Start MongoDB (IMPORTANT)

Make sure MongoDB is running:

```bash
mongod
```

OR use:

* `services.msc` → Start MongoDB Server

---

### 4. Run the Application

```bash
npm run dev
```

---

## 🌐 Application URL

```bash
http://localhost:3000
```

---

## ⚠️ Important Configuration

* App runs on **port 3000**
* Backend and frontend are integrated
* API routes available at:

```bash
http://localhost:3000/api
```

---

## 🔌 API Endpoints

### Workflows

* POST /api/workflows
* GET /api/workflows
* PUT /api/workflows/:id
* DELETE /api/workflows/:id

### Steps

* POST /api/workflows/:workflowId/steps
* GET /api/workflows/:workflowId/steps

### Rules

* POST /api/steps/:stepId/rules
* GET /api/steps/:stepId/rules

### Execution

* POST /api/workflows/:id/execute
* GET /api/executions/:id

---

## 🧪 Sample Input

```json
{
  "amount": 12000,
  "country": "US",
  "priority": "High"
}
```

---

## 📊 Output

* Displays execution flow step-by-step
* Shows rule evaluation results
* Tracks execution status
* Logs each step with timestamp

---

## ⚠️ Notes

* MongoDB must be running before starting app
* Always define a DEFAULT rule
* Ensure valid conditions in rules

---

## ⭐ Conclusion

This project demonstrates a dynamic workflow engine with rule-based execution, scalable architecture, and real-world automation capabilities.

---
