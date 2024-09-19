# vc
<div align="center">
<picture>
  <source srcset="https://pbs.twimg.com/media/FtISLwVaUAEAGD4.jpg">
  <img alt="just use vercel meme" src="https://pbs.twimg.com/media/FtISLwVaUAEAGD4.jpg">
</picture>
</div>

&ensp;

<div align="center">
<p>Vercel clone (for me) to understand the build and deployment phases as I'm currently preparing the Vercel interview. This includes 3 microservices for deployment, upload, and request, all written in Typescript. It's inspired by <a href="https://vercel.com/blog/behind-the-scenes-of-vercels-infrastructure">Vercel's infrastructure blog</a> and leverages S3 and SQS queues. </p> 
</div>

## Stack
- Bun
- Typescript
- Express
- S3
- SQS
- Docker

## API

- `/deploy`
```shell
curl -X POST http://localhost:3000/deploy \
     -H "Content-Type: application/json" \
     -d '{"repo_url": "<git-repo-url>"}'
```

## Commands

### Docker
```shell
sudo docker build --platform linux/amd64 -t request-service .
docker tag request-service <username>/request-service
docker push <username>/request-service
```

## TODOs
- [ ] Add support for more frameworks.
- [ ] Add support for server-side rendering frameworks like Next.js and Remix.
- [ ] Put everything behind authentication.
