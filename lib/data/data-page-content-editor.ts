import type { Block, TextAlign } from '../deck-types';

export const BLOCK_NAMES: Record<Block['t'], string> = {
  title: 'Judul',
  text: 'Teks',
  img: 'Gambar',
  dd: 'Dropdown',
  box: 'Container',
  concl: 'Kesimpulan',
  table: 'Tabel',
};

export const SLIDE_ADD_BLOCK_TYPES: Block['t'][] = [
  'text',
  'img',
  'dd',
  'box',
  'table',
  'concl',
];

export const CONTAINER_ADD_BLOCK_TYPES: Block['t'][] = [
  'title',
  'text',
  'img',
  'dd',
  'table',
  'concl',
];

export const MODAL_ADD_BLOCK_TYPES: Block['t'][] = [
  'title',
  'text',
  'img',
  'dd',
  'table',
  'concl',
];

export const TEXT_SIZE_OPTIONS = ['s', 'm', 'l', 'xl'] as const;

export const TEXT_ALIGN_OPTIONS: ReadonlyArray<{
  value: TextAlign;
  label: string;
}> = [
  { value: 'l', label: 'Rata kiri' },
  { value: 'c', label: 'Rata tengah' },
  { value: 'r', label: 'Rata kanan' },
];

export const PAGE_CONTENT_EDITOR_LABELS = {
  rte: {
    formatTextButton: 'Format teks',
    aiTermButton: '[[Istilah AI]]',
    aiTermTitle: 'Tandai istilah agar bisa dijelaskan Orias AI',
    aiTermFallback: 'istilah',
    modalButton: '[[[Modal]]]',
    modalTitle: 'Tandai teks untuk membuka popup modal',
    modalFallback: 'Judul Modal',
    previewButton: 'Pratinjau',
    boldAriaLabel: 'Tebal',
    boldFallback: 'teks tebal',
    selectionFallback: 'teks',
    previewHeading: 'Pratinjau:',
    emptyPreview: '(kosong)',
  },
  table: {
    defaultFirstCol: 'Kolom 1',
    headerLabel: 'Header:',
    decreaseColsAria: 'Kurangi jumlah header tabel',
    colsCountAria: 'Jumlah header tabel',
    increaseColsAria: 'Tambah header tabel',
    addColButton: 'Kolom',
    rowLabel: 'Baris:',
    decreaseRowsAria: 'Kurangi jumlah baris tabel',
    rowsCountAria: 'Jumlah baris tabel',
    increaseRowsAria: 'Tambah baris tabel',
    addRowButton: 'Baris',
    symmetricPrefix: 'Simetris',
    adaptivePrefix: 'Fit teks',
    previewButton: 'Pratinjau',
    previewHeading: 'Pratinjau tabel:',
    headerPrefix: 'Header',
    deleteColPrefix: 'Hapus kolom',
    headerAriaPrefix: 'Header kolom',
    rowActionsAria: 'Aksi baris',
    rowPlaceholderPrefix: 'Isi baris',
    rowAriaPrefix: 'Baris',
    colAriaPrefix: 'Kolom',
    deleteRowPrefix: 'Hapus baris',
  },
  block: {
    deleteButton: 'Hapus',
    deleteAriaPrefix: 'Hapus blok',
    textPlaceholder:
      'Tulis teks… [[istilah]] = jelaskan via AI, [[[istilah]]] = popup modal',
    titlePlaceholder: 'Judul tambahan (sama seperti header container)',
    titleAriaPrefix: 'Judul tambahan container',
    ddBadgeTitle: 'Format poin / huruf / simbol (kosong = nomor urut otomatis)',
    ddBadgeAria: 'Format poin dropdown',
    ddTitlePlaceholder: 'Judul poin',
    ddTitleAria: 'Judul poin dropdown',
    ddDetailPlaceholder:
      'Penjelasan… [[istilah]] = jelaskan via AI, [[[istilah]]] = popup',
    imgPreviewAlt: 'Pratinjau',
    imgReplaceButton: 'Ganti gambar',
    imgPickButton: 'Pilih gambar',
    imgAltPlaceholder: 'Deskripsi gambar (opsional)',
    imgAltAria: 'Deskripsi alt gambar',
    boxTitlePlaceholder: 'Judul container (opsional)',
    boxTitleAria: 'Judul container',
    conclLabelPlaceholder: 'Teks tombol kesimpulan',
    conclLabelAria: 'Teks tombol kesimpulan',
    conclTextPlaceholder: 'Isi kesimpulan',
  },
  slide: {
    addSlideButton: 'Slide',
    selectSlideAriaPrefix: 'Pilih slide',
    movePrevAria: 'Geser slide sebelumnya',
    moveNextAria: 'Geser slide berikutnya',
    duplicateButton: 'Duplikat',
    deleteSlideButton: 'Hapus slide',
    guideAria: 'Panduan editor',
    headerTitlePrefix: 'Judul presentasi di header',
    headerTitlePagePrefix: 'Halaman',
    headerTitlePlaceholder: 'Judul header untuk halaman ini (opsional)',
    sectionTitle: 'Isi slide',
    emptySlideMessage: 'Slide ini masih kosong. Tambahkan komponen di atas.',
  },
  modals: {
    sectionTitle: 'Modal',
    itemBadge: 'Modal',
    untitledLabel: '(tanpa judul)',
    emptyModalMessage: 'Modal masih kosong. Tambahkan komponen di bawah.',
  },
  io: {
    exportHtmlButton: 'Export HTML final',
    exportJsonButton: 'Simpan JSON',
    importJsonButton: 'Buka JSON',
    importHtmlButton: 'Import HTML',
    resetDeckButton: 'Kosongkan',
    htmlImportHeading: 'Impor Presentasi dari HTML',
    pickHtmlFileButton: 'Pilih file .html',
    pasteHtmlPlaceholder: 'Atau tempel kode HTML slide presentasi di sini…',
    pasteHtmlAria: 'Tempel kode HTML presentasi',
    cancelButton: 'Batal',
    applyHtmlButton: 'Impor HTML ke editor',
  },
} as const;
