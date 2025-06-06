const fs = require('fs');
const path = require('path');

module.exports = () => {
    const gradlePropsPath = path.join(
        process.env.HOME,
        '/project/android/gradle.properties'
    );

    try {
        let content = fs.readFileSync(gradlePropsPath, 'utf8');
        content = content.replace(
            /^kotlinVersion=.*$/m,
            'kotlinVersion=1.9.25'
        );
        fs.writeFileSync(gradlePropsPath, content);
        console.log('✅ Kotlin version updated to 1.9.25');
    } catch (e) {
        console.error('❌ Failed to update Kotlin version:', e);
    }
};
