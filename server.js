// const express = require('express');
// const { v4: uuidv4 } = require('uuid');
// const cors = require('cors');

// const app = express();
// const PORT = 3000;

// app.use(express.json());
// app.use(cors());

// const jobStore = {};

// // POST /jobs - Submit a new job
// app.post('/jobs', (req, res) => {
//   const { org_id, app_version_id, test_path, priority, target } = req.body;

//   if (!org_id || !app_version_id || !test_path || !target) {
//     return res.status(400).json({ error: 'Missing required fields' });
//   }

//   const jobId = uuidv4();
//   jobStore[jobId] = {
//     job_id: jobId,
//     org_id,
//     app_version_id,
//     test_path,
//     priority: priority || 'normal',
//     target,
//     status: 'queued',
//     submitted_at: new Date().toISOString(),
//   };

//   res.status(201).json({ job_id: jobId });
// });

// // GET /jobs/:job_id - Get job status
// app.get('/jobs/:job_id', (req, res) => {
//   const job = jobStore[req.params.job_id];
//   if (!job) {
//     return res.status(404).json({ error: 'Job not found' });
//   }

//   res.json(job);
// });

// app.listen(PORT, () => {
//   console.log(`Job API server is running at http://localhost:${PORT}`);
// });


// server.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// In-memory stores
const jobStore = {};  // job_id -> job
const queueByAppVersion = {}; // app_version_id -> [job_id]

// Simulated worker pool
const workerPool = [
  { id: 'worker1', target: 'emulator', busy: false },
  { id: 'worker2', target: 'device', busy: false },
  { id: 'worker3', target: 'browserstack', busy: false },
];

// POST /jobs - Submit a new job
app.post('/jobs', (req, res) => {
  const { org_id, app_version_id, test_path, priority, target } = req.body;

  if (!org_id || !app_version_id || !test_path || !target) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const jobId = uuidv4();
  const job = {
    job_id: jobId,
    org_id,
    app_version_id,
    test_path,
    priority: priority || 'normal',
    target,
    status: 'queued',
    submitted_at: new Date().toISOString(),
    retries: 0,
  };

  jobStore[jobId] = job;

  // Group jobs by app_version_id
  if (!queueByAppVersion[app_version_id]) {
    queueByAppVersion[app_version_id] = [];
  }
  queueByAppVersion[app_version_id].push(jobId);

  console.log(`Received new job: ${jobId} targeting ${target}`);
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

// GET /jobs - List all jobs (bonus)
app.get('/jobs', (req, res) => {
  res.json(Object.values(jobStore));
});

// Simulated scheduler
setInterval(() => {
  for (const worker of workerPool) {
    if (worker.busy) continue;

    // Find queued job for this worker's target
    for (const app_version_id in queueByAppVersion) {
      const queue = queueByAppVersion[app_version_id];
      const jobId = queue.find(jid => {
        const job = jobStore[jid];
        return job.status === 'queued' && job.target === worker.target;
      });
      if (jobId) {
        const job = jobStore[jobId];
        worker.busy = true;
        job.status = 'running';
        job.started_at = new Date().toISOString();

        console.log(`Worker ${worker.id} started job ${job.job_id}`);

        // Simulate job running
        setTimeout(() => {
          if (Math.random() < 0.8 || job.retries >= 1) {
            job.status = 'completed';
            job.completed_at = new Date().toISOString();
            console.log(`Job ${job.job_id} completed`);
          } else {
            console.log(`Job ${job.job_id} failed, retrying`);
            job.status = 'queued';
            job.retries += 1;
          }
          worker.busy = false;
        }, 3000 + Math.random() * 3000);

        break; // assigned job to worker
      }
    }
  }
}, 2000);

app.listen(PORT, () => {
  console.log(` Job API server running at http://localhost:${PORT}`);
});
