/**
 * @typedef {Object} AddressDto
 * @property {number} Id
 * @property {string} Uf
 * @property {string} Cidade
 * @property {string} Bairro
 * @property {string} Numero
 * @property {string} Referencia
 * @property {boolean} Padrao
 * @property {number} TempoMinutos
 * @property {number} DistanciaKm
 * @property {number} Frete
 */

/**
 * Faz POST para obter endereços do usuário por WhatsApp.
 * Se receber 204, retorna array vazio.
 * @param {string} whatsapp 
 * @returns {Promise<AddressDto[]>}
 */
async function fetchUserAddresses(whatsapp) {
  const resp = await fetch(
    '/api/Usuario/GetAddressesByWhatsApp',
    {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: whatsapp })
    }
  );
  if (resp.status === 204) return [];
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

/**
 * Renderiza a lista de endereços no UL.
 * @param {AddressDto[]} addresses 
 */
function renderAddressList(addresses) {
  const ul = document.getElementById('addressList');
  ul.innerHTML = '';

  addresses.forEach(addr => {
    const li = document.createElement('li');
    li.className = 'address-item';
    li.innerHTML = `
      <div class="address-info">
        <input
          type="radio"
          name="selectedAddress"
          id="addr-${addr.Id}"
          value="${addr.Id}"
          ${addr.Padrao ? 'checked' : ''}
        />
        <label for="addr-${addr.Id}">
          <strong>${addr.Bairro}, ${addr.Numero}</strong><br/>
          ${addr.Cidade} – ${addr.Uf}
          ${addr.Referencia ? `<br/><em>${addr.Referencia}</em>` : ''}
          <br/><small>
            ${addr.DistanciaKm.toFixed(1)} km • ${addr.TempoMinutos} min • R$ ${addr.Frete.toFixed(2)}
          </small>
        </label>
      </div>
      <button class="menu-btn" data-id="${addr.Id}" aria-label="Opções">
        <i class="fas fa-ellipsis-v"></i>
      </button>
    `;
    ul.appendChild(li);
  });
}


document.addEventListener('DOMContentLoaded', async () => {
  // 1) Recupera dados do localStorage
  const whatsapp = localStorage.getItem('bgHouse_whatsapp');
  const userId   = localStorage.getItem('bgHouse_id');

  // Se não encontrar WhatsApp, redireciona à identificação
  if (!whatsapp) {
    window.location.href = 'identify.html';
    return;
  }

  try {
    // 2) Busca endereços
    const addresses = await fetchUserAddresses(whatsapp);

    // Se não houver endereços cadastrados, redireciona também
    if (!addresses.length) {
      window.location.href = 'identify.html';
      return;
    }

    // 3) Renderiza lista
    renderAddressList(addresses);

    // 4) Configura botão Salvar
    document.getElementById('saveBtn').addEventListener('click', () => {
      const sel = document.querySelector('input[name="selectedAddress"]:checked');
      if (!sel) {
        alert('Selecione um endereço.');
        return;
      }
      const addressId = sel.value;
      // Exemplo de redirecionamento para checkout
      window.location.href = `checkout.html?userId=${userId}&addressId=${addressId}`;
    });

    // 5) Botões de menu
    document.querySelectorAll('.menu-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        // abrir opções de editar/excluir
      });
    });
  } catch (err) {
    console.error(err);
    // Em caso de erro de rede ou API, volta à identificação
    window.location.href = 'identify.html';
  }
});
