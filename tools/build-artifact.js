// Gör en artefakt-version av index.html (bara innehållet i <head>/<body>, utan skal).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = process.argv[2];
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const title = /<title>[\s\S]*?<\/title>/.exec(html)[0];
const styles = html.match(/<style>[\s\S]*?<\/style>/g).join('\n');
const body = /<body>([\s\S]*)<\/body>/.exec(html)[1];
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, title + '\n' + styles + '\n' + body.trim() + '\n');
const scripts = [...body.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
const files = {};
for (const s of scripts) files[s] = path.join(root, s);
console.log(JSON.stringify(files));
