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
        <input type="radio" name="selectedAddress" id="addr-${addr.id}" value="${addr.id}" ${addr.padrao ? 'checked' : ''} />
        <label for="addr-${addr.id}">
          <strong>${addr.bairro}, ${addr.numero}</strong><br/>
          ${addr.cidade} – ${addr.uf.toUpperCase()}<br/>
          ${addr.referencia ? `<em>${addr.referencia}</em><br/>` : ''}
          <small>${addr.distanciaKm.toFixed(1)} km • ${addr.tempoMinutos} min • R$ ${addr.frete.toFixed(2)}</small>
        </label>
      </div>
      <button class="menu-btn" data-id="${addr.id}" aria-label="Opções">
        <i class="fas fa-ellipsis-v"></i>
      </button>
    `;
    ul.appendChild(li);
  });

  // Bloqueia novo cadastro se já tiver 3 endereços
  if (addresses.length >= 3) {
    const newBtn = document.getElementById('newAddressBtn');
    newBtn.disabled = true;
    newBtn.style.opacity = '0.6';
    newBtn.style.cursor = 'not-allowed';
    newBtn.addEventListener('click', () => {
      Swal.fire({
        icon: 'info',
        title: 'Limite atingido',
        text: 'Você só pode cadastrar até 3 endereços. Exclua um para adicionar outro.',
        confirmButtonText: 'Entendi'
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('backBtn').addEventListener('click', () => {
    history.length > 1 ? history.back() : window.location.href = 'index.html';
  });

  const newBtn = document.getElementById('newAddressBtn');
  newBtn.addEventListener('click', () => {
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
