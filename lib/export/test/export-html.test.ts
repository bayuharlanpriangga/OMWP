import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadAndNormalizeDeck,
  migrateLegacyDeck,
} from '../../presentation/presentation-migration';
import { createDefaultDeck } from '../../presentation/presentation-page-content';
import { buildSlideAiContext } from '../../page/page-presentation';
import { createBlock } from '../../page/page-edit/page-edit';
import { createChartBlock } from '../../page/page-edit/page-edit-chart';
import { importDeckFromHtml } from '../../import/import-types/import-types-html';
import { buildStandaloneHtml } from '../export-html';

test('buildStandaloneHtml embeds deck JSON and BYOK keys safely', () => {
  const deck = migrateLegacyDeck(
    {
      title: 'Presentasi Uji',
      slides: [
        {
          title: 'Slide Konten',
          points: [{ text: 'Poin Utama', detail: 'Penjelasan utama' }],
        },
      ],
    },
    true
  );

  const html = buildStandaloneHtml(deck);
  assert.ok(html.includes('data-locked="1"'));
  assert.ok(html.includes('data-theme="default"'));
  assert.ok(html.includes('#EEF1F4'));
  assert.ok(html.includes('Presentasi Uji'));
  assert.ok(html.includes('<script id="byok-data" type="application/json">[]</script>'));

  const htmlWithKeys = buildStandaloneHtml(deck, [
    { provider: 'gemini', key: 'AIzaTestKey123' },
  ]);
  assert.ok(htmlWithKeys.includes('AIzaTestKey123'));
});

test('custom dropdown badge is preserved on normalize and embedded in standalone HTML', () => {
  const deck = createDefaultDeck();
  const ddBlock = createBlock('dd');
  if (ddBlock.t !== 'dd') throw new Error('Expected dd block');
  ddBlock.badge = '★A';
  ddBlock.text = 'Judul';
  deck.slides[0].blocks.push(ddBlock);

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  const normDd = normalized.slides[0].blocks.find((b) => b.t === 'dd');
  assert.equal(normDd?.t === 'dd' ? normDd.badge : undefined, '★A');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('★A'));
  assert.ok(
    html.includes('b.badge&&String(b.badge).trim()?b.badge:String(n)') ||
      html.includes('(b.badge&&String(b.badge).trim())?b.badge:String(n)')
  );
});

test('TableBlock feeds AI context, preserves manual colWidths, and exports to standalone HTML', () => {
  const deck = createDefaultDeck();
  const tbl = createBlock('table');
  if (tbl.t !== 'table') throw new Error('Expected table');
  tbl.headers = ['Nama', 'Keterangan', 'Catatan'];
  tbl.rows = [
    ['[[Overhead]]', 'Biaya produksi tidak langsung yang dialokasikan ke unit produk.', '[[[Detail Rumus]]]'],
    ['Tenaga Kerja'],
  ];
  tbl.colWidths = [20, 55, 25];
  deck.slides[0].blocks.push(tbl);

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  const normTbl = normalized.slides[0].blocks[0];
  assert.equal(normTbl.t, 'table');
  if (normTbl.t === 'table') {
    assert.equal(normTbl.headers.length, 3);
    assert.equal(normTbl.rows.length, 2);
    assert.deepEqual(normTbl.rows[1], ['Tenaga Kerja', '', '']);
    assert.deepEqual(normTbl.colWidths, [20, 55, 25]);
  }
  assert.equal(normalized.slides[0].modals?.[0].title, 'Detail Rumus');

  const ctx = buildSlideAiContext(normalized, normalized.slides[0], 'Overhead');
  assert.ok(ctx.slideContentOutline?.includes('Tabel'));
  assert.ok(ctx.slideContentOutline?.includes('Keterangan'));
  assert.ok(ctx.surroundingContext?.includes('Overhead'));

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('ptbl-wrap'));
  assert.ok(html.includes('tblWidths(hdrs,b.colWidths)'));
  assert.ok(html.includes('"colWidths":[20,55,25]'));
});

test('standalone HTML unifies slide canvas font metrics and borderless header/footer across all themes', () => {
  const deck = createDefaultDeck();
  deck.theme = 'hacker';
  deck.title = 'Konsistensi Tata Letak';
  const html = buildStandaloneHtml(deck);

  assert.ok(
    html.includes(".cv,.cv .s-s,.cv .s-m,.cv .s-l,.cv .s-xl,.cv .s-xxl,.cv .bt,.cv .ch,.cv .cb,.cv .concl,.cv .btn,.cv .ptbl,.cv .ptbl th,.cv .ptbl td{font-family:'IBM Plex Sans',system-ui,sans-serif;letter-spacing:0}")
  );
  assert.ok(html.includes('header{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:12px 16px 8px;border-bottom:0;background:transparent'));
  assert.ok(html.includes('border-top:0;z-index:15'));
});

test('multiple TitleBlock headings inside a Container normalize, sync modals, feed AI context, and export cleanly', () => {
  const deck = createDefaultDeck();
  const box = createBlock('box');
  if (box.t !== 'box') throw new Error('Expected box');
  box.title = 'Bagian Pertama';

  const subTitle = createBlock('title');
  if (subTitle.t !== 'title') throw new Error('Expected title');
  subTitle.text = 'Bagian Kedua [[[Detail Tambahan]]]';

  const textInside = createBlock('text');
  if (textInside.t !== 'text') throw new Error('Expected text');
  textInside.text = 'Uraian [[variabel]] lanjutan.';

  box.children.push(subTitle, textInside);
  deck.slides[0].blocks.push(box);

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  const normBox = normalized.slides[0].blocks[0];
  assert.equal(normBox.t, 'box');
  if (normBox.t === 'box') {
    assert.equal(normBox.children.length, 2);
    assert.equal(normBox.children[0].t, 'title');
    if (normBox.children[0].t === 'title') {
      assert.equal(normBox.children[0].text, 'Bagian Kedua [[[Detail Tambahan]]]');
    }
  }
  assert.equal(normalized.slides[0].modals?.[0].title, 'Detail Tambahan');

  const ctx = buildSlideAiContext(normalized, normalized.slides[0], 'Bagian Kedua');
  assert.ok(ctx.slideContentOutline?.includes('Bagian Kedua'));
  assert.ok(ctx.surroundingContext?.includes('Bagian Kedua'));

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('.cv .bt.bt-sub'));
  assert.ok(html.includes("else if(b.t==='title')"));
});

test('standalone HTML and AI context support independent per-slide headerTitle', () => {
  const deck = createDefaultDeck();
  deck.slides[0].headerTitle = 'Konteks Slide 1 — Pendahuluan';
  deck.slides.push({
    id: 'slide-2',
    name: '',
    headerTitle: 'Konteks Slide 2 — Analisis Data',
    blocks: [],
  });
  deck.title = '';

  const html = buildStandaloneHtml(deck);
  assert.ok(html.includes('Konteks Slide 1 — Pendahuluan'));
  assert.ok(html.includes('Konteks Slide 2 — Analisis Data'));
  assert.ok(html.includes("const hdrTitle=(typeof sl.headerTitle==='string'?sl.headerTitle:deck.title)||'Presentasi'"));

  const ctx2 = buildSlideAiContext(deck, deck.slides[1]);
  assert.equal(ctx2.deckTitle, 'Konteks Slide 2 — Analisis Data');
});

test('standalone HTML wraps ImageBlock in .im-frame and includes frame rules for every theme', () => {
  const deck = createDefaultDeck();
  const img = createBlock('img');
  if (img.t !== 'img') throw new Error('Expected img');
  img.src = 'data:image/png;base64,AAAA';
  img.alt = 'Foto Bingkai';
  deck.slides[0].blocks.push(img);

  const html = buildStandaloneHtml(deck);
  assert.ok(html.includes('<div class="im-frame"><img class="im"'));
  assert.ok(html.includes('.im-frame{position:relative;display:block;width:100%;padding:8px;'));
  for (const theme of [
    'default',
    'auditor',
    'cyberpunk',
    'hacker',
    'astronomi',
    'ghost',
    'halloween',
    'aquarium',
    'detective',
    'summer',
    'pixel',
    'dino',
    'zodiac',
    'tarot',
    'joker',
    'ai',
  ]) {
    assert.ok(
      html.includes(`[data-theme=${theme}] .im-frame{`),
      `Expected standalone CSS .im-frame rule for theme ${theme}`
    );
  }
});

test('TextBlock whole-block italic and underline flags normalize and export cleanly to standalone HTML', () => {
  const deck = createDefaultDeck();
  const tb = createBlock('text');
  if (tb.t !== 'text') throw new Error('Expected text');
  tb.b = true;
  tb.i = true;
  tb.u = true;
  tb.text = 'Teks *miring* dan __garis bawah__ serta ***tebal miring***';
  deck.slides[0].blocks.push(tb);

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  const normTb = normalized.slides[0].blocks[0];
  assert.equal(normTb.t, 'text');
  if (normTb.t === 'text') {
    assert.equal(normTb.b, true);
    assert.equal(normTb.i, true);
    assert.equal(normTb.u, true);
  }

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('.it{font-style:italic}.ul{text-decoration:underline;text-underline-offset:3px}'));
  assert.ok(html.includes("+(b.i?' it':'')+(b.u?' ul':'')"));
  assert.ok(html.includes('<strong><em>$1</em></strong>'));
  assert.ok(html.includes('<u class="ul">$1</u>'));
});

test('ChartBlock builds AI context, exports SVG chart in standalone HTML, and round-trips through HTML import', () => {
  const deck = createDefaultDeck();
  const chart = createChartBlock('pie');
  chart.title = 'Distribusi [[[Rincian Biaya]]]';
  chart.categories = ['Bahan Baku', 'Tenaga Kerja'];
  chart.series = [{ id: 's1', name: 'Persentase', values: [65, 35] }];
  deck.slides[0].blocks.push(chart);

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  assert.equal(normalized.slides[0].modals?.length, 1);
  assert.equal(normalized.slides[0].modals?.[0].title, 'Rincian Biaya');

  const ctx = buildSlideAiContext(normalized, normalized.slides[0], 'Bahan Baku');
  assert.ok(ctx.slideText.includes('Chart (Pai)'));
  assert.ok(ctx.slideText.includes('Bahan Baku'));
  assert.ok(ctx.surroundingContext?.includes('Chart (Pai)'));

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('renderChart(b)'));
  assert.ok(html.includes('.pchart-wrap'));

  const imported = importDeckFromHtml(html);
  assert.ok(imported);
  const reimportedChart = imported.deck.slides[0].blocks.find((b) => b.t === 'chart');
  assert.ok(reimportedChart && reimportedChart.t === 'chart');
  assert.equal(reimportedChart.chartType, 'pie');
  assert.deepEqual(reimportedChart.categories, ['Bahan Baku', 'Tenaga Kerja']);
  assert.deepEqual(reimportedChart.series[0].values, [65, 35]);

  const sunChart = createChartBlock('sunburst');
  sunChart.title = 'Struktur Pendapatan';
  sunChart.categories = ['Jasa', 'Produk'];
  sunChart.series = [
    { id: 's1', name: 'Q1', values: [30, 20] },
    { id: 's2', name: 'Q2', values: [40, 10] },
  ];
  deck.slides[0].blocks.push(sunChart);

  const sunNormalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(sunNormalized);
  const sunCtx = buildSlideAiContext(sunNormalized, sunNormalized.slides[0], 'Jasa');
  assert.ok(sunCtx.slideText.includes('Chart (Sunburst)'));
  const sunHtml = buildStandaloneHtml(sunNormalized);
  assert.ok(sunHtml.includes("ct==='sunburst'"));
  assert.ok(sunHtml.includes("sunburst:'Sunburst'"));
  const sunReimported = importDeckFromHtml(sunHtml);
  assert.ok(sunReimported);
  const foundSun = sunReimported.deck.slides[0].blocks.find(
    (b) => b.t === 'chart' && b.chartType === 'sunburst'
  );
  assert.ok(foundSun && foundSun.t === 'chart');
  assert.equal(foundSun.series.length, 2);
});
