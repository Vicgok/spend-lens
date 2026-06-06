const { withAppBuildGradle } = require('@expo/config-plugins');

function setSigningConfig(buildGradleContent) {
  // Check if signingConfigs release config is already added
  if (buildGradleContent.includes('signingConfigs.release')) {
    return buildGradleContent;
  }

  // 1. Add release signing configuration dynamically loading from credentials.json
  const signingConfigTarget = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;

  const signingConfigReplacement = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        
        // Dynamically load release credentials from credentials.json
        def credentialsFile = file("../../credentials.json")
        if (credentialsFile.exists()) {
            def credentials = new groovy.json.JsonSlurper().parseText(credentialsFile.text)
            if (credentials.android?.keystore) {
                def keystore = credentials.android.keystore
                release {
                    storeFile file("../../" + keystore.keystorePath)
                    storePassword keystore.keystorePassword
                    keyAlias keystore.keyAlias
                    keyPassword keystore.keyPassword
                }
            }
        }
    }`;

  // 2. Modify release buildType signingConfig
  const buildTypeTarget = `        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`;

  const buildTypeReplacement = `        release {
            def credentialsFile = file("../../credentials.json")
            if (credentialsFile.exists()) {
                signingConfig signingConfigs.release
            } else {
                signingConfig signingConfigs.debug
            }`;

  let updated = buildGradleContent;
  
  if (updated.includes(signingConfigTarget)) {
    updated = updated.replace(signingConfigTarget, signingConfigReplacement);
  } else {
    console.warn("withAndroidSigning Warning: Could not find standard signingConfigs block");
  }

  if (updated.includes(buildTypeTarget)) {
    updated = updated.replace(buildTypeTarget, buildTypeReplacement);
  } else {
    console.warn("withAndroidSigning Warning: Could not find standard buildTypes.release signingConfig");
  }

  return updated;
}

const withAndroidSigning = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = setSigningConfig(config.modResults.contents);
    }
    return config;
  });
};

module.exports = withAndroidSigning;
