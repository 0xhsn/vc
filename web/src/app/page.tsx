"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [uploadId, setUploadId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deployed, setDeployed] = useState(false);
  console.log(process.env.BACKEND_UPLOAD_URL);
  return (
    <main className="flex flex-col items-center justify-center p-10">
      <div className="z-10 w-full max-w-xl flex flex-col items-center justify-center font-mono text-sm">
        <Card className="w-full max-w-md mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              Deploy your GitHub Repository
            </CardTitle>
            <CardDescription>
              Enter the URL of your GitHub repository to deploy it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-url" className="block text-center">
                  GitHub Repository URL
                </Label>
                <Input
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                  }}
                  placeholder="https://github.com/username/repo"
                  className="w-full"
                />
              </div>
              <Button
                onClick={async () => {
                  setUploading(true);
                  const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_UPLOAD_URL}/deploy`, {
                    repo_url: repoUrl,
                  });
                  setUploadId(res.data.id);
                  setUploading(false);
                  const interval = setInterval(async () => {
                    const response = await axios.get(
                      `${process.env.NEXT_PUBLIC_BACKEND_UPLOAD_URL}/status?id=${res.data.id}`
                    );

                    if (response.data.status === "deployed") {
                      clearInterval(interval);
                      setDeployed(true);
                    }
                  }, 30000);
                }}
                disabled={uploadId !== "" || uploading}
                className="w-full"
                type="submit"
              >
                {uploadId
                  ? `Deploying (${uploadId})`
                  : uploading
                  ? "Uploading..."
                  : "Upload"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {deployed && (
          <Card className="w-full max-w-md mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Deployment Status</CardTitle>
              <CardDescription>
                Your website is successfully deployed!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="deployed-url" className="block text-center">
                  Deployed URL
                </Label>
                <Input
                  id="deployed-url"
                  readOnly
                  type="url"
                  value={`https://vcbackend.macdoos.dev/${uploadId}`}
                  className="w-full text-center"
                />
              </div>
              <Button className="w-full mt-4" variant="outline">
                <a
                  href={`https://vcbackend.macdoos.dev/${uploadId}/index.html`}
                  target="_blank"
                >
                  Visit Website
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="fixed bottom-0 left-0 flex h-24 w-full items-center justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:bg-none">
          <a
            className="flex items-center gap-2 p-4"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            NOT By{" "}
            <Image
              src="/vercel.svg"
              alt="Vercel Logo"
              className="dark:invert"
              width={100}
              height={24}
              priority
            />
          </a>
        </div>
      </div>
    </main>
  );
}
