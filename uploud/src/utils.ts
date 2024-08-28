import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import path from 'path';
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const MAX_ID_LENGTH = 5;

export const generate_deployment_id = () => {
  return Math.random().toString(36).substr(2, MAX_ID_LENGTH);
};

export const list_all_repo_files = async (deployment_id: string) => {
  const directory = path.join(__dirname, `../clones/${deployment_id}`);

  const walk = async (dir: string) => {
    let results: string[] = [];
    const list = await fs.promises.readdir(dir);
    for (const file of list) {
      const full_path = path.join(dir, file);
      const stat = await fs.promises.stat(full_path);
      if (stat && stat.isDirectory()) {
        const res = await walk(full_path);
        results = results.concat(res);
      } else {
        results.push(full_path);
      }
    }
    return results;
  };

  return walk(directory);
};

export const upload_file_to_s3 = async (file_name: string, file_path: string): Promise<string> => {
  try {
    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });


    const file_content = fs.readFileSync(file_path);

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: `clones/${file_name}`, 
      Body: file_content,
    };

    await s3.send(new PutObjectCommand(params));

    console.log(`File uploaded successfully. Location: ${params.Bucket}/${params.Key}`);
    return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
  } catch (error) {
    console.error("Error uploading file: ", error);
    throw error;
  }
};

const client = new SQSClient({});
const SQS_QUEUE_URL = process.env.AWS_SQS_URL as string;

export const publish_sqs_message = async (message_body: string) => {
  const command = new SendMessageCommand({
    QueueUrl: SQS_QUEUE_URL,
    MessageBody: message_body,
  });

  const response = await client.send(command);
  console.log("Message sent. ID:", response);
  return response;
};