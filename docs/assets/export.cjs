const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const assets = [
  { file: 'generate-og-image.html', width: 1200, height: 630, output: 'og-image.png' },
  { file: 'generate-youtube-thumbnail.html', width: 1280, height: 720, output: 'youtube-thumbnail.png' },
  { file: 'generate-devpost-thumbnail.html', width: 1200, height: 800, output: 'devpost-thumbnail.png' },
  { file: 'generate-devpost-gallery.html', width: 1200, height: 800, output: 'devpost-gallery.png' },
  { file: 'generate-readme-hero.html', width: 1280, height: 640, output: 'readme-hero.png' },
];

(async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ deviceScaleFactor: 2 });
    const page = await context.newPage();

    for (const asset of assets) {
      const startMs = Date.now();
      await page.setViewportSize({ width: asset.width, height: asset.height });
      await page.goto(`file://${path.resolve(__dirname, asset.file)}`);
      await page.evaluate(() => document.fonts.ready);
      
      await page.screenshot({
        path: path.resolve(__dirname, asset.output),
        fullPage: false,
        animations: 'disabled',
      });
      const ms = Date.now() - startMs;
      console.log(`✓ ${asset.output} (${ms}ms)`);
    }

    const svg = fs.readFileSync(path.resolve(__dirname, 'icon.svg'), 'utf-8');
    for (const size of [512, 1024]) {
      const startMs = Date.now();
      await page.setViewportSize({ width: size, height: size });
      await page.setContent(`<style>html,body{margin:0;padding:0}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: path.resolve(__dirname, `icon-${size}.png`),
        omitBackground: true,
        animations: 'disabled',
      });
      const ms = Date.now() - startMs;
      console.log(`✓ icon-${size}.png (${ms}ms)`);
    }

  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
