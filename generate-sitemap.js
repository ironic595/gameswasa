// generate-sitemap.js - lee games.json y genera sitemap.xml con slash
// Compatible con tu formato: [{slug, title, cat, live}]
const fs = require('fs');
const path = './games.json';

if (!fs.existsSync(path)) {
  console.error('No se encontro games.json en la raiz');
  process.exit(1);
}

const games = JSON.parse(fs.readFileSync(path,'utf8'));
const today = new Date().toISOString().split('T')[0];

// Filtra solo los live:true
const liveGames = games.filter(g => g.live === true || g.live === undefined);

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://games.wasa.chat/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>https://games.wasa.chat/play/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://games.wasa.chat/wasa-pass.html</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>
`;

liveGames.forEach(g => {
  const slug = typeof g === 'string' ? g : g.slug;
  if(!slug) return;
  xml += `  <url><loc>https://games.wasa.chat/play/${slug}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
`;
});

xml += `</urlset>
`;

fs.writeFileSync('./sitemap.xml', xml);
console.log(`✅ sitemap.xml generado con ${liveGames.length} juegos LIVE de ${games.length} totales`);
liveGames.forEach(g => console.log(' - /play/' + g.slug + '/'));
