import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addBlockToSlide,
  buildSlideAiContext,
  buildStandaloneHtml,
  computeReflowPositions,
  computeTableColumnWidths,
  createBlock,
  createDefaultDeck,
  deleteBlockInSlide,
  duplicateSlide,
  getDeckDisplayTitle,
  getSlideHeaderTitle,
  loadAndNormalizeDeck,
  migrateLegacyDeck,
  moveBlockInParent,
  parseInlineMarkup,
  scanModalTitles,
  stripMarkup,
  syncSlideModals,
  updateBlockInSlide,
} from './deck-logic';

test('createDefaultDeck initializes an empty blank presentation without dummy data', () => {
  const deck = createDefaultDeck();
  assert.equal(deck.v, 2);
  assert.equal(deck.title, '');
  assert.equal(deck.theme, 'default');
  assert.equal(deck.slides.length, 1);
  assert.equal(deck.slides[0].name, '');
  assert.equal(deck.slides[0].blocks.length, 0);
});

test('migrateLegacyDeck converts legacy structure into normalized v2 slides', () => {
  const migrated = migrateLegacyDeck(
    {
      title: 'Materi Uji',
      conclusion: 'Ringkasan akhir.',
      slides: [
        {
          title: 'Bagian 1',
          points: [{ text: 'Poin A', detail: 'Detail A' }],
          conclusion: 'Kesimpulan 1',
        },
      ],
    },
    true
  );
  assert.equal(migrated.v, 2);
  assert.equal(migrated.title, 'Materi Uji');
  assert.equal(migrated.slides.length, 3);
  assert.equal(migrated.slides[0].name, 'Cover');
  assert.equal(migrated.slides[1].name, 'Bagian 1');
  assert.equal(migrated.slides[2].name, 'Kesimpulan');
});

test('parseInlineMarkup tokenizes AI terms, modal triggers, bold, size tags, and line breaks', () => {
  const tokens = parseInlineMarkup(
    'Biaya **tetap** pada [[relevant range]] dan {l}detail{/l}\n[[[Grafik Biaya]]]'
  );
  assert.deepEqual(tokens, [
    { type: 'text', value: 'Biaya ' },
    { type: 'bold', children: [{ type: 'text', value: 'tetap' }] },
    { type: 'text', value: ' pada ' },
    { type: 'ai-term', term: 'relevant range' },
    { type: 'text', value: ' dan ' },
    { type: 'size', size: 'l', children: [{ type: 'text', value: 'detail' }] },
    { type: 'br' },
    { type: 'modal-trigger', title: 'Grafik Biaya' },
  ]);
});

test('stripMarkup removes brackets, bold markers, and size tags cleanly', () => {
  assert.equal(
    stripMarkup('**Biaya** [[overhead]] dan [[[Rumus]]] {xl}besar{/xl}'),
    'Biaya overhead dan Rumus besar'
  );
});

test('syncSlideModals detects [[[ ]]] markers and preserves children across renames and archival', () => {
  const textBlock = createBlock('text');
  if (textBlock.t !== 'text') throw new Error('Expected text block');
  textBlock.text = 'Lihat [[[Rincian Overhead]]] untuk detail.';

  let slide = syncSlideModals({
    id: 's1',
    name: 'Test',
    blocks: [textBlock],
    modals: [],
  });

  assert.equal(slide.modals?.length, 1);
  assert.equal(slide.modals?.[0].title, 'Rincian Overhead');

  const childText = createBlock('text');
  if (childText.t !== 'text') throw new Error('Expected text block');
  childText.text = 'Listrik + penyusutan';

  slide = {
    ...slide,
    modals: [{ ...slide.modals![0], children: [childText] }],
  };

  // Rename the modal trigger in-place: positional modal retains children
  slide = updateBlockInSlide(slide, textBlock.id, (b) =>
    b.t === 'text' ? { ...b, text: 'Lihat [[[Komponen BOP]]] untuk detail.' } : b
  );
  assert.equal(slide.modals?.length, 1);
  assert.equal(slide.modals?.[0].title, 'Komponen BOP');
  assert.equal(slide.modals?.[0].children.length, 1);

  // Remove trigger temporarily -> archived in mold; re-add -> restored
  slide = updateBlockInSlide(slide, textBlock.id, (b) =>
    b.t === 'text' ? { ...b, text: 'Tanpa modal sementara.' } : b
  );
  assert.equal(slide.modals?.length, 0);
  assert.ok(slide.mold?.['Komponen BOP']);

  slide = updateBlockInSlide(slide, textBlock.id, (b) =>
    b.t === 'text' ? { ...b, text: 'Kembali ke [[[Komponen BOP]]].' } : b
  );
  assert.equal(slide.modals?.length, 1);
  assert.equal(slide.modals?.[0].children.length, 1);
});

test('block tree CRUD operations add, update, move, and delete cleanly', () => {
  const b1 = createBlock('text');
  const b2 = createBlock('dd');
  let slide = { id: 's1', name: 'Slide 1', blocks: [b1] };

  slide = addBlockToSlide(slide, b2);
  assert.equal(slide.blocks.length, 2);

  slide = moveBlockInParent(slide, b2.id, -1);
  assert.equal(slide.blocks[0].id, b2.id);

  slide = deleteBlockInSlide(slide, b1.id);
  assert.equal(slide.blocks.length, 1);
  assert.equal(slide.blocks[0].id, b2.id);
});

test('computeReflowPositions pushes down horizontally overlapping blocks below an expanded block', () => {
  const offsets = computeReflowPositions([
    { id: 'leftTop', x: 0, y: 100, w: 6, collapsedHeight: 60, extraExpandedHeight: 90 },
    { id: 'leftBottom', x: 0, y: 180, w: 6, collapsedHeight: 60, extraExpandedHeight: 0 },
    { id: 'rightColumn', x: 50, y: 180, w: 6, collapsedHeight: 60, extraExpandedHeight: 0 },
  ]);

  assert.equal(offsets.leftTop, 100);
  assert.equal(offsets.leftBottom, 270);
  assert.equal(offsets.rightColumn, 180);
});

test('duplicateSlide assigns fresh IDs and buildStandaloneHtml embeds deck JSON safely', () => {
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
  const dup = duplicateSlide(deck.slides[1]);
  assert.notEqual(dup.id, deck.slides[1].id);
  assert.notEqual(dup.blocks[0].id, deck.slides[1].blocks[0].id);

  const ctx = buildSlideAiContext(deck, deck.slides[1]);
  assert.equal(ctx.slideTitle, 'Slide Konten');
  assert.ok(ctx.pointsText.includes('Poin Utama'));

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

  const scanned = scanModalTitles(deck.slides[1]);
  assert.deepEqual(scanned, []);

  const invalid = loadAndNormalizeDeck({ slides: [] });
  assert.equal(invalid, null);
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

test('buildSlideAiContext derives slide title automatically and captures full slide, modal, deck overview, and implicit term context', () => {
  const deck = createDefaultDeck();
  deck.title = 'Transformasi Infrastruktur Cloud';
  deck.slides[0].name = 'Slide 1';
  deck.slides[0].blocks.push({
    id: 't1',
    t: 'text',
    w: 12,
    text: 'Arsitektur Pemulihan Bencana',
    size: 'xl',
    align: 'l',
    b: true,
  });
  deck.slides[0].blocks.push({
    id: 'b1',
    t: 'box',
    w: 6,
    title: 'Target Layanan Kritis',
    children: [
      {
        id: 'dd1',
        t: 'dd',
        w: 12,
        text: 'Strategi [[Failover]] Aktif-Pasif',
        detail: 'Pemulihan node database harus selesai di bawah target [[RTO]] 15 menit tanpa kehilangan transaksi.',
      },
    ],
  });
  deck.slides[0].modals = [
    {
      id: 'm1',
      title: 'Checklist Verifikasi',
      children: [
        {
          id: 'mt1',
          t: 'text',
          w: 12,
          text: 'Simulasi replikasi lintas zona dilakukan tiap kuartal.',
          size: 'm',
          align: 'l',
        },
      ],
    },
  ];
  deck.slides.push({
    id: 's2',
    name: '',
    vc: false,
    blocks: [
      {
        id: 't2',
        t: 'text',
        w: 12,
        text: 'Estimasi Biaya & Jadwal Migrasi Q3',
        size: 'l',
        align: 'l',
        b: true,
      },
    ],
    modals: [],
  });

  const ctx = buildSlideAiContext(deck, deck.slides[0], 'RTO');
  assert.equal(ctx.slideTitle, 'Arsitektur Pemulihan Bencana');
  assert.equal(ctx.slideNumber, 1);
  assert.equal(ctx.totalSlides, 2);
  assert.ok(ctx.slideContentOutline?.includes('Target Layanan Kritis'));
  assert.ok(ctx.slideContentOutline?.includes('Pemulihan node database'));
  assert.ok(ctx.slideContentOutline?.includes('Checklist Verifikasi'));
  assert.ok(ctx.deckOverview?.includes('Estimasi Biaya & Jadwal Migrasi Q3'));
  assert.equal(ctx.clickedTerm, 'RTO');
  assert.ok(ctx.surroundingContext?.includes('Target Layanan Kritis'));
  assert.ok(ctx.surroundingContext?.includes('RTO 15 menit'));
});

test('computeTableColumnWidths stays symmetric for short balanced columns and adapts when a column has long text', () => {
  // 1. Short symmetrical 2 columns
  const sym2 = computeTableColumnWidths(
    ['Nama', 'Status'],
    [
      ['Andi', 'Aktif'],
      ['Budi Santoso', 'Lulus'],
    ]
  );
  assert.equal(sym2.mode, 'symmetric');
  assert.deepEqual(sym2.widths, [50, 50]);

  // 2. Short symmetrical 3 columns
  const sym3 = computeTableColumnWidths(
    ['Kode', 'Kategori', 'Satuan'],
    [['A-01', 'Material', 'Unit']]
  );
  assert.equal(sym3.mode, 'symmetric');
  assert.equal(sym3.widths.length, 3);
  assert.equal(Number(sym3.widths.reduce((a, b) => a + b, 0).toFixed(2)), 100);

  // 3. Adaptive 2 columns: "Nama" (short) vs "Keterangan" (long description)
  const adap2 = computeTableColumnWidths(
    ['Nama', 'Keterangan'],
    [
      [
        'Biaya Tetap',
        'Biaya operasional rutin yang jumlah totalnya tetap konstan meskipun volume produksi berubah sepanjang periode berjalan.',
      ],
    ]
  );
  assert.equal(adap2.mode, 'adaptive');
  assert.ok(adap2.widths[0] < 28, `Expected short col width < 28%, got ${adap2.widths[0]}`);
  assert.ok(adap2.widths[1] > 72, `Expected long col width > 72%, got ${adap2.widths[1]}`);
  assert.equal(Number(adap2.widths.reduce((a, b) => a + b, 0).toFixed(2)), 100);

  // 4. Strips markup before measuring & handles multi-line cells cleanly
  const markupShort = computeTableColumnWidths(
    ['**Nama**', '[[Istilah]]'],
    [['[[[Modal]]] singkat', '**Teks** pendek']]
  );
  assert.equal(markupShort.mode, 'symmetric');
  assert.deepEqual(markupShort.widths, [50, 50]);
});

test('TableBlock normalizes custom rows/columns, feeds modal scan & AI context, and exports to standalone HTML', () => {
  const deck = createDefaultDeck();
  const tbl = createBlock('table');
  if (tbl.t !== 'table') throw new Error('Expected table');
  tbl.headers = ['Nama', 'Keterangan', 'Catatan'];
  tbl.rows = [
    ['[[Overhead]]', 'Biaya produksi tidak langsung yang dialokasikan ke unit produk.', '[[[Detail Rumus]]]'],
    ['Tenaga Kerja'],
  ];
  deck.slides[0].blocks.push(tbl);

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  const normTbl = normalized.slides[0].blocks[0];
  assert.equal(normTbl.t, 'table');
  if (normTbl.t === 'table') {
    assert.equal(normTbl.headers.length, 3);
    assert.equal(normTbl.rows.length, 2);
    assert.deepEqual(normTbl.rows[1], ['Tenaga Kerja', '', '']);
  }
  assert.equal(normalized.slides[0].modals?.[0].title, 'Detail Rumus');

  const ctx = buildSlideAiContext(normalized, normalized.slides[0], 'Overhead');
  assert.ok(ctx.slideContentOutline?.includes('Tabel'));
  assert.ok(ctx.slideContentOutline?.includes('Keterangan'));
  assert.ok(ctx.surroundingContext?.includes('Overhead'));

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('ptbl-wrap'));
  assert.ok(html.includes('tblWidths'));
});

test('cyberpunk theme normalizes cleanly and exports purple self-contained cityscape styles', () => {
  const deck = createDefaultDeck();
  deck.theme = 'cyberpunk';
  deck.title = 'Metropolis Malam';

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  assert.equal(normalized.theme, 'cyberpunk');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('data-theme="cyberpunk"'));
  assert.ok(html.includes('[data-theme=cyberpunk]'));
  assert.ok(html.includes('#090612'));
  assert.ok(html.includes('#a855f7'));
  assert.ok(!html.includes('#00e5ff'));
  assert.ok(html.includes('data:image/svg+xml'));
});

test('hacker theme normalizes cleanly and exports neon green styles with matrix rain', () => {
  const deck = createDefaultDeck();
  deck.theme = 'hacker';
  deck.title = 'Sistem Keamanan Jaringan';

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  assert.equal(normalized.theme, 'hacker');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('data-theme="hacker"'));
  assert.ok(html.includes('[data-theme=hacker]'));
  assert.ok(html.includes('#00ff66'));
  assert.ok(html.includes('matrix-bg'));
  assert.ok(html.includes('JetBrains Mono'));
});

test('astronomi theme normalizes cleanly and exports monochrome black-white-gray styles with realistic Saturn space canvas', () => {
  const deck = createDefaultDeck();
  deck.theme = 'astronomi';
  deck.title = 'Eksplorasi Tata Surya';

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  assert.equal(normalized.theme, 'astronomi');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('data-theme="astronomi"'));
  assert.ok(html.includes('[data-theme=astronomi]'));
  assert.ok(html.includes('#050507'));
  assert.ok(html.includes('#f4f4f5'));
  const astroTokenMatch = html.match(/:root\[data-theme=astronomi\]\{[^}]+\}/);
  assert.ok(astroTokenMatch);
  assert.ok(!astroTokenMatch[0].includes('#7dd3fc'));
  assert.ok(!astroTokenMatch[0].includes('#38bdf8'));
  const astroScriptIdx = html.indexOf("else if(deck.theme==='astronomi')");
  const ghostScriptIdx = html.indexOf("else if(deck.theme==='ghost')");
  assert.ok(astroScriptIdx > -1 && ghostScriptIdx > astroScriptIdx);
  const astroScript = html.slice(astroScriptIdx, ghostScriptIdx);
  assert.ok(!astroScript.includes('#7dd3fc'));
  assert.ok(!astroScript.includes('#38bdf8'));
  assert.ok(html.includes('space-bg'));
  assert.ok(html.includes('Chakra Petch'));
});

test('ghost theme normalizes cleanly and exports blood-red styles with animated haunted room canvas', () => {
  const deck = createDefaultDeck();
  deck.theme = 'ghost';
  deck.title = 'Gedung Kosong Berhantu';

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  assert.equal(normalized.theme, 'ghost');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('data-theme="ghost"'));
  assert.ok(html.includes('[data-theme=ghost]'));
  assert.ok(html.includes('#080405'));
  assert.ok(html.includes('#dc2626'));
  assert.ok(html.includes('ghost-bg'));
  assert.ok(html.includes('Cinzel'));
});

test('halloween theme normalizes cleanly and exports orange styles with animated castle-cemetery canvas', () => {
  const deck = createDefaultDeck();
  deck.theme = 'halloween';
  deck.title = 'Malam Halloween';

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  assert.equal(normalized.theme, 'halloween');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('data-theme="halloween"'));
  assert.ok(html.includes('[data-theme=halloween]'));
  assert.ok(html.includes('#09060d'));
  assert.ok(html.includes('#f97316'));
  assert.ok(html.includes('halloween-bg'));
  assert.ok(html.includes('Creepster'));
});

test('aquarium theme normalizes cleanly and exports ocean-blue styles with animated marine canvas', () => {
  const deck = createDefaultDeck();
  deck.theme = 'aquarium';
  deck.title = 'Ekosistem Laut Dalam';

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  assert.equal(normalized.theme, 'aquarium');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('data-theme="aquarium"'));
  assert.ok(html.includes('[data-theme=aquarium]'));
  assert.ok(html.includes('#04182e'));
  assert.ok(html.includes('#0ea5e9'));
  assert.ok(html.includes('#38bdf8'));
  assert.ok(html.includes('aquarium-bg'));
  assert.ok(html.includes('Fredoka'));
});

test('detective theme normalizes cleanly and exports mocha styles with animated study canvas', () => {
  const deck = createDefaultDeck();
  deck.theme = 'detective';
  deck.title = 'Kasus Ruang Kerja';

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  assert.equal(normalized.theme, 'detective');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('data-theme="detective"'));
  assert.ok(html.includes('[data-theme=detective]'));
  assert.ok(html.includes('#1c120d'));
  assert.ok(html.includes('#d4a373'));
  assert.ok(html.includes('#a67c52'));
  assert.ok(html.includes('detective-bg'));
  assert.ok(html.includes('Cinzel'));
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

test('each slide maintains an independent headerTitle while legacy decks fall back to deck.title', () => {
  const deck = createDefaultDeck();
  deck.slides[0].headerTitle = 'Konteks Slide 1 — Pendahuluan';
  deck.slides.push({
    id: 'slide-2',
    name: '',
    headerTitle: 'Konteks Slide 2 — Analisis Data',
    blocks: [],
  });
  deck.slides.push({
    id: 'slide-3',
    name: 'Legacy Slide',
    blocks: [],
  });
  deck.title = 'Judul Bawaan';

  assert.equal(getSlideHeaderTitle(deck, deck.slides[0]), 'Konteks Slide 1 — Pendahuluan');
  assert.equal(getSlideHeaderTitle(deck, deck.slides[1]), 'Konteks Slide 2 — Analisis Data');
  assert.equal(getSlideHeaderTitle(deck, deck.slides[2]), 'Judul Bawaan');

  deck.title = '';
  assert.equal(getDeckDisplayTitle(deck), 'Konteks Slide 1 — Pendahuluan');

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
  ]) {
    assert.ok(
      html.includes(`[data-theme=${theme}] .im-frame{`),
      `Expected standalone CSS .im-frame rule for theme ${theme}`
    );
  }
});
