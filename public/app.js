/*
 * InvoiceForge app — dashboard, editor, statuses, print view.
 * Persistence: localStorage. Money math: window.InvoiceMath only —
 * nothing in this file computes a total by hand.
 */
(function () {
  'use strict';

  var STORE_KEY = 'invoiceforge.invoices.v1';
  var SEQ_KEY = 'invoiceforge.seq.v1';

  var state = { invoices: [], editingId: null };

  function money(n) {
    return '$' + Number(n || 0).toFixed(2);
  }
  function uid() {
    return 'inv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
  function totalsFor(inv) {
    return window.InvoiceMath.computeTotals(inv.items, inv.discountPct, inv.taxPct);
  }

  // ---------- persistence + seed (AC-11) ----------
  function seed() {
    var seeds = [
      {
        id: uid(), number: 'INV-1001', clientName: 'Sinar Abadi Studio',
        clientEmail: 'billing@sinarabadi.example', status: 'sent',
        notes: 'Net 14 days. Thank you!',
        items: [
          { description: 'Website redesign', qty: 1, price: 1500 },
          { description: 'Landing page copy', qty: 2, price: 250 },
        ],
        discountPct: 10, taxPct: 11,
      },
      {
        id: uid(), number: 'INV-1002', clientName: 'Kopi Nusantara',
        clientEmail: 'halo@kopinusantara.example', status: 'paid',
        notes: 'Paid via bank transfer.',
        items: [{ description: 'Menu design', qty: 3, price: 120 }],
        discountPct: 0, taxPct: 0,
      },
      {
        id: uid(), number: 'INV-1003', clientName: 'Duta Logistics',
        clientEmail: 'finance@dutalogistics.example', status: 'draft',
        notes: 'Draft — pending scope sign-off.',
        items: [{ description: 'Dashboard prototype', qty: 1, price: 2400 }],
        discountPct: 0, taxPct: 10,
      },
    ];
    seeds.forEach(function (inv) { inv.total = totalsFor(inv).total; });
    localStorage.setItem(SEQ_KEY, '1004');
    return seeds;
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) {
        state.invoices = seed();
        save();
      } else {
        state.invoices = JSON.parse(raw) || [];
      }
    } catch (e) {
      state.invoices = [];
    }
  }
  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state.invoices));
  }
  function nextNumber() {
    var n = parseInt(localStorage.getItem(SEQ_KEY) || '1001', 10);
    localStorage.setItem(SEQ_KEY, String(n + 1));
    return 'INV-' + n;
  }

  // ---------- dashboard (AC-1) ----------
  function renderStats() {
    var counts = { draft: 0, sent: 0, paid: 0 };
    var outstanding = 0;
    state.invoices.forEach(function (inv) {
      counts[inv.status] = (counts[inv.status] || 0) + 1;
      if (inv.status !== 'paid') outstanding += Number(inv.total) || 0;
    });
    document.getElementById('stats').innerHTML =
      stat(state.invoices.length, 'Invoices') +
      stat(counts.draft, 'Draft') +
      stat(counts.sent, 'Sent') +
      stat(money(window.InvoiceMath.round2(outstanding)), 'Outstanding');
    function stat(v, l) {
      return '<div class="stat"><div class="num">' + v + '</div><div class="lbl">' + l + '</div></div>';
    }
  }

  function renderList() {
    renderStats();
    var el = document.getElementById('invoiceList');
    if (!state.invoices.length) {
      el.innerHTML = '<div class="empty">No invoices yet. Create your first one.</div>';
      return;
    }
    var rows = state.invoices.map(function (inv) {
      var paidBtn = inv.status === 'paid'
        ? ''
        : '<button class="btn small" data-action="paid" data-id="' + inv.id + '">Mark as Paid</button>';
      return '<tr>' +
        '<td><strong>' + esc(inv.number) + '</strong></td>' +
        '<td>' + esc(inv.clientName) + '</td>' +
        '<td class="hide-sm">' + esc(inv.clientEmail || '—') + '</td>' +
        '<td><span class="badge ' + inv.status + '">' + inv.status + '</span></td>' +
        '<td class="num"><strong>' + money(inv.total) + '</strong></td>' +
        '<td><div class="row-actions">' + paidBtn +
        '<button class="btn small" data-action="edit" data-id="' + inv.id + '">Edit</button>' +
        '<button class="btn small" data-action="print" data-id="' + inv.id + '">Print</button>' +
        '<button class="btn small danger" data-action="delete" data-id="' + inv.id + '">Delete</button>' +
        '</div></td></tr>';
    }).join('');
    el.innerHTML = '<table><thead><tr><th>Number</th><th>Client</th><th class="hide-sm">Email</th><th>Status</th><th class="num">Total</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------- statuses (AC-8) ----------
  function markAsPaid(id) {
    var inv = state.invoices.find(function (i) { return i.id === id; });
    if (!inv) return;
    inv.status = 'paid';
    save();
    renderList();
  }

  function deleteInvoice(id) {
    var inv = state.invoices.find(function (i) { return i.id === id; });
    if (!inv) return;
    if (!window.confirm('Delete invoice ' + inv.number + ' for ' + inv.clientName + '?')) return;
    state.invoices = state.invoices.filter(function (i) { return i.id !== id; });
    save();
    renderList();
  }

  // ---------- print view (AC-10) ----------
  function printInvoice(id) {
    var inv = state.invoices.find(function (i) { return i.id === id; });
    if (!inv) return;
    var t = totalsFor(inv);
    var itemRows = inv.items.map(function (it) {
      var amount = window.InvoiceMath.round2((Number(it.qty) || 0) * (Number(it.price) || 0));
      return '<tr><td>' + esc(it.description) + '</td><td>' + esc(it.qty) + '</td><td>' +
        money(it.price) + '</td><td style="text-align:right">' + money(amount) + '</td></tr>';
    }).join('');
    document.getElementById('printSheet').innerHTML =
      '<h1>Invoice ' + esc(inv.number) + '</h1>' +
      '<p><strong>' + esc(inv.clientName) + '</strong>' + (inv.clientEmail ? ' · ' + esc(inv.clientEmail) : '') +
      '<br>Status: ' + esc(inv.status) + '</p>' +
      '<table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left">Description</th><th style="text-align:left">Qty</th><th style="text-align:left">Unit price</th><th style="text-align:right">Amount</th></tr></thead><tbody>' +
      itemRows + '</tbody></table>' +
      '<p style="text-align:right">Subtotal: ' + money(t.subtotal) + '<br>' +
      'Discount: −' + money(t.discount) + '<br>' +
      'Tax: ' + money(t.tax) + '<br>' +
      '<strong>Total: ' + money(t.total) + '</strong></p>' +
      (inv.notes ? '<p>' + esc(inv.notes) + '</p>' : '');
    window.print();
  }

  // ---------- editor (AC-2, AC-7) ----------
  function showEditor(inv) {
    state.editingId = inv ? inv.id : null;
    document.getElementById('listView').hidden = true;
    document.getElementById('editorView').hidden = false;
    document.getElementById('editorTitle').textContent = inv ? 'Edit ' + inv.number : 'New Invoice';
    document.getElementById('clientName').value = inv ? inv.clientName : '';
    document.getElementById('clientEmail').value = inv ? inv.clientEmail || '' : '';
    document.getElementById('status').value = inv ? inv.status : 'draft';
    document.getElementById('notes').value = inv ? inv.notes || '' : '';
    document.getElementById('discountPct').value = inv ? inv.discountPct : 0;
    document.getElementById('taxPct').value = inv ? inv.taxPct : 0;
    var body = document.getElementById('itemsBody');
    body.innerHTML = '';
    var items = inv ? inv.items : [{ description: '', qty: 1, price: 0 }];
    items.forEach(function (it) { addItemRow(it); });
    updatePreview();
  }
  function showList() {
    document.getElementById('editorView').hidden = true;
    document.getElementById('listView').hidden = false;
    renderList();
  }

  function addItemRow(it) {
    it = it || { description: '', qty: 1, price: 0 };
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><input class="it-desc" value="' + esc(it.description) + '" placeholder="Description"></td>' +
      '<td><input class="it-qty" type="number" min="0" step="0.01" value="' + esc(it.qty) + '"></td>' +
      '<td><input class="it-price" type="number" min="0" step="0.01" value="' + esc(it.price) + '"></td>' +
      '<td class="num it-amount">' + money(window.InvoiceMath.round2((Number(it.qty) || 0) * (Number(it.price) || 0))) + '</td>' +
      '<td><button type="button" class="btn small danger it-remove" title="Remove row">×</button></td>';
    tr.querySelector('.it-remove').addEventListener('click', function () {
      tr.remove();
      updatePreview();
    });
    tr.querySelectorAll('input').forEach(function (input) {
      input.addEventListener('input', updatePreview);
    });
    document.getElementById('itemsBody').appendChild(tr);
  }

  function readEditorItems() {
    var items = [];
    document.querySelectorAll('#itemsBody tr').forEach(function (tr) {
      items.push({
        description: tr.querySelector('.it-desc').value.trim(),
        qty: Number(tr.querySelector('.it-qty').value) || 0,
        price: Number(tr.querySelector('.it-price').value) || 0,
      });
      var amount = window.InvoiceMath.round2(items[items.length - 1].qty * items[items.length - 1].price);
      tr.querySelector('.it-amount').textContent = money(amount);
    });
    return items;
  }

  function updatePreview() {
    var items = readEditorItems();
    var t = window.InvoiceMath.computeTotals(
      items,
      Number(document.getElementById('discountPct').value) || 0,
      Number(document.getElementById('taxPct').value) || 0
    );
    document.getElementById('prevSubtotal').textContent = money(t.subtotal);
    document.getElementById('prevDiscount').textContent = '−' + money(t.discount);
    document.getElementById('prevTax').textContent = money(t.tax);
    document.getElementById('prevTotal').textContent = money(t.total);
    return t;
  }

  function saveFromEditor(ev) {
    ev.preventDefault();
    var items = readEditorItems().filter(function (it) { return it.description || it.qty || it.price; });
    if (!items.length) items = [{ description: 'Service', qty: 1, price: 0 }];
    var t = updatePreview();
    var data = {
      clientName: document.getElementById('clientName').value.trim(),
      clientEmail: document.getElementById('clientEmail').value.trim(),
      status: document.getElementById('status').value,
      notes: document.getElementById('notes').value.trim(),
      items: items,
      discountPct: Number(document.getElementById('discountPct').value) || 0,
      taxPct: Number(document.getElementById('taxPct').value) || 0,
      total: t.total,
    };
    if (state.editingId) {
      var inv = state.invoices.find(function (i) { return i.id === state.editingId; });
      Object.assign(inv, data);
    } else {
      data.id = uid();
      data.number = nextNumber();
      state.invoices.unshift(data);
    }
    save();
    showList();
  }

  // ---------- wiring ----------
  document.getElementById('newInvoiceBtn').addEventListener('click', function () { showEditor(null); });
  document.getElementById('backBtn').addEventListener('click', showList);
  document.getElementById('cancelBtn').addEventListener('click', showList);
  document.getElementById('addItemBtn').addEventListener('click', function () { addItemRow(); updatePreview(); });
  document.getElementById('invoiceForm').addEventListener('submit', saveFromEditor);
  ['discountPct', 'taxPct'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', updatePreview);
  });
  document.getElementById('invoiceList').addEventListener('click', function (ev) {
    var btn = ev.target.closest('button[data-action]');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    var action = btn.getAttribute('data-action');
    if (action === 'paid') markAsPaid(id);
    else if (action === 'delete') deleteInvoice(id);
    else if (action === 'print') printInvoice(id);
    else if (action === 'edit') {
      var inv = state.invoices.find(function (i) { return i.id === id; });
      if (inv) showEditor(inv);
    }
  });

  load();
  renderList();
})();
