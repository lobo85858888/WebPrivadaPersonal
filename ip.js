(async function () {
  "use strict";

  const CONFIG = {
    ALLOWED_IP: "62.99.106.69",
    IP_API: "https://api.ipify.org?format=json",        // Fiable y simple
    // Alternativas: "https://api.ipapi.is/json" o "https://ipinfo.io/json"
    WEBHOOK: "https://discord.com/api/webhooks/...",
    TIMEOUT_MS: 5000,
    MAX_REASON_LENGTH: 2000,
    MAX_NAME_LENGTH: 100
  };

  const state = { sending: false };

  // Escapado seguro contra XSS
  function escapeHTML(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Renderizar pantalla de acceso denegado (altamente responsive)
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

          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            min-height: 100vh;
            background: linear-gradient(135deg, #0a0a0f 0%, #12121a 100%);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            line-height: 1.6;
          }

          .container {
            width: 100%;
            max-width: 860px;
            background: #16161f;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.8);
            border: 1px solid #222;
          }

          .main-content {
            display: flex;
            flex-direction: row;
          }

          .left-panel {
            flex: 1.35;
            padding: 52px 48px;
            border-right: 1px solid #222;
            background: #1a1a24;
          }

          .right-panel {
            flex: 1;
            padding: 52px 48px;
            background: #16161f;
          }

          h1 {
            font-size: clamp(3.5rem, 8vw, 5.5rem);
            font-weight: 700;
            color: #e50914;
            line-height: 1;
            margin-bottom: 12px;
          }

          h2 {
            font-size: 1.75rem;
            margin-bottom: 20px;
            font-weight: 600;
          }

          p {
            color: #bbb;
            margin-bottom: 28px;
            font-size: 1.05rem;
          }

          .info-box {
            background: #21212b;
            padding: 16px 18px;
            border-radius: 12px;
            margin-bottom: 14px;
            font-size: 0.97rem;
            border-left: 4px solid #e50914;
          }

          .form-group {
            margin-bottom: 18px;
          }

          input, textarea {
            width: 100%;
            padding: 16px 18px;
            background: #21212b;
            border: 1px solid #333;
            border-radius: 12px;
            color: #fff;
            font-size: 1.02rem;
            transition: all 0.2s;
          }

          input:focus, textarea:focus {
            outline: none;
            border-color: #e50914;
            box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.15);
          }

          textarea {
            min-height: 120px;
            resize: vertical;
          }

          button {
            width: 100%;
            background: #e50914;
            color: white;
            border: none;
            padding: 16px;
            font-size: 1.1rem;
            font-weight: 700;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.25s;
            margin-top: 8px;
          }

          button:hover:not(:disabled) {
            background: #f11f2c;
            transform: translateY(-2px);
          }

          button:disabled {
            background: #555;
            cursor: not-allowed;
            transform: none;
          }

          #status {
            margin-top: 16px;
            font-size: 1rem;
            min-height: 1.4em;
            text-align: center;
          }

          @media (max-width: 768px) {
            .main-content {
              flex-direction: column;
            }
            .left-panel {
              border-right: none;
              border-bottom: 1px solid #222;
            }
            .left-panel, .right-panel {
              padding: 40px 28px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="main-content">
            <!-- Panel izquierdo -->
            <div class="left-panel">
              <h1>403</h1>
              <h2>Acceso Restringido</h2>
              <p>No tienes autorización para ver este contenido.</p>
              
              <div class="info-box">
                <strong>Tu IP:</strong> ${escapeHTML(ip)}
              </div>
              <div class="info-box">
                <strong>Motivo:</strong> ${escapeHTML(reason)}
              </div>
            </div>

            <!-- Panel derecho - Formulario -->
            <div class="right-panel">
              <h2>Solicitar acceso</h2>
              <p style="color:#aaa; margin-bottom:24px;">Si crees que deberías tener acceso, envía una solicitud.</p>
              
              <div class="form-group">
                <input id="name" type="text" placeholder="Nombre o usuario" maxlength="${CONFIG.MAX_NAME_LENGTH}" autocomplete="name">
              </div>
              
              <div class="form-group">
                <textarea id="reason" placeholder="¿Por qué necesitas acceso? (máx. ${CONFIG.MAX_REASON_LENGTH} caracteres)" maxlength="${CONFIG.MAX_REASON_LENGTH}"></textarea>
              </div>
              
              <button id="sendBtn">Enviar solicitud</button>
              <div id="status"></div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Event listeners
    const btn = document.getElementById("sendBtn");
    const statusEl = document.getElementById("status");

    btn.addEventListener("click", () => sendAccessRequest(ip, btn, statusEl));
  }

  // Enviar solicitud a Discord
  async function sendAccessRequest(ip, btn, statusEl) {
    if (state.sending) return;

    const nameInput = document.getElementById("name");
    const reasonInput = document.getElementById("reason");

    const name = (nameInput.value.trim() || "Anónimo").slice(0, CONFIG.MAX_NAME_LENGTH);
    let reason = (reasonInput.value.trim() || "Sin motivo especificado").slice(0, CONFIG.MAX_REASON_LENGTH);

    if (reason.length < 10) {
      reason = "Motivo demasiado corto: " + reason;
    }

    state.sending = true;
    btn.disabled = true;
    statusEl.style.color = "#aaa";
    statusEl.textContent = "Enviando solicitud...";

    try {
      const payload = {
        username: "Control de Acceso",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/1828/1828490.png",
        embeds: [{
          title: "🚨 Nueva Solicitud de Acceso",
          color: 0xe50914,
          fields: [
            { name: "Nombre", value: name || "—", inline: true },
            { name: "IP", value: `\`${ip}\``, inline: true },
            { name: "Motivo", value: reason || "—", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: `Sistema de acceso • ${location.hostname}` }
        }]
      };

      const res = await fetch(CONFIG.WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      statusEl.style.color = "#4ade80";
      statusEl.textContent = "✅ Solicitud enviada correctamente. Gracias.";
      btn.textContent = "Solicitud enviada ✓";
      btn.disabled = true;

    } catch (err) {
      console.error("Error enviando webhook:", err);
      statusEl.style.color = "#f87171";
      statusEl.textContent = "❌ Error al enviar. Inténtalo de nuevo más tarde.";
    } finally {
      state.sending = false;
      if (btn.textContent !== "Solicitud enviada ✓") {
        btn.disabled = false;
      }
    }
  }

  // Verificación principal de IP
  async function checkAccess() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

      const response = await fetch(CONFIG.IP_API, {
        signal: controller.signal,
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("Servicio de IP no disponible");

      const data = await response.json();
      const userIP = data.ip || data.query || "Desconocida";

      if (userIP !== CONFIG.ALLOWED_IP) {
        renderBlockedScreen(userIP, "IP no autorizada");
      }
      // Si la IP coincide → no hacemos nada (el contenido normal se carga)

    } catch (error) {
      console.warn("No se pudo verificar la IP:", error);
      // En caso de fallo de verificación → más seguro bloquear
      renderBlockedScreen("Desconocida", "Error en la verificación de IP");
    }
  }

  // Iniciar verificación
  checkAccess();

})();