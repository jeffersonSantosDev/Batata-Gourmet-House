// Ative o loader
function showLoader() {
  document.getElementById('loader').classList.remove('hidden');
}
// Esconda o loader
function hideLoader() {
  document.getElementById('loader').classList.add('hidden');
}

/**
 * Busca os endereços via API
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
 * Define o endereço padrão na API
 */
async function setDefaultAddress(whatsapp, addressId) {
  showLoader();
  try {
    const resp = await fetch('/api/Usuario/SetDefaultAddress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: whatsapp, addressId })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  } finally {
    hideLoader();
  }
}

/**
 * Renderiza a lista de endereços e retorna o id do padrão original.
 */
function renderAddressList(addresses) {
  const ul = document.getElementById('addressList');
  ul.innerHTML = '';

  let originalDefaultId = null;

  if (addresses.length === 0) {
    ul.innerHTML = '<li class="no-address">Nenhum endereço cadastrado.</li>';
    return originalDefaultId;
  }

  addresses.forEach(a => {
    if (a.padrao) originalDefaultId = String(a.id);

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
        <label for="addr-${a.id}"><strong>${a.bairro}, ${a.numero}</strong></label>
        <label for="addr-${a.id}">${a.cidade} – ${a.uf.toUpperCase()}</label>
        ${a.referencia ? `<label for="addr-${a.id}"><em>${a.referencia}</em></label>` : ''}
        <label for="addr-${a.id}"><small>${a.distanciaKm.toFixed(1)} km • ${a.tempoMinutos} min • R$ ${a.frete.toFixed(2)}</small></label>
      </div>
      <button class="menu-btn" data-id="${a.id}" aria-label="Opções">⋮</button>
    `;
    ul.appendChild(li);
  });

  // dropdown de excluir
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.dropdown').forEach(d => d.remove());
      const id = btn.dataset.id;
      const dd = document.createElement('div');
      dd.className = 'dropdown';
      dd.innerHTML = `
        <button onclick="deleteAddress(${id})">🗑️ Excluir</button>
      `;
      btn.parentElement.appendChild(dd);
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown').forEach(d => d.remove());
  });

  return originalDefaultId;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Voltar
  document.getElementById('backBtn').onclick = () => {
    history.length > 1 ? history.back() : window.location.href = 'index.html';
  };
  // Novo cadastro
  document.getElementById('newAddressBtn').onclick = () => {
    window.location.href = 'register-address.html';
  };

  const whatsapp = localStorage.getItem('bgHouse_whatsapp');
  const userId = localStorage.getItem('bgHouse_id');
  if (!whatsapp) return window.location.href = 'identify.html';

  // Carrega e renderiza
  let originalDefaultId = null;
  try {
    const list = await fetchUserAddresses(whatsapp);
    originalDefaultId = renderAddressList(list);
  } catch (err) {
    console.error('Erro ao buscar endereços:', err);
    return window.location.href = 'identify.html';
  }

  // Salvar
  document.getElementById('saveBtn').onclick = async () => {
    const sel = document.querySelector('input[name="selectedAddress"]:checked');
    if (!sel) {
      alert('Selecione um endereço.');
      return;
    }
    const newDefaultId = sel.value;

    // Se mudou o padrão, avisa a API
    if (originalDefaultId !== newDefaultId) {
      try {
        await setDefaultAddress(whatsapp, newDefaultId);
      } catch (err) {
        console.error('Erro ao atualizar padrão:', err);
        alert('Não foi possível definir o endereço padrão.');
        return;
      }
      // Recarrega lista e atualiza originalDefaultId
      const updatedList = await fetchUserAddresses(whatsapp);
      originalDefaultId = renderAddressList(updatedList);
    }

    // Por fim, redireciona para a index
    window.location.href = 'index.html';
  };
});

// Excluir endereço
async function deleteAddress(id) {
  if (!confirm('Deseja excluir este endereço?')) return;
  const whatsapp = localStorage.getItem('bgHouse_whatsapp');
  try {
    const resp = await fetch(`/api/Usuario/DeleteEndereco/${id}`, { method: 'DELETE' });
    if (!resp.ok) throw new Error();
    const updatedList = await fetchUserAddresses(whatsapp);
    renderAddressList(updatedList);
  } catch {
    alert('Não foi possível excluir este endereço.');
  }
}
