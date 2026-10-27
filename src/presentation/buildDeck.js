const fs = require('fs');
const PptxGenJS = require('pptxgenjs');
const THEME = require('./theme');

function defineMasters(pres) {
  const c = THEME.colors;
  const hasLogo = fs.existsSync(THEME.logoPath);

  const coverObjects = [];
  if (hasLogo) {
    coverObjects.push({
      image: {
        x: 0.7,
        y: 0.5,
        w: 1.1,
        h: 0.92,
        path: THEME.logoPath,
      },
    });
  }

  coverObjects.push(
    {
      placeholder: {
        options: {
          name: 'title',
          type: 'title',
          x: 0.7,
          y: 1.8,
          w: 8.6,
          h: 1.4,
          fontFace: THEME.headFontFace,
          fontSize: 40,
          bold: true,
          color: c.light,
          valign: 'bottom',
        },
        text: '',
      },
    },
    {
      placeholder: {
        options: {
          name: 'subtitle',
          type: 'body',
          x: 0.7,
          y: 3.35,
          w: 8.6,
          h: 0.8,
          fontFace: THEME.bodyFontFace,
          fontSize: 18,
          color: c.accent,
          valign: 'top',
        },
        text: '',
      },
    }
  );

  pres.defineSlideMaster({
    title: 'COVER',
    background: { color: c.primary },
    objects: coverObjects,
  });

  const contentObjects = [
    { rect: { x: 0, y: 0, w: 10, h: 0.12, fill: { color: c.accent } } },
    {
      placeholder: {
        options: {
          name: 'title',
          type: 'title',
          x: 0.6,
          y: 0.4,
          w: 8.2,
          h: 0.9,
          fontFace: THEME.headFontFace,
          fontSize: 28,
          bold: true,
          color: c.primary,
          valign: 'middle',
        },
        text: '',
      },
    },
    {
      placeholder: {
        options: {
          name: 'body',
          type: 'body',
          x: 0.6,
          y: 1.5,
          w: 8.8,
          h: 3.5,
          fontFace: THEME.bodyFontFace,
          fontSize: 18,
          color: c.text,
          valign: 'top',
        },
        text: '',
      },
    },
  ];

  if (hasLogo) {
    // Logo en la esquina superior derecha del contenido
    contentObjects.push({
      image: {
        x: 8.95,
        y: 0.35,
        w: 0.55,
        h: 0.46,
        path: THEME.logoPath,
      },
    });
    // Logo miniatura junto a la palabra DocIA PRO en el pie de página
    contentObjects.push({
      image: {
        x: 0.6,
        y: 5.18,
        w: 0.28,
        h: 0.24,
        path: THEME.logoPath,
      },
    });
    contentObjects.push({
      text: {
        text: THEME.name,
        options: {
          x: 0.95,
          y: 5.2,
          w: 5.5,
          h: 0.3,
          margin: 0,
          fontFace: THEME.bodyFontFace,
          fontSize: 10,
          color: c.muted,
          bold: true,
        },
      },
    });
  } else {
    contentObjects.push({
      text: {
        text: THEME.name,
        options: {
          x: 0.6,
          y: 5.2,
          w: 6,
          h: 0.3,
          margin: 0,
          fontFace: THEME.bodyFontFace,
          fontSize: 10,
          color: c.muted,
        },
      },
    });
  }

  pres.defineSlideMaster({
    title: 'CONTENT',
    background: { color: 'FFFFFF' },
    objects: contentObjects,
    slideNumber: { x: 8.8, y: 5.2, w: 0.6, h: 0.3, fontSize: 10, color: c.muted },
  });
}

/**
 * spec = {
 *   title: string,
 *   slides: [
 *     { layout: 'cover', title, subtitle?, notes? },
 *     { layout: 'content', title, bullets: [string], notes? }
 *   ]
 * }
 * Devuelve un Buffer con el .pptx
 */
async function buildDeck(spec) {
  const pres = new PptxGenJS(); // una instancia por archivo
  pres.layout = 'LAYOUT_16x9';  // 10" x 5.625"
  pres.theme = {
    headFontFace: THEME.headFontFace,
    bodyFontFace: THEME.bodyFontFace,
  };
  pres.title = spec.title || 'Presentación DocIA PRO';
  pres.company = THEME.name.replace(/&/g, '&amp;');

  defineMasters(pres);

  for (const s of spec.slides || []) {
    const isCover = s.layout === 'cover';
    const slide = pres.addSlide({ masterName: isCover ? 'COVER' : 'CONTENT' });

    slide.addText(s.title || '', { placeholder: 'title' });

    if (isCover) {
      if (s.subtitle) slide.addText(s.subtitle, { placeholder: 'subtitle' });
    } else if (Array.isArray(s.bullets) && s.bullets.length) {
      const runs = s.bullets.map((b, i, arr) => ({
        text: b,
        options: {
          bullet: true,
          breakLine: i < arr.length - 1,
          paraSpaceAfter: 8,
        },
      }));
      slide.addText(runs, { placeholder: 'body' });
    }

    if (s.notes) slide.addNotes(s.notes);
  }

  return pres.write({ outputType: 'nodebuffer' });
}

module.exports = { buildDeck };

