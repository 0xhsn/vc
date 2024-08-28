console.log("Starting deploy server...");
import { subscribe_to_sqs_message, download_s3_directory, build_project, copy_final_build } from "./utils";

async function processMessages() {
  while (true) {
    try {
      const deployment_id: any = await subscribe_to_sqs_message();
      
      if (deployment_id) {
        await download_s3_directory(deployment_id);
        await build_project(deployment_id);
        await copy_final_build(deployment_id);
      }
    } catch (error) {
      console.error("Error processing SQS message or downloading S3 directory:", error);
    }
  }
}

processMessages();
