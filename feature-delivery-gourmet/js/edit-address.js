// mostra loader
function showLoader() {
  document.getElementById('loader').classList.remove('hidden');
}
// esconde loader
function hideLoader() {
  document.getElementById('loader').classList.add('hidden');
}

/**
 * Busca endereços via API
 */
async function fetchUserAddresses(whatsapp) {
  showLoader();
  try {
    const resp = await fetch('/api/Usuario/GetAddressesByWhatsApp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: whatsapp })
    });
    if (resp.status === 204) return [];
    if (!resp.ok) throw new Error();
    return await resp.json();
  } finally {
    hideLoader();
  }
}

/**
 * Preenche a lista de endereços
 */
function renderAddressList(addresses) {
  const ul = document.getElementById('addressList');
  ul.innerHTML = '';
  if (addresses.length === 0) {
    ul.innerHTML = '<li class="no-address">Nenhum endereço cadastrado.</li>';
    return;
  }
  addresses.forEach(a => {
    const li = document.createElement('li');
    li.className = 'address-item';
    li.innerHTML = `
      <div class="address-info">
        <input type="radio" name="selectedAddress" id="addr-${a.id}" value="${a.id}" ${a.padrao?'checked':''}/>
        <label for="addr-${a.id}"><strong>${a.bairro}, ${a.numero}</strong></label>
        <label for="addr-${a.id}">${a.cidade} – ${a.uf.toUpperCase()}</label>
        ${a.referencia?`<label for="addr-${a.id}"><em>${a.referencia}</em></label>`:''}
        <label for="addr-${a.id}"><small>${a.distanciaKm.toFixed(1)} km • ${a.tempoMinutos} min • R$ ${a.frete.toFixed(2)}</small></label>
      </div>
      <button class="menu-btn" data-id="${a.id}">⋮</button>
    `;
    ul.appendChild(li);
  });

  // menu dropdown
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      document.querySelectorAll('.dropdown').forEach(d=>d.remove());
      const id = btn.dataset.id;
      const dd = document.createElement('div');
      dd.className = 'dropdown';
      dd.innerHTML = `
        <button onclick="editAddress(${id})">✏️ Editar</button>
        <button onclick="deleteAddress(${id})">🗑️ Excluir</button>`;
      btn.parentElement.appendChild(dd);
    };
  });
  document.onclick = () => document.querySelectorAll('.dropdown').forEach(d=>d.remove());
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('backBtn').onclick = () => history.length>1?history.back():window.location.href='index.html';
  document.getElementById('newAddressBtn').onclick = () => window.location.href='register-address.html';
  const whatsapp = localStorage.getItem('bgHouse_whatsapp');
  const userId = localStorage.getItem('bgHouse_id');
  if (!whatsapp) return window.location.href='identify.html';
  try {
    const list = await fetchUserAddresses(whatsapp);
    renderAddressList(list);
    document.getElementById('saveBtn').onclick = () => {
      const sel = document.querySelector('input[name="selectedAddress"]:checked');
      if (!sel) return alert('Selecione um endereço.');
      window.location.href = `checkout.html?userId=${userId}&addressId=${sel.value}`;
    };
  } catch {
    console.error('Erro');
    window.location.href='identify.html';
  }
});

// redireciona para editar
function editAddress(id) {
  window.location.href = `edit-address.html?addressId=${id}`;
}

// exclui
async function deleteAddress(id) {
  if (!confirm('Deseja excluir este endereço?')) return;
  try {
    const resp = await fetch(`/api/Usuario/DeleteEndereco/${id}`, { method:'DELETE' });
    if (!resp.ok) throw new Error();
    const list = await fetchUserAddresses(localStorage.getItem('bgHouse_whatsapp'));
    renderAddressList(list);
  } catch {
    alert('Erro ao excluir');
  }
}
