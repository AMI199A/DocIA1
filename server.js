const express = require('express');
const { buildDeck } = require('./src/presentation/buildDeck');

const app = express();
app.use(express.json({ limit: '10mb' }));

app.post('/api/presentations', async (req, res) => {
  const spec = req.body;
  if (!spec || !Array.isArray(spec.slides) || spec.slides.length === 0) {
    return res.status(400).json({ error: 'Se requiere un arreglo "slides" no vacío.' });
  }

  try {
    const buffer = await buildDeck(spec);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="presentacion.pptx"');
    res.send(buffer);
  } catch (err) {
    console.error('Error generando presentación:', err);
    res.status(500).json({ error: 'No se pudo generar la presentación.' });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Servidor de presentaciones DocIA PRO en http://localhost:${PORT}`));
}

module.exports = app;

