console.log("Starting deploy server...");
import {
  subscribe_to_sqs_message,
  download_s3_directory,
  build_project,
  copy_final_build,
} from "./utils";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { deployments } from "./schema";
import { eq } from "drizzle-orm/expressions";

const sql = neon(process.env.DRIZZLE_DATABASE_URL!);
const db = drizzle(sql);

async function processMessages() {
  while (true) {
    try {
      const deployment_id: string =
        (await subscribe_to_sqs_message()) as string;

      if (deployment_id) {
        await download_s3_directory(deployment_id);
        await build_project(deployment_id);
        await copy_final_build(deployment_id);
        async function updateDeployment(deployment_id: string) {
          const result = await db
            .update(deployments)
            .set({
              status: "deployed",
            })
            .where(eq(deployments.projectId, deployment_id))
            .returning({
              id: deployments.id,
              status: deployments.status,
            });

          if (result.length > 0) {
            console.log(
              `Updated deployment ID ${result[0].id} to status: ${result[0].status}`
            );
          } else {
            console.log(`Deployment ID ${deployment_id} not found.`);
          }
        }

        updateDeployment(deployment_id).catch(console.error);
      }
    } catch (error) {
      console.error(
        "Error processing SQS message or downloading S3 directory:",
        error
      );
    }
  }
}

processMessages();
