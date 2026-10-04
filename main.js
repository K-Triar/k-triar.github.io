/* Kトライア瑠璃交通 — Top page
   JS なしでも全情報が読める前提の、最小限の拡張のみ。 */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const header = document.querySelector(".mainHeader");
  const menuButton = document.querySelector(".mainHeader_menuButton");
  const nav = document.getElementById("globalNav");

  /* ---------- Compact header（スクロール時の固定ヘッダー） ----------
     .mainHeader の内容（ナビ・REWIS・乗換案内・運行状況）から生成するので、更新は .mainHeader だけでよい。 */
  if (header && nav && "IntersectionObserver" in window) {
    const bar = document.createElement("div");
    bar.className = "compactHeader";
    bar.innerHTML = `
      <div class="compactHeader_inner">
        <a class="compactHeader_logo" href="#top">
          <img src="assets/icons/kt_luli_logo.svg" alt="Kトライア瑠璃交通 ページの先頭へ" width="48" height="46">
        </a>
        <nav class="compactHeader_nav" aria-label="グローバルナビゲーション（固定表示）">
          <ul class="compactHeader_list"></ul>
        </nav>
        <div class="compactHeader_tools">
          <a class="compactStatus" href="#status">
            <svg class="compactStatus_icon" aria-hidden="true"><use></use></svg>
            <span><span class="u-visuallyHidden">運行状況：</span><span class="compactStatus_text"></span></span>
          </a>
          <a class="compactHeader_rewis"></a>
          <a class="primaryButton compactHeader_cta"></a>
          <button class="compactHeader_menuButton" type="button" aria-expanded="false" aria-controls="globalNav">
            <span class="mainHeader_menuIcon" aria-hidden="true"></span><span class="compactHeader_menuLabel">メニュー</span>
          </button>
        </div>
      </div>`;

    // ナビ（REWIS 以外）
    const list = bar.querySelector(".compactHeader_list");
    nav.querySelectorAll(".globalNav_item:not(.globalNav_item-rewis) .globalNav_link").forEach((link) => {
      const item = document.createElement("li");
      const a = document.createElement("a");
      item.className = "compactHeader_item";
      a.className = "compactHeader_link";
      a.href = link.getAttribute("href");
      a.textContent = link.textContent;
      item.append(a);
      list.append(item);
    });

    // REWIS / 乗換案内
    const rewis = nav.querySelector(".globalNav_link-rewis");
    const rewisLink = bar.querySelector(".compactHeader_rewis");
    if (rewis) {
      rewisLink.href = rewis.getAttribute("href");
      rewisLink.append(rewis.querySelector("img").cloneNode());
    } else rewisLink.remove();

    const cta = header.querySelector(".headerMore_actions .primaryButton");
    const ctaLink = bar.querySelector(".compactHeader_cta");
    if (cta) {
      ctaLink.href = cta.getAttribute("href");
      ctaLink.textContent = cta.textContent;
    } else ctaLink.remove();

    // 運行状況サマリ：最も重い状態の記号で代表し、異常のある路線数を文字で示す
    const lines = [...header.querySelectorAll(".lineStatus")];
    const count = (state) => lines.filter((line) => line.classList.contains(`lineStatus-${state}`)).length;
    const stop = count("stop");
    const notice = count("notice");
    const worst = stop ? "stop" : notice ? "notice" : "normal";
    const parts = [stop && `運転見合わせ ${stop}路線`, notice && `遅れ ${notice}路線`].filter(Boolean);
    const status = bar.querySelector(".compactStatus");
    status.classList.add(`compactStatus-${worst}`);
    status.querySelector("use").setAttribute("href", `#st-${worst}`);
    status.querySelector(".compactStatus_text").textContent = parts.length ? parts.join("・") : "全線 平常運転";

    header.after(bar);

    // 本来のヘッダーが画面の上へ完全に出たときだけ表示。非表示中は操作・読み上げの対象外にする
    const setVisible = (visible) => {
      bar.classList.toggle("is-visible", visible);
      bar.inert = !visible;
      bar.setAttribute("aria-hidden", String(!visible));
    };
    setVisible(false);
    new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    }).observe(header);
  }

  /* ---------- Global nav drawer (§4.2) ----------
     開閉ボタンは本来のヘッダーと固定ヘッダーの2つ。開いている間は本来のボタンが「閉じる」として最前面に出る。 */
  if (menuButton && nav) {
    const label = menuButton.querySelector(".mainHeader_menuLabel");
    let opener = menuButton;

    const setOpen = (open) => {
      document.querySelectorAll('[aria-controls="globalNav"]').forEach((button) => {
        button.setAttribute("aria-expanded", String(open));
      });
      nav.classList.toggle("is-open", open);
      label.textContent = open ? "閉じる" : "メニュー";
    };
    const close = () => {
      setOpen(false);
      opener.focus({ preventScroll: true });
    };

    document.addEventListener("click", (e) => {
      const button = e.target.closest('[aria-controls="globalNav"]');
      if (!button) return;
      if (nav.classList.contains("is-open")) {
        close();
      } else {
        opener = button;
        setOpen(true);
        if (button !== menuButton) menuButton.focus({ preventScroll: true });
      }
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) close();
    });
  }

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
