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
  PutObjectCommand
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { pipeline, Readable } from "stream";
import { promisify } from "util";
import { spawn } from "child_process";

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
  const baseOutputDir = path.join(__dirname, "builds", repo_name);

  const prefix = `clones/${repo_name}/`;

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

// TODO: Implement the build_project function with containiraization
export function build_project(id: string) {
    return new Promise((resolve, reject) => {
        const sanitizedId = path.basename(id);

        const projectPath = path.join(__dirname, 'builds', sanitizedId);

        const child = spawn('npm', ['install'], { cwd: projectPath });

        child.stdout?.on('data', (data) => {
            console.log('stdout: ' + data);
        });

        child.stderr?.on('data', (data) => {
            console.error('stderr: ' + data);
        });

        child.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Build process exited with code ${code}`));
            }

            const buildChild = spawn('npm', ['run', 'build'], { cwd: projectPath });

            buildChild.stdout?.on('data', (data) => {
                console.log('stdout: ' + data);
            });

            buildChild.stderr?.on('data', (data) => {
                console.error('stderr: ' + data);
            });

            buildChild.on('close', (buildCode) => {
                if (buildCode !== 0) {
                    return reject(new Error(`Build process exited with code ${buildCode}`));
                }

                resolve("");
            });
        });
    });
}

export const list_all_repo_files = async (deployment_id: string) => {
  const directory = path.join(__dirname, `./builds/${deployment_id}`);

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
      Key: `builds/${file_name}`, 
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


export async function copy_final_build(id: string) {
  // const folderPath = path.join(__dirname, `builds/${id}/build`);
  const files = await list_all_repo_files(`${id}/build`);

  files.map(async (file: string) => {
    const file_name = file.slice(__dirname.length + 8);
    console.log('file_name:', file_name);
    const s3_url = await upload_file_to_s3(file_name, file);
    return s3_url;
  })
}
