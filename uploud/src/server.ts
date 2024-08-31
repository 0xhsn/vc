import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import {
  generate_deployment_id,
  list_all_repo_files,
  upload_file_to_s3,
  publish_sqs_message,
} from "./utils";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { deployments } from "./schema";
import { eq } from "drizzle-orm/expressions";

const sql = neon(process.env.DRIZZLE_DATABASE_URL!);
const db = drizzle(sql);

const app = express();

app.use(cors({
  origin: 'https://vc.macdoos.dev',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

app.post("/deploy", async (req, res) => {
  const repo_url = req.body.repo_url;

  const deployment_id = generate_deployment_id();

  console.log("Cloning repository:", repo_url);
  await simpleGit().clone(repo_url, `./clones/${deployment_id}`);

  const files = await list_all_repo_files(deployment_id);

  const s3_urls = await Promise.all(
    files.map(async (file: string) => {
      const file_name = file.slice(__dirname.length + 4);
      console.log("file_name:", file_name);
      const s3_url = await upload_file_to_s3(file_name, file);
      return s3_url;
    })
  );

  await publish_sqs_message(deployment_id);
  async function addDeployment() {
    const result = await db
      .insert(deployments)
      .values({
        projectId: deployment_id,
        status: "uploaded",
      })
      .returning({
        id: deployments.id,
      });

    console.log("Inserted deployment ID:", result[0].id);
  }

  addDeployment().catch(console.error);

  res.json({
    id: deployment_id,
    urls: s3_urls,
  });
});

app.get("/status", async (req, res) => {
  const deployment_id = req.query.id as string;

  const result = await db
    .select({
      status: deployments.status,
    })
    .from(deployments)
    .where(eq(deployments.projectId, deployment_id));

  if (result.length > 0) {
    res.json({
      status: result[0].status,
    });
  } else {
    res.json({
      status: "not found",
    });
  }
});

const port = 4000;
app.listen(port);
console.log(`App is listening on port ${port}`);
