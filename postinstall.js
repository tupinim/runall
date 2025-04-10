const os = require('os');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

if (require.main === module) {
  console.log('Skipping postinstall (root project)');
  process.exit(0);
}

const plat = os.platform();
const arch = os.arch();
const version = require('./package.json').version;

const filename = `Runall-${plat}-${arch}-${version}.zip`;
const url = `https://github.com/pillbugin/runall/releases/download/v${version}/${filename}`;
const outputDir = path.resolve(__dirname, 'bin');
const zipPath = path.join(outputDir, filename);

// Create output dir if needed
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Check if file exists on GitHub first
function checkFileExists(url, callback) {
  const req = https.request(url, { method: 'HEAD' }, res => {
    callback(res.statusCode === 200);
  });

  req.on('error', err => {
    console.error('❌ Error checking file:', err.message);
    callback(false);
  });

  req.end();
}

checkFileExists(url, exists => {
  if (!exists) {
    console.error(`🚫 No binary available for platform "${plat}" and arch "${arch}".`);
    process.exit(1);
  }

  console.log(`⬇️ Downloading binary: ${filename}`);

  https.get(url, res => {
    if (res.statusCode !== 200) {
      console.error(`❌ Failed to download binary. HTTP ${res.statusCode}`);
      process.exit(1);
    }

    const fileStream = fs.createWriteStream(zipPath);
    res.pipe(fileStream);

    fileStream.on('finish', () => {
      fileStream.close(() => {
        console.log('✅ Download complete.');

        if (filename.endsWith('.zip')) {
          try {
            execSync(`unzip -o ${zipPath} -d ${outputDir}`);
            fs.unlinkSync(zipPath);
            console.log('📦 Binary unpacked.');
          } catch (err) {
            console.error('❌ Failed to unzip binary:', err);
            process.exit(1);
          }
        }
      });
    });
  }).on('error', err => {
    console.error('❌ Download error:', err.message);
    process.exit(1);
  });
});
