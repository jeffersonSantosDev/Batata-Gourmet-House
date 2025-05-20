function showLoader() {
  document.getElementById("loadingOverlay")?.classList.remove("hidden");
}
function hideLoader() {
  document.getElementById("loadingOverlay")?.classList.add("hidden");
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
    const subEl       = document.getElementById('subtotal');
    const cupLine     = document.getElementById('cupomLine');
    const descEl      = document.getElementById('desconto');
    const fretLine    = document.getElementById('freteLine');
    const freteEl     = document.getElementById('frete');
    const totalEl     = document.getElementById('total');
    const form        = document.getElementById('paymentForm');
    const radios      = form.elements['method'];
    const changeSec   = document.getElementById('changeSection');
    const changeInp   = document.getElementById('changeAmount');
    const noChangeChk = document.getElementById('noChange');
    const finishBtn   = document.getElementById('finishBtn');

    finishBtn.setAttribute('type','button');
    backBtn.onclick = () => window.location.href = "entrega.html";

    const whatsapp     = localStorage.getItem('bgHouse_whatsapp');
    const usuarioIdEnc = localStorage.getItem('bgHouse_id');
    const rawAddress   = localStorage.getItem('bgHouse_selectedAddress');
    const rawFrete     = localStorage.getItem('bgHouse_frete');
    const nome         = localStorage.getItem('bgHouse_name');

    let lojaId     = parseInt(localStorage.getItem("bgHouse_lojaId"));
    let programaId = parseInt(localStorage.getItem("bgHouse_fidelidadeId"));
    const userId   = usuarioIdEnc ? parseInt(atob(usuarioIdEnc)) : null;

    if (!whatsapp || !userId) {
      return swal("Ops!", "Identifique-se para continuar.", "warning")
        .then(() => window.location.href = "identify.html?return=payment.html");
    }

    if (!lojaId || !programaId) {
      try {
        const resp = await fetch('/api/Loja/GetInfoLoja', {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        const data = await resp.json();
        lojaId     = data.lojaId;
        programaId = data.programaFidelidadeId;
        localStorage.setItem("bgHouse_lojaId", lojaId);
        localStorage.setItem("bgHouse_fidelidadeId", programaId);
      } catch {
        return swal("Erro", "Não foi possível obter dados da loja.", "error")
          .then(() => window.location.href = "index.html");
      }
    }

    // Preenche endereço
    if (rawAddress) {
      try {
        const addr = JSON.parse(rawAddress);
        delivName.textContent  = nome || 'Você';
        delivPhone.textContent = whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '+$1 $2-$3');
        delivAddr.textContent  = `${addr.rua}, ${addr.numero}` +
                                 (addr.referencia ? ` (${addr.referencia})` : '');
        deliverySec.style.display = '';
      } catch {
        localStorage.removeItem('bgHouse_selectedAddress');
      }
    }

    let cart = { items: [] }, carrinhoId = null, subtotal = 0;
    try {
      const data = await fetchCart(whatsapp);
      cart = data;
      carrinhoId = data.cartId;

      if (!cart.items.length) {
        return swal("Carrinho vazio", "Você será redirecionado.", "info")
          .then(() => window.location.href = "index.html");
      }

      subtotal = data.items.reduce((sum, item) => {
        const base   = item.precoUnitario * item.quantidade;
        const addons = (item.adicionais || []).reduce((s, ad) => s + ad.preco * ad.quantidade, 0);
        return sum + base + addons;
      }, 0);
    } catch {
      return swal("Erro", "Não foi possível carregar o carrinho.", "error")
        .then(() => window.location.href = "index.html");
    }
    subEl.textContent = fmtBRL(subtotal);

    let desconto = 0;
    let cupomCode = null;
    try {
      cupomCode = await buscarCupomDoCarrinho(carrinhoId);
      if (cupomCode) {
        const json = await calcularCupomAplicado(cupomCode, userId, lojaId, subtotal, carrinhoId);
        if (json.sucesso) {
          desconto = json.dados;
          descEl.textContent = '- ' + fmtBRL(desconto);
          cupLine.style.display = '';
        }
      }
    } catch {
      console.warn("Não foi possível reaplicar o cupom.");
    }

    let storedFrete = 0;

    if (cart.endereco && cart.frete !== undefined) {
      storedFrete = parseFloat(cart.frete);
      freteEl.textContent = storedFrete > 0 ? fmtBRL(storedFrete) : "–";
      fretLine.style.display = '';
      localStorage.setItem("bgHouse_frete", storedFrete.toFixed(2));
      localStorage.setItem("bgHouse_selectedAddress", JSON.stringify(cart.endereco));
    } else if (!isNaN(parseFloat(rawFrete))) {
      storedFrete = parseFloat(rawFrete);
      freteEl.textContent = storedFrete > 0 ? fmtBRL(storedFrete) : "–";
      fretLine.style.display = '';
    } else {
      freteEl.textContent = "–";
      fretLine.style.display = "none";
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
                carrinhoId: carrinhoId,
                valor: total,
                jsonCarrinho: JSON.stringify({
                  cartItems: cart.items,
                  endereco: rawAddress ? JSON.parse(rawAddress) : null,
                  pagamento: "Pix"
                })
              })
            });
        
            const text = await resp.text();
            let data;
            try {
              data = JSON.parse(text);
            } catch {
              console.error("Resposta inválida da API:", text);
              swal("Erro", "Resposta inválida do servidor ao gerar QR Code.", "error");
              return;
            }
        
            if (data.sucesso && data.qrCodeUrl && data.txid && data.copiaCola) {
              swal({
                title: 'Escaneie o QR Code para pagar com Pix',
                content: {
                  element: "div",
                  attributes: {
                    innerHTML: `
                      <img src="${data.qrCodeUrl}" style="width:250px;height:250px;display:block;margin:0 auto;" />
                      <button id="copyPix" style="margin-top: 15px; padding: 8px 12px; background-color: #2c7be5; color: white; border: none; border-radius: 4px; cursor: pointer;">Copiar código Pix</button>
                    `
                  }
                },
                buttons: {
                  cancel: "Fechar"
                },
                closeOnClickOutside: false
              });
        
              document.getElementById('copyPix')?.addEventListener('click', async () => {
                try {
                  await navigator.clipboard.writeText(data.copiaCola);
                  swal("Copiado!", "Código Pix copiado para sua área de transferência.", "success");
                } catch {
                  swal("Erro", "Não foi possível copiar o código Pix.", "error");
                }
              });
        
              const interval = setInterval(async () => {
                const check = await fetch(`/api/Pix/StatusPagamento?txid=${data.txid}`);
                const res = await check.json();
                if (res.status === 'confirmado') {
                  clearInterval(interval);
                  swal.close();
                  swal("Pix Aprovado", "Pagamento confirmado!", "success")
                    .then(() => finishBtn.click());
                }
              }, 5000);
        
            } else {
              swal("Erro", data.mensagem || "Erro ao gerar QR Code Pix.", "error");
            }
        
          } catch (err) {
            console.error(err);
            swal("Erro", "Erro ao gerar QR Code Pix.", "error");
          } finally {
            hideLoader();
          }
        }
        

      });
    });

    if (form.elements['method'].value !== 'Dinheiro') {
      changeSec.style.display = 'none';
      changeInp.disabled = true;
    }

    noChangeChk.addEventListener('change', () => {
      changeInp.disabled = noChangeChk.checked;
      if (noChangeChk.checked) changeInp.value = '';
      else changeInp.focus();
    });

    changeInp.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/[^\d,]/g, '').replace(/,(\d{2}).+/, ',$1');
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
        lojaId,
        couponCode: cupomCode || null,
        programId,
        cartItems: cart.items,
        subtotal,
        frete: storedFrete,
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
