const { spawnSync } = require('child_process');

const builds = [
  { platform: 'darwin', arch: 'arm64' },
  { platform: 'darwin', arch: 'x64' },
  { platform: 'linux', arch: 'arm64' },
  { platform: 'linux', arch: 'x64' },
  { platform: 'linux', arch: 'x86' },
  { platform: 'win32', arch: 'arm64' },
  { platform: 'win32', arch: 'x64' },
  { platform: 'win32', arch: 'x86' },
];

for (const { platform, arch } of builds) {
  console.log(`\n📦 Building for ${platform} (${arch})...`);
  const result = spawnSync('npx', [
    'electron-forge',
    'make',
    '--platform', platform,
    '--arch', arch,
  ], { stdio: 'inherit' });

  if (result.status !== 0) {
    console.error(`❌ Failed to build for ${platform} (${arch})`);
    process.exit(1);
  }
}

console.log('\n✅ All builds completed!');
