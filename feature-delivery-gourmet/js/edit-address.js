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
    li.style.position = 'relative';

    // conteúdo principal
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
      <!-- botão editar -->
      <button class="edit-btn" onclick="editAddress(${addr.id})" title="Editar endereço"
              style="position:absolute; top:1rem; right:4rem; background:none; border:none; cursor:pointer; color:var(--secondary);">
        ✏️
      </button>
      <!-- menu de opções -->
      <button class="menu-btn" data-id="${addr.id}" aria-label="Opções"
              style="position:absolute; top:1rem; right:1rem; background:none; border:none; cursor:pointer;">
        ⋮
      </button>
    `;
    ul.appendChild(li);
  });

  // ao clicar no ⋮ abre dropdown de excluir
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      // remove todos
      document.querySelectorAll('.dropdown').forEach(d => d.remove());
      // cria dropdown
      const dd = document.createElement('div');
      dd.className = 'dropdown';
      dd.id = `dropdown-${id}`;
      dd.style = `
        position:absolute;
        top:2.5rem;
        right:1rem;
        background:var(--primary);
        border:1px solid var(--border);
        border-radius:6px;
        box-shadow:0 2px 6px var(--shadow);
        z-index:10;
      `;
      dd.innerHTML = `
        <button onclick="deleteAddress(${id})"
                style="display:block; width:100%; padding:8px 16px; border:none;
                       background:none; text-align:left; cursor:pointer;
                       color:#c0392b;">
          🗑️ Excluir
        </button>
      `;
      btn.parentElement.appendChild(dd);
    });
  });

  // fecha dropdown ao clicar fora
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown').forEach(d => d.remove());
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // voltar na seta
  document.getElementById('backBtn').addEventListener('click', () => {
    history.length > 1 ? history.back() : window.location.href = 'index.html';
  });

  // novo endereço
  document.getElementById('newAddressBtn').addEventListener('click', () => {
    window.location.href = 'register-address.html';
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

// função de edição
function editAddress(id) {
  window.location.href = `edit-address.html?addressId=${id}`;
}

// função de exclusão (padrão)
async function deleteAddress(id) {
  if (!confirm('Deseja excluir este endereço?')) return;
  try {
    const resp = await fetch(`/api/Usuario/DeleteEndereco/${id}`, { method: 'DELETE' });
    if (!resp.ok) throw new Error();
    // recarrega lista
    const addresses = await fetchUserAddresses(localStorage.getItem('bgHouse_whatsapp'));
    renderAddressList(addresses);
  } catch {
    alert('Não foi possível excluir.');
  }
}

/**
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
