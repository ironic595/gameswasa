// generate-sitemap.js - lastmod real por archivo
const fs = require('fs');
const path = require('path');

const games = JSON.parse(fs.readFileSync('./games.json','utf8'));
const liveGames = games.filter(g => g.live === true || g.live === undefined);

function getLastMod(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return fs.statSync(filePath).mtime.toISOString().split('T')[0];
    }
  } catch(e) {}
  return new Date().toISOString().split('T')[0];
}

const rootMod = getLastMod('./index.html');
const playMod = getLastMod('./play/index.html');
const passMod = getLastMod('./wasa-pass.html');

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://games.wasa.chat/</loc><lastmod>${rootMod}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>https://games.wasa.chat/play/</loc><lastmod>${playMod}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://games.wasa.chat/wasa-pass.html</loc><lastmod>${passMod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>
`;

liveGames.forEach(g => {
  const slug = typeof g === 'string'? g : g.slug;
  if(!slug) return;
  const gameFile = path.join('./play', slug, 'index.html');
  const mod = getLastMod(gameFile);
  xml += ` <url><loc>https://games.wasa.chat/play/${slug}/</loc><lastmod>${mod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
`;
});

xml += `</urlset>
`;

fs.writeFileSync('./sitemap.xml', xml);
console.log(`✅ sitemap con lastmod real`);
liveGames.forEach(g => console.log(` - ${g.slug}: ${getLastMod(path.join('./play', g.slug, 'index.html'))}`));
