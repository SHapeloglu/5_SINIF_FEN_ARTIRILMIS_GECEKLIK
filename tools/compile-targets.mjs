// MindAR hedef derleyicisi. Sahne dosyasindaki "mark: N" sirasiyla hedefleri tek .mind dosyasinda toplar.
// node-canvas gerektirmez: extract_marks.py'nin urettigi ham RGBA pikselleri kullanir.
//
// Kullanim:  node compile-targets.mjs <isaret_klasoru> <sahne.js> <cikti.mind>
// Gereksinim: npm install mind-ar@1.2.5 --ignore-scripts
import fs from 'node:fs';
import { CompilerBase } from 'mind-ar/src/image-target/compiler-base.js';
import { buildTrackingImageList } from 'mind-ar/src/image-target/image-list.js';
import { extractTrackingFeatures } from 'mind-ar/src/image-target/tracker/extract-utils.js';
import 'mind-ar/src/image-target/detector/kernels/cpu/index.js';

const [dir, sceneFile, outPath] = process.argv.slice(2);
const marks = JSON.parse(fs.readFileSync(`${dir}/marks.json`, 'utf8'));
const order = [...fs.readFileSync(sceneFile, 'utf8').matchAll(/^\s*mark:\s*(\d+)/gm)].map((m) => Number(m[1]));

class RawCompiler extends CompilerBase {
  createProcessCanvas(img) {
    return { getContext: () => ({ drawImage() {}, getImageData: () => ({ data: img.data }) }) };
  }
  compileTrack({ targetImages }) {
    return Promise.resolve(targetImages.map((t) => extractTrackingFeatures(buildTrackingImageList(t), () => {})));
  }
}

const images = order.map((n) => {
  const m = marks.find((x) => x.mark === n);
  if (!m) throw new Error(`marks.json icinde ${n} numarali isaret yok`);
  const name = `${dir}/m${String(n).padStart(2, '0')}.rgba`;
  return { width: m.px[0], height: m.px[1], data: new Uint8ClampedArray(fs.readFileSync(name)) };
});
console.log(`${images.length} hedef derleniyor: ${order.join(', ')}`);
const c = new RawCompiler();
let last = -10;
await c.compileImageTargets(images, (p) => { if (p - last >= 20) { console.log(`  %${p.toFixed(0)}`); last = p; } });
fs.writeFileSync(outPath, Buffer.from(c.exportData()));
console.log(`yazildi ${outPath} (${(fs.statSync(outPath).size / 1e6).toFixed(2)} MB)`);
