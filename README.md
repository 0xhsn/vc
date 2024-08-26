# vc
Vercel clone to understand the build and deployment phases.

## Stack
- Bun
- Typescript
- Express

## API

- `/deploy`
curl -X POST http://localhost:3000/deploy \
     -H "Content-Type: application/json" \
     -d '{"repo_url": "<git-repo-url>"}'
