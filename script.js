// Format angka ke Rupiah
const formatIDR = (num) => 
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

// Simpan & ambil data dari localStorage
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function load(key, def = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; }
  catch { return def; }
}

// Pilih produk dari index.html
function buyProduct(name, price, qty) {
  const selected = {
    name,
    price: Number(price),
    qty: Math.max(1, Number(qty) || 1)
  };
  save('selectedProduct', selected);
  window.location.href = 'transaksi.html';
}

// Hitung ongkir
function shippingCost(code) {
  switch (code) {
    case 'REG': return 15000;
    case 'EXP': return 25000;
    case 'SAME': return 35000;
    default: return 0;
  }
}

// Tampilkan ringkasan produk di transaksi.html
function renderSummary() {
  const sel = load('selectedProduct');
  const el = document.getElementById('summaryBody');
  if (!el) return;
  if (!sel) {
    el.innerHTML = 'Belum ada produk dipilih. Silakan kembali ke halaman Produk.';
    return;
  }
  el.innerHTML = `
    <div><strong>${sel.name}</strong></div>
    <div>Harga: ${formatIDR(sel.price)}</div>
    <div>Jumlah awal: ${sel.qty}</div>
  `;
  document.getElementById('qty').value = sel.qty;
}

// Validasi form transaksi
function validateForm() {
  const required = [
    ['custName', 'Nama'],
    ['custEmail', 'Email'],
    ['custPhone', 'No. HP'],
    ['custAddress', 'Alamat'],
    ['size', 'Ukuran'],
    ['color', 'Warna'],
    ['qty', 'Jumlah']
  ];
  for (const [id, label] of required) {
    const el = document.getElementById(id);
    if (!el || !el.value) {
      alert(`Mohon isi: ${label}`);
      el && el.focus();
      return false;
    }
  }
  return true;
}

// Kirim pesanan
function submitOrder() {
  if (!validateForm()) return;
  const sel = load('selectedProduct');
  if (!sel) { alert('Tidak ada produk dipilih.'); return; }

  const qty = Math.max(1, Number(document.getElementById('qty').value || 1));
  const size = document.getElementById('size').value;
  const color = document.getElementById('color').value;
  const ship = document.getElementById('shipping').value;
  const pay = document.getElementById('payment').value;
  const note = document.getElementById('note').value;

  const subtotal = sel.price * qty;
  const ongkir = shippingCost(ship);
  const tax = Math.round(subtotal * 0.11);
  const grand = subtotal + ongkir + tax;

  const order = {
    number: 'INV-' + Date.now(),
    date: new Date().toLocaleString('id-ID'),
    buyer: {
      name: document.getElementById('custName').value,
      email: document.getElementById('custEmail').value,
      phone: document.getElementById('custPhone').value,
      address: document.getElementById('custAddress').value
    },
    shipping: ship,
    payment: pay,
    note,
    items: [{
      name: sel.name,
      price: sel.price,
      qty,
      size,
      color,
      subtotal
    }],
    subtotal,
    ongkir,
    tax,
    grand
  };

  save('lastOrder', order);
  window.location.href = 'invoice.html';
}

// Tampilkan invoice
function renderInvoice() {
  const inv = load('lastOrder');
  if (!inv) {
    document.getElementById('invoiceBox').innerHTML = '<p>Tidak ada data invoice. Silakan lakukan transaksi terlebih dahulu.</p>';
    return;
  }
  document.getElementById('invNumber').textContent = inv.number;
  document.getElementById('invDate').textContent = inv.date;
  document.getElementById('invBuyer').innerHTML = `
    <div><strong>${inv.buyer.name}</strong></div>
    <div>${inv.buyer.address}</div>
    <div>${inv.buyer.phone} • ${inv.buyer.email}</div>
  `;
  const shipText = { REG: 'REG (2-4 hari)', EXP: 'EXP (1-2 hari)', SAME: 'Same Day' }[inv.shipping] || inv.shipping;
  document.getElementById('invShipPay').innerHTML = `
    <div>Pengiriman: ${shipText}</div>
    <div>Pembayaran: ${inv.payment}</div>
    ${inv.note ? `<div class="muted">Catatan: ${inv.note}</div>` : ''}
  `;
  document.getElementById('invItems').innerHTML = inv.items.map(it => `
    <tr>
      <td>${it.name}</td>
      <td>${it.size || '-'} / ${it.color || '-'}</td>
      <td>${it.qty}</td>
      <td>${formatIDR(it.price)}</td>
      <td>${formatIDR(it.subtotal)}</td>
    </tr>
  `).join('');
  document.getElementById('invSubtotal').textContent = formatIDR(inv.subtotal);
  document.getElementById('invShipping').textContent = formatIDR(inv.ongkir);
  document.getElementById('invTax').textContent = formatIDR(inv.tax);
  document.getElementById('invGrand').textContent = formatIDR(inv.grand);
}

// Jalankan otomatis sesuai halaman
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop();
  if (page === 'transaksi.html') renderSummary();
  if (page === 'invoice.html') renderInvoice();
});
