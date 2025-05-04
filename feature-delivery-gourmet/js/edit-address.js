// Ative o loader
function showLoader() {
  document.getElementById('loader').classList.remove('hidden');
}

// Esconda o loader
function hideLoader() {
  document.getElementById('loader').classList.add('hidden');
}

/**
 * Busca os endereços do usuário via WhatsApp.
 * @param {string} whatsapp
 * @returns {Promise<AddressDto[]>}
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
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } finally {
    hideLoader();
  }
}

/**
 * Renderiza a lista de endereços no UL.
 * @param {AddressDto[]} addresses
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
        <input 
          type="radio" 
          name="selectedAddress" 
          id="addr-${a.id}" 
          value="${a.id}" 
          ${a.padrao ? 'checked' : ''} 
        />
        <label for="addr-${a.id}">
          <strong>${a.bairro}, ${a.numero}</strong>
        </label>
        <label for="addr-${a.id}">
          ${a.cidade} – ${a.uf.toUpperCase()}
        </label>
        ${a.referencia ? `<label for="addr-${a.id}"><em>${a.referencia}</em></label>` : ''}
        <label for="addr-${a.id}">
          <small>${a.distanciaKm.toFixed(1)} km • ${a.tempoMinutos} min • R$ ${a.frete.toFixed(2)}</small>
        </label>
      </div>
      <button class="menu-btn" data-id="${a.id}" aria-label="Opções">⋮</button>
    `;
    ul.appendChild(li);
  });

  // Dropdown de editar/excluir
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.dropdown').forEach(d => d.remove());
      const id = btn.dataset.id;
      const dd = document.createElement('div');
      dd.className = 'dropdown';
      dd.innerHTML = `
        <button onclick="editAddress(${id})">✏️ Editar</button>
        <button onclick="deleteAddress(${id})">🗑️ Excluir</button>
      `;
      btn.parentElement.appendChild(dd);
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown').forEach(d => d.remove());
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Botão voltar
  document.getElementById('backBtn').onclick = () => {
    history.length > 1 ? history.back() : window.location.href = 'index.html';
  };

  // Botão "+ Cadastrar Novo"
  document.getElementById('newAddressBtn').onclick = () => {
    window.location.href = 'register-address.html';
  };

  const whatsapp = localStorage.getItem('bgHouse_whatsapp');
  const userId = localStorage.getItem
