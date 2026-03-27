(async function () {
  "use strict";

  const CONFIG = {
    ALLOWED_IP: "62.99.106.69",
    IP_API: "https://ip-api.com/json/?fields=status,message,query,country,city,isp,proxy",
    WEBHOOK: "https://discord.com/api/webhooks/1459251137386516584/IdR-wExor-ezEQ88YxRJM-v5NS43WtAqJP-Q6bDv0XnOSYD47bzhh2pxSIW_TIBMcRoR",
    TIMEOUT_MS: 5000,
    REQUEST_COOLDOWN: 15000
  };

  let lastRequestTime = 0;
  let isSending = false;

  const escapeHTML = (str = "") =>
    String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  function renderBlockedScreen(ipData) {
    const { query: ip = "Desconocida", country, city, isp = "—", proxy } = ipData || {};
    const location = city && country ? `${city}, ${country}` : "Desconocida";

    document.body.innerHTML = `
      <div style="font-family: 'Inter', system-ui, sans-serif; background: linear-gradient(135deg, #0a0a0f, #1a0f1f); color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div style="background: #121216; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 80px rgba(0,0,0,0.85); border: 1px solid rgba(229,9,20,0.15); max-width: 860px; width: 100%; display: flex; flex-direction: column; margin: 20px;">
          
          <!-- Parte izquierda -->
          <div style="flex: 1.35; padding: 50px 45px; background: linear-gradient(to bottom, rgba(229,9,20,0.04), transparent); border-bottom: 1px solid rgba(255,255,255,0.06);">
            <h1 style="font-family: 'Space Grotesk', sans-serif; font-size: 6rem; line-height: 1; color: #e50914; margin-bottom: 12px; letter-spacing: -4px;">403</h1>
            <h2 style="font-size: 1.85rem; margin-bottom: 20px; font-weight: 600;">Acceso Denegado</h2>
            <p style="color: #bbb; line-height: 1.65; margin-bottom: 28px;">Tu dirección IP no está permitida.<br>Si crees que es un error, solicita acceso abajo.</p>
            
            <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 18px; margin: 24px 0; font-size: 0.95rem;">
              <div style="margin-bottom: 12px; display: flex; justify-content: space-between;"><strong>IP:</strong> <span>${escapeHTML(ip)}</span></div>
              <div style="margin-bottom: 12px; display: flex; justify-content: space-between;"><strong>Ubicación:</strong> <span>${escapeHTML(location)}</span></div>
              <div style="margin-bottom: 12px; display: flex; justify-content: space-between;"><strong>ISP:</strong> <span>${escapeHTML(isp)}</span></div>
              ${proxy ? `<div style="color:#ff6b6b; font-size:0.85rem;">⚠️ Posible Proxy / VPN detectado</div>` : ''}
            </div>
          </div>
          
          <!-- Parte derecha -->
          <div style="flex: 1; padding: 50px 45px; background: #0f0f14;">
            <h2 style="font-size: 1.8rem; margin-bottom: 24px; font-weight: 600;">Solicitar Acceso</h2>
            <input id="name" placeholder="Tu nombre o usuario" autocomplete="name" 
                   style="width:100%; background:#1a1a21; border:1px solid rgba(255,255,255,0.1); color:#fff; padding:16px 18px; border-radius:14px; margin-bottom:16px; font-size:1rem;">
            <textarea id="reason" placeholder="Explica brevemente por qué necesitas acceso..." 
                      style="width:100%; background:#1a1a21; border:1px solid rgba(255,255,255,0.1); color:#fff; padding:16px 18px; border-radius:14px; min-height:120px; resize:vertical; margin-bottom:16px; font-size:1rem;"></textarea>
            <button id="send" 
                    style="width:100%; background:linear-gradient(90deg, #e50914, #ff2c2c); color:white; border:none; padding:16px; font-size:1.1rem; font-weight:700; border-radius:14px; cursor:pointer;">
              Enviar Solicitud
            </button>
            <div id="status" style="margin-top:16px; text-align:center; font-size:0.95rem; min-height:1.4em;"></div>
          </div>
        </div>
      </div>
    `;

    // Responsive simple con media queries inline
    const style = document.createElement("style");
    style.textContent = `
      @media (max-width: 768px) {
        h1 { font-size: 4.8rem !important; }
        .container > div { padding: 40px 30px !important; }
      }
    `;
    document.head.appendChild(style);

    document.getElementById("send").addEventListener("click", () => sendRequest(ipData));
  }

  async function sendRequest(ipData) {
    const now = Date.now();
    if (isSending || now - lastRequestTime < CONFIG.REQUEST_COOLDOWN) {
      showStatus("Espera un momento antes de enviar otra solicitud.", "#f59e0b");
      return;
    }

    const name = (document.getElementById("name").value.trim() || "Anónimo").slice(0, 600);
    const reason = (document.getElementById("reason").value.trim() || "Sin motivo").slice(0, 2000);

    isSending = true;
    lastRequestTime = now;
    const btn = document.getElementById("send");
    const statusEl = document.getElementById("status");

    btn.disabled = true;
    btn.textContent = "Enviando...";
    showStatus("Enviando solicitud...", "#60a5fa");

    try {
      const payload = {
        username: "Access Request Bot",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/1828/1828490.png",
        embeds: [{
          title: "🚨 Nueva Solicitud de Acceso",
          color: 0xe50914,
          fields: [
            { name: "Nombre", value: name, inline: true },
            { name: "IP", value: ipData.query || "Desconocida", inline: true },
            { name: "Ubicación", value: `${ipData.city || "-"}, ${ipData.country || "-"}`, inline: true },
            { name: "ISP", value: ipData.isp || "—", inline: false },
            { name: "Motivo", value: reason || "—", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: `Sistema de Control • ${location.hostname}` }
        }]
      };

      const res = await fetch(CONFIG.WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error();

      showStatus("✅ Solicitud enviada correctamente. Gracias.", "#4ade80");
      btn.textContent = "Enviado ✓";
    } catch (e) {
      console.error(e);
      showStatus("❌ Error al enviar. Inténtalo más tarde.", "#f87171");
      btn.disabled = false;
      btn.textContent = "Reintentar";
    } finally {
      isSending = false;
    }
  }

  function showStatus(text, color) {
    const statusEl = document.getElementById("status");
    if (statusEl) {
      statusEl.style.color = color;
      statusEl.textContent = text;
    }
  }

  // ====================== VERIFICACIÓN PRINCIPAL ======================
  async function checkAccess() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

      const res = await fetch(CONFIG.IP_API, {
        signal: controller.signal,
        cache: "no-store"
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error("IP service unavailable");

      const data = await res.json();

      if (data.status !== "success" || !data.query || data.query !== CONFIG.ALLOWED_IP) {
        renderBlockedScreen(data);
      }
      // Si la IP es correcta → no hacemos nada (se muestra tu página normal)

    } catch (err) {
      console.warn("Error verificando IP:", err);
      renderBlockedScreen({ query: "Desconocida", country: "", city: "", isp: "" });
    }
  }

  // Iniciar la verificación
  checkAccess();

})();