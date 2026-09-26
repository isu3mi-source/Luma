/* ============================================================
   Luma OS 1.0
   script.js
   ============================================================ */

"use strict";


/* ============================================================
   0. 基本ユーティリティ
   ============================================================ */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function safeJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    if (!value) return fallback;

    return JSON.parse(value);
  } catch (error) {
    console.warn("Luma: JSON load failed", key, error);
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Luma: JSON save failed", key, error);
    return false;
  }
}

function todayString(date = new Date()) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());

  return `${y}-${m}-${d}`;
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = String(text ?? "");
  return div.innerHTML;
}

function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds));

  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function formatMediaTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";

  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;

  return `${m}:${pad2(s)}`;
}

function uid(prefix = "luma") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}


/* ============================================================
   1. 状態
   ============================================================ */

const DEFAULT_SETTINGS = {
  showSeconds: false,
  showHomeReminder: true,
  showHomeWeather: true,

  clockColor: "white",
  clockOpacity: 70,
  clockBrightness: 100,
  clockFont: "thin",

  squishStrength: 100,

  wallpaperBrightness: 100,

  timerIsland: true,
  musicIsland: true,

  weatherLocation: null
};

const state = {
  settings: {
    ...DEFAULT_SETTINGS,
    ...safeJSON("lumaSettings", {})
  },

  alarms: safeJSON("lumaAlarms", []),

  reminders: safeJSON("lumaReminders", []),

  timer: {
    running: false,
    paused: false,
    remainingMs: 0,
    originalMs: 0,
    endAt: 0,
    interval: null
  },

  stopwatch: {
    running: false,
    startedAt: 0,
    elapsedBeforeStart: 0,
    interval: null,
    laps: []
  },

  music: {
    tracks: [],
    currentIndex: -1,
    objectURL: null
  },

  weather: {
    loading: false,
    data: null
  },

  ring: {
    active: false,
    type: null,
    audioContext: null,
    oscillator: null,
    gain: null,
    pulseInterval: null
  },

  currentPage: "home",

  db: null,

  toastTimer: null
};


/* ============================================================
   2. DOM
   ============================================================ */

const dom = {};

function cacheDOM() {
  dom.wallpaper = $("#wallpaper");
  dom.wallpaperPreview = $("#wallpaperPreview");

  dom.menuButton = $("#menuButton");
  dom.sideMenu = $("#sideMenu");
  dom.menuCloseButton = $("#menuCloseButton");
  dom.menuBackdrop = $("#menuBackdrop");

  dom.dynamicIsland = $("#dynamicIsland");
  dom.islandArtwork = $("#islandArtwork");
  dom.islandTitle = $("#islandTitle");
  dom.islandSubtitle = $("#islandSubtitle");
  dom.islandRight = $("#islandRight");

  dom.homeWeather = $("#homeWeather");
  dom.homeWeatherIcon = $("#homeWeatherIcon");
  dom.homeTemperature = $("#homeTemperature");
  dom.homeWeatherCity = $("#homeWeatherCity");

  dom.homeDate = $("#homeDate");
  dom.clockText = $("#clockText");
  dom.clockSeconds = $("#clockSeconds");

  dom.largeClockText = $("#largeClockText");
  dom.largeClockSeconds = $("#largeClockSeconds");
  dom.largeClockDate = $("#largeClockDate");

  dom.homeReminderCard = $("#homeReminderCard");
  dom.homeReminderList = $("#homeReminderList");
  dom.homeReminderAdd = $("#homeReminderAdd");

  dom.alarmList = $("#alarmList");
  dom.alarmEmpty = $("#alarmEmpty");

  dom.timerDisplay = $("#timerDisplay");
  dom.timerHours = $("#timerHours");
  dom.timerMinutes = $("#timerMinutes");
  dom.timerSecondsInput = $("#timerSecondsInput");

  dom.stopwatchDisplay = $("#stopwatchDisplay");
  dom.lapList = $("#lapList");

  dom.reminderList = $("#reminderList");
  dom.reminderEmpty = $("#reminderEmpty");

  dom.weatherIcon = $("#weatherIcon");
  dom.weatherTemperature = $("#weatherTemperature");
  dom.weatherCity = $("#weatherCity");
  dom.weatherDescription = $("#weatherDescription");
  dom.weatherHigh = $("#weatherHigh");
  dom.weatherLow = $("#weatherLow");
  dom.weatherHumidity = $("#weatherHumidity");
  dom.weatherWind = $("#weatherWind");
  dom.weatherUpdated = $("#weatherUpdated");

  dom.musicFileInput = $("#musicFileInput");
  dom.audioPlayer = $("#audioPlayer");
  dom.musicTitle = $("#musicTitle");
  dom.musicArtist = $("#musicArtist");
  dom.musicProgress = $("#musicProgress");
  dom.musicCurrentTime = $("#musicCurrentTime");
  dom.musicDuration = $("#musicDuration");
  dom.musicPlay = $("#musicPlay");
  dom.musicPrevious = $("#musicPrevious");
  dom.musicNext = $("#musicNext");
  dom.musicVolume = $("#musicVolume");
  dom.musicLibrary = $("#musicLibrary");

  dom.showSecondsSetting = $("#showSecondsSetting");
  dom.showHomeReminderSetting = $("#showHomeReminderSetting");
  dom.showHomeWeatherSetting = $("#showHomeWeatherSetting");

  dom.wallpaperFileInput = $("#wallpaperFileInput");
  dom.wallpaperBrightness = $("#wallpaperBrightness");
  dom.wallpaperBrightnessValue = $("#wallpaperBrightnessValue");

  dom.clockOpacity = $("#clockOpacity");
  dom.clockOpacityValue = $("#clockOpacityValue");

  dom.clockBrightness = $("#clockBrightness");
  dom.clockBrightnessValue = $("#clockBrightnessValue");

  dom.squishStrength = $("#squishStrength");
  dom.squishStrengthValue = $("#squishStrengthValue");

  dom.clockFontSetting = $("#clockFontSetting");

  dom.timerIslandSetting = $("#timerIslandSetting");
  dom.musicIslandSetting = $("#musicIslandSetting");

  dom.reminderModal = $("#reminderModal");
  dom.reminderTitleInput = $("#reminderTitleInput");
  dom.reminderDateInput = $("#reminderDateInput");
  dom.reminderTimeInput = $("#reminderTimeInput");

  dom.alarmModal = $("#alarmModal");
  dom.alarmTimeInput = $("#alarmTimeInput");
  dom.alarmLabelInput = $("#alarmLabelInput");
  dom.alarmRepeatInput = $("#alarmRepeatInput");

  dom.weatherModal = $("#weatherModal");
  dom.weatherSearchInput = $("#weatherSearchInput");
  dom.weatherSearchStatus = $("#weatherSearchStatus");
  dom.weatherSearchResults = $("#weatherSearchResults");

  dom.toast = $("#toast");
  dom.toastText = $("#toastText");

  dom.ringOverlay = $("#ringOverlay");
  dom.ringIcon = $("#ringIcon");
  dom.ringTitle = $("#ringTitle");
  dom.ringSubtitle = $("#ringSubtitle");
}


/* ============================================================
   3. 安全実行
   ============================================================ */

function safeRun(name, fn) {
  try {
    return fn();
  } catch (error) {
    console.error(`Luma: ${name} failed`, error);
    return undefined;
  }
}

async function safeRunAsync(name, fn) {
  try {
    return await fn();
  } catch (error) {
    console.error(`Luma: ${name} failed`, error);
    return undefined;
  }
}


/* ============================================================
   4. トースト
   ============================================================ */

function showToast(message) {
  if (!dom.toast || !dom.toastText) return;

  dom.toastText.textContent = message;

  dom.toast.classList.add("show");

  clearTimeout(state.toastTimer);

  state.toastTimer = setTimeout(() => {
    dom.toast.classList.remove("show");
  }, 2400);
}


/* ============================================================
   5. ページ
   ============================================================ */

function openPage(pageName) {
  const target = $(`#page-${pageName}`);

  if (!target) {
    console.warn("Luma: page not found:", pageName);
    return;
  }

  $$(".page").forEach((page) => {
    page.classList.remove("active");
  });

  target.classList.add("active");

  state.currentPage = pageName;

  $$(".menu-item").forEach((item) => {
    item.classList.toggle(
      "active",
      item.dataset.page === pageName
    );
  });

  closeMenu();

  safeRun("render page", () => {
    if (pageName === "alarm") renderAlarms();
    if (pageName === "reminder") renderReminders();
    if (pageName === "music") renderMusicLibrary();
    if (pageName === "weather") renderWeather();
  });
}

function openMenu() {
  dom.sideMenu?.classList.add("open");
  dom.menuBackdrop?.classList.add("show");
}

function closeMenu() {
  dom.sideMenu?.classList.remove("open");
  dom.menuBackdrop?.classList.remove("show");
}


/* ============================================================
   6. モーダル
   ============================================================ */

function openModal(id) {
  const modal = document.getElementById(id);

  if (!modal) return;

  modal.classList.add("show");
}

function closeModal(id) {
  const modal = document.getElementById(id);

  if (!modal) return;

  modal.classList.remove("show");
}


/* ============================================================
   7. 時計
   ============================================================ */

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short"
});

function updateClock() {
  const now = new Date();

  const hh = pad2(now.getHours());
  const mm = pad2(now.getMinutes());
  const ss = pad2(now.getSeconds());

  const main = `${hh}:${mm}`;

  if (dom.clockText) {
    dom.clockText.textContent = main;
  }

  if (dom.largeClockText) {
    dom.largeClockText.textContent = main;
  }

  if (dom.clockSeconds) {
    dom.clockSeconds.textContent = ss;
  }

  if (dom.largeClockSeconds) {
    dom.largeClockSeconds.textContent = ss;
  }

  const dateText = dateFormatter.format(now);

  if (dom.homeDate) {
    dom.homeDate.textContent = dateText;
  }

  if (dom.largeClockDate) {
    dom.largeClockDate.textContent = dateText;
  }

  updateWorldClocks(now);

  checkAlarms(now);
}

function updateWorldClocks(now = new Date()) {
  $$("[data-timezone]").forEach((element) => {
    const zone = element.dataset.timezone;

    try {
      element.textContent =
        new Intl.DateTimeFormat("ja-JP", {
          timeZone: zone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).format(now);
    } catch (error) {
      element.textContent = "--:--";
    }
  });
}


/* ============================================================
   8. 設定
   ============================================================ */

const GLASS_COLORS = {
  white: "255,255,255",
  blue: "72,155,255",
  purple: "176,104,255",
  pink: "255,92,181",
  orange: "255,164,66",
  green: "64,220,150"
};

function saveSettings() {
  saveJSON("lumaSettings", state.settings);
}

function applySettings() {
  const s = state.settings;

  const root = document.documentElement;

  root.style.setProperty(
    "--glass-rgb",
    GLASS_COLORS[s.clockColor] || GLASS_COLORS.white
  );

  root.style.setProperty(
    "--clock-opacity",
    String(clamp(s.clockOpacity, 20, 100) / 100)
  );

  root.style.setProperty(
    "--clock-brightness",
    String(clamp(s.clockBrightness, 60, 160) / 100)
  );

  document.body.classList.remove(
    "clock-font-thin",
    "clock-font-system",
    "clock-font-rounded"
  );

  document.body.classList.add(
    `clock-font-${s.clockFont}`
  );

  if (dom.clockSeconds) {
    dom.clockSeconds.style.display =
      s.showSeconds ? "" : "none";
  }

  if (dom.largeClockSeconds) {
    dom.largeClockSeconds.style.display =
      s.showSeconds ? "" : "none";
  }

  if (dom.homeReminderCard) {
    dom.homeReminderCard.style.display =
      s.showHomeReminder ? "" : "none";
  }

  if (dom.homeWeather) {
    dom.homeWeather.style.display =
      s.showHomeWeather ? "" : "none";
  }

  if (dom.wallpaper) {
    dom.wallpaper.style.filter =
      `brightness(${s.wallpaperBrightness / 100})`;
  }

  syncSettingsUI();

  updateIsland();
}

function syncSettingsUI() {
  const s = state.settings;

  if (dom.showSecondsSetting) {
    dom.showSecondsSetting.checked = s.showSeconds;
  }

  if (dom.showHomeReminderSetting) {
    dom.showHomeReminderSetting.checked =
      s.showHomeReminder;
  }

  if (dom.showHomeWeatherSetting) {
    dom.showHomeWeatherSetting.checked =
      s.showHomeWeather;
  }

  if (dom.wallpaperBrightness) {
    dom.wallpaperBrightness.value =
      s.wallpaperBrightness;
  }

  if (dom.wallpaperBrightnessValue) {
    dom.wallpaperBrightnessValue.textContent =
      `${s.wallpaperBrightness}%`;
  }

  if (dom.clockOpacity) {
    dom.clockOpacity.value = s.clockOpacity;
  }

  if (dom.clockOpacityValue) {
    dom.clockOpacityValue.textContent =
      `${s.clockOpacity}%`;
  }

  if (dom.clockBrightness) {
    dom.clockBrightness.value =
      s.clockBrightness;
  }

  if (dom.clockBrightnessValue) {
    dom.clockBrightnessValue.textContent =
      `${s.clockBrightness}%`;
  }

  if (dom.squishStrength) {
    dom.squishStrength.value =
      s.squishStrength;
  }

  if (dom.squishStrengthValue) {
    dom.squishStrengthValue.textContent =
      `${s.squishStrength}%`;
  }

  if (dom.clockFontSetting) {
    dom.clockFontSetting.value =
      s.clockFont;
  }

  if (dom.timerIslandSetting) {
    dom.timerIslandSetting.checked =
      s.timerIsland;
  }

  if (dom.musicIslandSetting) {
    dom.musicIslandSetting.checked =
      s.musicIsland;
  }

  $$(".glass-color").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.color === s.clockColor
    );
  });
}


/* ============================================================
   9. ボヨン / Liquid Glassタッチ
   ============================================================ */

function squishElement(element, event) {
  if (!element) return;

  const strength =
    clamp(state.settings.squishStrength, 0, 150) / 100;

  const rect = element.getBoundingClientRect();

  const x =
    clamp(
      ((event.clientX - rect.left) / rect.width) * 100,
      0,
      100
    );

  const y =
    clamp(
      ((event.clientY - rect.top) / rect.height) * 100,
      0,
      100
    );

  element.style.setProperty("--touch-x", `${x}%`);
  element.style.setProperty("--touch-y", `${y}%`);

  const horizontal =
    (x - 50) / 50;

  const vertical =
    (y - 50) / 50;

  let xScale = 1 - 0.045 * strength;
  let yScale = 1 - 0.075 * strength;

  if (element.classList.contains("squishy-strong")) {
    xScale = 1 - 0.060 * strength;
    yScale = 1 - 0.105 * strength;
  }

  if (element.classList.contains("squishy-soft")) {
    xScale = 1 - 0.020 * strength;
    yScale = 1 - 0.028 * strength;
  }

  const rotate =
    horizontal * 0.7 * strength;

  element.style.setProperty(
    "--squish-x",
    String(Math.max(0.82, xScale))
  );

  element.style.setProperty(
    "--squish-y",
    String(Math.max(0.78, yScale))
  );

  element.style.setProperty(
    "--squish-rotate",
    `${rotate}deg`
  );

  element.style.setProperty(
    "--release-x",
    String(Math.max(0.82, xScale))
  );

  element.style.setProperty(
    "--release-y",
    String(Math.max(0.78, yScale))
  );

  element.classList.remove("is-rebounding");
  element.classList.add("is-pressed");

  /* タッチ位置で少し光の中心をずらす */
  if (element.classList.contains("liquid-glass")) {
    const glowX = 50 + horizontal * 18;
    const glowY = 50 + vertical * 15;

    element.style.setProperty(
      "--touch-x",
      `${glowX}%`
    );

    element.style.setProperty(
      "--touch-y",
      `${glowY}%`
    );
  }
}

function releaseSquish(element) {
  if (!element) return;

  if (!element.classList.contains("is-pressed")) {
    return;
  }

  element.classList.remove("is-pressed");

  element.style.setProperty("--squish-x", "1");
  element.style.setProperty("--squish-y", "1");
  element.style.setProperty("--squish-rotate", "0deg");

  element.classList.remove("is-rebounding");

  /* animation再起動 */
  void element.offsetWidth;

  element.classList.add("is-rebounding");

  setTimeout(() => {
    element.classList.remove("is-rebounding");

    element.style.setProperty("--touch-x", "50%");
    element.style.setProperty("--touch-y", "50%");
  }, 560);
}

function installSquish() {
  const targets = [
    ...$$(".squishy"),
    ...$$(".squishy-soft")
  ];

  const uniqueTargets = [...new Set(targets)];

  uniqueTargets.forEach((element) => {
    element.addEventListener(
      "pointerdown",
      (event) => {
        if (event.pointerType === "mouse" &&
            event.button !== 0) {
          return;
        }

        squishElement(element, event);
      },
      { passive: true }
    );

    element.addEventListener(
      "pointerup",
      () => releaseSquish(element),
      { passive: true }
    );

    element.addEventListener(
      "pointercancel",
      () => releaseSquish(element),
      { passive: true }
    );

    element.addEventListener(
      "pointerleave",
      () => releaseSquish(element),
      { passive: true }
    );
  });
}


/* ============================================================
   10. リマインダー
   ============================================================ */

function sortReminders() {
  state.reminders.sort((a, b) => {
    const aDate =
      `${a.date || "9999-99-99"}T${a.time || "23:59"}`;

    const bDate =
      `${b.date || "9999-99-99"}T${b.time || "23:59"}`;

    return aDate.localeCompare(bDate);
  });
}

function saveReminders() {
  saveJSON("lumaReminders", state.reminders);
}

function renderReminders() {
  sortReminders();

  if (!dom.reminderList) return;

  dom.reminderList.innerHTML = "";

  if (dom.reminderEmpty) {
    dom.reminderEmpty.classList.toggle(
      "show",
      state.reminders.length === 0
    );
  }

  state.reminders.forEach((reminder) => {
    const card = document.createElement("article");

    card.className = "list-card squishy-soft";

    card.innerHTML = `
      <button
        class="home-reminder-check reminder-toggle"
        type="button"
        aria-label="完了"
        data-id="${reminder.id}"
        style="${
          reminder.completed
            ? "background:#24d989;border-color:#24d989;"
            : ""
        }"
      ></button>

      <div class="list-main">
        <div
          class="list-title"
          style="${
            reminder.completed
              ? "text-decoration:line-through;opacity:.5;"
              : ""
          }"
        >
          ${escapeHTML(reminder.title)}
        </div>

        <div class="list-subtitle">
          ${escapeHTML(reminder.date || "日付なし")}
          ${reminder.time ? ` ${escapeHTML(reminder.time)}` : ""}
        </div>
      </div>

      <div class="list-actions">
        <button
          class="icon-button reminder-delete squishy"
          type="button"
          data-id="${reminder.id}"
          aria-label="削除"
        >
          🗑
        </button>
      </div>
    `;

    dom.reminderList.appendChild(card);
  });

  renderHomeReminders();
}

function renderHomeReminders() {
  if (!dom.homeReminderList) return;

  const today = todayString();

  const todays = state.reminders
    .filter(
      (item) =>
        item.date === today &&
        !item.completed
    )
    .sort((a, b) =>
      (a.time || "99:99").localeCompare(
        b.time || "99:99"
      )
    );

  dom.homeReminderList.innerHTML = "";

  if (todays.length === 0) {
    dom.homeReminderList.innerHTML = `
      <div class="home-empty">
        今日の予定はありません
      </div>
    `;

    return;
  }

  todays.forEach((item) => {
    const row = document.createElement("div");

    row.className = "home-reminder-item";

    row.innerHTML = `
      <button
        class="home-reminder-check home-reminder-toggle"
        data-id="${item.id}"
        type="button"
        aria-label="完了"
      ></button>

      <span>${escapeHTML(item.title)}</span>

      <span class="home-reminder-time">
        ${escapeHTML(item.time || "")}
      </span>
    `;

    dom.homeReminderList.appendChild(row);
  });
}

function prepareReminderModal() {
  if (dom.reminderTitleInput) {
    dom.reminderTitleInput.value = "";
  }

  if (dom.reminderDateInput) {
    dom.reminderDateInput.value = todayString();
  }

  if (dom.reminderTimeInput) {
    dom.reminderTimeInput.value = "";
  }

  openModal("reminderModal");

  setTimeout(() => {
    dom.reminderTitleInput?.focus();
  }, 100);
}

function addReminder() {
  const title =
    dom.reminderTitleInput?.value.trim() || "";

  const date =
    dom.reminderDateInput?.value || "";

  const time =
    dom.reminderTimeInput?.value || "";

  if (!title) {
    showToast("予定を入力してください");
    return;
  }

  state.reminders.push({
    id: uid("reminder"),
    title,
    date,
    time,
    completed: false,
    createdAt: Date.now()
  });

  saveReminders();
  renderReminders();

  closeModal("reminderModal");

  showToast("予定を追加しました");
}

function toggleReminder(id) {
  const item =
    state.reminders.find((r) => r.id === id);

  if (!item) return;

  item.completed = !item.completed;

  saveReminders();
  renderReminders();
}

function deleteReminder(id) {
  state.reminders =
    state.reminders.filter((r) => r.id !== id);

  saveReminders();
  renderReminders();

  showToast("予定を削除しました");
}


/* ============================================================
   11. アラーム
   ============================================================ */

function saveAlarms() {
  saveJSON("lumaAlarms", state.alarms);
}

function repeatLabel(value) {
  const map = {
    daily: "毎日",
    weekdays: "平日",
    weekends: "土日のみ",
    once: "1回のみ"
  };

  return map[value] || "毎日";
}

function renderAlarms() {
  if (!dom.alarmList) return;

  state.alarms.sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  dom.alarmList.innerHTML = "";

  if (dom.alarmEmpty) {
    dom.alarmEmpty.classList.toggle(
      "show",
      state.alarms.length === 0
    );
  }

  state.alarms.forEach((alarm) => {
    const card = document.createElement("article");

    card.className = "list-card squishy-soft";

    card.innerHTML = `
      <div class="list-main">

        <div class="list-title">
          ${escapeHTML(alarm.time)}
        </div>

        <div class="list-subtitle">
          ${
            alarm.label
              ? `${escapeHTML(alarm.label)} ・ `
              : ""
          }
          ${repeatLabel(alarm.repeat)}
        </div>

      </div>

      <div class="list-actions">

        <label class="switch">
          <input
            class="alarm-toggle"
            data-id="${alarm.id}"
            type="checkbox"
            ${alarm.enabled ? "checked" : ""}
          >
          <span class="switch-slider"></span>
        </label>

        <button
          class="icon-button alarm-delete squishy"
          data-id="${alarm.id}"
          type="button"
          aria-label="削除"
        >
          🗑
        </button>

      </div>
    `;

    dom.alarmList.appendChild(card);
  });
}

function prepareAlarmModal() {
  if (dom.alarmTimeInput) {
    dom.alarmTimeInput.value = "07:00";
  }

  if (dom.alarmLabelInput) {
    dom.alarmLabelInput.value = "";
  }

  if (dom.alarmRepeatInput) {
    dom.alarmRepeatInput.value = "daily";
  }

  openModal("alarmModal");
}

function addAlarm() {
  const time =
    dom.alarmTimeInput?.value || "";

  if (!time) {
    showToast("時刻を設定してください");
    return;
  }

  const label =
    dom.alarmLabelInput?.value.trim() || "";

  const repeat =
    dom.alarmRepeatInput?.value || "daily";

  state.alarms.push({
    id: uid("alarm"),
    time,
    label,
    repeat,
    enabled: true,
    lastTriggeredKey: null
  });

  saveAlarms();
  renderAlarms();

  closeModal("alarmModal");

  showToast("アラームを追加しました");
}

function alarmMatchesDay(alarm, date) {
  const day = date.getDay();

  if (alarm.repeat === "daily") {
    return true;
  }

  if (alarm.repeat === "weekdays") {
    return day >= 1 && day <= 5;
  }

  if (alarm.repeat === "weekends") {
    return day === 0 || day === 6;
  }

  if (alarm.repeat === "once") {
    return true;
  }

  return true;
}

function checkAlarms(now) {
  if (state.ring.active) return;

  const currentTime =
    `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

  const triggerKey =
    `${todayString(now)}-${currentTime}`;

  for (const alarm of state.alarms) {
    if (!alarm.enabled) continue;

    if (alarm.time !== currentTime) continue;

    if (!alarmMatchesDay(alarm, now)) continue;

    if (alarm.lastTriggeredKey === triggerKey) {
      continue;
    }

    alarm.lastTriggeredKey = triggerKey;

    if (alarm.repeat === "once") {
      alarm.enabled = false;
    }

    saveAlarms();
    renderAlarms();

    startRing(
      "alarm",
      alarm.label || "アラーム",
      `${alarm.time} になりました`
    );

    break;
  }
}


/* ============================================================
   12. タイマー
   ============================================================ */

function readTimerInputMs() {
  const hours =
    clamp(
      Number(dom.timerHours?.value || 0),
      0,
      23
    );

  const minutes =
    clamp(
      Number(dom.timerMinutes?.value || 0),
      0,
      59
    );

  const seconds =
    clamp(
      Number(dom.timerSecondsInput?.value || 0),
      0,
      59
    );

  return (
    hours * 3600 +
    minutes * 60 +
    seconds
  ) * 1000;
}

function setTimerInputs(totalSeconds) {
  const total = Math.max(
    0,
    Math.floor(totalSeconds)
  );

  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (dom.timerHours) {
    dom.timerHours.value = h;
  }

  if (dom.timerMinutes) {
    dom.timerMinutes.value = m;
  }

  if (dom.timerSecondsInput) {
    dom.timerSecondsInput.value = s;
  }

  if (!state.timer.running) {
    state.timer.remainingMs = total * 1000;
    updateTimerDisplay();
  }
}

function updateTimerDisplay() {
  let ms = state.timer.remainingMs;

  if (state.timer.running) {
    ms = Math.max(
      0,
      state.timer.endAt - Date.now()
    );

    state.timer.remainingMs = ms;
  }

  const seconds = Math.ceil(ms / 1000);

  if (dom.timerDisplay) {
    dom.timerDisplay.textContent =
      formatDuration(seconds);
  }

  updateIsland();
}

function startTimer() {
  if (state.timer.running) {
    return;
  }

  let ms = state.timer.remainingMs;

  if (!state.timer.paused || ms <= 0) {
    ms = readTimerInputMs();
  }

  if (ms <= 0) {
    showToast("タイマー時間を設定してください");
    return;
  }

  state.timer.originalMs =
    state.timer.originalMs > 0 &&
    state.timer.paused
      ? state.timer.originalMs
      : ms;

  state.timer.remainingMs = ms;
  state.timer.endAt = Date.now() + ms;
  state.timer.running = true;
  state.timer.paused = false;

  clearInterval(state.timer.interval);

  state.timer.interval =
    setInterval(timerTick, 250);

  timerTick();
}

function timerTick() {
  if (!state.timer.running) return;

  const remaining =
    Math.max(
      0,
      state.timer.endAt - Date.now()
    );

  state.timer.remainingMs = remaining;

  updateTimerDisplay();

  if (remaining <= 0) {
    clearInterval(state.timer.interval);

    state.timer.interval = null;
    state.timer.running = false;
    state.timer.paused = false;
    state.timer.remainingMs = 0;

    updateTimerDisplay();

    startRing(
      "timer",
      "タイマー",
      "時間になりました"
    );
  }
}

function pauseTimer() {
  if (!state.timer.running) return;

  state.timer.remainingMs =
    Math.max(
      0,
      state.timer.endAt - Date.now()
    );

  state.timer.running = false;
  state.timer.paused = true;

  clearInterval(state.timer.interval);
  state.timer.interval = null;

  updateTimerDisplay();
}

function resetTimer() {
  clearInterval(state.timer.interval);

  state.timer.interval = null;
  state.timer.running = false;
  state.timer.paused = false;

  const inputMs = readTimerInputMs();

  state.timer.remainingMs = inputMs;
  state.timer.originalMs = inputMs;

  updateTimerDisplay();
}


/* ============================================================
   13. ストップウォッチ
   ============================================================ */

function stopwatchElapsed() {
  if (!state.stopwatch.running) {
    return state.stopwatch.elapsedBeforeStart;
  }

  return (
    state.stopwatch.elapsedBeforeStart +
    (performance.now() - state.stopwatch.startedAt)
  );
}

function formatStopwatch(ms) {
  const totalTenths =
    Math.floor(ms / 100);

  const tenths =
    totalTenths % 10;

  const totalSeconds =
    Math.floor(totalTenths / 10);

  const seconds =
    totalSeconds % 60;

  const minutes =
    Math.floor(totalSeconds / 60);

  return (
    `${pad2(minutes)}:` +
    `${pad2(seconds)}.` +
    `${tenths}`
  );
}

function updateStopwatchDisplay() {
  if (!dom.stopwatchDisplay) return;

  dom.stopwatchDisplay.textContent =
    formatStopwatch(stopwatchElapsed());
}

function toggleStopwatch() {
  const button = $("#stopwatchStart");

  if (!state.stopwatch.running) {
    state.stopwatch.startedAt =
      performance.now();

    state.stopwatch.running = true;

    state.stopwatch.interval =
      setInterval(
        updateStopwatchDisplay,
        50
      );

    if (button) {
      button.textContent = "一時停止";
    }
  } else {
    state.stopwatch.elapsedBeforeStart =
      stopwatchElapsed();

    state.stopwatch.running = false;

    clearInterval(
      state.stopwatch.interval
    );

    state.stopwatch.interval = null;

    if (button) {
      button.textContent = "再開";
    }

    updateStopwatchDisplay();
  }
}

function addLap() {
  if (
    !state.stopwatch.running &&
    state.stopwatch.elapsedBeforeStart <= 0
  ) {
    return;
  }

  state.stopwatch.laps.unshift(
    stopwatchElapsed()
  );

  renderLaps();
}

function renderLaps() {
  if (!dom.lapList) return;

  dom.lapList.innerHTML = "";

  state.stopwatch.laps.forEach(
    (lap, index) => {
      const row =
        document.createElement("div");

      row.className = "lap-row";

      row.innerHTML = `
        <span>
          ラップ ${
            state.stopwatch.laps.length - index
          }
        </span>

        <strong>
          ${formatStopwatch(lap)}
        </strong>
      `;

      dom.lapList.appendChild(row);
    }
  );
}

function resetStopwatch() {
  clearInterval(
    state.stopwatch.interval
  );

  state.stopwatch.interval = null;
  state.stopwatch.running = false;
  state.stopwatch.startedAt = 0;
  state.stopwatch.elapsedBeforeStart = 0;
  state.stopwatch.laps = [];

  const button = $("#stopwatchStart");

  if (button) {
    button.textContent = "スタート";
  }

  updateStopwatchDisplay();
  renderLaps();
}


/* ============================================================
   14. 鳴動
   ============================================================ */

function createAudioContext() {
  const AudioContextClass =
    window.AudioContext ||
    window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  return new AudioContextClass();
}

function startRing(type, title, subtitle) {
  if (state.ring.active) {
    stopRing();
  }

  state.ring.active = true;
  state.ring.type = type;

  if (dom.ringIcon) {
    dom.ringIcon.textContent =
      type === "timer" ? "⏱️" : "⏰";
  }

  if (dom.ringTitle) {
    dom.ringTitle.textContent = title;
  }

  if (dom.ringSubtitle) {
    dom.ringSubtitle.textContent =
      subtitle;
  }

  dom.ringOverlay?.classList.add("show");

  try {
    const context =
      createAudioContext();

    if (!context) return;

    state.ring.audioContext =
      context;

    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;

    gain.gain.value = 0;

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();

    state.ring.oscillator =
      oscillator;

    state.ring.gain =
      gain;

    let high = false;

    const pulse = () => {
      high = !high;

      const now =
        context.currentTime;

      gain.gain.cancelScheduledValues(now);

      gain.gain.setValueAtTime(
        gain.gain.value,
        now
      );

      gain.gain.linearRampToValueAtTime(
        high ? 0.12 : 0,
        now + 0.08
      );

      oscillator.frequency.setValueAtTime(
        high ? 880 : 660,
        now
      );
    };

    pulse();

    state.ring.pulseInterval =
      setInterval(pulse, 430);
  } catch (error) {
    console.warn(
      "Luma: alarm audio unavailable",
      error
    );
  }
}

function stopRing() {
  state.ring.active = false;

  dom.ringOverlay?.classList.remove(
    "show"
  );

  clearInterval(
    state.ring.pulseInterval
  );

  state.ring.pulseInterval = null;

  try {
    state.ring.oscillator?.stop();
  } catch (_) {}

  try {
    state.ring.audioContext?.close();
  } catch (_) {}

  state.ring.oscillator = null;
  state.ring.audioContext = null;
  state.ring.gain = null;
}


/* ============================================================
   15. 天気
   ============================================================ */

function weatherInfo(code, isDay = 1) {
  const night = Number(isDay) === 0;

  if (code === 0) {
    return {
      icon: night ? "🌙" : "☀️",
      text: "快晴"
    };
  }

  if ([1, 2].includes(code)) {
    return {
      icon: night ? "☁️" : "🌤️",
      text: "晴れ時々くもり"
    };
  }

  if (code === 3) {
    return {
      icon: "☁️",
      text: "くもり"
    };
  }

  if ([45, 48].includes(code)) {
    return {
      icon: "🌫️",
      text: "霧"
    };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return {
      icon: "🌦️",
      text: "霧雨"
    };
  }

  if ([61, 63, 65, 66, 67].includes(code)) {
    return {
      icon: "🌧️",
      text: "雨"
    };
  }

  if ([71, 73, 75, 77].includes(code)) {
    return {
      icon: "🌨️",
      text: "雪"
    };
  }

  if ([80, 81, 82].includes(code)) {
    return {
      icon: "🌦️",
      text: "にわか雨"
    };
  }

  if ([85, 86].includes(code)) {
    return {
      icon: "🌨️",
      text: "にわか雪"
    };
  }

  if ([95, 96, 99].includes(code)) {
    return {
      icon: "⛈️",
      text: "雷雨"
    };
  }

  return {
    icon: "🌤️",
    text: "天気"
  };
}

async function searchWeatherCities() {
  const raw =
    dom.weatherSearchInput?.value.trim() || "";

  if (!raw) {
    dom.weatherSearchStatus.textContent =
      "都市名を入力してください";

    return;
  }

  dom.weatherSearchStatus.textContent =
    "検索しています…";

  dom.weatherSearchResults.innerHTML = "";

  let queries = [raw];

  const stripped =
    raw.replace(
      /(市|区|町|村)$/u,
      ""
    );

  if (
    stripped &&
    stripped !== raw
  ) {
    queries.push(stripped);
  }

  let results = [];

  for (const query of queries) {
    try {
      const url =
        "https://geocoding-api.open-meteo.com/v1/search" +
        `?name=${encodeURIComponent(query)}` +
        "&count=10" +
        "&language=ja" +
        "&format=json" +
        "&countryCode=JP";

      const response =
        await fetch(url);

      if (!response.ok) {
        continue;
      }

      const json =
        await response.json();

      if (
        Array.isArray(json.results) &&
        json.results.length
      ) {
        results = json.results;
        break;
      }
    } catch (error) {
      console.warn(
        "Luma: weather search failed",
        error
      );
    }
  }

  if (!results.length) {
    dom.weatherSearchStatus.textContent =
      "見つかりませんでした。別の地名で検索してください。";

    return;
  }

  dom.weatherSearchStatus.textContent =
    `${results.length}件見つかりました`;

  results.forEach((place) => {
    const button =
      document.createElement("button");

    button.type = "button";
    button.className =
      "weather-result squishy";

    const sub = [
      place.admin1,
      place.admin2,
      place.country
    ]
      .filter(Boolean)
      .join(" / ");

    button.innerHTML = `
      <div>
        <strong>
          ${escapeHTML(place.name)}
        </strong>

        <small>
          ${escapeHTML(sub)}
        </small>
      </div>

      <span>›</span>
    `;

    button.addEventListener(
      "click",
      async () => {
        state.settings.weatherLocation = {
          name: place.name,
          latitude: place.latitude,
          longitude: place.longitude,
          timezone:
            place.timezone || "Asia/Tokyo",
          admin1: place.admin1 || ""
        };

        saveSettings();

        closeModal("weatherModal");

        await fetchWeather();
      }
    );

    dom.weatherSearchResults.appendChild(
      button
    );
  });

  installSquishForNewElements(
    dom.weatherSearchResults
  );
}

async function fetchWeather() {
  const location =
    state.settings.weatherLocation;

  if (!location) {
    renderWeather();
    return;
  }

  if (state.weather.loading) {
    return;
  }

  state.weather.loading = true;

  if (dom.weatherUpdated) {
    dom.weatherUpdated.textContent =
      "天気を取得しています…";
  }

  try {
    const params =
      new URLSearchParams({
        latitude:
          String(location.latitude),

        longitude:
          String(location.longitude),

        current:
          [
            "temperature_2m",
            "relative_humidity_2m",
            "weather_code",
            "wind_speed_10m",
            "is_day"
          ].join(","),

        daily:
          [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min"
          ].join(","),

        timezone:
          location.timezone ||
          "Asia/Tokyo",

        forecast_days: "1"
      });

    const url =
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Weather HTTP ${response.status}`
      );
    }

    const json =
      await response.json();

    const current =
      json.current || {};

    const daily =
      json.daily || {};

    state.weather.data = {
      city: location.name,
      temperature:
        current.temperature_2m,
      humidity:
        current.relative_humidity_2m,
      weatherCode:
        current.weather_code,
      wind:
        current.wind_speed_10m,
      isDay:
        current.is_day,
      high:
        daily.temperature_2m_max?.[0],
      low:
        daily.temperature_2m_min?.[0],
      updatedAt:
        new Date()
    };

    renderWeather();
  } catch (error) {
    console.error(
      "Luma: weather fetch failed",
      error
    );

    if (dom.weatherUpdated) {
      dom.weatherUpdated.textContent =
        "天気を取得できませんでした";
    }

    showToast(
      "天気を取得できませんでした"
    );
  } finally {
    state.weather.loading = false;
  }
}

function renderWeather() {
  const location =
    state.settings.weatherLocation;

  const data =
    state.weather.data;

  if (!location) {
    if (dom.weatherCity) {
      dom.weatherCity.textContent =
        "都市を設定してください";
    }

    if (dom.homeWeatherCity) {
      dom.homeWeatherCity.textContent =
        "天気を設定";
    }

    if (dom.homeTemperature) {
      dom.homeTemperature.textContent =
        "--°";
    }

    return;
  }

  if (!data) {
    if (dom.weatherCity) {
      dom.weatherCity.textContent =
        location.name;
    }

    if (dom.homeWeatherCity) {
      dom.homeWeatherCity.textContent =
        location.name;
    }

    return;
  }

  const info =
    weatherInfo(
      Number(data.weatherCode),
      data.isDay
    );

  if (dom.weatherIcon) {
    dom.weatherIcon.textContent =
      info.icon;
  }

  if (dom.weatherTemperature) {
    dom.weatherTemperature.textContent =
      Number.isFinite(
        Number(data.temperature)
      )
        ? Math.round(data.temperature)
        : "--";
  }

  if (dom.weatherCity) {
    dom.weatherCity.textContent =
      data.city;
  }

  if (dom.weatherDescription) {
    dom.weatherDescription.textContent =
      info.text;
  }

  if (dom.weatherHigh) {
    dom.weatherHigh.textContent =
      Number.isFinite(Number(data.high))
        ? `${Math.round(data.high)}°`
        : "--°";
  }

  if (dom.weatherLow) {
    dom.weatherLow.textContent =
      Number.isFinite(Number(data.low))
        ? `${Math.round(data.low)}°`
        : "--°";
  }

  if (dom.weatherHumidity) {
    dom.weatherHumidity.textContent =
      Number.isFinite(
        Number(data.humidity)
      )
        ? `${Math.round(data.humidity)}%`
        : "--%";
  }

  if (dom.weatherWind) {
    dom.weatherWind.textContent =
      Number.isFinite(Number(data.wind))
        ? `${Math.round(data.wind)} km/h`
        : "-- km/h";
  }

  if (dom.weatherUpdated) {
    const time =
      new Intl.DateTimeFormat(
        "ja-JP",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      ).format(data.updatedAt);

    dom.weatherUpdated.textContent =
      `最終更新 ${time}`;
  }

  if (dom.homeWeatherIcon) {
    dom.homeWeatherIcon.textContent =
      info.icon;
  }

  if (dom.homeTemperature) {
    dom.homeTemperature.textContent =
      Number.isFinite(
        Number(data.temperature)
      )
        ? `${Math.round(
            data.temperature
          )}°`
        : "--°";
  }

  if (dom.homeWeatherCity) {
    dom.homeWeatherCity.textContent =
      data.city;
  }
}


/* ============================================================
   16. IndexedDB
   ============================================================ */

function openLumaDB() {
  return new Promise(
    (resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(
          new Error(
            "IndexedDB unavailable"
          )
        );

        return;
      }

      const request =
        indexedDB.open(
          "LumaOSDatabase",
          2
        );

      request.onupgradeneeded =
        (event) => {
          const db =
            event.target.result;

          if (
            !db.objectStoreNames.contains(
              "assets"
            )
          ) {
            db.createObjectStore(
              "assets"
            );
          }

          if (
            !db.objectStoreNames.contains(
              "tracks"
            )
          ) {
            db.createObjectStore(
              "tracks",
              {
                keyPath: "id"
              }
            );
          }
        };

      request.onsuccess = () => {
        state.db =
          request.result;

        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    }
  );
}

function dbPut(
  storeName,
  value,
  key = undefined
) {
  return new Promise(
    (resolve, reject) => {
      if (!state.db) {
        reject(
          new Error(
            "Database not ready"
          )
        );

        return;
      }

      const tx =
        state.db.transaction(
          storeName,
          "readwrite"
        );

      const store =
        tx.objectStore(storeName);

      const request =
        key === undefined
          ? store.put(value)
          : store.put(value, key);

      request.onsuccess =
        () => resolve();

      request.onerror =
        () => reject(request.error);
    }
  );
}

function dbGet(storeName, key) {
  return new Promise(
    (resolve, reject) => {
      if (!state.db) {
        resolve(undefined);
        return;
      }

      const tx =
        state.db.transaction(
          storeName,
          "readonly"
        );

      const request =
        tx.objectStore(storeName)
          .get(key);

      request.onsuccess =
        () => resolve(request.result);

      request.onerror =
        () => reject(request.error);
    }
  );
}

function dbGetAll(storeName) {
  return new Promise(
    (resolve, reject) => {
      if (!state.db) {
        resolve([]);
        return;
      }

      const tx =
        state.db.transaction(
          storeName,
          "readonly"
        );

      const request =
        tx.objectStore(storeName)
          .getAll();

      request.onsuccess =
        () =>
          resolve(request.result || []);

      request.onerror =
        () => reject(request.error);
    }
  );
}

function dbDelete(storeName, key) {
  return new Promise(
    (resolve, reject) => {
      if (!state.db) {
        resolve();
        return;
      }

      const tx =
        state.db.transaction(
          storeName,
          "readwrite"
        );

      const request =
        tx.objectStore(storeName)
          .delete(key);

      request.onsuccess =
        () => resolve();

      request.onerror =
        () => reject(request.error);
    }
  );
}

function dbClear(storeName) {
  return new Promise(
    (resolve, reject) => {
      if (!state.db) {
        resolve();
        return;
      }

      const tx =
        state.db.transaction(
          storeName,
          "readwrite"
        );

      const request =
        tx.objectStore(storeName)
          .clear();

      request.onsuccess =
        () => resolve();

      request.onerror =
        () => reject(request.error);
    }
  );
}


/* ============================================================
   17. 壁紙
   ============================================================ */

let wallpaperObjectURL = null;

function setWallpaperBlob(blob) {
  if (wallpaperObjectURL) {
    URL.revokeObjectURL(
      wallpaperObjectURL
    );
  }

  wallpaperObjectURL =
    URL.createObjectURL(blob);

  const css =
    `url("${wallpaperObjectURL}")`;

  if (dom.wallpaper) {
    dom.wallpaper.style.backgroundImage =
      css;
  }

  if (dom.wallpaperPreview) {
    dom.wallpaperPreview.style.backgroundImage =
      css;
  }
}

async function loadWallpaper() {
  try {
    const blob =
      await dbGet(
        "assets",
        "wallpaper"
      );

    if (blob instanceof Blob) {
      setWallpaperBlob(blob);
    }
  } catch (error) {
    console.warn(
      "Luma: wallpaper load failed",
      error
    );
  }
}

async function saveWallpaper(file) {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast(
      "画像ファイルを選択してください"
    );

    return;
  }

  try {
    await dbPut(
      "assets",
      file,
      "wallpaper"
    );

    setWallpaperBlob(file);

    showToast("壁紙を変更しました");
  } catch (error) {
    console.error(
      "Luma: wallpaper save failed",
      error
    );

    showToast(
      "壁紙を保存できませんでした"
    );
  }
}

async function resetWallpaper() {
  try {
    await dbDelete(
      "assets",
      "wallpaper"
    );
  } catch (_) {}

  if (wallpaperObjectURL) {
    URL.revokeObjectURL(
      wallpaperObjectURL
    );

    wallpaperObjectURL = null;
  }

  if (dom.wallpaper) {
    dom.wallpaper.style.backgroundImage =
      "";
  }

  if (dom.wallpaperPreview) {
    dom.wallpaperPreview.style.backgroundImage =
      "";
  }

  showToast(
    "デフォルト壁紙に戻しました"
  );
}


/* ============================================================
   18. ミュージック
   ============================================================ */

async function loadMusicLibrary() {
  try {
    state.music.tracks =
      await dbGetAll("tracks");

    state.music.tracks.sort(
      (a, b) =>
        (a.addedAt || 0) -
        (b.addedAt || 0)
    );

    renderMusicLibrary();
  } catch (error) {
    console.warn(
      "Luma: music library load failed",
      error
    );
  }
}

async function addMusicFiles(files) {
  const list =
    Array.from(files || []);

  if (!list.length) return;

  let added = 0;

  for (const file of list) {
    if (!file.type.startsWith("audio/")) {
      continue;
    }

    const track = {
      id: uid("track"),
      title:
        file.name.replace(
          /\.[^.]+$/,
          ""
        ),
      fileName: file.name,
      type: file.type,
      blob: file,
      addedAt: Date.now() + added
    };

    try {
      await dbPut(
        "tracks",
        track
      );

      state.music.tracks.push(track);

      added++;
    } catch (error) {
      console.warn(
        "Luma: track save failed",
        error
      );
    }
  }

  renderMusicLibrary();

  if (
    state.music.currentIndex < 0 &&
    state.music.tracks.length
  ) {
    loadTrack(0, false);
  }

  showToast(
    added
      ? `${added}曲追加しました`
      : "追加できる音楽がありませんでした"
  );
}

function renderMusicLibrary() {
  if (!dom.musicLibrary) return;

  dom.musicLibrary.innerHTML = "";

  if (!state.music.tracks.length) {
    dom.musicLibrary.innerHTML = `
      <div class="home-empty">
        ＋からこの端末の音楽を追加できます
      </div>
    `;

    return;
  }

  state.music.tracks.forEach(
    (track, index) => {
      const row =
        document.createElement("div");

      row.className =
        "track-row squishy-soft";

      if (
        index ===
        state.music.currentIndex
      ) {
        row.classList.add("active");
      }

      row.innerHTML = `
        <div class="track-name">
          ${escapeHTML(track.title)}
        </div>

        <button
          class="icon-button track-delete squishy"
          data-id="${track.id}"
          type="button"
          aria-label="曲を削除"
        >
          ×
        </button>
      `;

      row.addEventListener(
        "click",
        (event) => {
          if (
            event.target.closest(
              ".track-delete"
            )
          ) {
            return;
          }

          loadTrack(index, true);
        }
      );

      dom.musicLibrary.appendChild(row);
    }
  );

  installSquishForNewElements(
    dom.musicLibrary
  );
}

function loadTrack(
  index,
  autoplay = false
) {
  const track =
    state.music.tracks[index];

  if (!track || !dom.audioPlayer) {
    return;
  }

  if (state.music.objectURL) {
    URL.revokeObjectURL(
      state.music.objectURL
    );
  }

  state.music.objectURL =
    URL.createObjectURL(track.blob);

  dom.audioPlayer.src =
    state.music.objectURL;

  state.music.currentIndex =
    index;

  if (dom.musicTitle) {
    dom.musicTitle.textContent =
      track.title;
  }

  if (dom.musicArtist) {
    dom.musicArtist.textContent =
      "この端末の音楽";
  }

  renderMusicLibrary();

  if (autoplay) {
    dom.audioPlayer
      .play()
      .catch((error) => {
        console.warn(
          "Luma: audio play blocked",
          error
        );

        showToast(
          "再生ボタンを押してください"
        );
      });
  }

  updateIsland();
}

function toggleMusic() {
  if (!dom.audioPlayer) return;

  if (
    state.music.currentIndex < 0
  ) {
    if (
      state.music.tracks.length
    ) {
      loadTrack(0, false);
    } else {
      showToast(
        "先に曲を追加してください"
      );

      return;
    }
  }

  if (dom.audioPlayer.paused) {
    dom.audioPlayer
      .play()
      .catch(() => {
        showToast(
          "音楽を再生できませんでした"
        );
      });
  } else {
    dom.audioPlayer.pause();
  }
}

function nextTrack() {
  if (!state.music.tracks.length) {
    return;
  }

  let next =
    state.music.currentIndex + 1;

  if (
    next >= state.music.tracks.length
  ) {
    next = 0;
  }

  loadTrack(next, true);
}

function previousTrack() {
  if (!state.music.tracks.length) {
    return;
  }

  let previous =
    state.music.currentIndex - 1;

  if (previous < 0) {
    previous =
      state.music.tracks.length - 1;
  }

  loadTrack(previous, true);
}

async function deleteTrack(id) {
  const index =
    state.music.tracks.findIndex(
      (track) => track.id === id
    );

  if (index < 0) return;

  const deletingCurrent =
    index ===
    state.music.currentIndex;

  try {
    await dbDelete(
      "tracks",
      id
    );
  } catch (error) {
    console.warn(
      "Luma: track delete failed",
      error
    );
  }

  state.music.tracks.splice(
    index,
    1
  );

  if (deletingCurrent) {
    dom.audioPlayer?.pause();

    if (state.music.objectURL) {
      URL.revokeObjectURL(
        state.music.objectURL
      );

      state.music.objectURL = null;
    }

    state.music.currentIndex = -1;

    if (dom.audioPlayer) {
      dom.audioPlayer.removeAttribute(
        "src"
      );

      dom.audioPlayer.load();
    }

    if (dom.musicTitle) {
      dom.musicTitle.textContent =
        "曲を追加してください";
    }

    if (dom.musicArtist) {
      dom.musicArtist.textContent =
        "この端末の音楽";
    }
  } else if (
    index <
    state.music.currentIndex
  ) {
    state.music.currentIndex--;
  }

  renderMusicLibrary();
  updateIsland();
}


/* ============================================================
   19. Dynamic Island
   ============================================================ */

function updateIsland() {
  if (!dom.dynamicIsland) return;

  /*
    優先順位
    1. タイマー
    2. 再生中の音楽
    3. Luma
  */

  if (
    state.settings.timerIsland &&
    (
      state.timer.running ||
      state.timer.paused
    ) &&
    state.timer.remainingMs > 0
  ) {
    dom.islandArtwork?.classList.remove(
      "hidden"
    );

    if (dom.islandArtwork) {
      dom.islandArtwork.textContent =
        "⏱";
    }

    if (dom.islandTitle) {
      dom.islandTitle.textContent =
        state.timer.running
          ? "タイマー"
          : "タイマー 一時停止";
    }

    if (dom.islandSubtitle) {
      dom.islandSubtitle.textContent =
        "Luma Timer";
    }

    if (dom.islandRight) {
      dom.islandRight.textContent =
        formatDuration(
          Math.ceil(
            state.timer.remainingMs /
            1000
          )
        );
    }

    return;
  }

  const audio =
    dom.audioPlayer;

  const currentTrack =
    state.music.tracks[
      state.music.currentIndex
    ];

  if (
    state.settings.musicIsland &&
    audio &&
    !audio.paused &&
    currentTrack
  ) {
    dom.islandArtwork?.classList.remove(
      "hidden"
    );

    if (dom.islandArtwork) {
      dom.islandArtwork.textContent =
        "♪";
    }

    if (dom.islandTitle) {
      dom.islandTitle.textContent =
        currentTrack.title;
    }

    if (dom.islandSubtitle) {
      dom.islandSubtitle.textContent =
        "再生中";
    }

    if (dom.islandRight) {
      dom.islandRight.textContent =
        "Ⅱ";
    }

    return;
  }

  dom.islandArtwork?.classList.add(
    "hidden"
  );

  if (dom.islandTitle) {
    dom.islandTitle.textContent =
      "Luma";
  }

  if (dom.islandSubtitle) {
    dom.islandSubtitle.textContent =
      "OS 1.0";
  }

  if (dom.islandRight) {
    dom.islandRight.textContent = "";
  }
}


/* ============================================================
   20. 設定タブ
   ============================================================ */

function openSettingsPanel(name) {
  $$(".settings-tab").forEach(
    (button) => {
      button.classList.toggle(
        "active",
        button.dataset.settings === name
      );
    }
  );

  $$(".settings-panel").forEach(
    (panel) => {
      panel.classList.remove("active");
    }
  );

  $(`#settings-${name}`)
    ?.classList.add("active");
}


/* ============================================================
   21. 全データリセット
   ============================================================ */

async function resetAllData() {
  const confirmed =
    window.confirm(
      "Lumaの設定・アラーム・予定・壁紙・保存した曲をすべて削除しますか？"
    );

  if (!confirmed) return;

  try {
    dom.audioPlayer?.pause();

    localStorage.removeItem(
      "lumaSettings"
    );

    localStorage.removeItem(
      "lumaAlarms"
    );

    localStorage.removeItem(
      "lumaReminders"
    );

    await dbClear("assets");
    await dbClear("tracks");

    showToast(
      "Lumaをリセットしました"
    );

    setTimeout(() => {
      location.reload();
    }, 700);
  } catch (error) {
    console.error(
      "Luma: reset failed",
      error
    );

    showToast(
      "リセットに失敗しました"
    );
  }
}


/* ============================================================
   22. 動的要素にもボヨン
   ============================================================ */

function installSquishForNewElements(
  root
) {
  if (!root) return;

  const targets = [
    ...root.querySelectorAll(
      ".squishy, .squishy-soft"
    )
  ];

  targets.forEach((element) => {
    if (
      element.dataset.squishInstalled ===
      "true"
    ) {
      return;
    }

    element.dataset.squishInstalled =
      "true";

    element.addEventListener(
      "pointerdown",
      (event) => {
        if (
          event.pointerType === "mouse" &&
          event.button !== 0
        ) {
          return;
        }

        squishElement(
          element,
          event
        );
      },
      { passive: true }
    );

    element.addEventListener(
      "pointerup",
      () =>
        releaseSquish(element),
      { passive: true }
    );

    element.addEventListener(
      "pointercancel",
      () =>
        releaseSquish(element),
      { passive: true }
    );

    element.addEventListener(
      "pointerleave",
      () =>
        releaseSquish(element),
      { passive: true }
    );
  });
}


/* ============================================================
   23. イベント
   ============================================================ */

function installEvents() {

  /* --------------------------
     メニュー
  -------------------------- */

  dom.menuButton?.addEventListener(
    "click",
    openMenu
  );

  dom.menuCloseButton?.addEventListener(
    "click",
    closeMenu
  );

  dom.menuBackdrop?.addEventListener(
    "click",
    closeMenu
  );

  $$(".menu-item").forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          openPage(
            button.dataset.page
          );
        }
      );
    }
  );

  $$(".close-page").forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => openPage("home")
      );
    }
  );


  /* --------------------------
     ホーム
  -------------------------- */

  dom.homeWeather?.addEventListener(
    "click",
    () => {
      openPage("weather");

      if (
        !state.settings.weatherLocation
      ) {
        openModal("weatherModal");
      }
    }
  );

  dom.homeReminderAdd?.addEventListener(
    "click",
    prepareReminderModal
  );


  /* --------------------------
     モーダル
  -------------------------- */

  $$(".modal-close").forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          closeModal(
            button.dataset.closeModal
          );
        }
      );
    }
  );

  $$(".modal-layer").forEach(
    (modal) => {
      modal.addEventListener(
        "pointerdown",
        (event) => {
          if (event.target === modal) {
            modal.classList.remove(
              "show"
            );
          }
        }
      );
    }
  );


  /* --------------------------
     リマインダー
  -------------------------- */

  $("#addReminderButton")
    ?.addEventListener(
      "click",
      prepareReminderModal
    );

  $("#saveReminderButton")
    ?.addEventListener(
      "click",
      addReminder
    );

  dom.reminderList?.addEventListener(
    "click",
    (event) => {
      const toggle =
        event.target.closest(
          ".reminder-toggle"
        );

      if (toggle) {
        toggleReminder(
          toggle.dataset.id
        );

        return;
      }

      const del =
        event.target.closest(
          ".reminder-delete"
        );

      if (del) {
        deleteReminder(
          del.dataset.id
        );
      }
    }
  );

  dom.homeReminderList
    ?.addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(
            ".home-reminder-toggle"
          );

        if (button) {
          toggleReminder(
            button.dataset.id
          );
        }
      }
    );


  /* --------------------------
     アラーム
  -------------------------- */

  $("#addAlarmButton")
    ?.addEventListener(
      "click",
      prepareAlarmModal
    );

  $("#saveAlarmButton")
    ?.addEventListener(
      "click",
      addAlarm
    );

  dom.alarmList?.addEventListener(
    "change",
    (event) => {
      const toggle =
        event.target.closest(
          ".alarm-toggle"
        );

      if (!toggle) return;

      const alarm =
        state.alarms.find(
          (item) =>
            item.id ===
            toggle.dataset.id
        );

      if (!alarm) return;

      alarm.enabled =
        toggle.checked;

      saveAlarms();
    }
  );

  dom.alarmList?.addEventListener(
    "click",
    (event) => {
      const del =
        event.target.closest(
          ".alarm-delete"
        );

      if (!del) return;

      state.alarms =
        state.alarms.filter(
          (alarm) =>
            alarm.id !==
            del.dataset.id
        );

      saveAlarms();
      renderAlarms();
    }
  );


  /* --------------------------
     タイマー
  -------------------------- */

  $$(".preset-button").forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          const minutes =
            Number(
              button.dataset.minutes
            );

          setTimerInputs(
            minutes * 60
          );

          state.timer.paused = false;
          state.timer.originalMs =
            minutes * 60 * 1000;
        }
      );
    }
  );

  $("#timerStart")
    ?.addEventListener(
      "click",
      startTimer
    );

  $("#timerPause")
    ?.addEventListener(
      "click",
      pauseTimer
    );

  $("#timerReset")
    ?.addEventListener(
      "click",
      resetTimer
    );

  [
    dom.timerHours,
    dom.timerMinutes,
    dom.timerSecondsInput
  ].forEach((input) => {
    input?.addEventListener(
      "change",
      () => {
        if (!state.timer.running) {
          state.timer.paused = false;
          state.timer.remainingMs =
            readTimerInputMs();

          state.timer.originalMs =
            state.timer.remainingMs;

          updateTimerDisplay();
        }
      }
    );
  });


  /* --------------------------
     ストップウォッチ
  -------------------------- */

  $("#stopwatchStart")
    ?.addEventListener(
      "click",
      toggleStopwatch
    );

  $("#stopwatchLap")
    ?.addEventListener(
      "click",
      addLap
    );

  $("#stopwatchReset")
    ?.addEventListener(
      "click",
      resetStopwatch
    );


  /* --------------------------
     天気
  -------------------------- */

  $("#weatherSearchButton")
    ?.addEventListener(
      "click",
      () => {
        openModal(
          "weatherModal"
        );

        setTimeout(
          () =>
            dom.weatherSearchInput
              ?.focus(),
          100
        );
      }
    );

  $("#weatherSearchSubmit")
    ?.addEventListener(
      "click",
      searchWeatherCities
    );

  dom.weatherSearchInput
    ?.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          event.preventDefault();

          searchWeatherCities();
        }
      }
    );


  /* --------------------------
     ミュージック
  -------------------------- */

  dom.musicFileInput
    ?.addEventListener(
      "change",
      async (event) => {
        await addMusicFiles(
          event.target.files
        );

        event.target.value = "";
      }
    );

  dom.musicPlay?.addEventListener(
    "click",
    toggleMusic
  );

  dom.musicPrevious
    ?.addEventListener(
      "click",
      previousTrack
    );

  dom.musicNext?.addEventListener(
    "click",
    nextTrack
  );

  dom.musicVolume?.addEventListener(
    "input",
    () => {
      if (dom.audioPlayer) {
        dom.audioPlayer.volume =
          Number(
            dom.musicVolume.value
          );
      }
    }
  );

  dom.musicProgress
    ?.addEventListener(
      "input",
      () => {
        const audio =
          dom.audioPlayer;

        if (
          !audio ||
          !Number.isFinite(
            audio.duration
          ) ||
          audio.duration <= 0
        ) {
          return;
        }

        audio.currentTime =
          (
            Number(
              dom.musicProgress.value
            ) / 100
          ) *
          audio.duration;
      }
    );

  dom.audioPlayer
    ?.addEventListener(
      "play",
      () => {
        if (dom.musicPlay) {
          dom.musicPlay.textContent =
            "Ⅱ";
        }

        updateIsland();
      }
    );

  dom.audioPlayer
    ?.addEventListener(
      "pause",
      () => {
        if (dom.musicPlay) {
          dom.musicPlay.textContent =
            "▶";
        }

        updateIsland();
      }
    );

  dom.audioPlayer
    ?.addEventListener(
      "timeupdate",
      () => {
        const audio =
          dom.audioPlayer;

        if (!audio) return;

        if (
          Number.isFinite(
            audio.duration
          ) &&
          audio.duration > 0
        ) {
          dom.musicProgress.value =
            (
              audio.currentTime /
              audio.duration
            ) * 100;

          dom.musicDuration.textContent =
            formatMediaTime(
              audio.duration
            );
        }

        dom.musicCurrentTime.textContent =
          formatMediaTime(
            audio.currentTime
          );
      }
    );

  dom.audioPlayer
    ?.addEventListener(
      "ended",
      nextTrack
    );

  dom.musicLibrary
    ?.addEventListener(
      "click",
      async (event) => {
        const button =
          event.target.closest(
            ".track-delete"
          );

        if (!button) return;

        event.stopPropagation();

        await deleteTrack(
          button.dataset.id
        );
      }
    );


  /* --------------------------
     設定タブ
  -------------------------- */

  $$(".settings-tab").forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          openSettingsPanel(
            button.dataset.settings
          );
        }
      );
    }
  );


  /* --------------------------
     表示設定
  -------------------------- */

  dom.showSecondsSetting
    ?.addEventListener(
      "change",
      () => {
        state.settings.showSeconds =
          dom.showSecondsSetting.checked;

        saveSettings();
        applySettings();
      }
    );

  dom.showHomeReminderSetting
    ?.addEventListener(
      "change",
      () => {
        state.settings.showHomeReminder =
          dom.showHomeReminderSetting
            .checked;

        saveSettings();
        applySettings();
      }
    );

  dom.showHomeWeatherSetting
    ?.addEventListener(
      "change",
      () => {
        state.settings.showHomeWeather =
          dom.showHomeWeatherSetting
            .checked;

        saveSettings();
        applySettings();
      }
    );


  /* --------------------------
     壁紙設定
  -------------------------- */

  dom.wallpaperFileInput
    ?.addEventListener(
      "change",
      async (event) => {
        const file =
          event.target.files?.[0];

        if (file) {
          await saveWallpaper(file);
        }

        event.target.value = "";
      }
    );

  $("#resetWallpaperButton")
    ?.addEventListener(
      "click",
      resetWallpaper
    );

  dom.wallpaperBrightness
    ?.addEventListener(
      "input",
      () => {
        state.settings.wallpaperBrightness =
          Number(
            dom.wallpaperBrightness.value
          );

        saveSettings();
        applySettings();
      }
    );


  /* --------------------------
     時計ガラス設定
  -------------------------- */

  $$(".glass-color").forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          state.settings.clockColor =
            button.dataset.color;

          saveSettings();
          applySettings();
        }
      );
    }
  );

  dom.clockOpacity
    ?.addEventListener(
      "input",
      () => {
        state.settings.clockOpacity =
          Number(
            dom.clockOpacity.value
          );

        saveSettings();
        applySettings();
      }
    );

  dom.clockBrightness
    ?.addEventListener(
      "input",
      () => {
        state.settings.clockBrightness =
          Number(
            dom.clockBrightness.value
          );

        saveSettings();
        applySettings();
      }
    );

  dom.squishStrength
    ?.addEventListener(
      "input",
      () => {
        state.settings.squishStrength =
          Number(
            dom.squishStrength.value
          );

        saveSettings();
        syncSettingsUI();
      }
    );

  dom.clockFontSetting
    ?.addEventListener(
      "change",
      () => {
        state.settings.clockFont =
          dom.clockFontSetting.value;

        saveSettings();
        applySettings();
      }
    );


  /* --------------------------
     Island設定
  -------------------------- */

  dom.timerIslandSetting
    ?.addEventListener(
      "change",
      () => {
        state.settings.timerIsland =
          dom.timerIslandSetting
            .checked;

        saveSettings();
        updateIsland();
      }
    );

  dom.musicIslandSetting
    ?.addEventListener(
      "change",
      () => {
        state.settings.musicIsland =
          dom.musicIslandSetting
            .checked;

        saveSettings();
        updateIsland();
      }
    );


  /* --------------------------
     リセット
  -------------------------- */

  $("#resetAllButton")
    ?.addEventListener(
      "click",
      resetAllData
    );


  /* --------------------------
     鳴動停止
  -------------------------- */

  $("#ringStopButton")
    ?.addEventListener(
      "click",
      stopRing
    );


  /* --------------------------
     Islandタップ
  -------------------------- */

  dom.dynamicIsland
    ?.addEventListener(
      "click",
      () => {
        if (
          state.timer.running ||
          state.timer.paused
        ) {
          openPage("timer");
          return;
        }

        if (
          dom.audioPlayer &&
          !dom.audioPlayer.paused
        ) {
          openPage("music");
        }
      }
    );


  /* --------------------------
     タブ復帰
  -------------------------- */

  document.addEventListener(
    "visibilitychange",
    () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        if (state.timer.running) {
          timerTick();
        }

        updateClock();
      }
    }
  );
}


/* ============================================================
   24. 初期化
   ============================================================ */

async function init() {
  /*
    重要：
    前回と違い、state（アラーム等）は
    この時点ですでに全て初期化済み。
  */

  cacheDOM();

  installEvents();

  installSquish();

  applySettings();

  renderReminders();
  renderAlarms();

  updateClock();
  updateStopwatchDisplay();

  state.timer.remainingMs =
    readTimerInputMs();

  state.timer.originalMs =
    state.timer.remainingMs;

  updateTimerDisplay();

  updateIsland();

  if (dom.audioPlayer) {
    dom.audioPlayer.volume =
      Number(
        dom.musicVolume?.value || 0.8
      );
  }

  /*
    時計は最後に定期実行開始。
    初期化途中でcheckAlarms()を呼ばない。
  */

  setInterval(() => {
    safeRun(
      "clock update",
      updateClock
    );
  }, 1000);


  /* IndexedDB */

  await safeRunAsync(
    "database initialization",
    async () => {
      await openLumaDB();

      await Promise.all([
        loadWallpaper(),
        loadMusicLibrary()
      ]);
    }
  );


  /* 天気 */

  if (
    state.settings.weatherLocation
  ) {
    await safeRunAsync(
      "weather initialization",
      fetchWeather
    );
  } else {
    renderWeather();
  }


  /*
    30分ごとに天気を更新。
    都市が設定されている場合のみ。
  */

  setInterval(() => {
    if (
      state.settings.weatherLocation
    ) {
      safeRunAsync(
        "weather refresh",
        fetchWeather
      );
    }
  }, 30 * 60 * 1000);


  openPage("home");

  console.log(
    "Luma OS 1.0 ready."
  );
}


/* ============================================================
   25. 起動
   ============================================================ */

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      init().catch((error) => {
        console.error(
          "Luma fatal initialization error:",
          error
        );
      });
    }
  );
} else {
  init().catch((error) => {
    console.error(
      "Luma fatal initialization error:",
      error
    );
  });
}
