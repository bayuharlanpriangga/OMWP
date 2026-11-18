import type { ThemeId } from '../deck-types';

export const THEME_ORDER: ThemeId[] = [
  'default',
  'brutal',
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
];

export const THEME_META: Record<ThemeId, { name: string; description: string }> = {
  default: {
    name: 'Default',
    description:
      'Identitas Orias (Perak–Emas): latar perak tenang, tinta kontras tinggi, geometri facet presisi, dan satu aksen emas datar.',
  },
  brutal: {
    name: 'Brutalis',
    description: 'Tebal, warna cerah, garis hitam, bayangan keras, animasi membal.',
  },
  auditor: {
    name: 'Auditor',
    description:
      'Formal dan tenang: navy dan emas, huruf serif, garis tipis, animasi halus untuk presentasi audit dan laporan.',
  },
  cyberpunk: {
    name: 'Cyberpunk',
    description:
      'Metropolis malam neon: latar perkotaan malam hari gelap, aksen ungu & magenta elektrik, kartu kaca gelap futuristik.',
  },
  hacker: {
    name: 'Hacker',
    description:
      'Terminal kode neon hijau dengan animasi hujan Matrix di latar belakang, tipografi monospace, dan panel kaca gelap kontras tinggi.',
  },
  astronomi: {
    name: 'Astronomi',
    description:
      'Observatorium antariksa monokrom hitam-putih-abu dengan Bima Sakti perak, bintang berkelip, bulan mengorbit, dan planet Saturnus berwarna alami realistis.',
  },
  ghost: {
    name: 'Ghost',
    description:
      'Ruangan angker kumuh bernuansa merah darah: TV CRT rusak menyala berkedip, kursi goyang bergerak di belakang, dan sosok hantu mengintip serta melesat di sudut pintu.',
  },
  halloween: {
    name: 'Halloween',
    description:
      'Malam Halloween bernuansa oren menyala: cahaya bulan purnama, istana hitam berpagar besi, kuburan & pohon angker, labu oren menyala, burung hantu, dan kelelawar berterbangan.',
  },
  aquarium: {
    name: 'Aquarium',
    description:
      'Dunia bawah laut bernuansa biru cerah: ikan tropis, rumput laut bergoyang, bintang laut, keong, gurita, ubur-ubur, megalodon, hiu, ikan kembung, dan ikan bermoncong lampu.',
  },
  detective: {
    name: 'Detective',
    description:
      'Ruang kerja detektif bernuansa coklat mocca: meja berantakan dengan laptop kasus kriminal, papan hubung pola, sorot cahaya jendela, jas & berkas tertiup angin, kaca pembesar, dan pulpen.',
  },
  summer: {
    name: 'Summer',
    description:
      'Pantai musim panas bernuansa kuning cerah: ombak laut, ban renang mengapung, burung bangau, pohon kelapa & tenda payung beranimasi angin, matras santai, kedai & gelas minuman kuning bergoyang dengan es, papan selancar, pistol air, dan kacamata renang.',
  },
  pixel: {
    name: 'Pixel 8-Bit',
    description:
      'Dunia game retro pixel 8-bit bernuansa biru tua dan kuning: langit malam berpiksel, kastil & platform mengambang, koin emas berputar, pesawat luar angkasa, slime, dan karakter pahlawan pixel beranimasi.',
  },
};

export const THEME_SWATCHES: Record<
  ThemeId,
  {
    name: string;
    colors: string[];
  }
> = {
  default: {
    name: 'Default',
    colors: ['#EEF1F4', '#FFFFFF', '#A9C6DC', '#D4A72C', '#0D0D0D'],
  },
  brutal: {
    name: 'Brutalis',
    colors: ['#fff4d6', '#ffd23f', '#ff6b35', '#2ec4b6', '#111111'],
  },
  auditor: {
    name: 'Auditor',
    colors: ['#f4f6f9', '#ffffff', '#14243d', '#b08d3c', '#1b2430'],
  },
  cyberpunk: {
    name: 'Cyberpunk',
    colors: ['#090612', '#150d28', '#a855f7', '#ff2a85', '#fcee0a'],
  },
  hacker: {
    name: 'Hacker',
    colors: ['#030804', '#06150b', '#00ff66', '#16a34a', '#d9ffe5'],
  },
  astronomi: {
    name: 'Astronomi',
    colors: ['#050507', '#18181b', '#71717a', '#d4d4d8', '#ffffff'],
  },
  ghost: {
    name: 'Ghost',
    colors: ['#080405', '#1a0a0c', '#dc2626', '#7f1d1d', '#f4eaea'],
  },
  halloween: {
    name: 'Halloween',
    colors: ['#09060d', '#1c1024', '#f97316', '#fbbf24', '#fff4e8'],
  },
  aquarium: {
    name: 'Aquarium',
    colors: ['#04182e', '#0c4a6e', '#0ea5e9', '#38bdf8', '#e0f2fe'],
  },
  detective: {
    name: 'Detective',
    colors: ['#1c120d', '#462818', '#8c5a3c', '#d4a373', '#f5ebe0'],
  },
  summer: {
    name: 'Summer',
    colors: ['#fef9c3', '#fde047', '#facc15', '#f59e0b', '#713f12'],
  },
  pixel: {
    name: 'Pixel 8-Bit',
    colors: ['#08122e', '#132b6b', '#1d4ed8', '#facc15', '#fef08a'],
  },
};
