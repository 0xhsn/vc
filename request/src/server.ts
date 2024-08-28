import express from "express";
import { download_s3_directory } from "./utils";
console.log("Starting request server...");
const app = express();

let fileContentsCache: { [key: string]: string } | null = null;

const initializeFiles = async () => {
  try {
    fileContentsCache = await download_s3_directory("gicu4");
  } catch (error) {
    console.error("Failed to download files:", error);
    fileContentsCache = {};
  }
};

initializeFiles();

app.get("/", (req, res) => {
  try {
    const fileContent = fileContentsCache
      ? fileContentsCache["index.html"]
      : null;
    if (!fileContent) throw new Error("File not found");

    res.set("Content-Type", "text/html");

    res.send(fileContent);
  } catch (error) {
    console.error("Error serving the HTML file:", error);
    res.status(500).send("Error retrieving the HTML file.");
  }
});

app.get("/static/*", (req, res) => {
  try {
    const filePath = req.path.replace("/static/", "static/");
    const fileContent = fileContentsCache ? fileContentsCache[filePath] : null;
    if (!fileContent) throw new Error("File not found");

    const type = filePath.endsWith(".css")
      ? "text/css"
      : filePath.endsWith(".js")
      ? "application/javascript"
      : filePath.endsWith(".png")
      ? "image/png"
      : "application/octet-stream";

    res.set("Content-Type", type);
    res.send(fileContent);
  } catch (error) {
    console.error("Error serving the static file:", error);
    res.status(500).send("Error retrieving the static file.");
  }
});

app.get("/*", (req, res) => {
  try {
    const filePath = req.path.substring(1); // Remove the leading slash
    const fileContent = fileContentsCache ? fileContentsCache[filePath] : null;
    if (!fileContent) throw new Error("File not found");

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
  } catch (error) {
    console.error("Error serving the file:", error);
    res.status(500).send("Error retrieving the file.");
  }
});

app.listen(3001);
