const { withXcodeProject } = require('expo/config-plugins');

/**
 * Expo config plugin to allow entitlements file modification during build.
 * Fixes: "Entitlements file was modified during the build" error.
 */
const withEntitlementsModification = (config) => {
    return withXcodeProject(config, async (config) => {
        const xcodeProject = config.modResults;

        const buildConfigurations = xcodeProject.pbxXCBuildConfigurationSection();
        for (const key in buildConfigurations) {
            const buildConfig = buildConfigurations[key];
            if (typeof buildConfig === 'object' && buildConfig.buildSettings) {
                // Only apply to the main app target (not pods/extensions)
                if (
                    buildConfig.buildSettings.PRODUCT_BUNDLE_IDENTIFIER === 'com.didimobile' ||
                    buildConfig.buildSettings.PRODUCT_BUNDLE_IDENTIFIER === '"com.didimobile"' ||
                    buildConfig.buildSettings.INFOPLIST_FILE?.includes('DiDiMoibile')
                ) {
                    buildConfig.buildSettings.CODE_SIGN_ALLOW_ENTITLEMENTS_MODIFICATION = 'YES';
                }
            }
        }

        return config;
    });
};

module.exports = withEntitlementsModification;
