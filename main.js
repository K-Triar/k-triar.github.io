/* Kトライア瑠璃交通 — 全ページ共通（ヘッダー固定・メニュー開閉）
   JS なしでも全情報が読める前提の、最小限の拡張のみ。Top page 専用の処理は home.js。 */
(() => {
  "use strict";

  const header = document.querySelector(".mainHeader");
  // Top page は本来のヘッダーのボタン、下層ページは固定ヘッダー（静的マークアップ）のボタンを主とする
  const menuButton = document.querySelector(".mainHeader_menuButton") || document.querySelector(".compactHeader_menuButton");
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
    nav.querySelectorAll(".globalNav_item:not(.globalNav_item-rewis):not(.globalNav_item-sub) .globalNav_link").forEach((link) => {
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
    // 状態名・表記は REWIS（src/pages/index.js の STATE_LABELS）と共通
    const suspend = count("suspend");
    const warning = count("warning");
    const worst = suspend ? "suspend" : warning ? "warning" : "normal";
    const parts = [suspend && `運転見合わせ ${suspend}路線`, warning && `運行情報あり ${warning}路線`].filter(Boolean);
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
     Top page の開閉ボタンは本来のヘッダーと固定ヘッダーの2つ。開いている間は本来のボタンが「閉じる」として最前面に出る。
     下層ページは固定ヘッダーのボタン1つで、開いている間はそのボタンが最前面に出る。 */
  if (menuButton && nav) {
    const label = menuButton.querySelector(".mainHeader_menuLabel, .compactHeader_menuLabel");
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
})();
