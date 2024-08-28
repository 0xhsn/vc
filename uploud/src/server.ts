import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import { generate_deployment_id, list_all_repo_files, upload_file_to_s3, publish_sqs_message } from "./utils";
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { deployments } from './schema';

const sql = neon(process.env.DRIZZLE_DATABASE_URL!);
const db = drizzle(sql);

const app = express();
app.use(cors());
app.use(express.json());
console.log("AWS Region:", process.env.AWS_REGION);
console.log("AWS Access Key ID:", process.env.AWS_ACCESS_KEY_ID);
console.log("S3 Bucket Name:", process.env.AWS_BUCKET_NAME);
console.log("SQS Queue URL:", process.env.AWS_SQS_URL);

app.post("/deploy", async (req, res) => {
  const repo_url = req.body.repo_url;

  const deployment_id = generate_deployment_id();

  await simpleGit().clone(repo_url, `./clones/${deployment_id}`);

  const files = await list_all_repo_files(deployment_id);
  
  const s3_urls = await Promise.all(
    files.map(async (file: string) => {
      const file_name = file.slice(__dirname.length + 4);
      console.log('file_name:', file_name);
      const s3_url = await upload_file_to_s3(file_name, file);
      return s3_url;
    })
  );

  await publish_sqs_message(deployment_id);
  async function addDeployment() {
    const result = await db.insert(deployments).values({
        projectId: deployment_id,
        status: 'uploaded',
    }).returning({
        id: deployments.id,
    });

    console.log('Inserted deployment ID:', result[0].id);
}

addDeployment().catch(console.error);

  res.json({
    id: deployment_id,
    urls: s3_urls,
  });
});

const port = 3000;
app.listen(port);
console.log(`App is listening on port ${port}`);
