(function () {
  'use strict';

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

  /* ===== RSVP: form submit =====
     No backend is wired up yet. This just validates and gives feedback.
     Swap the block inside submit for a real fetch('/api/rsvp', ...) call
     once you have somewhere to send the confirmations. */
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
      console.log('RSVP recebido:', data);

      status.textContent = 'Confirmação recebida — obrigado! ' + (data.presenca === 'sim' ? 'Até lá! 💚' : 'Vamos sentir sua falta!');
      form.reset();
      toggleGroup.querySelectorAll('.toggle').forEach(function (b) {
        b.classList.remove('is-active');
      });
      toggleGroup.querySelector('.toggle--yes').classList.add('is-active');
      presencaInput.value = 'sim';
    });
  }
})();
