const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withCustomPodfile(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      try {
        let podfileContents = await fs.promises.readFile(podfilePath, 'utf8');

        if (!podfileContents.includes('use_modular_headers!')) {
          podfileContents = podfileContents.replace(
            /(target\s+['"][^'"]+['"]\s+do\s*\n\s*use_expo_modules!)/,
            '$1\n  use_modular_headers!',
          );

          await fs.promises.writeFile(podfilePath, podfileContents);
          console.log('✅ Added use_modular_headers! to Podfile');
        } else {
          console.log('ℹ️  use_modular_headers! already exists in Podfile');
        }

        return config;
      } catch (error) {
        console.warn('⚠️  Could not modify Podfile:', error.message);
        return config;
      }
    },
  ]);
};
