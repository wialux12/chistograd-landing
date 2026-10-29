/* =========================================================
   ЧистоГрад — интерактивность лендинга
   ========================================================= */

(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const body = document.body;
  const header = $("#site-header");
  const mobileMenu = $("#mobile-menu");
  const burger = $(".burger");
  const menuClose = $(".mobile-menu__close");
  const menuBackdrop = $(".menu-backdrop");
  const modal = $("#order-modal");
  const modalDialog = $(".modal__dialog", modal);
  const modalForm = $("#modal-form");
  const modalSuccess = $("#modal-success");
  const modalSubtitle = $("#modal-subtitle");
  const modalService = $("#modal-service");
  let lastFocusedElement = null;

  /* =======================================================
     Header and navigation
     ======================================================= */

  let scrollTicking = false;

  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    scrollTicking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(updateHeader);
        scrollTicking = true;
      }
    },
    { passive: true }
  );

  updateHeader();

  const navLinks = $$(".nav [data-nav]");
  const navSections = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      const section = id ? $(id) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && navSections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visible.length) return;

        const activeId = visible[0].target.id;
        navLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${activeId}`;
          link.classList.toggle("is-active", isActive);
          if (isActive) {
            link.setAttribute("aria-current", "true");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      },
      { rootMargin: "-28% 0px -58% 0px", threshold: [0, 0.15, 0.4] }
    );

    navSections.forEach(({ section }) => navObserver.observe(section));
  }

  /* =======================================================
     Focus helpers
     ======================================================= */

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  const getFocusable = (container) =>
    $$(focusableSelector, container).filter(
      (el) => !el.hasAttribute("hidden") && el.getClientRects().length > 0
    );

  const trapFocus = (container, event) => {
    const focusable = getFocusable(container);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  /* =======================================================
     Mobile menu
     ======================================================= */

  const isMenuOpen = () => mobileMenu.classList.contains("is-open");

  const openMenu = () => {
    lastFocusedElement = document.activeElement;
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    menuBackdrop.classList.add("is-visible");
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Закрыть меню");
    body.classList.add("menu-open");
    window.setTimeout(() => menuClose.focus(), 120);
  };

  const closeMenu = (restoreFocus = true) => {
    if (!isMenuOpen()) return;
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuBackdrop.classList.remove("is-visible");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Открыть меню");
    body.classList.remove("menu-open");

    if (restoreFocus && lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  };

  burger.addEventListener("click", () => {
    if (isMenuOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menuClose.addEventListener("click", () => closeMenu());
  menuBackdrop.addEventListener("click", () => closeMenu());

  $$(".mobile-menu__nav a, .mobile-menu__footer .btn, .mobile-menu .brand").forEach((link) => {
    link.addEventListener("click", () => closeMenu(false));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1020 && isMenuOpen()) {
      closeMenu(false);
    }
  });

  /* =======================================================
     Modal
     ======================================================= */

  const isModalOpen = () => modal.classList.contains("is-open");

  const clearFieldErrors = (form) => {
    $$(".field__error", form).forEach((error) => {
      error.textContent = "";
    });
    $$(".is-invalid", form).forEach((field) => field.classList.remove("is-invalid"));
  };

  const resetModalState = () => {
    modalForm.hidden = false;
    modalSuccess.hidden = true;
    modalForm.reset();
    clearFieldErrors(modalForm);
    const submit = $("button[type='submit']", modalForm);
    if (submit) {
      submit.disabled = false;
      submit.innerHTML = 'Жду звонка <svg class="icon" aria-hidden="true"><use href="#i-arrow"></use></svg>';
    }
  };

  const openModal = (service = "Поддерживающая уборка", subtitle = "") => {
    const openedFromMenu = isMenuOpen();
    if (openedFromMenu) closeMenu(false);

    lastFocusedElement = openedFromMenu ? burger : document.activeElement;
    resetModalState();
    modalService.value = service;
    modalSubtitle.textContent =
      subtitle ||
      `${service}. Оставьте телефон — перезвоним в течение 10 минут и подтвердим свободное время.`;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("modal-open");

    window.setTimeout(() => {
      const nameField = $("#modal-name");
      if (nameField) nameField.focus();
    }, 180);
  };

  const closeModal = (restoreFocus = true) => {
    if (!isModalOpen()) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    body.classList.remove("modal-open");

    if (restoreFocus && lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  };

  $$("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      openModal(button.dataset.service || "Поддерживающая уборка");
    });
  });

  $$("[data-order]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(
        link.dataset.service || "Уборка",
        `${link.dataset.service || "Уборка"}. Оставьте телефон — рассчитаем стоимость и подскажем ближайшее свободное время.`
      );
    });
  });

  $$("[data-close-modal]").forEach((element) => {
    element.addEventListener("click", () => closeModal());
  });

  $("#modal-reset").addEventListener("click", () => {
    resetModalState();
    const nameField = $("#modal-name");
    if (nameField) nameField.focus();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (isModalOpen()) {
        closeModal();
        return;
      }
      if (isMenuOpen()) {
        closeMenu();
      }
    }

    if (event.key === "Tab") {
      if (isModalOpen()) {
        trapFocus(modalDialog, event);
      } else if (isMenuOpen()) {
        trapFocus(mobileMenu, event);
      }
    }
  });

  /* =======================================================
     Reveal on scroll
     ======================================================= */

  const revealGroups = $$(".services__grid, .benefits, .reviews__grid, .process__steps, .faq__list");
  revealGroups.forEach((group) => {
    Array.from(group.children).forEach((child, index) => {
      if (child.classList.contains("reveal")) {
        child.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 65}ms`);
      }
    });
  });

  const reveals = $$(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7% 0px" }
    );

    reveals.forEach((element) => revealObserver.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add("is-visible"));
  }

  /* =======================================================
     Phone mask and form validation
     ======================================================= */

  const formatPhone = (raw) => {
    let digits = String(raw).replace(/\D/g, "");
    if (!digits) return "";

    if (digits[0] === "8") digits = `7${digits.slice(1)}`;
    if (digits[0] === "9") digits = `7${digits}`;
    if (digits[0] !== "7") digits = `7${digits}`;
    digits = digits.slice(0, 11);

    let result = "+7";
    if (digits.length > 1) result += ` (${digits.slice(1, 4)}`;
    if (digits.length >= 4) result += ") ";
    if (digits.length > 4) result += digits.slice(4, 7);
    if (digits.length > 7) result += `-${digits.slice(7, 9)}`;
    if (digits.length > 9) result += `-${digits.slice(9, 11)}`;
    return result;
  };

  $$("input[type='tel']").forEach((input) => {
    input.addEventListener("focus", () => {
      if (!input.value.trim()) input.value = "+7 (";
    });

    input.addEventListener("blur", () => {
      if (input.value.trim() === "+7 (") input.value = "";
    });

    input.addEventListener("input", () => {
      input.value = formatPhone(input.value);
      clearFieldError(input);
    });
  });

  const setFieldError = (input, message) => {
    const field = input.closest(".field");
    input.classList.toggle("is-invalid", Boolean(message));
    if (message) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }
    if (field) {
      const error = $(".field__error", field);
      if (error) error.textContent = message;
    } else if (input.name === "consent") {
      const form = input.closest("form");
      const error = form ? $(".checkbox__error", form) : null;
      if (error) error.textContent = message;
    }
  };

  function clearFieldError(input) {
    const field = input.closest(".field");
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    if (field) {
      const error = $(".field__error", field);
      if (error) error.textContent = "";
    } else if (input.name === "consent") {
      const form = input.closest("form");
      const error = form ? $(".checkbox__error", form) : null;
      if (error) error.textContent = "";
    }
  }

  const validateForm = (form) => {
    let firstInvalid = null;

    const fields = $$("[required]", form);

    fields.forEach((input) => {
      let message = "";

      if (input.type === "checkbox") {
        if (!input.checked) message = "Подтвердите согласие на обработку данных";
      } else if (input.type === "tel") {
        const digits = input.value.replace(/\D/g, "");
        if (!digits || digits.length < 11) message = "Укажите корректный номер телефона";
      } else if (input.tagName === "SELECT") {
        if (!input.value) message = "Выберите услугу";
      } else {
        if (input.value.trim().length < 2) message = "Пожалуйста, укажите имя";
      }

      setFieldError(input, message);

      if (message && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: false });
      firstInvalid.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    return !firstInvalid;
  };

  $$("form").forEach((form) => {
    $$("[required]", form).forEach((input) => {
      const eventName = input.type === "checkbox" || input.tagName === "SELECT" ? "change" : "input";
      input.addEventListener(eventName, () => clearFieldError(input));
    });
  });

  const saveLead = (data) => {
    try {
      const key = "chistograd_leads";
      const previous = JSON.parse(window.localStorage.getItem(key) || "[]");
      const leads = Array.isArray(previous) ? previous : [];
      leads.push(data);
      window.localStorage.setItem(key, JSON.stringify(leads.slice(-50)));
    } catch (error) {
      // Демо-режим: если localStorage недоступен, заявка просто не сохранится.
    }
  };

  const setLoading = (button, loading) => {
    if (!button) return;
    if (loading) {
      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.textContent = "Отправляем…";
    } else {
      button.disabled = false;
      if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
      }
    }
  };

  const handleMainForm = (form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!validateForm(form)) return;

      const submit = $("button[type='submit']", form);
      const success = $("#lead-success");
      const name = $("#lead-name").value.trim();
      const phone = $("#lead-phone").value;
      const service = $("#lead-service").value;
      const comment = $("#lead-comment").value.trim();

      setLoading(submit, true);

      window.setTimeout(() => {
        saveLead({
          name,
          phone,
          service,
          comment,
          source: "Основная форма",
          createdAt: new Date().toISOString(),
        });

        form.hidden = true;
        success.hidden = false;
        form.reset();
        clearFieldErrors(form);
        setLoading(submit, false);

        success.setAttribute("tabindex", "-1");
        success.focus({ preventScroll: true });
        success.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 650);
    });

    $("#lead-reset").addEventListener("click", () => {
      const success = $("#lead-success");
      success.hidden = true;
      form.hidden = false;
      clearFieldErrors(form);
      const nameField = $("#lead-name");
      if (nameField) {
        nameField.focus();
        nameField.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    });
  };

  const handleModalForm = (form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!validateForm(form)) return;

      const submit = $("button[type='submit']", form);
      const name = $("#modal-name").value.trim();
      const phone = $("#modal-phone").value;
      const service = modalService.value;

      setLoading(submit, true);

      window.setTimeout(() => {
        saveLead({
          name,
          phone,
          service,
          source: "Быстрая заявка",
          createdAt: new Date().toISOString(),
        });

        form.hidden = true;
        modalSuccess.hidden = false;
        form.reset();
        clearFieldErrors(form);
        setLoading(submit, false);

        modalSuccess.setAttribute("tabindex", "-1");
        modalSuccess.focus({ preventScroll: true });
      }, 650);
    });
  };

  handleMainForm($("#lead-form"));
  handleModalForm(modalForm);

  /* =======================================================
     Calculator
     ======================================================= */

  const calculator = $(".calculator");

  if (calculator) {
    const rates = {
      maintenance: 65,
      general: 99,
      renovation: 149,
    };

    const minimums = {
      maintenance: 2490,
      general: 3990,
      renovation: 5490,
    };

    const typeNames = {
      maintenance: "Поддерживающая уборка",
      general: "Генеральная уборка",
      renovation: "Уборка после ремонта",
    };

    const propertyNames = {
      flat: "Квартира",
      house: "Дом",
      office: "Офис",
    };

    const propertyCoef = {
      flat: 1,
      house: 1.15,
      office: 0.9,
    };

    const durationCoef = {
      flat: 1,
      house: 1.18,
      office: 0.8,
    };

    const durationDivisors = {
      maintenance: 26,
      general: 17,
      renovation: 12,
    };

    const areaRange = $("#area-range");
    const areaOutput = $("#area-output");
    const totalOutput = $("#calc-total");
    const baseOutput = $("#calc-base");
    const extrasOutput = $("#calc-extras");
    const discountOutput = $("#calc-discount");
    const saveOutput = $("#calc-save");
    const propertyOutput = $("#calc-property");
    const durationOutput = $("#calc-duration");
    const announcement = $("#calc-announce");
    const bookButton = $("#calc-book");

    const formatNumber = (value) => Math.round(value).toLocaleString("ru-RU");
    const formatRub = (value) => `${formatNumber(value)} ₽`;
    const roundToTen = (value) => Math.round(value / 10) * 10;

    const pluralHours = (value) => {
      const abs = Math.abs(value) % 100;
      const last = abs % 10;
      if (abs > 10 && abs < 20) return "часов";
      if (last === 1) return "час";
      if (last >= 2 && last <= 4) return "часа";
      return "часов";
    };

    const formatDuration = (hours) => {
      if (Number.isInteger(hours)) return `${hours} ${pluralHours(hours)}`;
      return `${hours.toFixed(1).replace(".", ",")} часа`;
    };

    const getState = () => {
      const property = $("input[name='property']:checked", calculator)?.value || "flat";
      const type = $("input[name='clean-type']:checked", calculator)?.value || "maintenance";
      const area = Number(areaRange.value);
      const extras = $$(".calc-extra input:checked", calculator).map((input) => ({
        price: Number(input.dataset.price),
        label: input.dataset.label,
      }));

      return { property, type, area, extras };
    };

    const render = () => {
      const { property, type, area, extras } = getState();
      const extrasTotal = extras.reduce((sum, item) => sum + item.price, 0);

      const base = Math.max(
        minimums[type],
        roundToTen(area * rates[type] * propertyCoef[property])
      );
      const subtotal = base + extrasTotal;
      const discount = roundToTen(subtotal * 0.1);
      const total = subtotal - discount;

      const rawHours =
        Math.max(2, (area / durationDivisors[type]) * durationCoef[property] + extras.length * 0.35);
      const hours = Math.round(rawHours * 2) / 2;

      areaOutput.textContent = `${area} м²`;
      totalOutput.textContent = formatNumber(total);
      baseOutput.textContent = formatRub(base);
      extrasOutput.textContent = formatRub(extrasTotal);
      discountOutput.textContent = `−${formatRub(discount)}`;
      saveOutput.textContent = `Вы экономите ${formatRub(discount)}`;
      propertyOutput.textContent = propertyNames[property];
      durationOutput.textContent = `≈ ${formatDuration(hours)}`;

      const progress = ((area - Number(areaRange.min)) / (Number(areaRange.max) - Number(areaRange.min))) * 100;
      areaRange.style.setProperty("--range-progress", `${progress}%`);

      bookButton.dataset.service = typeNames[type];
      bookButton.dataset.summary = `${propertyNames[property]} ${area} м² · ${typeNames[type].toLowerCase()} · предварительно ${formatRub(total)}`;

      window.clearTimeout(render.announceTimer);
      render.announceTimer = window.setTimeout(() => {
        if (announcement) {
          announcement.textContent = `Предварительная стоимость: ${formatRub(total)}`;
        }
      }, 450);
    };

    render.announceTimer = null;

    $$("input[name='property'], input[name='clean-type'], .calc-extra input", calculator).forEach((input) => {
      input.addEventListener("change", render);
    });

    areaRange.addEventListener("input", render);

    $$("[data-area-step]", calculator).forEach((button) => {
      button.addEventListener("click", () => {
        const step = Number(button.dataset.areaStep);
        const next = Math.min(Number(areaRange.max), Math.max(Number(areaRange.min), Number(areaRange.value) + step));
        areaRange.value = String(next);
        render();
      });
    });

    bookButton.addEventListener("click", () => {
      openModal(
        bookButton.dataset.service || "Уборка",
        `${bookButton.dataset.summary}. Оставьте телефон — менеджер подтвердит точную стоимость и свободное время.`
      );
    });

    render();
  }

  /* =======================================================
     Hide the mobile call-to-action while the form is visible
     ======================================================= */

  const mobileBar = $(".mobile-bar");
  const contactForm = $(".contact-form");

  if (mobileBar && contactForm && "IntersectionObserver" in window) {
    const barObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          mobileBar.classList.toggle("is-hidden", entry.isIntersecting);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );

    barObserver.observe(contactForm);
  }

  /* =======================================================
     Small niceties
     ======================================================= */

  const faqItems = $$(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") updateHeader();
  });
})();
