const { exec } = require('child_process');
exec('npx tsx server/index.ts', (err, stdout, stderr) => {
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
  if (err) console.error(err);
});
