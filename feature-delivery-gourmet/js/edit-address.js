// ative o loader
function showLoader() {
  document.getElementById('loader').classList.remove('hidden');
}

// esconda o loader
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
          <strong>${addr.bairro}, ${addr.numero}</strong><br/>
          ${addr.cidade} – ${addr.uf.toUpperCase()}<br/>
          ${addr.referencia ? `<em>${addr.referencia}</em><br/>` : ''}
          <small>
            ${addr.distanciaKm.toFixed(1)} km • ${addr.tempoMinutos} min • R$ ${addr.frete.toFixed(2)}
          </small>
        </label>
      </div>
      <button class="menu-btn" data-id="${addr.id}" aria-label="Opções">
        <i class="fas fa-ellipsis-v"></i>
      </button>
    `;
    ul.appendChild(li);
  });
}
document.addEventListener('DOMContentLoaded', async () => {
  // efeito de voltar na seta
  document.getElementById('backBtn').addEventListener('click', () => {
    history.length > 1 ? history.back() : window.location.href = 'index.html';
  });

  // botão de criar novo endereço
  document.getElementById('newAddressBtn').addEventListener('click', () => {
    window.location.href = 'register-address.html'; // ou o arquivo de cadastro que você usa
  });

  const whatsapp = localStorage.getItem('bgHouse_whatsapp');
  const userId   = localStorage.getItem('bgHouse_id');
  if (!whatsapp) return window.location.href = 'identify.html';

  try {
    const addresses = await fetchUserAddresses(whatsapp);
    renderAddressList(addresses);

    document.getElementById('saveBtn').addEventListener('click', () => {
      const sel = document.querySelector('input[name="selectedAddress"]:checked');
      if (!sel) {
        alert('Selecione um endereço.');
        return;
      }
      window.location.href = `checkout.html?userId=${userId}&addressId=${sel.value}`;
    });
  } catch (err) {
    console.error('Erro ao buscar endereços:', err);
    window.location.href = 'identify.html';
  }
});


/**ssss
 * @typedef {Object} AddressDto
 * @property {number} id
 * @property {number} usuarioId
 * @property {string} uf
 * @property {string} cidade
 * @property {string} bairro
 * @property {string} numero
 * @property {string} referencia
 * @property {boolean} padrao
 * @property {number} distanciaKm
 * @property {number} tempoMinutos
 * @property {number} frete
 */
