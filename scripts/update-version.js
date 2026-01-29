#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Update version in package.json by incrementing patch version
 * Example: 1.0.27 -> 1.0.28
 */
function updateVersion() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');

  try {
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Parse current version
    const currentVersion = packageJson.version;
    const versionParts = currentVersion.split('.');

    if (versionParts.length !== 3) {
      throw new Error(`Invalid version format: ${currentVersion}. Expected format: x.y.z`);
    }

    // Increment patch version
    const major = parseInt(versionParts[0]);
    const minor = parseInt(versionParts[1]);
    const patch = parseInt(versionParts[2]) + 1;

    const newVersion = `${major}.${minor}.${patch}`;

    // Update package.json
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    console.log(`✅ Version updated: ${currentVersion} → ${newVersion}`);

    return newVersion;
  } catch (error) {
    console.error('❌ Error updating version:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateVersion();
}

module.exports = updateVersion;
