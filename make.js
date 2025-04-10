const { spawn } = require('child_process');

const builds = [
  { platform: 'darwin', arch: 'arm64' },
  { platform: 'darwin', arch: 'x64' },
  { platform: 'linux', arch: 'arm64' },
  { platform: 'linux', arch: 'x64' },
  { platform: 'win32', arch: 'arm64' },
  { platform: 'win32', arch: 'x64' },
];

function runBuild({ platform, arch }) {
  return new Promise((resolve, reject) => {
    const log = [];
    const command = 'npx';
    const args = [
      'electron-forge',
      'make',
      '--platform', platform,
      '--arch', arch,
    ];

    const child = spawn(command, args, { shell: true });

    child.stdout.on('data', data => log.push(`[${platform}-${arch}] ${data}`));
    child.stderr.on('data', data => log.push(`[${platform}-${arch}][stderr] ${data}`));

    child.on('close', code => {
      if (code !== 0) {
        console.log(`\n✅ Build completed for ${result.platform} (${result.arch})`);
        reject({
          platform,
          arch,
          code,
          log: log.join('')
        });
      } else {
        resolve({
          platform,
          arch,
          log: log.join('')
        });
      }
    });
  });
}

(async () => {
  console.log('🚀 Running parallel builds...\n');

  try {
    const results = await Promise.all(builds.map(runBuild));

    for (const result of results) {
      console.log(`\n--- Logs for ${result.platform} (${result.arch}) ---\n`);
      console.log(result.log);
    }

    console.log('\n📦 All builds completed successfully!\n');
  } catch (error) {
    console.error(`\n❌ Build failed for ${error.platform} (${error.arch})`);
    console.error(`Exit code: ${error.code}\n`);
    console.error('--- Full log ---\n');
    console.error(error.log);
    process.exit(1);
  }
})();
