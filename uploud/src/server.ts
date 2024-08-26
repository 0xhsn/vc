import express from 'express';
import cors from 'cors';
import simpleGit from 'simple-git';
import { generate_deployment_id } from './utils';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/deploy', async (req, res) => {
  const repo_url = req.body.repo_url;
  console.log('Repository URL: ', repo_url);

  const deployment_id = generate_deployment_id();

  await simpleGit().clone(repo_url, `./clones/${deployment_id}`);

  res.json({
    id: deployment_id
  });
});

const port = 3000;
app.listen(port);
console.log(`App is listening on port ${port}`);
