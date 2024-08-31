import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

export const streamToString = async (stream: Readable): Promise<string> => {
  const chunks: any[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
};

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  }, 
});

export async function download_s3_directory(repo_name: string) {
  const fileContents: { [key: string]: string } = {};

  const prefix = `builds/${repo_name}/build/`;

  const allFiles = await s3.send(
    new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Prefix: prefix,
    })
  );

  const allPromises =
    allFiles.Contents?.map(async ({ Key }) => {
      if (!Key) return;

      const filePath = Key.replace(prefix, "");
      const getObjectCommand = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: Key,
      });

      const response = await s3.send(getObjectCommand);

      if (response.Body instanceof Readable) {
        const content = await streamToString(response.Body as Readable);
        fileContents[filePath] = content;
      } else {
        throw new Error(
          `Unexpected response body type: ${typeof response.Body}`
        );
      }
    }) || [];

  console.log("awaiting...");

  await Promise.all(allPromises);
  console.log("Downloaded!");

  return fileContents;
}
