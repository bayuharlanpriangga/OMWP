import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStandaloneHtml, createBlock, createDefaultDeck } from './deck-logic';
import { importDeckFromHtml } from './html-import';

test('importDeckFromHtml round-trips standalone HTML exported by the app', () => {
  const deck = createDefaultDeck();
  deck.title = 'Presentasi Ekspor';
  const dd = createBlock('dd');
  if (dd.t !== 'dd') throw new Error('Expected dd');
  dd.text = 'Poin Satu';
  dd.detail = 'Detail [[istilah]] dan [[[Popup]]]';
  deck.slides[0].name = 'Pembuka';
  deck.slides[0].blocks.push(dd);

  const html = buildStandaloneHtml(deck);
  const imported = importDeckFromHtml(html);

  assert.ok(imported);
  assert.equal(imported.source, 'opres');
  assert.equal(imported.deck.title, 'Presentasi Ekspor');
  assert.equal(imported.deck.theme, 'default');
  assert.equal(imported.slideCount, 1);
  assert.equal(imported.deck.slides[0].blocks[0].t, 'dd');
  assert.equal(imported.deck.slides[0].modals?.[0].title, 'Popup');
});

test('importDeckFromHtml parses generic multi-slide HTML with sections, cards, details, lists, and images', () => {
  const html = `<!doctype html>
<html lang="id" data-theme="auditor">
<head><title>Audit Internal 2026</title></head>
<body>
  <main>
    <section class="slide">
      <h1>Audit Operasional</h1>
      <p>Ringkasan <strong>temuan utama</strong> kuartal ini.</p>
      <img src="https://picsum.photos/seed/audit/800/400" alt="Grafik audit" />
    </section>
    <section class="slide">
      <h2>Rincian Temuan</h2>
      <div class="grid grid-cols-2">
        <div class="card">
          <h3>Kontrol Akses</h3>
          <p>Perlu rotasi kunci berkala.</p>
        </div>
        <div class="card">
          <h3>Rekonsiliasi</h3>
          <p>Selisih turun menjadi 0,2%.</p>
        </div>
      </div>
      <details>
        <summary>Tindak Lanjut</summary>
        <p>Selesai sebelum 30 Nov 2026.</p>
      </details>
      <ul>
        <li>Verifikasi log</li>
        <li>Uji kepatuhan</li>
      </ul>
      <aside>Risiko utama terkendali.</aside>
    </section>
  </main>
</body>
</html>`;

  const imported = importDeckFromHtml(html);
  assert.ok(imported);
  assert.equal(imported.source, 'html');
  assert.equal(imported.deck.title, 'Audit Internal 2026');
  assert.equal(imported.deck.theme, 'auditor');
  assert.equal(imported.slideCount, 2);

  const s1 = imported.deck.slides[0];
  assert.equal(s1.name, 'Audit Operasional');
  assert.equal(s1.blocks[0].t, 'text');
  assert.equal(s1.blocks[1].t, 'text');
  if (s1.blocks[1].t === 'text') {
    assert.ok(s1.blocks[1].text.includes('**temuan utama**'));
  }
  assert.equal(s1.blocks[2].t, 'img');

  const s2 = imported.deck.slides[1];
  assert.equal(s2.blocks.some((b) => b.t === 'box' && b.w === 6), true);
  assert.equal(s2.blocks.some((b) => b.t === 'dd'), true);
  assert.equal(s2.blocks.some((b) => b.t === 'concl'), true);
});

test('importDeckFromHtml splits plain heading-based HTML into slides and rejects empty HTML', () => {
  const html = `<html><body>
    <h1>Bagian Pertama</h1>
    <p>Isi pertama.</p>
    <h2>Bagian Kedua</h2>
    <p>Isi kedua.</p>
  </body></html>`;

  const imported = importDeckFromHtml(html);
  assert.ok(imported);
  assert.equal(imported.slideCount, 2);
  assert.equal(imported.deck.slides[0].name, 'Bagian Pertama');
  assert.equal(imported.deck.slides[1].name, 'Bagian Kedua');

  assert.equal(importDeckFromHtml('<html><body><script>alert(1)</script></body></html>'), null);
});

test('importDeckFromHtml converts HTML tables into native editable TableBlock blocks', () => {
  const html = `<html><body><section class="slide">
    <h2>Perbandingan Komponen</h2>
    <table>
      <thead><tr><th>Nama</th><th>Keterangan</th></tr></thead>
      <tbody>
        <tr><td>Listrik</td><td>Tagihan utilitas pabrik bulanan</td></tr>
        <tr><td>Sewa</td><td>Kontrak gedung gudang tahunan</td></tr>
      </tbody>
    </table>
  </section></body></html>`;

  const imported = importDeckFromHtml(html);
  assert.ok(imported);
  const tbl = imported.deck.slides[0].blocks.find((b) => b.t === 'table');
  assert.ok(tbl && tbl.t === 'table');
  assert.deepEqual(tbl.headers, ['Nama', 'Keterangan']);
  assert.equal(tbl.rows.length, 2);
  assert.deepEqual(tbl.rows[0], ['Listrik', 'Tagihan utilitas pabrik bulanan']);
});

test('importDeckFromHtml preserves cyberpunk theme attribute on standalone round-trip and generic HTML', () => {
  const deck = createDefaultDeck();
  deck.theme = 'cyberpunk';
  deck.title = 'Cyber Night';
  deck.slides[0].blocks.push(createBlock('text'));
  if (deck.slides[0].blocks[0].t === 'text') {
    deck.slides[0].blocks[0].text = 'Neon Skyline';
  }
  const exported = buildStandaloneHtml(deck);
  const reimported = importDeckFromHtml(exported);
  assert.ok(reimported);
  assert.equal(reimported.deck.theme, 'cyberpunk');

  const generic = importDeckFromHtml(
    '<!doctype html><html data-theme="cyberpunk"><head><title>Neon Deck</title></head><body><section class="slide"><h1>Kota Malam</h1></section></body></html>'
  );
  assert.ok(generic);
  assert.equal(generic.deck.theme, 'cyberpunk');
});

test('importDeckFromHtml preserves hacker theme attribute on standalone round-trip and generic HTML', () => {
  const deck = createDefaultDeck();
  deck.theme = 'hacker';
  deck.title = 'Protokol Terminal';
  deck.slides[0].blocks.push(createBlock('text'));
  if (deck.slides[0].blocks[0].t === 'text') {
    deck.slides[0].blocks[0].text = 'Enkripsi Data';
  }
  const exported = buildStandaloneHtml(deck);
  const reimported = importDeckFromHtml(exported);
  assert.ok(reimported);
  assert.equal(reimported.deck.theme, 'hacker');

  const generic = importDeckFromHtml(
    '<!doctype html><html data-theme="hacker"><head><title>Matrix Deck</title></head><body><section class="slide"><h1>Kode Hijau</h1></section></body></html>'
  );
  assert.ok(generic);
  assert.equal(generic.deck.theme, 'hacker');
});

test('importDeckFromHtml preserves astronomi theme attribute on standalone round-trip and generic HTML', () => {
  const deck = createDefaultDeck();
  deck.theme = 'astronomi';
  deck.title = 'Kosmologi Modern';
  deck.slides[0].blocks.push(createBlock('text'));
  if (deck.slides[0].blocks[0].t === 'text') {
    deck.slides[0].blocks[0].text = 'Galaksi Bima Sakti';
  }
  const exported = buildStandaloneHtml(deck);
  const reimported = importDeckFromHtml(exported);
  assert.ok(reimported);
  assert.equal(reimported.deck.theme, 'astronomi');

  const generic = importDeckFromHtml(
    '<!doctype html><html data-theme="astronomi"><head><title>Observatorium</title></head><body><section class="slide"><h1>Exoplanet</h1></section></body></html>'
  );
  assert.ok(generic);
  assert.equal(generic.deck.theme, 'astronomi');
});

test('importDeckFromHtml preserves ghost theme attribute on standalone round-trip and generic HTML', () => {
  const deck = createDefaultDeck();
  deck.theme = 'ghost';
  deck.title = 'Ruangan Angker';
  deck.slides[0].blocks.push(createBlock('text'));
  if (deck.slides[0].blocks[0].t === 'text') {
    deck.slides[0].blocks[0].text = 'TV Rusak & Kursi Goyang';
  }
  const exported = buildStandaloneHtml(deck);
  const reimported = importDeckFromHtml(exported);
  assert.ok(reimported);
  assert.equal(reimported.deck.theme, 'ghost');

  const generic = importDeckFromHtml(
    '<!doctype html><html data-theme="ghost"><head><title>Gedung Kosong</title></head><body><section class="slide"><h1>Lorong Gelap</h1></section></body></html>'
  );
  assert.ok(generic);
  assert.equal(generic.deck.theme, 'ghost');
});

test('importDeckFromHtml preserves halloween theme attribute on standalone round-trip and generic HTML', () => {
  const deck = createDefaultDeck();
  deck.theme = 'halloween';
  deck.title = 'Istana Malam Halloween';
  deck.slides[0].blocks.push(createBlock('text'));
  if (deck.slides[0].blocks[0].t === 'text') {
    deck.slides[0].blocks[0].text = 'Labu Oren & Kelelawar';
  }
  const exported = buildStandaloneHtml(deck);
  const reimported = importDeckFromHtml(exported);
  assert.ok(reimported);
  assert.equal(reimported.deck.theme, 'halloween');

  const generic = importDeckFromHtml(
    '<!doctype html><html data-theme="halloween"><head><title>Kastil Tua</title></head><body><section class="slide"><h1>Kuburan Berkabut</h1></section></body></html>'
  );
  assert.ok(generic);
  assert.equal(generic.deck.theme, 'halloween');
});
