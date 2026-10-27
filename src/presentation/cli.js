const fs = require('fs');
const path = require('path');
const { buildDeck } = require('./buildDeck');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Uso: node cli.js <spec.json> <salida.pptx>');
    process.exit(1);
  }

  const specPath = path.resolve(args[0]);
  const outputPath = path.resolve(args[1]);

  try {
    const raw = fs.readFileSync(specPath, 'utf8');
    const spec = JSON.parse(raw);
    const buffer = await buildDeck(spec);
    fs.writeFileSync(outputPath, buffer);
    console.log(`Presentación generada con éxito en: ${outputPath}`);
  } catch (err) {
    console.error('Error generando presentación:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

