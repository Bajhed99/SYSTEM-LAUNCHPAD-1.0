const fs = require('fs');
const path = require('path');

// Try to load .env manually since we are running with node
const envPath = path.resolve(process.cwd(), '.env');
const dotenv = require('dotenv'); // This might fail if dotenv is not installed

console.log('Checking environment variables...');

if (fs.existsSync(envPath)) {
    console.log('.env file found.');
    const envConfig = require('dotenv').config();
    if (envConfig.error) {
        console.error('Error loading .env file:', envConfig.error);
    }
} else {
    console.log('.env file NOT found.');
}

const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const missingVars = [];

requiredVars.forEach(varName => {
    if (process.env[varName]) {
        console.log(`✅ ${varName} is set.`);
    } else {
        console.log(`❌ ${varName} is MISSING.`);
        missingVars.push(varName);
    }
});

if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars.join(', '));
    process.exit(1);
} else {
    console.log('All required environment variables are set.');
}
