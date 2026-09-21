import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sitemapPath = path.join(__dirname, 'public', 'sitemap.xml');
let data = fs.readFileSync(sitemapPath, 'utf8');

data = data.replace(/findingmena\.com/g, 'findingglobal.com');

fs.writeFileSync(sitemapPath, data);
console.log('Successfully updated sitemap.xml to use findingglobal.com');
