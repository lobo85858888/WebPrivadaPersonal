(async function () {
  "use strict";

  const CONFIG = {
    ALLOWED_IP: "62.99.106.69",
    IP_API: "https://ip-api.com/json/?fields=status,message,query,country,countryCode,regionName,city,isp,org,proxy",
    WEBHOOK: "https://discord.com/api/webhooks/1459251137386516584/IdR-wExor-ezEQ88YxRJM-v5NS43WtAqJP-Q6bDv0XnOSYD47bzhh2pxSIW_TIBMcRoR",
    TIMEOUT_MS: 5000,
    REQUEST_COOLDOWN: 15000   // 15 segundos entre solicitudes (anti-spam)
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
    const { query: ip, country, city, isp, proxy } = ipData || {};
    const location = country && city ? `${city}, ${country}` : "Desconocida";

    document.documentElement.innerHTML = `
      <head>
        <meta charset="UTF-8">
        <title>Acceso Restringido • 403</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
          
          :root {
            --red: #e50914;
            --dark: #0a0a0f;
            --card: #121216;
          }
          
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            font-family: 'Inter', system-ui, sans-serif;
            background: linear-gradient(135deg, #0a0a0f 0%, #1a0f1f 100%);
            color: #fff;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
          }
          body::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at center, rgba(229,9,20,0.08) 0%, transparent 70%);
            pointer-events: none;
          }
          
          .container {
            background: var(--card);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 25px 80px rgba(0,0,0,0.8);
            border: 1px solid rgba(229,9,20,0.15);
            max-width: 860px;
            width: 100%;
            display: flex;
            margin: 20px;
          }
          
          .left {
            flex: 1.35;
            padding: 60px 55px;
            border-right: 1px solid rgba(255,255,255,0.06);
            background: linear-gradient(to bottom, rgba(229,9,20,0.03), transparent);
          }
          
          .right {
            flex: 1;
            padding: 60px 50px;
            background: #0f0f14;
          }
          
          h1 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 6.5rem;
            font-weight: 700;
            line-height: 1;
            color: var(--red);
            margin-bottom: 12px;
            letter-spacing: -4px;
          }
          
          h2 {
            font-size: 1.85rem;
            margin-bottom: 20px;
            font-weight: 600;
          }
          
          p {
            color: #bbb;
            line-height: 1.65;
            margin-bottom: 28px;
          }
          
          .info {
            background: rgba(255,255,255,0.03);
            border-radius: 16px;
            padding: 18px;
            margin: 24px 0;
            font-size: 0.95rem;
          }
          
          .info div {
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
          }
          
          .info strong { color: #ddd; }
          
          input, textarea {
            width: 100%;
            background: #1a1a21;
            border: 1px solid rgba(255,255,255,0.08);
            color: #fff;
            padding: 16px 18px;
            border-radius: 14px;
            margin-bottom: 16px;
            font-size: 1rem;
            transition: all 0.2s;
          }
          
          input:focus, textarea:focus {
            outline: none;
            border-color: var(--red);
            box-shadow: 0 0 0 3px rgba(229,9,20,0.15);
          }
          
          textarea { resize: vertical; min-height: 120px; }
          
          button {
            width: 100%;
            background: linear-gradient(90deg, #e50914, #ff2c2c);
            color: white;
            border: none;
            padding: 16px;
            font-size: 1.1rem;
            font-weight: 700;
            border-radius: 14px;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 8px;
          }
          
          button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(229,9,20,0.4);
          }
          
          button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          #status {
            margin-top: 16px;
            text-align: center;
            font-size: 0.95rem;
            min-height: 1.4em;
          }
          
          .tag {
            display: inline-block;
            background: rgba(229,9,20,0.2);
            color: #ff6b6b;
            font-size: 0.8rem;
            padding: 2px 10px;
            border-radius: 9999px;
            margin-top: 10px;
          }
          
          @media (max-width: 768px) {
            .container { flex-direction: column; }
            .left { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
            h1 { font-size: 5rem; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="left">
            <h1>403</h1>
            <h2>Acceso Denegado</h2>
            <p>Tu dirección IP no está en la lista blanca. Si crees que esto es un error, solicita acceso abajo.</p>
            
            <div class="info">
              <div><strong>IP:</strong> <span>${escapeHTML(ip || "Desconocida")}</span></div>
              <div><strong>Ubicación:</strong> <span>${escapeHTML(location)}</span></div>
              <div><strong>ISP:</strong> <span>${escapeHTML(isp || "—")}</span></div>
              ${proxy ? `<div class="tag">Posible Proxy / VPN detectado</div>` : ''}
            </div>
          </div>
          
          <div class="right">
            <h2>Solicitar Acceso</h2>
            <input id="name" placeholder="Tu nombre o usuario" autocomplete="name">
            <textarea id="reason" placeholder="Explica brevemente por qué necesitas acceso..."></textarea>
            <button id="send">Enviar Solicitud</button>
            <div id="status"></div>
          </div>
        </div>
      </body>
    `;

    document.getElementById("send").addEventListener("click", () =>
      sendRequest(ipData)
    );
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

      if (!res.ok) throw new Error("Failed to send");

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

  // ====================== MAIN ======================
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

      if (data.status !== "success" || !data.query) {
        throw new Error("Invalid IP response");
      }

      if (data.query !== CONFIG.ALLOWED_IP) {
        renderBlockedScreen(data);
      }
      // Si la IP coincide → no hacemos nada (se muestra el contenido normal)

    } catch (err) {
      console.warn("Error verificando IP:", err);
      // En caso de error crítico, mostramos bloqueo con mensaje claro
      renderBlockedScreen({ query: "Desconocida", country: "", city: "", isp: "" });
    }
  }

  checkAccess();
})();