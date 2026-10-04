/* Kトライア瑠璃交通 — Top page 専用
   メインビジュアルのスライダーとニュースタブ。ヘッダー・メニューなど全ページ共通の処理は main.js。 */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Main visual slider (§4.5) ---------- */
  const mainVisual = document.querySelector(".mainVisual");

  if (mainVisual) {
    const slides = [...mainVisual.querySelectorAll(".mainVisual_slide")];
    const dots = [...mainVisual.querySelectorAll(".mainVisual_dot")];
    const controls = mainVisual.querySelector(".mainVisual_controls");
    const toggle = mainVisual.querySelector(".mainVisual_toggle");
    const toggleLabel = toggle.querySelector(".mainVisual_toggleLabel");
    const INTERVAL = 6000;
    let current = 0;
    let timer = null;
    let userPaused = reducedMotion.matches; // 視差・自動再生を抑制する設定では停止状態で開始
    let hoverPaused = false;

    const show = (index) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === current));
      dots.forEach((dot, i) => {
        if (i === current) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    };

    const sync = () => {
      clearInterval(timer);
      timer = null;
      if (!userPaused && !hoverPaused) timer = setInterval(() => show(current + 1), INTERVAL);
      toggle.setAttribute("aria-pressed", String(userPaused));
      toggleLabel.textContent = userPaused ? "再生" : "一時停止";
    };

    controls.hidden = false;
    dots.forEach((dot, i) => dot.addEventListener("click", () => show(i)));
    toggle.addEventListener("click", () => {
      userPaused = !userPaused;
      sync();
    });

    // 操作中・注視中は送らない
    mainVisual.addEventListener("mouseenter", () => { hoverPaused = true; sync(); });
    mainVisual.addEventListener("mouseleave", () => { hoverPaused = false; sync(); });
    mainVisual.addEventListener("focusin", () => { hoverPaused = true; sync(); });
    mainVisual.addEventListener("focusout", (e) => {
      if (!mainVisual.contains(e.relatedTarget)) { hoverPaused = false; sync(); }
    });
    reducedMotion.addEventListener("change", (e) => {
      if (e.matches) { userPaused = true; sync(); }
    });

    show(0);
    sync();
  }

  /* ---------- News tabs (§4.7) ---------- */
  const tablist = document.querySelector(".newsTabs");

  if (tablist) {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));

    const select = (index, focus) => {
      tabs.forEach((tab, i) => {
        const selected = i === index;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[i].hidden = !selected;
      });
      if (focus) tabs[index].focus();
    };

    tablist.hidden = false;
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(i, false));
      tab.addEventListener("keydown", (e) => {
        const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
        if (!(e.key in keys)) return;
        e.preventDefault();
        select((keys[e.key] + tabs.length) % tabs.length, true);
      });
    });
    select(0, false);
  }
})();
