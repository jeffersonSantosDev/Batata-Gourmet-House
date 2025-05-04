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
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: whatsapp })
    });
    if (resp.status === 204) return [];
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
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

  addresses.forEach(addr => {
    const li = document.createElement('li');
    li.className = 'address-item';
    li.innerHTML = `
      <div class="address-info">
        <input
          type="radio"
          name="selectedAddress"
          id="addr-${addr.id}"
          value="${addr.id}"
          ${addr.padrao ? 'checked' : ''}
        />
        <label for="addr-${addr.id}">
          <strong>${addr.bairro}, ${addr.numero}</strong>
        </label>
        <label for="addr-${addr.id}">
          ${addr.cidade} – ${addr.uf.toUpperCase()}
        </label>
        ${addr.referencia ? `<label for="addr-${addr.id}"><em>${addr.referencia}</em></label>` : ''}
        <label for="addr-${addr.id}">
          <small>${addr.distanciaKm.toFixed(1)} km • ${addr.tempoMinutos} min • R$ ${addr.frete.toFixed(2)}</small>
        </label>
      </div>
      <button class="menu-btn" data-id="${addr.id}" aria-label="Opções">⋮</button>
    `;
    ul.appendChild(li);
  });

  // Dropdown de editar/excluir
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      document.querySelectorAll('.dropdown').forEach(d => d.remove());
      const dd = document.createElement('div');
      dd.className = 'dropdown';
      dd.innerHTML = `
        <button onclick="editAddress(${id})">✏️ Editar</button>
        <button onclick="deleteAddress(${id})">🗑️ Excluir</button>
      `;
      btn.parentElement.appendChild(dd);
    });
  });

  // Fecha dropdown ao clicar fora
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown').forEach(d => d.remove());
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Botão voltar
  document.getElementById('backBtn').addEventListener('click', () => {
    history.length > 1 ? history.back() : window.location.href = 'index.html';
  });

  // Botão "+ Cadastrar"
  document.getElementById('newAddressBtn').addEventListener('click', () => {
    window.location.href = 'register-address.html';
  });

  const whatsapp = localStorage.getItem('bgHouse_whatsapp');
  const userId   = localStorage.getItem('bg
