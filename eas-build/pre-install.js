const fs = require('fs');
const path = require('path');

module.exports = async function () {
    const gradlePropsPath = path.join(__dirname, '..', 'android', 'gradle.properties');

    try {
        if (fs.existsSync(gradlePropsPath)) {
            let content = fs.readFileSync(gradlePropsPath, 'utf8');
            const kotlinRegex = /^kotlinVersion=.*$/m;

            if (kotlinRegex.test(content)) {
                content = content.replace(kotlinRegex, 'kotlinVersion=1.9.25');
            } else {
                content += '\nkotlinVersion=1.9.25\n';
            }

            fs.writeFileSync(gradlePropsPath, content);
            console.log('✅ Kotlin version set to 1.9.25');
        } else {
            console.warn('⚠️ gradle.properties not found, skipping Kotlin version override.');
        }
    } catch (err) {
        console.error('❌ Failed to patch Kotlin version:', err);
        process.exit(1);
    }
};
