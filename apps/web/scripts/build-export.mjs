import { spawn } from 'child_process';

process.env.OUTPUT_EXPORT = 'true';

const build = spawn('npx', ['next', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    OUTPUT_EXPORT: 'true'
  }
});

build.on('close', (code) => {
  process.exit(code || 0);
});

