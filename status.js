/* Kトライア瑠璃交通 — Top page「KT線 運行状況」
   REWIS の公開データ（/v2/public）を取得し、.serviceStatus の各路線（data-line-id）の状態を書き換える。
   状態の判定は REWIS のトップページ（rewis/src/pages/index.js）と共通。
   書き換えるたびに #status へ "statusupdate" を送り、main.js が固定ヘッダーのサマリを作り直す。 */

const API = "https://rewis-editor-api.56drich.workers.dev";
const MODEL_URL = "https://k-triar.github.io/rewis/src/shared/model.js";
const REFRESH_INTERVAL = 60 * 1000; // 公開 API のキャッシュは 30 秒。それより短く取りに行かない

const STATES = ["normal", "warning", "suspend", "unknown"];
const STATE_LABELS = { normal: "平常運転", warning: "運行情報あり", suspend: "運転見合わせ" };

const section = document.getElementById("status");
const timeEl = section && section.querySelector(".serviceStatus_time");
const items = section ? [...section.querySelectorAll(".lineStatus[data-line-id]")] : [];

let buildModel = null;
let lastFetched = 0;
let timer = null;

function isSuspendNotice(model, notice) {
  const template = (model.masters?.statusTemplates || []).find((t) => t.code === notice.status?.code);
  const code = notice.status?.code || "";
  const heading = notice.status?.heading || "";
  return template?.statusId === "OfS" || /SUSPEND/i.test(code) || heading.includes("運転見合わせ");
}

function classify(model, lineId) {
  const notice = model.primaryNotice(lineId);
  if (!notice) return "normal";
  return isSuspendNotice(model, notice) ? "suspend" : "warning";
}

function setItem(item, state, stateText, name) {
  item.classList.remove(...STATES.map((s) => `lineStatus-${s}`));
  item.classList.add(`lineStatus-${state}`);
  item.querySelector("use").setAttribute("href", `#st-${state}`);
  item.querySelector(".lineStatus_state").textContent = stateText;
  if (name) item.querySelector(".lineStatus_name").textContent = name;
}

function setTime(date) {
  const label = new Intl.DateTimeFormat("ja-JP", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo",
  }).format(date);
  const time = document.createElement("time");
  time.dateTime = date.toISOString();
  time.textContent = label;
  timeEl.replaceChildren(time, " 現在");
}

async function refresh() {
  lastFetched = Date.now();
  try {
    buildModel ??= (await import(MODEL_URL)).buildModel;
    const res = await fetch(`${API}/v2/public`);
    if (!res.ok) throw new Error(`REWIS のデータを取得できませんでした: ${res.status}`);
    const pub = await res.json();
    const model = buildModel(pub.network, pub.notices, pub.masters);

    items.forEach((item) => {
      const lineId = item.dataset.lineId;
      if (!model.lineById.has(lineId)) {
        setItem(item, "unknown", "情報なし");
        return;
      }
      const state = classify(model, lineId);
      setItem(item, state, STATE_LABELS[state], model.lineName(lineId));
    });
    setTime(new Date());
  } catch (error) {
    console.error(error);
    // 一度表示できた状態は残し、初回の失敗だけ「取得できません」にする
    items.filter((item) => item.classList.contains("lineStatus-unknown"))
      .forEach((item) => setItem(item, "unknown", "取得できません"));
    if (!timeEl.querySelector("time")) timeEl.textContent = "運行情報を取得できませんでした";
  }
  section.dispatchEvent(new CustomEvent("statusupdate"));
}

// 表示中だけ定期的に取り直す。タブに戻ったときは間隔を過ぎていればすぐ取り直す
function schedule() {
  clearTimeout(timer);
  if (document.hidden) return;
  const wait = Math.max(0, lastFetched + REFRESH_INTERVAL - Date.now());
  timer = setTimeout(async () => {
    await refresh();
    schedule();
  }, wait);
}

if (section && timeEl && items.length) {
  document.addEventListener("visibilitychange", schedule);
  await refresh();
  schedule();
}
