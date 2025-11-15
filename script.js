// script.js (module) - versi diperbaiki: link detail pakai p.id (bukan index)
import { produkList } from "./data-produk.js";

document.addEventListener('DOMContentLoaded', () => {
  // tambahkan indeks internal (tidak mengganti id string asli)
  const produk = produkList.map((item, index) => ({ ...item, __idx: index }));

  // debugging
  console.log('Produk dimuat:', produk.length);

  // container yang benar
  const mainContainer = document.getElementById('produk-container');
  if (!mainContainer) {
    console.error('Elemen #produk-container tidak ditemukan di HTML.');
    return;
  }

  // ========================
  // Helpers
  // ========================
  const escapeHtml = (s = '') => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  function imageOnErrorAttr() {
    return `onerror="this.onerror=null;this.src='https://via.placeholder.com/420x420?text=No+Image';"`;
  }
  function createTagLabels(tagString) {
    if (!tagString) return '';
    return String(tagString).trim().split(/\s+/).filter(Boolean).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ');
  }

  function createCards(arr) {
    return arr.map(item => {
      const mainSrc = (item.varian && item.varian.length) ? item.varian[0] : (item.fotoUtama || '');
      const descAttr = item.deskripsi ? `data-desc="${escapeHtml(item.deskripsi)}"` : '';
      const tagHtml = createTagLabels(item.tag || '');
      // NOTE: gunakan item.id untuk link detail -> ini perbaikan utama
      return `
        <div class="produk-card" data-index="${item.__idx}" data-id="${escapeHtml(item.id)}" data-nama="${escapeHtml(item.nama)}" ${descAttr}>
          <a class="card-link" href="produk-detail.html?id=${encodeURIComponent(item.id)}" style="text-decoration:none;color:inherit;display:block;">
            <img class="main-image" src="${escapeHtml(mainSrc)}" alt="${escapeHtml(item.nama)}" ${imageOnErrorAttr()}>
            ${item.varian && item.varian.length ? `
              <div class="color-options">
                ${item.varian.map((v, i) => `<img src="${escapeHtml(v)}" onclick="gantiFoto(this)" ${i===0? 'class="active"':''} ${imageOnErrorAttr()} alt="varian">`).join('')}
              </div>
            ` : ''}
            <div class="card-body">
              <h3>${escapeHtml(item.nama)}</h3>
              <p class="harga">${escapeHtml(typeof item.harga === 'number' ? ('Rp ' + item.harga.toLocaleString('id-ID')) : item.harga)}</p>
              <div class="tags">${tagHtml}</div>
            </div>
          </a>
          <div style="text-align:center;margin-top:10px;">
            <button class="btn-beli">Beli Sekarang</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ========================
  // Renderers
  // ========================
  function renderBestSeller() {
    const bestSeller = produk.filter(p => String(p.tag || '').trim() === "best-seller");
    const el = document.getElementById('best-seller');
    if (el) el.innerHTML = createCards(bestSeller);
  }

  function renderProdukBaru() {
    const produkBaru = produk.filter(p => String(p.tag || '').trim() === "produk-baru");
    const el = document.getElementById('produk-baru');
    if (el) el.innerHTML = createCards(produkBaru);
  }

  function renderProduk(kategori = "all") {
    const filtered = kategori === "all" ? produk : produk.filter(p => p.kategori === kategori);
    const container = document.getElementById('produk-container');
    if (!container) return;
    container.classList.add('fade-out');
    setTimeout(() => {
      container.innerHTML = createCards(filtered);
      container.classList.remove('fade-out');
      if (window.AOS && typeof window.AOS.refresh === 'function') window.AOS.refresh();
    }, 150);
  }

  // ========================
  // Slider controls
  // ========================
  function setupSliderControls() {
    document.querySelectorAll('.slider-wrapper').forEach(wrapper => {
      const cont = wrapper.querySelector('.slider-container');
      const btnPrev = wrapper.querySelector('.slider-btn.prev');
      const btnNext = wrapper.querySelector('.slider-btn.next');
      if (!cont || !btnPrev || !btnNext) return;
      const scrollAmount = Math.max(260, Math.floor(cont.clientWidth * 0.6));
      btnPrev.onclick = () => cont.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      btnNext.onclick = () => cont.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  // ========================
  // Global functions for inline handlers
  // ========================
  window.gantiFoto = function(el) {
    try {
      const card = el.closest('.produk-card');
      const main = card?.querySelector('.main-image');
      if (main && el && el.src) main.src = el.src;
      card?.querySelectorAll('.color-options img')?.forEach(img => img.classList.remove('active'));
      el.classList.add('active');
    } catch (err) { console.error(err); }
  };

  window.gantiFotoDetail = function(el) {
    try {
      const detailImg = document.getElementById('detail-image');
      if (detailImg && el && el.src) detailImg.src = el.src;
      document.querySelectorAll('#detail-variants img').forEach(img => img.classList.remove('active'));
      el.classList.add('active');
    } catch (err) { console.error('Gagal ganti foto detail:', err); }
  };

  function beliProdukLangsungByCard(card) {
    if (!card) return;
    const nama = card.querySelector('h3')?.innerText?.trim() || '';
    const harga = card.querySelector('.harga')?.innerText?.trim() || '';
    const varianAktif = card.querySelector('.color-options img.active');
    const varian = varianAktif ? varianAktif.src.split('/').pop() : '';
    const pesan = encodeURIComponent(`Halo kak, saya tertarik dengan:\n\n📌 ${nama}${varian ? ' (' + varian + ')' : ''}\n💰 Harga: ${harga}\n\nApakah stok ini masih tersedia?`);
    const nomorWA = "6289697710601";
    const waUrl = `https://wa.me/${nomorWA}?text=${pesan}`;
    window.open(waUrl, '_blank');
  }

  window.beliProdukLangsung = function(el) {
    const card = el.closest('.produk-card');
    beliProdukLangsungByCard(card);
  };

  // ========================
  // Product detail panel (fallback modal)
  // ========================
  function formatPriceText(text) { return text || ''; }

  function openProductDetailFromCard(cardElem) {
    if (!cardElem) return;
    const nameEl = cardElem.querySelector('h3');
    const produkNama = nameEl?.innerText?.trim() || '';
    const produkData = produk.find(p => p.nama === produkNama) || null;

    const imgSrc = produkData?.fotoUtama || cardElem.querySelector('.main-image')?.src || '';
    const hargaText = produkData?.harga || cardElem.querySelector('.harga')?.innerText || '';
    const descFromAttr = cardElem.getAttribute('data-desc');
    const descText = produkData?.deskripsi || descFromAttr || 'Deskripsi belum tersedia.';

    const panel = document.getElementById('product-detail');
    if (!panel) return;

    const imgEl = document.getElementById('detail-image');
    const namePanel = document.getElementById('detail-name');
    const pricePanel = document.getElementById('detail-price');
    const descPanel = document.getElementById('detail-desc');
    const storeEl = document.getElementById('detail-store');
    const buyBtn = document.getElementById('detail-buy');
    const variantsEl = document.getElementById('detail-variants');

    if (imgEl) {
      imgEl.src = imgSrc || 'https://via.placeholder.com/420x420?text=No+Image';
      imgEl.alt = produkNama;
      imgEl.onerror = function(){ this.onerror = null; this.src = 'https://via.placeholder.com/420x420?text=No+Image'; };
    }
    if (namePanel) namePanel.innerText = produkData?.nama || produkNama;
    if (pricePanel) pricePanel.innerText = formatPriceText(hargaText);
    if (descPanel) descPanel.innerText = descText;

    if (variantsEl && produkData && produkData.varian && produkData.varian.length > 0) {
      variantsEl.innerHTML = produkData.varian.map((v, i) => 
        `<img src="${escapeHtml(v)}" onclick="gantiFotoDetail(this)" ${i===0? 'class="active"':''} ${imageOnErrorAttr()} alt="varian">`
      ).join('');
    } else if (variantsEl) {
      variantsEl.innerHTML = '';
    }

    if (storeEl) {
      storeEl.innerHTML = `
        <div class="store-avatar">
          <i class="fas fa-store"></i>
        </div>
        <div class="store-info">
          <div class="store-name">Qila Solo Store</div>
          <div class="store-location">Solo, Jawa Tengah</div>
        </div>
      `;
    }

    if (buyBtn) {
      const namaEnc = encodeURIComponent(produkData?.nama || produkNama);
      buyBtn.href = `https://wa.me/6289697710601?text=Halo%20kak,%20saya%20tertarik%20dengan%20${namaEnc}`;
    }

    panel.classList.add('active');
    if (window.innerWidth < 900) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ========================
  // Close detail
  // ========================
  function setupCloseDetail() {
    const closeBtn = document.getElementById('close-detail');
    if (!closeBtn) return;
    closeBtn.addEventListener('click', () => {
      const panel = document.getElementById('product-detail');
      if (panel) panel.classList.remove('active');
      if (window.innerWidth < 900) {
        const produkTop = document.getElementById('produk-container');
        if (produkTop) produkTop.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // ========================
  // Event delegation: klik pada container
  // ========================
  function setupProdukContainerClick() {
    const container = document.getElementById('produk-container');
    if (!container) return;

    container.addEventListener('click', (e) => {
      // tombol beli
      if (e.target.closest('.btn-beli') || e.target.classList.contains('btn-beli')) {
        const card = e.target.closest('.produk-card');
        if (card) beliProdukLangsungByCard(card);
        return;
      }

      // klik varian image -> do nothing (inline handler gantiFoto menangani)
      if (e.target.closest('.color-options img')) return;

      // klik kartu -> gunakan data-id atau link .card-link href
      const card = e.target.closest('.produk-card');
      if (!card) return;

      // prioritas: data-id (set di createCards), lalu cek .card-link href, lalu fallback cari index by nama
      let idParam = card.getAttribute('data-id') ?? null;
      if (!idParam) {
        const linkEl = card.querySelector('.card-link');
        if (linkEl) {
          // parse id param dari href, safer than using index
          try {
            const href = linkEl.getAttribute('href') || '';
            const sp = new URL(href, location.origin);
            idParam = sp.searchParams.get('id');
          } catch (err) {
            idParam = null;
          }
        }
      }

      if (idParam) {
        // langsung pindah ke halaman detail dengan id asli
        window.location.href = `produk-detail.html?id=${encodeURIComponent(idParam)}`;
        return;
      }

      // fallback lama: cari index berdasarkan nama
      let idx = card.getAttribute('data-index');
      if (idx === null || idx === '' || Number.isNaN(Number(idx))) {
        const nama = card.querySelector('h3')?.innerText?.trim() || '';
        idx = produk.findIndex(p => p.nama === nama);
      } else {
        idx = Number(idx);
      }

      if (typeof idx === 'number' && idx >= 0 && idx < produk.length) {
        // Jika sampai sini, tetap redirect menggunakan id asli produk berdasarkan index
        const actualId = produk[idx]?.id ?? idx;
        window.location.href = `produk-detail.html?id=${encodeURIComponent(actualId)}`;
      } else {
        // terakhir: buka panel detail fallback
        openProductDetailFromCard(card);
      }
    });
  }

  // ========================
  // UI: hamburger, kategori, smooth scroll
  // ========================
  function setupHamburger() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    if (!hamburger || !navLinks) return;
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
    });
    navLinks.querySelectorAll && navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
      });
    });
  }

  function setupKategoriButtons() {
    document.querySelectorAll('#kategori-buttons button').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.getAttribute('data-kategori') || 'all';
        renderProduk(k);
        document.querySelectorAll('#kategori-buttons button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  function setupSmoothScroll() {
    document.querySelectorAll('.navbar nav a').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // ========================
  // Inisialisasi
  // ========================
  renderBestSeller();
  renderProdukBaru();
  renderProduk(); // default: semua
  setupSliderControls();
  setupProdukContainerClick();
  setupCloseDetail();
  setupKategoriButtons();
  setupHamburger();
  setupSmoothScroll();

  // resize debounce untuk slider
  let _resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
      setupSliderControls();
    }, 150);
  });

}); // DOMContentLoaded end
