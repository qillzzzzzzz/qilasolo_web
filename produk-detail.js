// produk-detail.js (minimal, robust) 
// - baca id dari URL
// - lookup produk dari data-produk.js
// - isi elemen detail (gambar, varian, nama, harga, deskripsi, tombol WA)

import { produkList } from "./data-produk.js";

document.addEventListener("DOMContentLoaded", () => {
  // --- util & constants ---
  const PLACEHOLDER = "https://via.placeholder.com/600x600?text=No+Image";
  const nomorWA = "6289697710601";

  const rupiahFmt = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  function formatPrice(v) {
    if (typeof v === "number") return rupiahFmt.format(v);
    if (!v) return "-";
    return String(v);
  }

  function safeSetImg(imgEl, src) {
    if (!imgEl) return;
    imgEl.loading = "lazy";
    imgEl.onerror = () => { imgEl.onerror = null; imgEl.src = PLACEHOLDER; };
    imgEl.src = src || PLACEHOLDER;
  }

  // --- build produkMap untuk lookup cepat ---
  const produk = produkList.map((p, i) => ({ ...p, __idx: i }));
  const produkMap = new Map(produk.map(p => [String(p.id), p]));

  // --- elemen DOM yang dipakai di produk-detail.html ---
  const elImage = document.getElementById("detail-image");
  const elVariants = document.getElementById("detail-variants");
  const elName = document.getElementById("detail-name");
  const elPrice = document.getElementById("detail-price");
  const elDesc = document.getElementById("detail-desc");
  const elBuy = document.getElementById("detail-buy");
  const elNote = document.getElementById("detail-note");

  // --- ambil id dari URL (prioritas), fallback numeric index ---
  const params = new URLSearchParams(location.search);
  const idParam = params.get("id");

  let productData = null;

  if (idParam) {
    // coba langsung by id
    productData = produkMap.get(String(idParam)) ?? null;
    // jika tidak ada, cek apakah idParam angka -> treat as index
    if (!productData && /^\d+$/.test(idParam)) {
      const idx = Number(idParam);
      if (!Number.isNaN(idx) && produk[idx]) productData = produk[idx];
    }
  } else {
    // jika tidak ada id di URL -> coba ambil index dari path atau fallback ke produk[0]
    // (opsional) di sini kita fallback ke produk[0]
    productData = produk[0] ?? null;
  }

  function showNotFound() {
    if (elName) elName.textContent = "Produk tidak ditemukan";
    if (elPrice) elPrice.textContent = "";
    if (elDesc) elDesc.textContent = "Maaf, produk yang Anda cari tidak tersedia atau ID-nya salah.";
    if (elImage) safeSetImg(elImage, PLACEHOLDER);
    if (elVariants) elVariants.innerHTML = "";
    if (elBuy) {
      elBuy.href = "index.html";
      elBuy.textContent = "Kembali ke katalog";
    }
    if (elNote) elNote.textContent = "Cek kembali link atau kembali ke katalog.";
  }

  if (!productData) {
    showNotFound();
    return;
  }

  // --- tampilkan data produk ke DOM ---
  if (elName) elName.textContent = productData.nama || "Produk";
  if (elPrice) elPrice.textContent = formatPrice(productData.harga);
  if (elDesc) elDesc.textContent = productData.deskripsi || "Deskripsi belum tersedia.";
  if (elImage) safeSetImg(elImage, productData.fotoUtama || (productData.varian && productData.varian[0]) || PLACEHOLDER);

  // varian thumbnails
  if (elVariants) {
    elVariants.innerHTML = "";
    if (productData.varian && productData.varian.length) {
      productData.varian.forEach((v, i) => {
        const img = document.createElement("img");
        img.alt = `varian-${i}`;
        img.dataset.src = v || "";
        img.loading = "lazy";
        img.src = v || PLACEHOLDER; // bisa pakai data-src + IntersectionObserver jika mau lazy lebih agresif
        if (i === 0) img.classList.add("active");
        img.addEventListener("click", () => {
          safeSetImg(elImage, v);
          // aktifkan border
          elVariants.querySelectorAll("img").forEach(x => x.classList.remove("active"));
          img.classList.add("active");
        });
        elVariants.appendChild(img);
      });
    }
  }

  // set tombol WA dengan pesan prefill
  if (elBuy) {
    const namaEnc = encodeURIComponent(productData.nama || "Produk");
    const pesan = encodeURIComponent(`Halo kak, saya tertarik dengan:\n\n📌 ${productData.nama}\n💰 Harga: ${formatPrice(productData.harga)}\n\nApakah stok ini masih tersedia?`);
    elBuy.href = `https://wa.me/${nomorWA}?text=${pesan}`;
  }

  // spare note (stok / info tambahan)
  if (elNote) {
    elNote.textContent = productData.kategori ? `Kategori: ${productData.kategori}` : "";
  }

  // optional: update document.title agar saat share hasilnya bagus
  try {
    if (productData.nama) document.title = `${productData.nama} — Qila Solo`;
  } catch (e) { /* ignore */ }

  // optional: jika ingin tambahkan tombol share programmatic (HTML sudah pakai navigator.share)
  // sudah ada onclick pada elemen #detail-share di HTML, itu cukup.

});
