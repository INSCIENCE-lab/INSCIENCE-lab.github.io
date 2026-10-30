import{spawnSync}from'node:child_process';
import{fileURLToPath}from'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
for(const name of ['check.mjs','check-updates.mjs','check-audit.mjs','check-atmosphere.mjs','check-mars.mjs','check-transfer.mjs','check-sky-integration.mjs','check-sky-camera.mjs']){const result=spawnSync(process.execPath,[fileURLToPath(new URL(name,import.meta.url))],{cwd:fileURLToPath(new URL('.',import.meta.url)),stdio:'inherit'});if(result.status!==0)process.exit(result.status||1)}
