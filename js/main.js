(function () {
  'use strict';

  /* ===== Phone input mask: (DD) XXXXX-XXXX ===== */
  function maskPhone(digits) {
    digits = digits.slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return '(' + digits;
    if (digits.length <= 6) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
    if (digits.length <= 10) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 6) + '-' + digits.slice(6);
    return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 7) + '-' + digits.slice(7);
  }

  function applyPhoneMask(el) {
    if (!el) return;
    el.setAttribute('inputmode', 'numeric');
    el.setAttribute('maxlength', '15');
    el.addEventListener('input', function () {
      var digits = el.value.replace(/\D/g, '');
      el.value = maskPhone(digits);
    });
  }

  applyPhoneMask(document.getElementById('telefone'));
  applyPhoneMask(document.getElementById('pixWhatsapp'));

  /* ===== Mobile nav toggle ===== */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ===== Countdown ===== */
  var WEDDING_DATE = new Date('2026-10-23T16:00:00-03:00').getTime();

  var elDays = document.getElementById('cd-days');
  var elHours = document.getElementById('cd-hours');
  var elMin = document.getElementById('cd-min');
  var elSec = document.getElementById('cd-sec');

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function updateCountdown() {
    var now = Date.now();
    var diff = WEDDING_DATE - now;

    if (diff <= 0) {
      elDays.textContent = '00';
      elHours.textContent = '00';
      elMin.textContent = '00';
      elSec.textContent = '00';
      return;
    }

    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    var minutes = Math.floor((diff / (1000 * 60)) % 60);
    var seconds = Math.floor((diff / 1000) % 60);

    elDays.textContent = pad(days);
    elHours.textContent = pad(hours);
    elMin.textContent = pad(minutes);
    elSec.textContent = pad(seconds);
  }

  if (elDays) {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  /* ===== RSVP: presence toggle ===== */
  var toggleGroup = document.querySelector('.toggle-group');
  var presencaInput = document.getElementById('presenca');

  if (toggleGroup && presencaInput) {
    toggleGroup.querySelectorAll('.toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleGroup.querySelectorAll('.toggle').forEach(function (b) {
          b.classList.remove('is-active');
        });
        btn.classList.add('is-active');
        presencaInput.value = btn.dataset.value;
      });
    });
  }

  /* ===== RSVP: form submit ===== */
  var form = document.getElementById('rsvpForm');
  var status = document.getElementById('formStatus');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = Object.fromEntries(new FormData(form).entries());
      var submitBtn = form.querySelector('button[type="submit"]');

      submitBtn.disabled = true;
      status.textContent = 'Enviando...';

      fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          return res.json().then(function (body) {
            if (!res.ok) { throw new Error(body.error || 'Erro ao enviar.'); }
            return body;
          });
        })
        .then(function () {
          status.textContent = 'Confirmação recebida — obrigado! ' + (data.presenca === 'sim' ? 'Até lá! 💚' : 'Vamos sentir sua falta!');
          form.reset();
          toggleGroup.querySelectorAll('.toggle').forEach(function (b) {
            b.classList.remove('is-active');
          });
          toggleGroup.querySelector('.toggle--yes').classList.add('is-active');
          presencaInput.value = 'sim';
        })
        .catch(function (err) {
          status.textContent = err.message || 'Não foi possível enviar. Tente novamente.';
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  /* ===== Presentes: PIX modal ===== */
  var pixModal = document.getElementById('pixModal');
  var pixModalClose = document.getElementById('pixModalClose');
  var pixModalOverlay = document.getElementById('pixModalOverlay');
  var pixStepForm = document.getElementById('pixStepForm');
  var pixStepResult = document.getElementById('pixStepResult');
  var pixForm = document.getElementById('pixForm');
  var pixFormStatus = document.getElementById('pixFormStatus');
  var pixModalTitle = document.getElementById('pixModalTitle');
  var pixModalPrice = document.getElementById('pixModalPrice');
  var pixResultTitle = document.getElementById('pixResultTitle');
  var pixResultPrice = document.getElementById('pixResultPrice');
  var pixQrImage = document.getElementById('pixQrImage');
  var pixCode = document.getElementById('pixCode');
  var pixCopyBtn = document.getElementById('pixCopyBtn');
  var pixCloseResult = document.getElementById('pixCloseResult');

  var currentGift = null;

  function formatBRL(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function openPixModal(giftName, price) {
    currentGift = { giftName: giftName, price: price };

    pixModalTitle.textContent = giftName;
    pixModalPrice.textContent = formatBRL(price);
    pixFormStatus.textContent = '';
    pixForm.reset();

    pixStepForm.hidden = false;
    pixStepResult.hidden = true;

    pixModal.classList.add('is-open');
    pixModal.setAttribute('aria-hidden', 'false');
  }

  function closePixModal() {
    pixModal.classList.remove('is-open');
    pixModal.setAttribute('aria-hidden', 'true');
    currentGift = null;
  }

  if (pixModal) {
    document.querySelectorAll('.gift-card .btn--primary').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var giftName = btn.dataset.gift;
        var price = parseFloat(btn.dataset.price);
        if (giftName && price) {
          openPixModal(giftName, price);
        }
      });
    });

    pixModalClose.addEventListener('click', closePixModal);
    pixModalOverlay.addEventListener('click', closePixModal);
    pixCloseResult.addEventListener('click', closePixModal);

    pixForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!pixForm.checkValidity() || !currentGift) {
        pixForm.reportValidity();
        return;
      }

      var submitBtn = pixForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      pixFormStatus.textContent = 'Gerando QR Code...';

      fetch('/api/gift-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftName: currentGift.giftName,
          price: currentGift.price,
          guestName: document.getElementById('pixNome').value,
          guestEmail: document.getElementById('pixEmail').value,
          guestPhone: document.getElementById('pixWhatsapp').value
        })
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) { throw new Error(data.error || 'Erro ao gerar PIX.'); }
            return data;
          });
        })
        .then(function (data) {
          pixResultTitle.textContent = currentGift.giftName;
          pixResultPrice.textContent = formatBRL(currentGift.price);
          pixQrImage.src = data.qrCodeDataUrl;
          pixCode.value = data.brCode;

          pixStepForm.hidden = true;
          pixStepResult.hidden = false;
        })
        .catch(function (err) {
          pixFormStatus.textContent = err.message || 'Erro ao gerar PIX. Tente novamente.';
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });

    pixCopyBtn.addEventListener('click', function () {
      pixCode.select();
      navigator.clipboard.writeText(pixCode.value).then(function () {
        var original = pixCopyBtn.textContent;
        pixCopyBtn.textContent = 'Copiado!';
        setTimeout(function () { pixCopyBtn.textContent = original; }, 2000);
      });
    });
  }
})();
