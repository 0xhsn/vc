const MAX_ID_LENGTH = 5;

export const generate_deployment_id = () => {
  return Math.random().toString(36).substr(2, MAX_ID_LENGTH);
};

export const list_all_repo_files = async (deployment_id: string) => {
  const fs = require("fs");
  const path = require("path");

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
