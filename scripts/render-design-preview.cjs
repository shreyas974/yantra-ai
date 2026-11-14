// Visual review artifact from the actual homepage. This is not a live backend.
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
globalThis.React = React;
const { renderToStaticMarkup } = require('react-dom/server');
require('@next/env').loadEnvConfig(process.cwd());
const Home = require('../app/page.tsx').default;
const BrandMark = require('../components/BrandMark.tsx').default;
const Footer = require('../components/Footer.tsx').default;
async function main() {
  const cssDir = path.join(process.cwd(), '.next/static/css');
  const css = fs.readdirSync(cssDir).filter(f => f.endsWith('.css')).map(f => fs.readFileSync(path.join(cssDir, f), 'utf8')).join('\n');
  const content = renderToStaticMarkup(await Home());
  const logo = renderToStaticMarkup(React.createElement(BrandMark));
  const footer = renderToStaticMarkup(React.createElement(Footer));
  const nav = '<header class="site-header header-light"><div class="nav-container"><a class="brand-lockup" href="/">'+logo+'<span class="brand-type">YANTRA<span class="brand-ai">AI</span><small>HUMAN IDEAS. MACHINE INTELLIGENCE.</small></span></a><nav class="desktop-links">'+[['/','Home'],['/about','About'],['/tracks','Tracks'],['/schedule','Schedule'],['/prizes','Awards'],['/rules','Rules'],['/faq','FAQ'],['/contact','Contact']].map(([href,label])=>`<a href="${href}">${label}</a>`).join('')+'</nav><div class="desktop-actions"><a class="nav-signin" href="/login">Sign in</a><a class="nav-register" href="/register">Join the hackathon ↗</a></div></div></header>';
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="http://127.0.0.1:3000"><title>YANTRA AI — Design review</title><style>'+css+'</style></head><body>'+nav+content+footer+'<div style="position:fixed;bottom:10px;left:10px;padding:8px 12px;border-radius:5px;background:#f5f3ed;color:#233b2c;border:1px solid #233b2c33;font:10px Arial;z-index:100">Design review · Connect the running app for registration and live data</div></body></html>';
  const destination = path.join(process.cwd(), 'work/preview');
  fs.mkdirSync(destination,{recursive:true});
  fs.writeFileSync(path.join(destination,'yantra-ai.html'),html);
  console.log('Created work/preview/yantra-ai.html from the actual homepage; live data unavailable if Firestore is unavailable.');
  await require('../lib/db.ts').db.disconnect();
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
