const { withEntitlementsPlist, withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const OLD_GROUP = 'group.com.didimobile.onesignal';
const NEW_GROUP = 'group.com.didimobile.app.onesignal';

const withFixOneSignalAppGroup = (config) => {
    // 1. Fix app entitlements
    config = withEntitlementsPlist(config, (config) => {
        const entitlements = config.modResults;
        const groups = entitlements['com.apple.security.application-groups'];
        
        if (Array.isArray(groups)) {
            entitlements['com.apple.security.application-groups'] = groups.map(g => {
                if (g === OLD_GROUP) {
                    return NEW_GROUP;
                }
                return g;
            });
        }
        return config;
    });

    // 2. Fix EAS experimental config (set by onesignal-expo-plugin)
    if (config.extra?.eas?.build?.experimental?.ios?.appExtensions) {
        const exts = config.extra.eas.build.experimental.ios.appExtensions;
        for (const ext of exts) {
            // FORCE overriding the TargetName and bundle identifier as well!
            if (ext.targetName === 'OneSignalNotificationServiceExtension') {
                 ext.bundleIdentifier = 'com.didimobile.onesignalext';
            }
            if (ext.entitlements?.['com.apple.security.application-groups']) {
                ext.entitlements['com.apple.security.application-groups'] = ext.entitlements['com.apple.security.application-groups'].map((g) => {
                    // Try to catch the old group
                    if (g === OLD_GROUP || g === `group.${config.ios?.bundleIdentifier}.onesignal`) {
                        return NEW_GROUP;
                    }
                    return g;
                });
            }
            // Double check if somehow it wasn't caught
            const idx = ext.entitlements?.['com.apple.security.application-groups']?.indexOf(OLD_GROUP);
            if (idx > -1) {
                ext.entitlements['com.apple.security.application-groups'][idx] = NEW_GROUP;
            }
        }
    }

    // 3. Fix extension entitlements in the generated iOS folder
    config = withDangerousMod(config, [
        'ios',
        async (config) => {
            const iosPath = path.join(config.modRequest.projectRoot, 'ios');
            const extEntitlementsPath = path.join(
                iosPath,
                'OneSignalNotificationServiceExtension',
                'OneSignalNotificationServiceExtension.entitlements'
            );

            if (fs.existsSync(extEntitlementsPath)) {
                let content = fs.readFileSync(extEntitlementsPath, 'utf8');
                if (content.includes(OLD_GROUP)) {
                    content = content.replace(new RegExp(OLD_GROUP, 'g'), NEW_GROUP);
                    fs.writeFileSync(extEntitlementsPath, content);
                }
            }
            return config;
        },
    ]);

    return config;
};

module.exports = withFixOneSignalAppGroup;
