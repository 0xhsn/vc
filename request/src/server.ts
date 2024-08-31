import express from "express";
import { s3, streamToString } from "./utils"; // Import the necessary utilities
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream"; // Import the Readable type from the 'stream' module

const app = express();

app.get("/:repoId/*", async (req, res) => {
  const repoId = req.params.repoId;
  const filePath = (req.params as { [key: string]: string })[0] as string; // Get the file path after the repoId

  // Construct the S3 key correctly
  const s3Key = `builds/${repoId}/build/${filePath}`;

  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME as string,
      Key: s3Key, // Use the correctly constructed S3 key
    });

    const response = await s3.send(getObjectCommand);

    if (response.Body) {
      const fileContent = await streamToString(response.Body as Readable);

      // Determine the content type based on the file extension
      const type = filePath.endsWith(".html")
        ? "text/html"
        : filePath.endsWith(".css")
        ? "text/css"
        : filePath.endsWith(".js")
        ? "application/javascript"
        : filePath.endsWith(".json")
        ? "application/json"
        : filePath.endsWith(".ico")
        ? "image/x-icon"
        : filePath.endsWith(".png")
        ? "image/png"
        : filePath.endsWith(".svg")
        ? "image/svg+xml"
        : "application/octet-stream";

      res.set("Content-Type", type);
      res.send(fileContent);
    } else {
      throw new Error("Unexpected response body type");
    }
  } catch (error) {
    console.error(`Error serving the file for repo ${repoId} and path ${filePath}:`, error);
    res.status(404).send("File not found.");
  }
});


app.listen(4002, () => {
  console.log("Server is listening on port 4002");
});
