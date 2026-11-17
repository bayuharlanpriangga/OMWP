import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="s-xl font-bold m-0 mb-3">Halaman tidak ditemukan</h1>
      <p className="text-base opacity-75 m-0 mb-6 max-w-md">
        Tautan yang dibuka tidak tersedia. Kembali ke halaman utama presentasi.
      </p>
      <Link href="/" className="pbtn">
        Kembali ke Presentasi
      </Link>
    </main>
  );
}
