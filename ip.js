(async function () {
  "use strict";

  const CONFIG = {
    ALLOWED_IP: "62.99.106.69" "77.209.13.144",
    API: "https://api.ipify.org?format=json",
    WEBHOOK: "https://discord.com/api/webhooks/1459251137386516584/IdR-wExor-ezEQ88YxRJM-v5NS43WtAqJP-Q6bDv0XnOSYD47bzhh2pxSIW_TIBMcRoR"
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

  function renderBlockedScreen(ip = "Desconocida", reason = "") {
    document.documentElement.innerHTML = `
      <head>
        <title>Acceso Restringido</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          *{margin:0;padding:0;box-sizing:border-box;}
          html, body { height:100%; }
          body{
            font-family: 'Inter', sans-serif;
            display:flex;
            justify-content:center;
            align-items:center;
            background: #0b0b0f;
            color: #fff;
            padding: 20px;
          }
          .container{
            display:flex;
            max-width: 750px;
            width: 100%;
            background: #141414;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.6);
          }
          .left, .right{
            padding: 40px;
          }
          .left{
            flex: 1.2;
            border-right: 1px solid #222;
          }
          .right{
            flex: 1;
          }
          h1{
            font-size: 48px;
            color: #e50914;
            margin-bottom: 10px;
          }
          h2{
            font-size: 22px;
            margin-bottom: 20px;
            font-weight: 600;
          }
          p{
            color: #ccc;
            margin-bottom: 20px;
            line-height: 1.5;
            font-size: 15px;
          }
          .info{
            margin-top: 15px;
          }
          .info div{
            margin-bottom: 10px;
            padding: 10px;
            background: #1f1f1f;
            border-radius: 8px;
            font-size: 14px;
          }
          input, textarea{
            width: 100%;
            padding: 12px 14px;
            margin-bottom: 15px;
            border-radius: 8px;
            border: none;
            background: #222;
            color: #fff;
            font-size: 14px;
          }
          textarea{resize:none;height:100px;}
          input::placeholder, textarea::placeholder{color: #777;}
          button{
            width: 100%;
            background: #e50914;
            border: none;
            border-radius: 8px;
            padding: 12px;
            font-size: 16px;
            font-weight: 700;
            color: #fff;
            cursor: pointer;
            transition: 0.2s;
          }
          button:hover{
            background: #ff2c2c;
          }
          #status{
            margin-top: 12px;
            font-size: 14px;
            color: #aaa;
          }
          @media(max-width: 700px){
            .container{flex-direction: column;}
            .left{border-right: none; border-bottom: 1px solid #222;}
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="left">
            <h1>403</h1>
            <h2>Acceso Restringido</h2>
            <p>No estás en la lista de permitidos. Si crees que deberías tener acceso, completa el formulario de la derecha.</p>
            <div class="info">
              <div><strong>Tu IP:</strong> ${escapeHTML(ip)}</div>
              <div><strong>Estado:</strong> ${escapeHTML(reason || "No tienes permiso para acceder a esta página.")}</div>
            </div>
          </div>
          <div class="right">
            <h2>Solicitar acceso</h2>
            <input id="user-name" placeholder="Tu nombre o usuario">
            <textarea id="user-reason" placeholder="Por qué necesitas acceso"></textarea>
            <button id="send-request">Enviar solicitud</button>
            <div id="status"></div>
          </div>
        </div>
      </body>
    `;

    const sendBtn = document.getElementById("send-request");
    const statusEl = document.getElementById("status");

    sendBtn.addEventListener("click", async () => {
      if (state.sending) return;

      const name = document.getElementById("user-name").value.trim() || "Sin nombre";
      const reasonText = document.getElementById("user-reason").value.trim() || "Sin motivo";
      const now = new Date();

      state.sending = true;
      sendBtn.disabled = true;
      statusEl.textContent = "Enviando solicitud...";

      try {
        const payload = {
          username: "Access Request",
          avatar_url: "https://cdn-icons-png.flaticon.com/512/1828/1828490.png",
          embeds: [
            {
              title: "🚨 Nueva solicitud de acceso",
              color: 0xe50914,
              fields: [
                { name: "Usuario", value: name.slice(0, 1024), inline: true },
                { name: "IP", value: ip.slice(0, 1024), inline: true },
                { name: "Motivo", value: reasonText.slice(0, 1024), inline: false }
              ],
              footer: { text: "Sistema de control de acceso" },
              timestamp: now.toISOString()
            }
          ]
        };

        const resp = await fetch(CONFIG.WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        statusEl.style.color = "#86efac";
        statusEl.textContent = "Solicitud enviada con éxito.";
      } catch (error) {
        console.error(error);
        statusEl.style.color = "#fca5a5";
        statusEl.textContent = "No se pudo enviar la solicitud.";
      } finally {
        state.sending = false;
        sendBtn.disabled = false;
      }
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(CONFIG.API, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeout);
    const data = await res.json();
    const userIP = data?.ip || "Desconocida";

    if (!CONFIG.ALLOWED_IP || userIP !== CONFIG.ALLOWED_IP) {
      renderBlockedScreen(userIP);
    }
  } catch (error) {
    console.error(error);
    renderBlockedScreen("Desconocida", "No se pudo verificar la IP.");
  }

})();