import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
  SQSClient,
  DeleteMessageBatchCommand,
} from "@aws-sdk/client-sqs";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { pipeline, Readable } from "stream";
import { promisify } from "util";

const client = new SQSClient({});
const SQS_QUEUE_URL = process.env.AWS_SQS_URL as string;
const s3 = new S3Client({ region: "eu-west-2" });
const streamPipeline = promisify(pipeline);

const receiveMessage = (queueUrl = SQS_QUEUE_URL) =>
  client.send(
    new ReceiveMessageCommand({
      MaxNumberOfMessages: 10,
      MessageAttributeNames: ["All"],
      QueueUrl: queueUrl,
      WaitTimeSeconds: 20,
      VisibilityTimeout: 20,
    })
  );

export const subscribe_to_sqs_message = async (queueUrl = SQS_QUEUE_URL) => {
  const { Messages } = await receiveMessage(queueUrl);

  if (!Messages || Messages.length === 0) {
    return;
  }

  const message = Messages[0];

  console.log("Message Body:", message.Body); 

  let deployment_id;

  if (message.Body) {
    deployment_id = message.Body.trim();

    await client.send(
      new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: message.ReceiptHandle,
      })
    );

    return deployment_id;
  }
};
  

export async function download_s3_directory(repo_name: string) {
  const baseOutputDir = path.join(__dirname, "output", repo_name);

  const prefix = `${repo_name}/`;

  const allFiles = await s3.send(
    new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Prefix: prefix,
    })
  );

  const allPromises =
    allFiles.Contents?.map(async ({ Key }) => {
      if (!Key) return;

      const finalOutputPath = path.join(baseOutputDir, Key.replace(prefix, ""));
      const dirName = path.dirname(finalOutputPath);

      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
      }

      const outputFile = fs.createWriteStream(finalOutputPath);
      const getObjectCommand = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: Key,
      });

      const response = await s3.send(getObjectCommand);

      if (response.Body instanceof Readable) {
        await streamPipeline(response.Body, outputFile);
      } else {
        throw new Error(
          `Unexpected response body type: ${typeof response.Body}`
        );
      }
    }) || [];

  console.log("awaiting...");

  await Promise.all(allPromises);
  console.log("Downloaded!");
}
