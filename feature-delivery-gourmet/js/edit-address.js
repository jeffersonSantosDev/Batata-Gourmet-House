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
    li.style.position = 'relative'; // <- garante que o dropdown fique alinhado ao botão

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
        <i class="fas fa-pen"></i>
      </button>
      <div class="dropdown" id="dropdown-${addr.id}" style="
        display: none;
        position: absolute;
        top: 45px;
        right: 10px;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 1000;
      ">
        <button onclick="editAddress(${addr.id})" style="
          padding: 10px 16px;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          color: #333;
          font-size: 14px;
          cursor: pointer;
        ">Editar</button>
        <button onclick="deleteAddress(${addr.id})" style="
          padding: 10px 16px;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          color: #c0392b;
          font-size: 14px;
          cursor: pointer;
        ">Excluir</button>
      </div>
    `;
    ul.appendChild(li);
  });

  // Mostrar/esconder dropdown
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      document.querySelectorAll('.dropdown').forEach(d => d.style.display = 'none');
      const dropdown = document.getElementById(`dropdown-${id}`);
      if (dropdown) dropdown.style.display = 'block';
    });
  });

  // Fechar dropdown ao clicar fora
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown').forEach(d => d.style.display = 'none');
  });

  // Bloqueio do botão Novo Endereço
  const newBtn = document.getElementById('newAddressBtn');
  if (addresses.length >= 3) {
    newBtn.disabled = true;
    newBtn.style.opacity = '0.6';
    newBtn.style.cursor = 'not-allowed';
    newBtn.onclick = () => {
      Swal.fire({
        icon: 'info',
        title: 'Limite atingido',
        text: 'Você só pode cadastrar até 3 endereços. Exclua um para adicionar outro.',
        confirmButtonText: 'Entendi'
      });
    };
  } else {
    newBtn.disabled = false;
    newBtn.style.opacity = '1';
    newBtn.style.cursor = 'pointer';
    newBtn.onclick = () => window.location.href = 'register-address.html';
  }
}



document.addEventListener('DOMContentLoaded', async () => {
  // efeito de voltar na seta
  document.getElementById('backBtn').addEventListener('click', () => {
    history.length > 1 ? history.back() : window.location.href = 'index.html';
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
        Swal.fire({
          icon: 'warning',
          title: 'Endereço obrigatório',
          text: 'Selecione um endereço para prosseguir.',
          confirmButtonText: 'Ok'
        });
        return;
      }
      window.location.href = `checkout.html?userId=${userId}&addressId=${sel.value}`;
    });
  } catch (err) {
    console.error('Erro ao buscar endereços:', err);
    window.location.href = 'identify.html';
  }
});
async function deleteAddress(id) {
  const confirm = await Swal.fire({
    title: 'Deseja excluir este endereço?',
    text: 'Essa ação não poderá ser desfeita.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  });

  if (confirm.isConfirmed) {
    try {
      const resp = await fetch(`/api/Usuario/DeleteEndereco/${id}`, {
        method: 'DELETE'
      });

      if (!resp.ok) throw new Error('Erro ao excluir');

      Swal.fire('Excluído!', 'Endereço removido com sucesso.', 'success');

      const whatsapp = localStorage.getItem('bgHouse_whatsapp');
      const addresses = await fetchUserAddresses(whatsapp);
      renderAddressList(addresses);

    } catch (err) {
      Swal.fire('Erro', 'Não foi possível excluir o endereço.', 'error');
    }
  }
}

function editAddress(id) {
  window.location.href = `edit-address.html?id=${id}`;
}