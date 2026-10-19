/*!
 * InfyCrest GuestAI — embeddable guest-assistant widget.
 * Isolated shadow DOM, XSS-safe (text-only rendering), no secrets.
 * Install: <script src="HOST/widget.js" data-property-id="PUBLIC_ID" async></script>
 */
(function () {
  "use strict";

  var script =
    document.currentScript ||
    (function () {
      var s = document.querySelectorAll("script[data-property-id]");
      return s[s.length - 1];
    })();
  if (!script) return;

  var propertyId = script.getAttribute("data-property-id");
  if (!propertyId) {
    console.error("[GuestAI] Missing data-property-id");
    return;
  }
  if (document.getElementById("icg-guestai-root")) return; // already loaded

  var apiBase = new URL(script.src).origin;

  /* ---------- session id ------------------------------------------------ */
  var sidKey = "icg_sid_" + propertyId;
  var sessionId = null;
  try {
    sessionId = window.localStorage.getItem(sidKey);
    if (!sessionId) {
      sessionId =
        window.crypto && window.crypto.randomUUID
          ? window.crypto.randomUUID()
          : "s-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      window.localStorage.setItem(sidKey, sessionId);
    }
  } catch (e) {
    sessionId = "s-" + Math.random().toString(36).slice(2);
  }

  /* ---------- helpers ---------------------------------------------------- */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }
  function sendApi(path, payload, method) {
    var options = {
      method: method || "POST",
      credentials: "omit",
    };
    if (payload) {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(payload);
    }
    return fetch(apiBase + path, {
      ...options,
    }).then(function (res) {
      return res.json().catch(function () {
        return {};
      }).then(function (data) {
        return { status: res.status, data: data };
      });
    });
  }

  /* ---------- load config ------------------------------------------------ */
  sendApi("/api/widget-config?propertyId=" + encodeURIComponent(propertyId), null, "GET")
    .then(function (res) {
      if (res.status !== 200 || !res.data.ok) {
        console.warn("[GuestAI] Widget not available:", res.data.error || res.status);
        return;
      }
      build(res.data);
    })
    .catch(function (err) {
      console.warn("[GuestAI] Failed to load config", err);
    });

  /* ---------- build UI ---------------------------------------------------- */
  function build(cfg) {
    var accent = cfg.chatbot.accentColor || "#E8553A";
    var position = cfg.chatbot.position === "bottom-left" ? "left:16px;" : "right:16px;";
    var published = !!cfg.published && cfg.property.status === "active";

    var host = document.createElement("div");
    host.id = "icg-guestai-root";
    var shadow = host.attachShadow({ mode: "open" });
    document.body.appendChild(host);

    var style = document.createElement("style");
    style.textContent = [
      ":host{all:initial;}",
      "*{box-sizing:border-box;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}",
      ".icg-launcher{position:fixed;bottom:16px;" + position + "width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(27,23,20,.25);transition:transform .15s ease,box-shadow .15s ease;z-index:2147483000;color:#fff;background:" + accent + ";}",
      ".icg-launcher:hover{transform:scale(1.06);}",
      ".icg-launcher:focus-visible{outline:3px solid " + accent + ";outline-offset:3px;}",
      ".icg-panel{position:fixed;bottom:84px;" + position + "width:min(392px,calc(100vw - 24px));height:min(620px,calc(100vh - 110px));background:#fff;border-radius:20px;box-shadow:0 24px 64px -16px rgba(27,23,20,.35),0 2px 8px rgba(27,23,20,.08);display:flex;flex-direction:column;overflow:hidden;z-index:2147483000;opacity:0;transform:translateY(16px) scale(.98);pointer-events:none;transition:opacity .22s ease,transform .22s ease;}",
      ".icg-panel.icg-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}",
      ".icg-header{display:flex;align-items:center;gap:10px;padding:14px 16px;color:#fff;background:" + accent + ";}",
      ".icg-avatar{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:15px;color:#fff;flex-shrink:0;overflow:hidden;}",
      ".icg-avatar img{width:100%;height:100%;object-fit:cover;}",
      ".icg-title{font-size:14px;font-weight:600;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".icg-subtitle{font-size:11px;opacity:.8;line-height:1.3;}",
      ".icg-close{margin-left:auto;background:transparent;border:none;color:rgba(255,255,255,.85);cursor:pointer;padding:6px;border-radius:8px;line-height:0;}",
      ".icg-close:hover{background:rgba(255,255,255,.15);}",
      ".icg-body{flex:1;overflow-y:auto;padding:16px;background:#faf8f5;display:flex;flex-direction:column;gap:10px;}",
      ".icg-msg{max-width:86%;padding:10px 13px;border-radius:16px;font-size:13.5px;line-height:1.5;white-space:pre-wrap;word-break:break-word;}",
      ".icg-msg-bot{background:#fff;color:#2a2521;border:1px solid #ede9e2;border-top-left-radius:6px;align-self:flex-start;}",
      ".icg-msg-user{background:" + accent + ";color:#fff;border-top-right-radius:6px;align-self:flex-end;}",
      ".icg-msg-error{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;font-size:12.5px;}",
      ".icg-retry{margin-top:6px;background:#fff;border:1px solid #fecaca;color:#b91c1c;border-radius:999px;padding:4px 12px;font-size:12px;cursor:pointer;}",
      ".icg-typing{display:flex;gap:4px;padding:12px 14px;}",
      ".icg-typing span{width:6px;height:6px;border-radius:50%;background:#b7ada1;animation:icg-b 1.2s infinite;}",
      ".icg-typing span:nth-child(2){animation-delay:.15s;}",
      ".icg-typing span:nth-child(3){animation-delay:.3s;}",
      "@keyframes icg-b{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-3px);opacity:1}}",
      ".icg-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px;background:#faf8f5;}",
      ".icg-chip{border:1px solid " + accent + ";color:" + accent + ";background:#fff;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:500;cursor:pointer;transition:background .15s;}",
      ".icg-chip:hover{background:" + accent + "1a;}",
      ".icg-form-row{display:flex;gap:8px;padding:12px 14px;border-top:1px solid #ede9e2;background:#fff;}",
      ".icg-input{flex:1;border:1px solid #e5dfd6;border-radius:999px;padding:10px 16px;font-size:13.5px;outline:none;color:#2a2521;background:#faf8f5;}",
      ".icg-input:focus{border-color:" + accent + ";background:#fff;}",
      ".icg-send{width:40px;height:40px;border-radius:50%;border:none;background:" + accent + ";color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}",
      ".icg-send:disabled{opacity:.5;cursor:not-allowed;}",
      ".icg-lead-btn{margin:0 14px 12px;border:1px solid " + accent + ";color:" + accent + ";background:#fff;border-radius:12px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;}",
      ".icg-lead-form{padding:16px;overflow-y:auto;background:#faf8f5;flex:1;display:flex;flex-direction:column;gap:10px;}",
      ".icg-lead-form h3{font-size:15px;font-weight:600;color:#1b1714;margin:0;}",
      ".icg-lead-form p{font-size:12px;color:#6e655a;margin:0;}",
      ".icg-field{width:100%;border:1px solid #e5dfd6;border-radius:10px;padding:9px 12px;font-size:13px;background:#fff;color:#2a2521;outline:none;}",
      ".icg-field:focus{border-color:" + accent + ";}",
      ".icg-field-row{display:flex;gap:8px;}",
      ".icg-consent{display:flex;gap:8px;font-size:12px;color:#544c44;align-items:flex-start;}",
      ".icg-consent input{margin-top:2px;accent-color:" + accent + ";}",
      ".icg-submit{border:none;background:" + accent + ";color:#fff;border-radius:12px;padding:11px;font-size:13.5px;font-weight:600;cursor:pointer;}",
      ".icg-submit:disabled{opacity:.6;cursor:not-allowed;}",
      ".icg-back{background:transparent;border:none;color:#6e655a;font-size:12px;cursor:pointer;text-decoration:underline;padding:4px 0 8px;}",
      ".icg-note{font-size:11px;color:#8f8578;text-align:center;padding:8px 14px;background:#faf8f5;border-top:1px solid #ede9e2;}",
      ".icg-offline{padding:28px 20px;text-align:center;font-size:13.5px;color:#544c44;line-height:1.6;}",
    ].join("\n");
    shadow.appendChild(style);

    /* ----- launcher ----- */
    var launcher = el("button", "icg-launcher");
    launcher.setAttribute("aria-label", "Open chat with " + cfg.chatbot.displayName);
    launcher.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    shadow.appendChild(launcher);

    /* ----- panel ----- */
    var panel = el("div", "icg-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", cfg.chatbot.displayName);

    var header = el("div", "icg-header");
    var avatar = el("div", "icg-avatar");
    if (cfg.chatbot.logoUrl) {
      var img = document.createElement("img");
      img.src = cfg.chatbot.logoUrl;
      img.alt = "";
      img.onerror = function () {
        img.remove();
        avatar.textContent = (cfg.property.name || "G").charAt(0).toUpperCase();
      };
      avatar.appendChild(img);
    } else {
      avatar.textContent = (cfg.property.name || "G").charAt(0).toUpperCase();
    }
    var titleWrap = el("div");
    titleWrap.style.minWidth = "0";
    titleWrap.appendChild(el("div", "icg-title", cfg.chatbot.displayName));
    titleWrap.appendChild(
      el("div", "icg-subtitle", cfg.property.name + (published ? "" : " · currently offline")),
    );
    var closeBtn = el("button", "icg-close");
    closeBtn.setAttribute("aria-label", "Close chat");
    closeBtn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    header.appendChild(avatar);
    header.appendChild(titleWrap);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    var body = el("div", "icg-body");
    panel.appendChild(body);

    if (!published) {
      var offline = el(
        "div",
        "icg-offline",
        "Our assistant is offline at the moment." +
          (cfg.chatbot.contactEmail
            ? " Please reach us at " + cfg.chatbot.contactEmail + " — we'd love to help."
            : " Please check back soon."),
      );
      body.appendChild(offline);
      shadow.appendChild(panel);
      wireToggle();
      return;
    }

    /* ----- messages ----- */
    var chips = el("div", "icg-chips");
    var chipsShown = true;

    function addMsg(kind, text) {
      var bubble = el("div", "icg-msg icg-msg-" + kind, text);
      body.appendChild(bubble);
      body.scrollTop = body.scrollHeight;
      return bubble;
    }
    function showTyping() {
      var t = el("div", "icg-msg icg-msg-bot icg-typing");
      t.appendChild(document.createElement("span"));
      t.appendChild(document.createElement("span"));
      t.appendChild(document.createElement("span"));
      body.appendChild(t);
      body.scrollTop = body.scrollHeight;
      return t;
    }

    addMsg("bot", cfg.chatbot.welcomeMessage);

    if (Array.isArray(cfg.chatbot.suggestedQuestions)) {
      cfg.chatbot.suggestedQuestions.slice(0, 6).forEach(function (q) {
        var chip = el("button", "icg-chip", q);
        chip.type = "button";
        chip.addEventListener("click", function () {
          sendMessage(q, true);
        });
        chips.appendChild(chip);
      });
    }
    if (chips.childNodes.length > 0) panel.appendChild(chips);

    function hideChips() {
      if (chipsShown && chips.parentNode) {
        chips.remove();
        chipsShown = false;
      }
    }

    /* ----- input row ----- */
    var formRow = el("form", "icg-form-row");
    var input = el("input", "icg-input");
    input.type = "text";
    input.placeholder = "Type your question…";
    input.maxLength = 1000;
    input.setAttribute("aria-label", "Message");
    var sendBtn = el("button", "icg-send");
    sendBtn.type = "submit";
    sendBtn.setAttribute("aria-label", "Send message");
    sendBtn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>';
    formRow.appendChild(input);
    formRow.appendChild(sendBtn);
    panel.appendChild(formRow);

    /* ----- lead form ----- */
    var leadBtn = null;
    var isAccommodation = !cfg.property.businessType || cfg.property.businessType === "accommodation";
    function showLeadButton() {
      if (leadBtn || !cfg.chatbot.leadCaptureEnabled) return;
      leadBtn = el("button", "icg-lead-btn", isAccommodation ? "Request booking assistance" : "Contact the team");
      leadBtn.type = "button";
      leadBtn.addEventListener("click", openLeadForm);
      panel.insertBefore(leadBtn, formRow);
    }
    function hideLeadButton() {
      if (leadBtn) {
        leadBtn.remove();
        leadBtn = null;
      }
    }

    function openLeadForm() {
      hideChips();
      body.style.display = "none";
      formRow.style.display = "none";
      hideLeadButton();

      var form = el("form", "icg-lead-form");
      form.appendChild(el("h3", null, isAccommodation ? "Booking inquiry" : "Contact inquiry"));
      form.appendChild(
        el("p", null, isAccommodation
          ? "Share your details and the team will confirm availability personally. This does not create a reservation yet."
          : "Share your details and message. The team will follow up personally.")
      );

      function field(type, placeholder, attrs) {
        var f = el("input", "icg-field");
        f.type = type;
        f.placeholder = placeholder;
        if (attrs) Object.keys(attrs).forEach(function (k) { f.setAttribute(k, attrs[k]); });
        return f;
      }
      var nameF = field("text", "Your name *", { required: "required", maxlength: "80" });
      var emailF = field("email", "Email", { maxlength: "200" });
      var phoneF = field("tel", "Phone", { maxlength: "40" });
      var inF = isAccommodation ? field("date", "Check-in", { "aria-label": "Check-in date" }) : null;
      var outF = isAccommodation ? field("date", "Check-out", { "aria-label": "Check-out date" }) : null;
      var guestsF = isAccommodation ? field("number", "Guests", { min: "1", max: "30" }) : null;
      var datesRow = isAccommodation ? el("div", "icg-field-row") : null;
      if (datesRow) {
        datesRow.appendChild(inF);
        datesRow.appendChild(outF);
      }
      var msgF = el("textarea", "icg-field");
      msgF.placeholder = "Anything else we should know?";
      msgF.rows = 2;
      msgF.maxLength = 1000;

      var consentRow = el("label", "icg-consent");
      var consent = document.createElement("input");
      consent.type = "checkbox";
      var consentText = document.createElement("span");
      consentText.textContent =
        "I agree that " + cfg.property.name + " may contact me about this inquiry. *";
      consentRow.appendChild(consent);
      consentRow.appendChild(consentText);

      var errEl = el("p", null, "");
      errEl.style.color = "#b91c1c";
      errEl.style.minHeight = "14px";

      var submit = el("button", "icg-submit", "Send inquiry");
      submit.type = "submit";

      var back = el("button", "icg-back", "← Back to chat");
      back.type = "button";
      back.addEventListener("click", closeLeadForm);

      form.appendChild(nameF);
      form.appendChild(emailF);
      form.appendChild(phoneF);
      if (datesRow) form.appendChild(datesRow);
      if (guestsF) form.appendChild(guestsF);
      form.appendChild(msgF);
      form.appendChild(consentRow);
      form.appendChild(errEl);
      form.appendChild(submit);
      form.appendChild(back);
      panel.insertBefore(form, formRow);

      var successText = "";
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        errEl.textContent = "";
        if (!consent.checked) {
          errEl.textContent = "Please confirm we may contact you about this inquiry.";
          return;
        }
        if (!emailF.value.trim() && !phoneF.value.trim()) {
          errEl.textContent = "Please provide an email or a phone number.";
          return;
        }
        submit.disabled = true;
        submit.textContent = "Sending…";
        sendApi("/api/leads?propertyId=" + encodeURIComponent(propertyId) + "&v=3", {
          propertyId: propertyId,
          sessionId: sessionId,
          name: nameF.value.trim(),
          email: emailF.value.trim(),
          phone: phoneF.value.trim(),
          checkIn: inF ? inF.value || "" : "",
          checkOut: outF ? outF.value || "" : "",
          guests: guestsF && guestsF.value ? Number(guestsF.value) : undefined,
          message: msgF.value.trim(),
          consentFollowUp: true,
        })
          .then(function (res) {
            if (res.status === 201 && res.data.ok) {
              successText =
                "Thank you, " + nameF.value.trim().split(" ")[0] + "! Your inquiry has been sent — the team will follow up shortly.";
              form.innerHTML = "";
              var ok = el("div", "icg-offline", successText);
              form.appendChild(ok);
              var back2 = el("button", "icg-back", "← Back to chat");
              back2.type = "button";
              back2.addEventListener("click", closeLeadForm);
              form.appendChild(back2);
            } else {
              errEl.textContent = res.data.detail || res.data.error || "Could not send your inquiry. Please try again.";
              submit.disabled = false;
              submit.textContent = "Send inquiry";
            }
          })
          .catch(function () {
            errEl.textContent = "Network error — please try again.";
            submit.disabled = false;
            submit.textContent = "Send inquiry";
          });
      });
    }

    function closeLeadForm() {
      var form = panel.querySelector(".icg-lead-form");
      if (form) form.remove();
      body.style.display = "";
      formRow.style.display = "";
      input.focus();
    }

    /* ----- messaging ----- */
    var waiting = false;

    function showError(lastText) {
      var wrap = el("div", "icg-msg icg-msg-bot icg-msg-error");
      wrap.appendChild(
        document.createTextNode("Something went wrong reaching the assistant."),
      );
      var retry = el("button", "icg-retry", "Retry");
      retry.type = "button";
      retry.addEventListener("click", function () {
        wrap.remove();
        sendMessage(lastText, false);
      });
      wrap.appendChild(retry);
      body.appendChild(wrap);
      body.scrollTop = body.scrollHeight;
    }

    function sendMessage(text, fromChip) {
      text = (text || "").trim();
      if (!text || waiting) return;
      hideChips();
      if (fromChip !== "silent") {
        addMsg("user", text);
      }
      input.value = "";
      waiting = true;
      sendBtn.disabled = true;
      var typing = showTyping();

      sendApi("/api/chat?propertyId=" + encodeURIComponent(propertyId) + "&v=3", {
        propertyId: propertyId,
        sessionId: sessionId,
        message: text,
      })
        .then(function (res) {
          typing.remove();
          waiting = false;
          sendBtn.disabled = false;
          if (res.status === 429) {
            addMsg(
              "bot",
              "You're sending messages very quickly — please wait about " +
                (res.data.retryAfterSec || 30) +
                " seconds and try again.",
            );
            return;
          }
          if (res.status !== 200 || typeof res.data.reply !== "string") {
            showError(text);
            return;
          }
          addMsg("bot", res.data.reply);
          if (res.data.leadForm || res.data.limitReached) {
            showLeadButton();
          }
        })
        .catch(function () {
          typing.remove();
          waiting = false;
          sendBtn.disabled = false;
          showError(text);
        });
    }

    formRow.addEventListener("submit", function (e) {
      e.preventDefault();
      sendMessage(input.value, false);
    });

    var powered = el("div", "icg-note", "AI assistant · answers from this property's approved info");
    panel.appendChild(powered);

    shadow.appendChild(panel);
    wireToggle();

    function wireToggle() {
      var open = false;
      function toggle(force) {
        open = force !== undefined ? force : !open;
        panel.classList.toggle("icg-open", open);
        launcher.setAttribute("aria-expanded", String(open));
        if (open) {
          var i = panel.querySelector(".icg-input");
          if (i) setTimeout(function () { i.focus(); }, 220);
        }
      }
      launcher.addEventListener("click", function () { toggle(); });
      closeBtn.addEventListener("click", function () { toggle(false); });
    }
  }
})();
