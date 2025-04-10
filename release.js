const { spawnSync } = require("child_process");
const package = require('./package.json');

const tag = `v${package.version}`;

try {
  const result = execSync('git rev-parse --abbrev-ref HEAD', {
    stdio: 'pipe',
    encoding: 'utf-8',
  });

  if (result !== 'main') {
    console.log('🚫 Branch is not "main".');
  }
} catch (err) {
  console.error('Error checking git branch:', err);
}

try {
  const result = execSync('git status --porcelain', {
    stdio: 'pipe',
    encoding: 'utf-8',
  });

  if (result.trim().length > 0) {
    console.log('🚫 Workspace is not clean. Commit or stash changes before releasing.');
    return false;
  }
} catch (err) {
  console.error('Error checking workspace status:', err);
}

try {
  execSync('git fetch origin', { stdio: 'ignore' });

  const result = execSync(`git rev-list --left-right --count origin/main...main`, {
    encoding: 'utf-8'
  }).trim();

  const [behind, ahead] = result.split('\t').map(Number);

  if (behind > 0 && ahead > 0) {
    console.log(`🚫 Branch is out of sync: ${behind} behind, ${ahead} ahead`);
  }
} catch (err) {
  console.error('Error checking origin status:', err);
}

try {
  const result = execSync(`git ls-remote --tags origin refs/tags/${tagName}`, {
    stdio: 'pipe',
    encoding: 'utf-8',
  });

  if (result.trim().length > 0) {
    console.log(`🚫 Tag ${tag} already exists on remote.`);
  }
} catch (err) {
  console.error('Error verifying tag and workspace:', err);
}

const cmd = `git tag ${tag} && git push origin ${tag}`;
spawnSync('bash -c', [cmd], {
  stdio: "inherit",
  shell: true,
});
