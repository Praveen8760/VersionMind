

// .backend/utils/progress.js

export function sendProgress(repoId, payload) {
  if (!global.repoClients || !global.repoClients[repoId]) return;

  global.repoClients[repoId].forEach((client) => {
    client.write(`data: ${JSON.stringify(payload)}\n\n`);
  });
}
