(async function () {
  "use strict";

  const CONFIG = {
    ALLOWED_IP: "62.99.106.69",
    IP_API: "https://api.ipify.org?format=json",
    WEBHOOK: "https://discord.com/api/webhooks/1459251137386516584/IdR-wExor-ezEQ88YxRJM-v5NS43WtAqJP-Q6bDv0XnOSYD47bzhh2pxSIW_TIBMcRoR",  // ← Pega aquí tu webhook completo
    TIMEOUT_MS: 8000,
    MAX_NAME_LENGTH: 100,
    MAX_REASON_LENGTH: 1800   // un poco menos de 2000 para evitar límites de Discord
  };

  const state = { sending: false };

  function escapeHTML(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderBlockedScreen(ip = "Desconocida", reason = "Acceso no autorizado") {
    document.documentElement.innerHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Acceso Restringido</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          body {
            font-family: 'Inter', system-ui, sans-serif;
            min-height: 100vh;
            background: linear-gradient(135deg, #0a0a0f, #12121a);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            width: 100%;
            max-width: 860px;
            background: #16161f;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 25px 70px rgba(0,0,0,0.85);
            border: 1px solid #222;
          }
          .main {
            display: flex;
            flex-direction: column;
          }
          .left {
            padding: 50px 45px;
            background: #1a1a24;
            border-bottom: 1px solid #222;
          }
          .right {
            padding: 50px 45px;
          }
          h1 { font-size: clamp(3.8rem, 9vw, 6rem); color: #e50914; line-height: 1; margin-bottom: 10px; }
          h2 { font-size: 1.8rem; margin-bottom: 20px; }
          p { color: #bbb; margin-bottom: 25px; }
          .info {
            background: #21212b;
            padding: 16px 18px;
            border-radius: 12px;
            margin-bottom: 14px;
            border-left: 4px solid #e50914;
          }
          input, textarea {
            width: 100%;
            padding: 16px 18px;
            background: #21212b;
            border: 1px solid #333;
            border-radius: 12px;
            color: #fff;
            font-size: 1.05rem;
            margin-bottom: 18px;
          }
          textarea { min-height: 130px; resize: vertical; }
          input:focus, textarea:focus {
            border-color: #e50914;
            outline: none;
            box-shadow: 0 0 0 3px rgba(229,9,20,0.2);
          }
          button {
            width: 100%;
            background: #e50914;
            color: white;
            border: none;
            padding: 17px;
            font-size: 1.1rem;
            font-weight: 700;
            border-radius: 12px;
            cursor: pointer;
            transition: 0.3s;
          }
          button:hover:not(:disabled) { background: #f11f2c; transform: translateY(-2px); }
          button:disabled { background: #555; cursor: not-allowed; }
          #status { margin-top: 18px; font-size: 1.02rem; text-align: center; min-height: 1.5em; }
          @media (min-width: 769px) {
            .main { flex-direction: row; }
            .left { border-bottom: none; border-right: 1px solid #222; flex: 1.35; }
            .right { flex: 1; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="main">
            <div class="left">
              <h1>403</h1>
              <h2>Acceso Restringido</h2>
              <p>No estás autorizado para ver este contenido.</p>
              <div class="info"><strong>Tu IP:</strong> ${escapeHTML(ip)}</div>
              <div class="info"><strong>Motivo:</strong> ${escapeHTML(reason)}</div>
            </div>
            <div class="right">
              <h2>Solicitar acceso</h2>
              <p style="color:#aaa;">Si crees que deberías tener acceso, completa el formulario.</p>
              <input id="name" type="text" placeholder="Nombre o usuario" maxlength="${CONFIG.MAX_NAME_LENGTH}">
              <textarea id="reason" placeholder="¿Por qué necesitas acceso?"></textarea>
              <button id="sendBtn">Enviar solicitud</button>
              <div id="status"></div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const btn = document.getElementById("sendBtn");
    const statusEl = document.getElementById("status");
    btn.addEventListener("click", () => sendAccessRequest(ip, btn, statusEl));
  }

  async function sendAccessRequest(ip, btn, statusEl) {
    if (state.sending) return;

    const name = (document.getElementById("name").value.trim() || "Anónimo").slice(0, CONFIG.MAX_NAME_LENGTH);
    let reason = (document.getElementById("reason").value.trim() || "Sin motivo especificado").slice(0, CONFIG.MAX_REASON_LENGTH);

    if (reason.length < 8) reason = "Motivo no especificado correctamente.";

    state.sending = true;
    btn.disabled = true;
    statusEl.style.color = "#aaa";
    statusEl.textContent = "Enviando solicitud...";

    try {
      const payload = {
        username: "Solicitud de Acceso",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/1828/1828490.png",
        content: null,   // importante para evitar errores
        embeds: [{
          title: "🚨 Nueva solicitud de acceso",
          color: 0xe50914,
          fields: [
            { name: "Nombre", value: name, inline: true },
            { name: "IP", value: `\`${ip}\``, inline: true },
            { name: "Motivo", value: reason, inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: `Sistema • ${location.hostname}` }
        }]
      };

      const res = await fetch(CONFIG.WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "no-cors",           // ← Clave para evitar CORS
        cache: "no-store"
      });

      // Con mode: 'no-cors' no podemos leer res.ok, así que asumimos éxito si no hay excepción
      statusEl.style.color = "#4ade80";
      statusEl.textContent = "✅ Solicitud enviada correctamente. Gracias!";
      btn.textContent = "Enviado ✓";
      btn.disabled = true;

    } catch (err) {
      console.error("Error al enviar webhook:", err);
      statusEl.style.color = "#f87171";
      statusEl.textContent = "❌ Error al enviar. Revisa tu conexión o inténtalo más tarde.";
    } finally {
      state.sending = false;
    }
  }

  // Verificación de IP
  async function checkAccess() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

      const res = await fetch(CONFIG.IP_API, {
        signal: controller.signal,
        cache: "no-store"
      });

      clearTimeout(timeout);

      if (!res.ok) throw new Error("IP service failed");

      const data = await res.json();
      const userIP = data.ip || data.query || "Desconocida";

      if (userIP !== CONFIG.ALLOWED_IP) {
        renderBlockedScreen(userIP, "IP no permitida");
      }
      // IP correcta → no bloqueamos

    } catch (err) {
      console.warn("Error verificando IP:", err);
      renderBlockedScreen("Desconocida", "No se pudo verificar tu IP");
    }
  }

  checkAccess();

})();