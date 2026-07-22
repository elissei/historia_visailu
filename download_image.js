import fs from 'fs';
import path from 'path';

// Määritä polku JSON-tiedostoon, jossa kysymykset ja imageUrl-kentät sijaitsevat
const questionsFilePath = path.join(process.cwd(), 'src', 'data', 'questions.ts');
// Huom. Voit myös käyttää erillistä images.json-tiedostoa, jos haluat erottaa kuvat kysymyksistä.

// Esimerkkilista ladattavista kohteista (tämän voi myös parsia suoraan JSONista)
const imagesToDownload = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Flint_axes.jpg/800px-Flint_axes.jpg",
    dest: "public/images/history/grade6/hist_6_01.jpg"
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Lascaux_painting.jpg/800px-Lascaux_painting.jpg",
    dest: "public/images/history/grade6/hist_6_02.jpg"
  }
  // Lisää muut kuvat tähän listaan tai lue ne automaattisesti JSON-tiedostosta
];

async function downloadImage(url, filepath) {
  try {
    // Varmista, että kohdekansio on olemassa
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Virhe ladattaessa kuvaa: ${response.statusText} (${url})`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
    console.log(`✅ Ladattu onnistuneesti: ${filepath}`);
  } catch (error) {
    console.error(`❌ Lataus epäonnistui kohteelle ${url}:`, error.message);
  }
}

async function startDownloadProcess() {
  console.log('🚀 Aloitetaan kuvien automaattinen lataus...');
  
  for (const item of imagesToDownload) {
    await downloadImage(item.url, item.dest);
  }
  
  console.log('✨ Kaikki kuvat käsitelty!');
}

startDownloadProcess();