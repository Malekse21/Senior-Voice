const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'seniorvoice/src/pages/MainPage.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

const regex = /const groqKey = import\.meta\.env\.VITE_GROQ_API_KEY \|\| keys\?\.groq\n\s*if \(\!groqKey\) \{[\s\S]*?return\n\s*\}/;
content = content.replace(regex, 'const groqKey = import.meta.env.VITE_GROQ_API_KEY || keys?.groq;');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Script updated successfully');
