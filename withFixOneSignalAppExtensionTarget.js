const { withXcodeProject } = require('@expo/config-plugins');

const withFixOneSignalAppExtensionTarget = (config) => {
    return withXcodeProject(config, (config) => {
        const xcodeProject = config.modResults;
        const configurations = xcodeProject.pbxXCBuildConfigurationSection();
        for (const key in configurations) {
            if (typeof configurations[key].buildSettings !== "undefined" &&
                configurations[key].buildSettings.PRODUCT_NAME === '"OneSignalNotificationServiceExtension"') {
                const buildSettingsObj = configurations[key].buildSettings;
                buildSettingsObj.PRODUCT_BUNDLE_IDENTIFIER = '"com.didimobile.onesignalext"';
            }
        }
        return config;
    });
};

module.exports = withFixOneSignalAppExtensionTarget;
