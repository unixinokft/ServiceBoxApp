const fs = require('fs');
const path = require('path');

console.log('Running postinstall script to patch kotlinVersion in gradle.properties...');

const gradlePropsPath = path.join(__dirname, 'android', 'gradle.properties');

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
        console.log('✅ Patched kotlinVersion in gradle.properties');
    } else {
        console.warn('⚠️ gradle.properties not found.');
    }
} catch (err) {
    console.error('❌ Failed to patch kotlinVersion:', err);
}
