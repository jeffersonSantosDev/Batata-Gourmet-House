function showLoader() {
  document.getElementById("loadingOverlay").classList.remove("hidden");
}
function hideLoader() {
  document.getElementById("loadingOverlay").classList.add("hidden");
}

async function fetchCart(whatsapp) {
  const r = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
  if (!r.ok) throw new Error('Erro ao carregar carrinho');
  return r.json();
}

async function calcularCupomAplicado(code, userId, storeId, sub, carrinhoId) {
  const r = await fetch('/api/Cupom/Aplicar', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({
      codigo: code,
      usuarioId: userId,
      lojaId: storeId,
      valorOriginal: sub,
      carrinhoId
    })
  });
  if (!r.ok) return { sucesso: false };
  return await r.json();
}

async function buscarCupomDoCarrinho(carrinhoId) {
  try {
    const r = await fetch(`/api/Cupom/GetCupomCarrinho?carrinhoId=${carrinhoId}`);
    if (!r.ok) return null;
    const codigo = await r.text();
    return codigo || null;
  } catch {
    return null;
  }
}

function fmtBRL(v) {
  return v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}

document.addEventListener('DOMContentLoaded', async () => {
  showLoader();
  try {
    const backBtn     = document.getElementById('backBtn');
    const deliverySec = document.getElementById('deliverySection');
    const delivName   = document.getElementById('delivName');
    const delivPhone  = document.getElementById('delivPhone');
    const delivAddr   = document.getElementById('delivAddress');
    const subEl    = document.getElementById('subtotal');
    const cupLine  = document.getElementById('cupomLine');
    const descEl   = document.getElementById('desconto');
    const fretLine = document.getElementById('freteLine');
    const freteEl  = document.getElementById('frete');
    const totalEl  = document.getElementById('total');
    const form        = document.getElementById('paymentForm');
    const radios      = form.elements['method'];
    const changeSec   = document.getElementById('changeSection');
    const changeInp   = document.getElementById('changeAmount');
    const noChangeChk = document.getElementById('noChange');
    const finishBtn   = document.getElementById('finishBtn');

    finishBtn.setAttribute('type','button');
    backBtn.onclick = () => history.back();

    const whatsapp   = localStorage.getItem('bgHouse_whatsapp');
    const userId     = whatsapp ? parseInt(atob(localStorage.getItem('bgHouse_id'))) : null;
    const storeId    = parseInt(localStorage.getItem('bgHouse_lojaId'));
    const programId  = parseInt(localStorage.getItem('bgHouse_fidelidadeId'));
    const rawAddress = localStorage.getItem('bgHouse_selectedAddress');
    const rawFrete   = localStorage.getItem('bgHouse_frete');

    if (!whatsapp || !userId) {
      swal("Ops!", "Identifique-se para continuar.", "warning")
        .then(() => window.location.href = "identify.html?return=payment.html");
      return;
    }

    let storedFrete = 0;
    if (rawFrete) {
      storedFrete = parseFloat(rawFrete);
      if (storedFrete > 0) {
        freteEl.textContent = fmtBRL(storedFrete);
        fretLine.style.display = '';
      }
    }
    if (rawAddress) {
      try {
        const addr = JSON.parse(rawAddress);
        delivName.textContent  = localStorage.getItem('bgHouse_name') || 'Você';
        delivPhone.textContent = localStorage.getItem('bgHouse_whatsapp')
                                   .replace(/(\d{2})(\d{5})(\d{4})/,'+$1 $2-$3');
        delivAddr.textContent  = `${addr.rua}, ${addr.numero}` +
                                 (addr.referencia ? ` (${addr.referencia})` : '');
        deliverySec.style.display = '';
      } catch {
        localStorage.removeItem('bgHouse_selectedAddress');
      }
    }

    let cart = { items: [] }, carrinhoId = null, subtotal = 0;
    try {
      const resp = await fetch(`/api/Cart?whatsapp=${encodeURIComponent(whatsapp)}`);
      const data = await resp.json();
      cart = data;
      carrinhoId = data.cartId;

      subtotal = data.items.reduce((sum, item) => {
        const base   = item.precoUnitario * item.quantidade;
        const addons = (item.adicionais || []).reduce(
          (s, ad) => s + ad.preco * ad.quantidade, 0
        );
        return sum + base + addons;
      }, 0);
    } catch {
      subtotal = 0;
    }
    subEl.textContent = fmtBRL(subtotal);

    // Buscar cupom do banco
    let desconto = 0;
    let cupomCode = null;
    try {
      const res = await fetch(`/api/Cupom/GetCupomCarrinho?carrinhoId=${carrinhoId}`);
      if (res.ok) cupomCode = await res.text();
    } catch {}

    if (cupomCode) {
      const cupomResp = await fetch('/api/Cupom/Aplicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: cupomCode,
          usuarioId: userId,
          lojaId: storeId,
          valorOriginal: subtotal,
          carrinhoId
        })
      });
      const json = await cupomResp.json();
      if (json.sucesso) {
        desconto = json.dados;
        descEl.textContent = '- ' + fmtBRL(desconto);
        cupLine.style.display = '';
      }
    }

    const total = Math.max(0, subtotal - desconto + storedFrete);
    totalEl.textContent = fmtBRL(total);

    Array.from(radios).forEach(radio => {
      radio.addEventListener('change', async () => {
        if (radio.value === 'Dinheiro') {
          changeSec.style.display = 'flex';
          changeInp.disabled = noChangeChk.checked;
        } else {
          changeSec.style.display = 'none';
          noChangeChk.checked = false;
          changeInp.disabled = true;
          changeInp.value = '';
        }

        if (radio.value === 'Pix') {
          showLoader();
          try {
            const resp = await fetch("/api/Pix/GerarQrCode", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                usuarioId: userId,
                valor: total,
                jsonCarrinho: JSON.stringify({
                  cartItems: cart.items,
                  endereco: rawAddress ? JSON.parse(rawAddress) : null,
                  pagamento: "Pix"
                })
              }) 
            });

            const data = await resp.json();
            if (data.sucesso) {
              const qrcodeUrl = data.qrCodeUrl;
              const txid = data.txid;

              Swal.fire({
                title: 'Escaneie o QR Code para pagar com Pix',
                html: `<img src="${qrcodeUrl}" alt="QR Code Pix" style="width: 250px; height: 250px;">`,
                confirmButtonText: 'Aguardando pagamento...',
                showConfirmButton: false,
                allowOutsideClick: false
              });

              const interval = setInterval(async () => {
                const check = await fetch(`/api/Pix/StatusPagamento?txid=${txid}`);
                const res = await check.json();
                if (res.status === 'confirmado') {
                  clearInterval(interval);
                  Swal.close();
                  swal("Pix Aprovado", "Pagamento confirmado!", "success")
                    .then(() => finishBtn.click());
                }
              }, 5000);
            } else {
              swal("Erro", data.mensagem || "Erro ao gerar QR Code", "error");
            }
          } catch {
            swal("Erro", "Erro ao gerar QR Code Pix", "error");
          } finally {
            hideLoader();
          }
        }
      });
    });

    if (form.elements['method'].value !== 'Dinheiro') {
      changeSec.style.display = 'none';
      changeInp.disabled      = true;
    }

    noChangeChk.addEventListener('change', () => {
      changeInp.disabled = noChangeChk.checked;
      if (noChangeChk.checked) changeInp.value = '';
      else changeInp.focus();
    });

    changeInp.addEventListener('input', e => {
      e.target.value = e.target.value
        .replace(/[^\d,]/g, '')
        .replace(/,(\d{2}).+/, ',$1');
    });

    finishBtn.addEventListener('click', () => {
      const method = form.elements['method'].value;
      let changeFor = 0;

      if (method === 'Dinheiro') {
        if (!noChangeChk.checked && !changeInp.value.trim()) {
          swal('Atenção', 'Informe o valor do troco.', 'warning');
          return;
        }
        changeFor = parseFloat(changeInp.value.replace(',', '.')) || 0;
      }

      const order = {
        whatsapp,
        addressId: rawAddress ? JSON.parse(rawAddress).id : null,
        paymentMethod: method,
        changeFor,
        usuarioId: userId,
        lojaId:    storeId,
        couponCode: cupomCode || null,
        programId,
        cartItems: cart.items,
        subtotal,
        frete:     storedFrete,
        desconto,
        total
      };

      console.log('Pedido final:', order);
      swal('Sucesso', 'Pedido finalizado! Veja o console.', 'success');
    });

  } finally {
    hideLoader();
  }
});
