import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAndNormalizeDeck } from '../../presentation/presentation-migration';
import { createDefaultDeck } from '../../presentation/presentation-page-content';
import { buildStandaloneHtml } from '../export-html';

test('cyberpunk theme normalizes cleanly and exports purple self-contained animated cityscape styles', () => {
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
  assert.ok(html.includes('cyberpunk-bg'));
  assert.ok(!html.includes('data:image/svg+xml'));
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

test('summer theme normalizes cleanly and exports sunny yellow styles with animated beach canvas', () => {
  const deck = createDefaultDeck();
  deck.theme = 'summer';
  deck.title = 'Liburan Musim Panas';

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  assert.equal(normalized.theme, 'summer');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('data-theme="summer"'));
  assert.ok(html.includes('[data-theme=summer]'));
  assert.ok(html.includes('#fef9c3'));
  assert.ok(html.includes('#facc15'));
  assert.ok(html.includes('#eab308'));
  assert.ok(html.includes('summer-bg'));
  assert.ok(html.includes('Fredoka'));
});

test('pixel theme normalizes cleanly and exports dark-blue & yellow 8-bit game styles with animated pixel canvas', () => {
  const deck = createDefaultDeck();
  deck.theme = 'pixel';
  deck.title = 'Petualangan Pixel 8-Bit';

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  assert.equal(normalized.theme, 'pixel');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('data-theme="pixel"'));
  assert.ok(html.includes('[data-theme=pixel]'));
  assert.ok(html.includes('#08122e'));
  assert.ok(html.includes('#facc15'));
  assert.ok(html.includes('#1d4ed8'));
  assert.ok(html.includes('pixel-bg'));
  assert.ok(html.includes('Silkscreen'));
});

test('dino theme normalizes cleanly and exports Chrome-gray pixel dino game styles with 4-dino canvas', () => {
  const deck = createDefaultDeck();
  deck.theme = 'dino';
  deck.title = 'Dino Offline Runner';

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  assert.equal(normalized.theme, 'dino');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('data-theme="dino"'));
  assert.ok(html.includes('[data-theme=dino]'));
  assert.ok(html.includes('#e5e7eb'));
  assert.ok(html.includes('#3f3f46'));
  assert.ok(html.includes('dino-bg'));
  assert.ok(html.includes('Silkscreen'));
});

test('zodiac theme normalizes cleanly and exports celestial midnight-gold styles with zodiac canvas', () => {
  const deck = createDefaultDeck();
  deck.theme = 'zodiac';
  deck.title = 'Atlas Langit Zodiak';

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  assert.equal(normalized.theme, 'zodiac');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('data-theme="zodiac"'));
  assert.ok(html.includes('[data-theme=zodiac]'));
  assert.ok(html.includes('#070b1a'));
  assert.ok(html.includes('#d4af37'));
  assert.ok(html.includes('zodiac-bg'));
  assert.ok(html.includes('Cinzel'));
});

test('tarot theme normalizes cleanly and exports mystical velvet-gold styles with tarot canvas', () => {
  const deck = createDefaultDeck();
  deck.theme = 'tarot';
  deck.title = 'Arkana Malam Mistis';

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  assert.equal(normalized.theme, 'tarot');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('data-theme="tarot"'));
  assert.ok(html.includes('[data-theme=tarot]'));
  assert.ok(html.includes('#0c0611'));
  assert.ok(html.includes('#c99846'));
  assert.ok(html.includes('tarot-bg'));
  assert.ok(html.includes('Cinzel'));
});

test('joker theme normalizes cleanly and exports hot-pink Joker styles with joker canvas', () => {
  const deck = createDefaultDeck();
  deck.theme = 'joker';
  deck.title = 'Panggung Sandiwara Joker';

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  assert.equal(normalized.theme, 'joker');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('data-theme="joker"'));
  assert.ok(html.includes('[data-theme=joker]'));
  assert.ok(html.includes('#12040c'));
  assert.ok(html.includes('#ff1f8e'));
  assert.ok(html.includes('joker-bg'));
  assert.ok(html.includes('Playfair Display'));
});

test('ai theme normalizes cleanly and exports AI Nexus clean-white styles with quad-AI palette and ai canvas', () => {
  const deck = createDefaultDeck();
  deck.theme = 'ai';
  deck.title = 'Sintesis Multi-Model AI Nexus';

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  assert.equal(normalized.theme, 'ai');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('data-theme="ai"'));
  assert.ok(html.includes('[data-theme=ai]'));
  assert.ok(html.includes('#ffffff'));
  assert.ok(html.includes('#4285f4'));
  assert.ok(html.includes('#4d6bfe'));
  assert.ok(html.includes('#10a37f'));
  assert.ok(html.includes('#d97757'));
  assert.ok(html.includes('ai-bg'));
  assert.ok(html.includes('Chakra Petch'));
});
