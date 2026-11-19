import assert from 'node:assert/strict';
import test from 'node:test';
import { createDefaultDeck } from '../../presentation/presentation-page-content';
import { buildDeckJson, buildDeckJsonExport } from '../../export/export-json';
import { createBlock } from '../../page/page-edit/page-edit';
import { importDeckFromJson } from '../import-types/import-types-json';

test('buildDeckJsonExport and importDeckFromJson round-trip deck content, theme, and modals cleanly', () => {
  const deck = createDefaultDeck();
  deck.title = 'Arsitektur AI Nexus';
  deck.theme = 'ai';

  const dd = createBlock('dd');
  if (dd.t !== 'dd') throw new Error('Expected dd');
  dd.text = 'Sintesis Multi-Model';
  dd.detail = 'Menggabungkan [[Gemini]] dan [[[Benchmark]]] secara terstruktur.';

  const box = createBlock('box');
  if (box.t !== 'box') throw new Error('Expected box');
  box.title = 'Ringkasan';
  box.children.push(createBlock('text'));

  deck.slides[0].headerTitle = 'Halaman Pertama';
  deck.slides[0].blocks.push(dd, box);

  const exported = buildDeckJsonExport(deck);
  assert.equal(exported.filename, 'arsitektur-ai-nexus.json');
  assert.equal(exported.mimeType, 'application/json');
  assert.equal(exported.content, buildDeckJson(deck));

  const imported = importDeckFromJson(exported.content);
  assert.ok(imported);
  assert.equal(imported.deck.title, 'Arsitektur AI Nexus');
  assert.equal(imported.deck.theme, 'ai');
  assert.equal(imported.slideCount, 1);
  assert.equal(imported.blockCount, 3);
  assert.equal(imported.deck.slides[0].headerTitle, 'Halaman Pertama');
  assert.equal(imported.deck.slides[0].blocks[0].t, 'dd');
  assert.equal(imported.deck.slides[0].modals?.[0].title, 'Benchmark');
});

test('importDeckFromJson handles UTF-8 BOM and rejects invalid or non-deck JSON', () => {
  const deck = createDefaultDeck();
  deck.title = 'BOM Test';
  const withBom = `\uFEFF  ${buildDeckJson(deck)}  `;

  const okResult = importDeckFromJson(withBom);
  assert.ok(okResult);
  assert.equal(okResult.deck.title, 'BOM Test');

  assert.equal(importDeckFromJson(''), null);
  assert.equal(importDeckFromJson('   '), null);
  assert.equal(importDeckFromJson('{invalid json'), null);
  assert.equal(importDeckFromJson('null'), null);
  assert.equal(importDeckFromJson('{"foo":"bar"}'), null);
});
