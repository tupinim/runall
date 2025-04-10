const { spawnSync } = require("child_process");
const package = require('./package.json');

const tag = `v${package.version}`;

try {
  const result = execSync(`git ls-remote --tags origin refs/tags/${tagName}`, {
    stdio: 'pipe',
    encoding: 'utf-8',
  });

  if (result.trim().length > 0) {
    console.log(`🚫 Tag ${tag} already exists on remote.`);
  }
} catch (err) {
  console.error('Error verifying tag:', err);
  return false;
}

const cmd = `git tag ${tag} && git push origin ${tag}`;
result = spawnSync('bash -c', [cmd], {
  stdio: "inherit",
  shell: true,
});
