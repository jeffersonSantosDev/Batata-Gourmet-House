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
  } catch (err) {
    console.error(err);
    await swal("Erro", "Não foi possível carregar seus pedidos. Tente novamente mais tarde.", "error");
    window.location.href = 'identify.html';
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
  } catch (err) {
    console.error(err);
    await swal("Erro", "Não foi possível definir o endereço padrão. Tente novamente mais tarde.", "error");
    throw err;  // para não prosseguir no save
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

  // filtra só os ativos
  const ativos = addresses.filter(a => a.ativo);

  let originalDefaultId = null;

  if (ativos.length === 0) {
    ul.innerHTML = '<li class="no-address">Nenhum endereço cadastrado.</li>';
    return originalDefaultId;
  }

  ativos.forEach(a => {
    if (a.padrao) originalDefaultId = String(a.id);

    const li = document.createElement('li');
    li.className = 'address-item';
    li.innerHTML = `
    <input
      type="radio"
      name="selectedAddress"
      id="addr-${a.id}"
      value="${a.id}"
      ${a.padrao ? 'checked' : ''}
    />
    <div class="address-content">
      <label for="addr-${a.id}" class="address-line1">
        <strong>${a.bairro}, ${a.numero}</strong>
      </label>
      <div class="address-street">Rua ${a.Rua || ''}</div>
      <div class="address-city">${a.cidade} – ${a.uf.toUpperCase()}</div>
      <div class="address-meta">
        ${a.distanciaKm.toFixed(1)} km • ${a.tempoMinutos} min • R$ ${a.frete.toFixed(2)}
      </div>
    </div>
    <button class="menu-btn" data-id="${a.id}" aria-label="Opções">⋮</button>
  `;
  
    ul.appendChild(li);
  });

  // … resto igual …
  // dropdown, evento de click, etc.

  return originalDefaultId;
}


document.addEventListener('DOMContentLoaded', async () => {
  // Voltar
  document.getElementById('backBtn').onclick = () => {
    history.length > 1 ? history.back() : window.location.href = 'index.html';
  };
 
  // Novo cadastro
  document.getElementById('newAddressBtn').onclick = (e) => {
    // conta quantos <li class="address-item"> existem
    const count = document.querySelectorAll('.address-item').length;
    if (count >= 2) {
      e.preventDefault();
      return swal("Atenção", "Você só pode ter 2 endereços cadastrados. Caso queira cadastrar outro, exclua um antes.", "warning");
    }
    // senão, segue para a tela de cadastro
    window.location.href = 'register-address.html';
  };
  const whatsapp = localStorage.getItem('bgHouse_whatsapp'); 

  if (!whatsapp) {
    return window.location.replace("identify.html");
  }

  // Carrega e renderiza
  let originalDefaultId = null;
  try {
    const list = await fetchUserAddresses(whatsapp);
    originalDefaultId = renderAddressList(list);
  } catch {
    // Já tratado no fetchUserAddresses
    return;
  }

  // Salvar
  document.getElementById('saveBtn').onclick = async () => {
    const sel = document.querySelector('input[name="selectedAddress"]:checked');
    if (!sel) {
      return swal("Atenção", "Selecione um endereço antes de salvar.", "warning");
    }
    const newDefaultId = sel.value;

    // Se mudou o padrão, avisa a API
    if (originalDefaultId !== newDefaultId) {
      try {
        await setDefaultAddress(whatsapp, newDefaultId);
      } catch {
        return;
      }
      // Recarrega lista e atualiza originalDefaultId
      const updatedList = await fetchUserAddresses(whatsapp);
      originalDefaultId = renderAddressList(updatedList);
    }
 
  };
});

// Excluir endereço 
async function deleteAddress(id) {
  const confirmDelete = await swal({
    title: "Confirmação",
    text: "Deseja excluir este endereço?",
    icon: "warning",
    buttons: ["Cancelar", "Excluir"],
    dangerMode: true
  });
  if (!confirmDelete) return;

  const whatsapp = localStorage.getItem('bgHouse_whatsapp');
  showLoader();
  try {
    const resp = await fetch(`/api/Usuario/DeleteEndereco/${id}`, { method: 'DELETE' });
    if (!resp.ok) throw new Error();

    // Recarrega lista
    const updatedList = await fetchUserAddresses(whatsapp);
    renderAddressList(updatedList);

    // Se só restou 1, define automaticamente como padrão
    if (updatedList.length === 1) {
      const onlyAddressId = updatedList[0].id;
      try {
        await setDefaultAddress(whatsapp, onlyAddressId);
        // Opcional: atualizar UI pra marcar o rádio
        document
          .querySelector(`input[name="selectedAddress"][value="${onlyAddressId}"]`)
          .checked = true;
      } catch {
        // já mostrou erro lá dentro, podemos ignorar
      }
    }
  } catch {
    console.error('Erro ao excluir endereço');
    await swal("Erro", "Não foi possível excluir este endereço. Tente novamente mais tarde.", "error");
  } finally {
    hideLoader();
  }
}
