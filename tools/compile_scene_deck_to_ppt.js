#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

const input = process.argv[2];
const output = process.argv[3] || '/mnt/data/scene-deck.pptx';
if (!input) {
  console.error('usage: node compile_scene_deck_to_ppt.js scene-deck.json [output.pptx]');
  process.exit(2);
}

const deck = JSON.parse(fs.readFileSync(input, 'utf8'));
validateDeck(deck);

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = deck.deck?.author || 'OpenAI';
pptx.subject = deck.deck?.subject || '';
pptx.title = deck.deck?.title || '';
pptx.company = deck.deck?.company || '';
pptx.lang = deck.deck?.lang || 'ja-JP';
pptx.theme = {
  headFontFace: deck.deck?.fonts?.jp || 'Yu Gothic',
  bodyFontFace: deck.deck?.fonts?.jp || 'Yu Gothic',
  lang: deck.deck?.lang || 'ja-JP'
};

const PPT_W = 13.333;
const PPT_H = 7.5;
const sx = v => (Number(v) / 100) * PPT_W;
const sy = v => (Number(v) / 100) * PPT_H;
const sw = v => (Number(v) / 100) * PPT_W;
const sh = v => (Number(v) / 100) * PPT_H;
const clean = c => String(c || '000000').replace('#','').toUpperCase();
const fontFace = (style={}) => style.fontFace || style.font || deck.deck?.fonts?.jp || 'Yu Gothic';

function validateDeck(d) {
  if (!d || typeof d !== 'object') throw new Error('scene deck must be an object');
  if (d.profile !== 'SCENE-DECK-v1') throw new Error('profile must be SCENE-DECK-v1');
  if (!Array.isArray(d.slides) || d.slides.length === 0) throw new Error('slides[] is required');
  const ids = new Set();
  d.slides.forEach((s, i) => {
    if (!s.id) throw new Error(`slide ${i+1}: id is required`);
    if (ids.has(s.id)) throw new Error(`duplicate slide id: ${s.id}`);
    ids.add(s.id);
    if (!Array.isArray(s.elements)) throw new Error(`slide ${s.id}: elements[] is required`);
  });
}

function themeFor(slide) {
  const key = slide.theme || deck.deck?.defaultTheme;
  return (deck.themes && key && deck.themes[key]) || {
    bg:'FFFFFF', ink:'111111', accent:'D2471D', signal:'F6B72B', paper:'FAF8F2', muted:'777777'
  };
}

function resolveColor(v, theme, fallback='111111') {
  if (!v) return clean(fallback);
  if (typeof v !== 'string') return clean(fallback);
  if (v.startsWith('$')) return clean(theme[v.slice(1)] || fallback);
  return clean(v);
}

function addText(slide, el, theme) {
  const st = el.style || {};
  const color = resolveColor(st.color, theme, theme.ink);
  const opts = {
    x:sx(el.x), y:sy(el.y), w:sw(el.w), h:sh(el.h),
    fontFace:fontFace(st), fontSize:Number(st.fontSize || 18),
    bold:!!st.bold, italic:!!st.italic, color,
    margin:Number(st.marginPt || 0),
    align:st.align || 'left', valign:st.valign || 'top',
    breakLine:false,
    fit:st.fit || 'shrink',
    paraSpaceAfterPt:Number(st.paraSpaceAfterPt || 0),
    charSpacing:st.charSpacing == null ? undefined : Number(st.charSpacing),
    rotate:st.rotate == null ? undefined : Number(st.rotate),
    transparency:st.transparency == null ? undefined : Number(st.transparency),
    isTextBox:true
  };
  if (st.lineSpacingMultiple) opts.lineSpacingMultiple = Number(st.lineSpacingMultiple);
  if (st.bullet) opts.bullet = st.bullet;
  if (Array.isArray(el.runs)) {
    const runs = el.runs.map(r => ({
      text:String(r.text ?? ''),
      options:{
        fontFace:fontFace({...st, ...(r.style||{})}),
        fontSize:Number(r.style?.fontSize || st.fontSize || 18),
        bold:r.style?.bold ?? st.bold ?? false,
        italic:r.style?.italic ?? st.italic ?? false,
        color:resolveColor(r.style?.color || st.color, theme, theme.ink),
        breakLine:!!r.breakLine
      }
    }));
    slide.addText(runs, opts);
  } else {
    slide.addText(String(el.text ?? ''), opts);
  }
}

function addShape(slide, el, theme) {
  const st = el.style || {};
  const typeMap = {
    rect:pptx.ShapeType.rect,
    roundRect:pptx.ShapeType.roundRect,
    ellipse:pptx.ShapeType.ellipse
  };
  const shapeType = typeMap[el.type];
  const fill = resolveColor(st.fill, theme, theme.paper);
  const line = resolveColor(st.line, theme, theme.ink);
  slide.addShape(shapeType, {
    x:sx(el.x), y:sy(el.y), w:sw(el.w), h:sh(el.h),
    fill:{color:fill, transparency:Number(st.fillTransparency || 0)},
    line:{color:line, pt:Number(st.lineWidth || 1), transparency:Number(st.lineTransparency || 0)},
    rotate:st.rotate == null ? undefined : Number(st.rotate)
  });
}

function addLine(slide, el, theme) {
  const st = el.style || {};
  const color = resolveColor(st.color || st.line, theme, theme.ink);
  const x1=sx(el.x1), y1=sy(el.y1), x2=sx(el.x2), y2=sy(el.y2);
  slide.addShape(pptx.ShapeType.line, {
    x:x1, y:y1, w:x2-x1, h:y2-y1,
    line:{
      color, pt:Number(st.lineWidth || 1),
      beginArrowType:st.beginArrow || undefined,
      endArrowType:st.endArrow || undefined,
      dash:st.dash || undefined,
      transparency:Number(st.transparency || 0)
    }
  });
}

function addImage(slide, el) {
  if (!el.path) throw new Error(`image ${el.id || ''}: path is required`);
  const p = path.isAbsolute(el.path) ? el.path : path.resolve(path.dirname(input), el.path);
  if (!fs.existsSync(p)) throw new Error(`image not found: ${p}`);
  slide.addImage({path:p, x:sx(el.x), y:sy(el.y), w:sw(el.w), h:sh(el.h), transparency:Number(el.style?.transparency || 0)});
}

function addChart(slide, el, theme) {
  const chartTypeMap = {
    bar:pptx.ChartType.bar,
    column:pptx.ChartType.bar,
    line:pptx.ChartType.line,
    pie:pptx.ChartType.pie,
    doughnut:pptx.ChartType.doughnut
  };
  const ct = chartTypeMap[el.chartType];
  if (!ct) throw new Error(`chart ${el.id || ''}: unsupported chartType ${el.chartType}`);
  const series = (el.series || []).map(s => ({
    name:s.name || '',
    labels:(s.labels || el.categories || []).map(String),
    values:(s.values || []).map(Number)
  }));
  if (!series.length) throw new Error(`chart ${el.id || ''}: series[] required`);
  const st=el.style||{};
  const opts={
    x:sx(el.x), y:sy(el.y), w:sw(el.w), h:sh(el.h),
    showLegend:st.showLegend ?? false,
    showTitle:st.showTitle ?? false,
    showValue:st.showValue ?? false,
    showCategoryName:st.showCategoryName ?? false,
    showCatName:st.showCategoryName ?? false,
    catAxisLabelFontFace:fontFace(st),
    valAxisLabelFontFace:fontFace(st),
    catAxisLabelFontSize:Number(st.axisFontSize || 9),
    valAxisLabelFontSize:Number(st.axisFontSize || 9),
    showCatNameOnSeries:false,
    showValueOnSeries:false,
    showBorder:false,
    chartColors:(st.colors || [theme.accent, theme.ink, theme.signal]).map(c => resolveColor(c, theme)),
    showSerName:st.showSeriesName ?? false,
    showPercent:st.showPercent ?? false,
    valGridLine:{color:resolveColor(st.gridColor || theme.muted, theme, theme.muted), transparency:Number(st.gridTransparency ?? 65), pt:Number(st.gridWidth || 0.5)},
    catAxisLineColor:resolveColor(st.axisColor || theme.ink, theme, theme.ink),
    valAxisLineColor:resolveColor(st.axisColor || theme.ink, theme, theme.ink)
  };
  if (el.chartType === 'column') opts.barDir = 'col';
  if (st.legendPos) opts.legendPos=st.legendPos;
  if (st.showTitle && el.title) { opts.title=el.title; opts.titleFontFace=fontFace(st); opts.titleFontSize=Number(st.titleFontSize||12); }
  slide.addChart(ct, series, opts);
}

function addElement(slide, el, theme) {
  if (!el || el.visible === false) return;
  switch(el.type) {
    case 'text': return addText(slide, el, theme);
    case 'rect':
    case 'roundRect':
    case 'ellipse': return addShape(slide, el, theme);
    case 'line':
    case 'connector': return addLine(slide, el, theme);
    case 'image': return addImage(slide, el);
    case 'chart': return addChart(slide, el, theme);
    default: throw new Error(`slide element ${el.id || ''}: unsupported type ${el.type}`);
  }
}

deck.slides.forEach(scene => {
  const theme = themeFor(scene);
  const slide = pptx.addSlide();
  slide.background = {color:resolveColor(scene.background || '$bg', theme, theme.bg)};
  [...scene.elements].sort((a,b)=>(a.z||0)-(b.z||0)).forEach(el => addElement(slide, el, theme));
  if (scene.notes) slide.addNotes(String(scene.notes));
});

pptx.writeFile({fileName:output}).then(() => console.log(output));
