const { spawnSync, execSync } = require("child_process");
const package = require('./package.json');

const tag = `v${package.version}`;

try {
  const result = execSync('git rev-parse --abbrev-ref HEAD', {
    stdio: 'pipe',
    encoding: 'utf-8',
  });

  if (result.trim() !== 'main') {
    console.log('🚫 Branch is not "main".');
    process.exit(1);
  }
} catch (err) {
  console.error('Error checking git branch:', err);
  process.exit(1);
}

try {
  const result = execSync('git status --porcelain', {
    stdio: 'pipe',
    encoding: 'utf-8',
  });

  if (result.trim().length > 0) {
    console.log('🚫 Workspace is not clean. Commit or stash changes before releasing.');
    process.exit(1);
  }
} catch (err) {
  console.error('Error checking workspace status:', err);
  process.exit(1);
}

try {
  execSync('git fetch origin', { stdio: 'ignore' });

  const result = execSync(`git rev-list --left-right --count origin/main...main`, {
    encoding: 'utf-8'
  }).trim();

  const [behind, ahead] = result.split('\t').map(Number);

  if (behind > 0 && ahead > 0) {
    console.log(`🚫 Branch is out of sync: ${behind} behind, ${ahead} ahead`);
    process.exit(1);
  }
} catch (err) {
  console.error('Error checking origin status:', err);
  process.exit(1);
}

try {
  const result = execSync(`git ls-remote --tags origin refs/tags/${tagName}`, {
    stdio: 'pipe',
    encoding: 'utf-8',
  });

  if (result.trim().length > 0) {
    console.log(`🚫 Tag ${tag} already exists on remote.`);
    process.exit(1);
  }
} catch (err) {
  console.error('Error verifying tag and workspace:', err);
  process.exit(1);
}

const cmd = `git tag ${tag} && git push origin ${tag}`;
spawnSync('bash -c', [cmd], {
  stdio: "inherit",
  shell: true,
});
