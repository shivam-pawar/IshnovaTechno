/* ==========================================================================
   Ishnova Techno Private Limited — site behaviour
   Vanilla JS, no dependencies. Every module exits quietly if its markup
   is absent, so one file can serve every page.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Mobile navigation ------------------------------------------------ */

  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-nav]");
    var scrim = document.querySelector("[data-nav-scrim]");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      if (scrim) scrim.classList.toggle("is-open", open);
      if (open) {
        var first = nav.querySelector("a, button");
        if (first) first.focus();
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    if (scrim) scrim.addEventListener("click", function () { setOpen(false); });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset state if the viewport grows past the drawer breakpoint.
    window.matchMedia("(min-width: 881px)").addEventListener("change", function (event) {
      if (event.matches) setOpen(false);
    });
  }

  /* --- Header elevation on scroll --------------------------------------- */

  function initHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;

    var ticking = false;

    function update() {
      header.classList.toggle("is-stuck", window.scrollY > 12);
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  /* --- Scroll reveal ----------------------------------------------------- */

  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = Number(entry.target.dataset.revealDelay || 0);
        window.setTimeout(function () {
          entry.target.classList.add("is-visible");
        }, delay);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

    items.forEach(function (el, index) {
      // Stagger siblings inside the same grid for a gentle cascade.
      if (!el.dataset.revealDelay) {
        var siblings = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : index;
        el.dataset.revealDelay = String(Math.min(siblings, 5) * 70);
      }
      observer.observe(el);
    });
  }

  /* --- Stat count-up ----------------------------------------------------- */

  function initCounters() {
    var counters = document.querySelectorAll("[data-count-to]");
    if (!counters.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      counters.forEach(function (el) { el.textContent = el.dataset.countTo; });
      return;
    }

    function run(el) {
      var target = Number(el.dataset.countTo);
      var duration = 1100;
      var start = null;

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = String(Math.round(target * eased));
        if (progress < 1) window.requestAnimationFrame(step);
      }

      window.requestAnimationFrame(step);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) {
      el.textContent = "0";
      observer.observe(el);
    });
  }

  /* --- Contact form ------------------------------------------------------
     No backend exists for this static build, so the form validates inline
     and swaps in a confirmation panel. Wire `action`/`method` to a real
     endpoint (or a form service) to start delivering submissions.
     --------------------------------------------------------------------- */

  function initForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;

    var success = document.querySelector("[data-form-success]");
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function fieldOf(input) { return input.closest(".field"); }

    function messageFor(input) {
      if (!input.value.trim()) return "This field is required.";
      if (input.type === "email" && !emailPattern.test(input.value.trim())) {
        return "Enter a valid email address.";
      }
      return "";
    }

    function validate(input) {
      var field = fieldOf(input);
      if (!field) return true;
      var error = field.querySelector(".field-error");
      var message = messageFor(input);

      field.setAttribute("data-invalid", message ? "true" : "false");
      input.setAttribute("aria-invalid", message ? "true" : "false");
      if (error) error.textContent = message;
      return !message;
    }

    var required = Array.prototype.slice.call(form.querySelectorAll("[required]"));

    required.forEach(function (input) {
      input.addEventListener("blur", function () { validate(input); });
      input.addEventListener("input", function () {
        if (fieldOf(input) && fieldOf(input).getAttribute("data-invalid") === "true") validate(input);
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var firstInvalid = null;
      required.forEach(function (input) {
        if (!validate(input) && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      if (success) {
        form.hidden = true;
        success.hidden = false;
        success.setAttribute("tabindex", "-1");
        success.focus();
      }
    });
  }

  /* --- Footer year ------------------------------------------------------- */

  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* --- Boot -------------------------------------------------------------- */

  function boot() {
    initNav();
    initHeader();
    initReveal();
    initCounters();
    initForm();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
