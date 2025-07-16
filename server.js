const express = require('express');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const jobStore = {};

// POST /jobs - Submit a new job
app.post('/jobs', (req, res) => {
  const { org_id, app_version_id, test_path, priority, target } = req.body;

  if (!org_id || !app_version_id || !test_path || !target) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const jobId = uuidv4();
  jobStore[jobId] = {
    job_id: jobId,
    org_id,
    app_version_id,
    test_path,
    priority: priority || 'normal',
    target,
    status: 'queued',
    submitted_at: new Date().toISOString(),
  };

  res.status(201).json({ job_id: jobId });
});

// GET /jobs/:job_id - Get job status
app.get('/jobs/:job_id', (req, res) => {
  const job = jobStore[req.params.job_id];
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
});

app.listen(PORT, () => {
  console.log(`Job API server is running at http://localhost:${PORT}`);
});


