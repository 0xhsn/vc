# vc
<div align="center">
<picture>
  <source srcset="https://pbs.twimg.com/media/FtISLwVaUAEAGD4.jpg">
  <img alt="just use vercel meme" src="https://pbs.twimg.com/media/FtISLwVaUAEAGD4.jpg">
</picture>
</div>

&ensp;

<div align="center">
<p>Vercel clone (for me) to understand the build and deployment phases.</p>
</div>

## Stack
- Bun
- Typescript
- Express

## API

- `/deploy`
```shell
curl -X POST http://localhost:3000/deploy \
     -H "Content-Type: application/json" \
     -d '{"repo_url": "<git-repo-url>"}'
```
