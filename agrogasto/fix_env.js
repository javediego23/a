const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const content = `DATABASE_URL="file:./dev.db"`;

try {
    fs.writeFileSync(envPath, content);
    console.log('.env fixed');
} catch (e) {
    console.error('Failed to write .env', e);
}
