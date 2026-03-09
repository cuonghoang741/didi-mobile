const withFixOneSignalEASConfig = (config) => {
    // Modify the extra EAS config object directly to ensure EAS CLI sees the right Bundle ID AND App Group
    if (!config.extra) config.extra = {};
    if (!config.extra.eas) config.extra.eas = {};
    if (!config.extra.eas.build) config.extra.eas.build = {};
    if (!config.extra.eas.build.experimental) config.extra.eas.build.experimental = {};
    if (!config.extra.eas.build.experimental.ios) config.extra.eas.build.experimental.ios = {};
    if (!config.extra.eas.build.experimental.ios.appExtensions) config.extra.eas.build.experimental.ios.appExtensions = [];
    
    const OLD_GROUP = 'group.com.didimobile.onesignal';
    const NEW_GROUP = 'group.com.didimobile.app.onesignal';

    // Check if the extension is registered, if yes, override its bundle ID
    const exts = config.extra.eas.build.experimental.ios.appExtensions;
    for (const ext of exts) {
        if (ext.targetName === 'OneSignalNotificationServiceExtension') {
            ext.bundleIdentifier = 'com.didimobile.onesignalext';
        }
        
        // This is where EAS CLI looks for the capability to register the App Group during `eas build` or `eas credentials`
        if (ext.entitlements && ext.entitlements['com.apple.security.application-groups']) {
             const groups = ext.entitlements['com.apple.security.application-groups'];
             const idx = groups.indexOf(OLD_GROUP);
             if (idx > -1) {
                 ext.entitlements['com.apple.security.application-groups'][idx] = NEW_GROUP;
             }
             
             // Check another way it could be defined by OneSignal
             const oldGroup2 = `group.${config.ios?.bundleIdentifier}.onesignal`;
             const idx2 = groups.indexOf(oldGroup2);
             if (idx2 > -1) {
                 ext.entitlements['com.apple.security.application-groups'][idx2] = NEW_GROUP;
             }
        }
    }
    
    return config;
};

module.exports = withFixOneSignalEASConfig;
