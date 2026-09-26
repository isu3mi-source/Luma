/* =========================================================
   Luma v1.0
   Glass Clock Dashboard
========================================================= */

"use strict";

/* =========================================================
   基本要素
========================================================= */

const $ = id => document.getElementById(id);

const menuButton = $("menuButton");
const closeButton = $("closeButton");
const sideMenu = $("sideMenu");
const menuOverlay = $("menuOverlay");
const weatherMini = $("weatherMini");

const island = $("island");
const islandLeft = $("islandLeft");
const islandCenter = $("islandCenter");
const islandRight = $("islandRight");

const root = document.documentElement;


/* =========================================================
   安全な保存
========================================================= */

function loadJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}


/* =========================================================
   時計
========================================================= */

let showSeconds =
  localStorage.getItem("lumaSeconds") === "true";

function updateClock() {

  const now = new Date();

  const hour =
    String(now.getHours()).padStart(2, "0");

  const minute =
    String(now.getMinutes()).padStart(2, "0");

  const second =
    String(now.getSeconds()).padStart(2, "0");

  $("clockText").textContent =
    showSeconds
      ? `${hour}:${minute}:${second}`
      : `${hour}:${minute}`;

  const week =
    ["日", "月", "火", "水", "木", "金", "土"];

  $("dateText").textContent =
    `${now.getMonth() + 1}月${now.getDate()}日（${week[now.getDay()]}）`;

  updateWorldClock();
  checkAlarms();
}

updateClock();

setInterval(updateClock, 1000);


/* =========================================================
   メニュー
========================================================= */

menuButton.addEventListener("click", () => {

  sideMenu.classList.add("show");
  menuOverlay.classList.add("show");

});

menuOverlay.addEventListener("click", closeMenu);

function closeMenu() {

  sideMenu.classList.remove("show");
  menuOverlay.classList.remove("show");

}


/* =========================================================
   ページ切替
========================================================= */

function openPage(name) {

  document
    .querySelectorAll(".page")
    .forEach(page => page.classList.remove("active"));

  const target = $(name + "Page");

  if (target) {
    target.classList.add("active");
  }

  const home = name === "home";

  menuButton.style.display =
    home ? "flex" : "none";

  closeButton.style.display =
    home ? "none" : "block";

  weatherMini.style.display =
    home && homeWeatherToggle.checked
      ? "flex"
      : "none";

  closeMenu();

  if (name === "reminder") {
    drawReminders();
  }

  if (name === "alarm") {
    drawAlarms();
  }

}

closeButton.addEventListener("click", () => {
  openPage("home");
});


/* =========================================================
   Dynamic Island
========================================================= */

function resetIsland() {

  island.className = "";

  islandLeft.textContent = "";
  islandCenter.innerHTML =
    '<span id="islandTitle">Luma</span>';
  islandRight.textContent = "";

}

function showTimerIsland(text) {

  if (!$("timerIslandToggle").checked) {
    return;
  }

  island.className = "timer";

  islandLeft.textContent = "◴";
  islandCenter.textContent = "";
  islandRight.textContent = text;

}

function showMusicIsland() {

  if (!$("musicIslandToggle").checked) {
    return;
  }

  island.className = "music";

  islandLeft.textContent = "";
  islandCenter.textContent = "Luma";
  islandRight.textContent = "♪";

}


/* =========================================================
   タイマー
========================================================= */

let timerDefault = 300;
let timerSeconds = 300;
let timerID = null;

function timerText() {

  const minutes =
    Math.floor(timerSeconds / 60);

  const seconds =
    timerSeconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
  );

}

function drawTimer() {

  const text = timerText();

  $("timerDisplay").textContent = text;

  if (timerID) {
    showTimerIsland(text);
  }

}

function setTimer(seconds) {

  pauseTimer();

  timerDefault = seconds;
  timerSeconds = seconds;

  drawTimer();
  resetIsland();

}

function startTimer() {

  if (timerID) return;

  showTimerIsland(timerText());

  timerID = setInterval(() => {

    timerSeconds--;

    if (timerSeconds <= 0) {

      timerSeconds = 0;

      drawTimer();

      clearInterval(timerID);
      timerID = null;

      resetIsland();

      playBeep();

      setTimeout(() => {
        alert("タイマーが終了しました");
      }, 100);

      return;
    }

    drawTimer();

  }, 1000);

}

function pauseTimer() {

  if (timerID) {

    clearInterval(timerID);
    timerID = null;

  }

  if ($("audioPlayer").paused) {
    resetIsland();
  }

}

function resetTimer() {

  pauseTimer();

  timerSeconds = timerDefault;

  drawTimer();
  resetIsland();

}


/* =========================================================
   簡易通知音
========================================================= */

function playBeep() {

  try {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    const ctx = new AudioContext();

    const oscillator =
      ctx.createOscillator();

    const gain =
      ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.value = 880;

    gain.gain.setValueAtTime(
      0.25,
      ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + 0.8
    );

    oscillator.start();

    oscillator.stop(
      ctx.currentTime + 0.8
    );

  } catch {
    // 音が使用できない環境では何もしない
  }

}


/* =========================================================
   ストップウォッチ
========================================================= */

let stopwatchElapsed = 0;
let stopwatchStart = 0;
let stopwatchID = null;

function startStopwatch() {

  if (stopwatchID) return;

  stopwatchStart =
    Date.now() - stopwatchElapsed;

  stopwatchID =
    setInterval(() => {

      stopwatchElapsed =
        Date.now() - stopwatchStart;

      drawStopwatch();

    }, 100);

}

function pauseStopwatch() {

  if (stopwatchID) {

    clearInterval(stopwatchID);
    stopwatchID = null;

  }

}

function resetStopwatch() {

  pauseStopwatch();

  stopwatchElapsed = 0;

  drawStopwatch();

}

function drawStopwatch() {

  const tenths =
    Math.floor(stopwatchElapsed / 100);

  const minutes =
    Math.floor(tenths / 600);

  const seconds =
    Math.floor((tenths % 600) / 10);

  const decimal =
    tenths % 10;

  $("stopwatchDisplay").textContent =
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0") +
    "." +
    decimal;

}


/* =========================================================
   世界時計
========================================================= */

function zoneTime(zone) {

  return new Intl.DateTimeFormat(
    "ja-JP",
    {
      timeZone: zone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }
  ).format(new Date());

}

function updateWorldClock() {

  $("tokyoTime").textContent =
    zoneTime("Asia/Tokyo");

  $("londonTime").textContent =
    zoneTime("Europe/London");

  $("newYorkTime").textContent =
    zoneTime("America/New_York");

  $("parisTime").textContent =
    zoneTime("Europe/Paris");

}


/* =========================================================
   リマインダー
========================================================= */

let reminders =
  loadJSON("lumaReminders", []);

function openReminderEditor() {

  const today =
    new Date().toISOString().split("T")[0];

  $("reminderTextInput").value = "";
  $("reminderDateInput").value = today;
  $("reminderTimeInput").value = "";

  $("reminderModal").classList.add("show");

}

function closeReminderEditor() {

  $("reminderModal").classList.remove("show");

}

function saveReminderFromEditor() {

  const text =
    $("reminderTextInput").value.trim();

  const date =
    $("reminderDateInput").value;

  const time =
    $("reminderTimeInput").value;

  if (!text) {

    alert("内容を入力してください");
    return;

  }

  reminders.push({

    id: Date.now(),
    text,
    date,
    time,
    completed: false

  });

  saveReminders();

  closeReminderEditor();

  drawReminders();
  drawHomeReminders();

}

function saveReminders() {

  saveJSON(
    "lumaReminders",
    reminders
  );

}

function toggleReminder(id) {

  const item =
    reminders.find(
      reminder => reminder.id === id
    );

  if (!item) return;

  item.completed = !item.completed;

  saveReminders();

  drawReminders();
  drawHomeReminders();

}

function deleteReminder(id) {

  reminders =
    reminders.filter(
      reminder => reminder.id !== id
    );

  saveReminders();

  drawReminders();
  drawHomeReminders();

}

function drawReminders() {

  const list = $("reminderList");

  list.innerHTML = "";

  $("reminderEmpty").style.display =
    reminders.length ? "none" : "block";

  reminders
    .slice()
    .sort((a, b) => {

      const aa =
        `${a.date || ""} ${a.time || ""}`;

      const bb =
        `${b.date || ""} ${b.time || ""}`;

      return aa.localeCompare(bb);

    })
    .forEach(item => {

      const row =
        document.createElement("div");

      row.className = "reminderItem";

      const check =
        document.createElement("button");

      check.className =
        "reminderCheck" +
        (item.completed
          ? " completed"
          : "");

      check.onclick =
        () => toggleReminder(item.id);

      const body =
        document.createElement("div");

      body.className =
        "reminderBody";

      const title =
        document.createElement("div");

      title.className =
        "reminderTitle";

      title.textContent = item.text;

      if (item.completed) {

        title.style.textDecoration =
          "line-through";

        title.style.opacity = ".5";

      }

      const meta =
        document.createElement("div");

      meta.className =
        "reminderMeta";

      meta.textContent =
        [item.date, item.time]
          .filter(Boolean)
          .join("　");

      const del =
        document.createElement("button");

      del.className =
        "deleteReminder";

      del.textContent = "×";

      del.onclick =
        () => deleteReminder(item.id);

      body.appendChild(title);
      body.appendChild(meta);

      row.appendChild(check);
      row.appendChild(body);
      row.appendChild(del);

      list.appendChild(row);

    });

}


/* =========================================================
   HOME リマインダー
========================================================= */

function localDateString(date = new Date()) {

  const y = date.getFullYear();

  const m =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const d =
    String(date.getDate())
      .padStart(2, "0");

  return `${y}-${m}-${d}`;

}

function drawHomeReminders() {

  const list =
    $("homeReminderList");

  const empty =
    $("homeReminderEmpty");

  list.innerHTML = "";

  const today =
    localDateString();

  const todayItems =
    reminders
      .filter(item =>
        item.date === today &&
        !item.completed
      )
      .sort((a, b) =>
        (a.time || "99:99")
          .localeCompare(
            b.time || "99:99"
          )
      );

  empty.style.display =
    todayItems.length
      ? "none"
      : "block";

  todayItems.forEach(item => {

    const row =
      document.createElement("div");

    row.className =
      "homeReminder";

    const check =
      document.createElement("button");

    check.onclick =
      () => toggleReminder(item.id);

    const text =
      document.createElement("span");

    text.textContent = item.text;

    row.appendChild(check);
    row.appendChild(text);

    if (item.time) {

      const time =
        document.createElement("time");

      time.textContent = item.time;

      row.appendChild(time);

    }

    list.appendChild(row);

  });

}


/* =========================================================
   アラーム
========================================================= */

let alarms =
  loadJSON("lumaAlarms", []);

let lastAlarmKey = "";

function addAlarm() {

  const time =
    prompt(
      "アラーム時刻を入力してください\n例：07:30"
    );

  if (!time) return;

  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  ) {

    alert(
      "07:30 のように入力してください"
    );

    return;
  }

  const label =
    prompt(
      "アラーム名を入力してください",
      "アラーム"
    ) || "アラーム";

  alarms.push({

    id: Date.now(),
    time,
    label,
    enabled: true

  });

  saveJSON(
    "lumaAlarms",
    alarms
  );

  drawAlarms();

}

function toggleAlarm(id) {

  const alarm =
    alarms.find(item => item.id === id);

  if (!alarm) return;

  alarm.enabled =
    !alarm.enabled;

  saveJSON(
    "lumaAlarms",
    alarms
  );

  drawAlarms();

}

function deleteAlarm(id) {

  alarms =
    alarms.filter(
      item => item.id !== id
    );

  saveJSON(
    "lumaAlarms",
    alarms
  );

  drawAlarms();

}

function drawAlarms() {

  const list = $("alarmList");

  list.innerHTML = "";

  $("alarmEmpty").style.display =
    alarms.length
      ? "none"
      : "block";

  alarms
    .slice()
    .sort(
      (a, b) =>
        a.time.localeCompare(b.time)
    )
    .forEach(alarm => {

      const row =
        document.createElement("div");

      row.className =
        "alarmItem";

      const time =
        document.createElement("div");

      time.className =
        "alarmTime";

      time.textContent =
        alarm.time;

      const info =
        document.createElement("div");

      info.className =
        "alarmInfo";

      info.textContent =
        alarm.label;

      const toggle =
        document.createElement("input");

      toggle.type =
        "checkbox";

      toggle.checked =
        alarm.enabled;

      toggle.style.marginLeft =
        "auto";

      toggle.style.width =
        "24px";

      toggle.style.height =
        "24px";

      toggle.onclick =
        () => toggleAlarm(alarm.id);

      const del =
        document.createElement("button");

      del.textContent = "×";

      del.style.marginLeft =
        "15px";

      del.style.border =
        "0";

      del.style.borderRadius =
        "12px";

      del.style.width =
        "38px";

      del.style.height =
        "38px";

      del.style.color =
        "white";

      del.style.background =
        "rgba(220,60,60,.6)";

      del.onclick =
        () => deleteAlarm(alarm.id);

      row.appendChild(time);
      row.appendChild(info);
      row.appendChild(toggle);
      row.appendChild(del);

      list.appendChild(row);

    });

}

function checkAlarms() {

  const now = new Date();

  const hh =
    String(now.getHours())
      .padStart(2, "0");

  const mm =
    String(now.getMinutes())
      .padStart(2, "0");

  const current =
    `${hh}:${mm}`;

  const key =
    `${localDateString(now)}-${current}`;

  if (lastAlarmKey === key) {
    return;
  }

  const alarm =
    alarms.find(
      item =>
        item.enabled &&
        item.time === current
    );

  if (alarm) {

    lastAlarmKey = key;

    playBeep();

    setTimeout(() => {
      alert(
        `${alarm.time}\n${alarm.label}`
      );
    }, 100);

  }

}


/* =========================================================
   天気
   Open-Meteo
========================================================= */

let weatherLocation =
  loadJSON(
    "lumaWeatherLocation",
    null
  );

function openWeatherSearch() {

  $("weatherSearchInput").value = "";
  $("weatherSearchStatus").textContent = "";

  $("weatherModal")
    .classList.add("show");

  setTimeout(() => {
    $("weatherSearchInput").focus();
  }, 150);

}

function closeWeatherSearch() {

  $("weatherModal")
    .classList.remove("show");

}

async function searchWeatherCity() {

  const city =
    $("weatherSearchInput")
      .value
      .trim();

  if (!city) {

    $("weatherSearchStatus")
      .textContent =
      "市町村名を入力してください";

    return;

  }

  $("weatherSearchStatus")
    .textContent =
    "検索しています…";

  try {

    const url =
      "https://geocoding-api.open-meteo.com/v1/search" +
      "?name=" +
      encodeURIComponent(city) +
      "&count=10" +
      "&language=ja" +
      "&format=json" +
      "&countryCode=JP";

    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error("検索エラー");
    }

    const data =
      await response.json();

    if (
      !data.results ||
      data.results.length === 0
    ) {

      $("weatherSearchStatus")
        .textContent =
        "市町村が見つかりませんでした";

      return;

    }

    const result =
      data.results[0];

    weatherLocation = {

      name: result.name,
      admin1: result.admin1 || "",
      latitude: result.latitude,
      longitude: result.longitude

    };

    saveJSON(
      "lumaWeatherLocation",
      weatherLocation
    );

    closeWeatherSearch();

    await loadWeather();

  } catch (error) {

    console.error(error);

    $("weatherSearchStatus")
      .textContent =
      "天気検索に接続できませんでした";

  }

}

async function loadWeather() {

  if (!weatherLocation) {

    $("weatherCity")
      .textContent =
      "市町村を設定";

    $("miniCity")
      .textContent =
      "未設定";

    return;

  }

  const {
    latitude,
    longitude,
    name
  } = weatherLocation;

  $("weatherCity")
    .textContent = name;

  $("miniCity")
    .textContent = name;

  $("weatherCondition")
    .textContent =
    "天気を取得しています…";

  try {

    const params =
      new URLSearchParams({

        latitude:
          String(latitude),

        longitude:
          String(longitude),

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
          "Asia/Tokyo",

        forecast_days:
          "1"

      });

    const response =
      await fetch(
        "https://api.open-meteo.com/v1/forecast?" +
        params.toString()
      );

    if (!response.ok) {
      throw new Error("Weather API error");
    }

    const data =
      await response.json();

    const current =
      data.current;

    const daily =
      data.daily;

    if (!current) {
      throw new Error("No current weather");
    }

    const weather =
      weatherCodeInfo(
        current.weather_code,
        current.is_day
      );

    const temp =
      Math.round(
        current.temperature_2m
      );

    $("weatherTemp")
      .textContent =
      `${temp}°`;

    $("miniTemp")
      .textContent =
      `${temp}°`;

    $("weatherCondition")
      .textContent =
      weather.label;

    $("weatherLargeIcon")
      .textContent =
      weather.icon;

    $("miniWeatherIcon")
      .textContent =
      weather.icon;

    $("weatherHumidity")
      .textContent =
      `${Math.round(
        current.relative_humidity_2m
      )}%`;

    $("weatherWind")
      .textContent =
      `${Math.round(
        current.wind_speed_10m
      )} km/h`;

    if (
      daily &&
      daily.temperature_2m_max &&
      daily.temperature_2m_min
    ) {

      $("weatherHigh")
        .textContent =
        `${Math.round(
          daily.temperature_2m_max[0]
        )}°`;

      $("weatherLow")
        .textContent =
        `${Math.round(
          daily.temperature_2m_min[0]
        )}°`;

    }

    const now =
      new Date();

    $("weatherUpdated")
      .textContent =
      `${now.getHours()}:${String(
        now.getMinutes()
      ).padStart(2, "0")} 更新`;

  } catch (error) {

    console.error(error);

    $("weatherCondition")
      .textContent =
      "天気情報を取得できませんでした";

  }

}


/* =========================================================
   WMO 天気コード
========================================================= */

function weatherCodeInfo(code, isDay = 1) {

  if (code === 0) {

    return {
      label: "晴れ",
      icon: isDay ? "☀️" : "🌙"
    };

  }

  if ([1, 2].includes(code)) {

    return {
      label: "晴れ時々くもり",
      icon: isDay ? "🌤️" : "☁️"
    };

  }

  if (code === 3) {

    return {
      label: "くもり",
      icon: "☁️"
    };

  }

  if ([45, 48].includes(code)) {

    return {
      label: "霧",
      icon: "🌫️"
    };

  }

  if ([51, 53, 55, 56, 57].includes(code)) {

    return {
      label: "霧雨",
      icon: "🌦️"
    };

  }

  if ([61, 63, 65, 66, 67].includes(code)) {

    return {
      label: "雨",
      icon: "🌧️"
    };

  }

  if ([71, 73, 75, 77].includes(code)) {

    return {
      label: "雪",
      icon: "🌨️"
    };

  }

  if ([80, 81, 82].includes(code)) {

    return {
      label: "にわか雨",
      icon: "🌦️"
    };

  }

  if ([85, 86].includes(code)) {

    return {
      label: "にわか雪",
      icon: "🌨️"
    };

  }

  if ([95, 96, 99].includes(code)) {

    return {
      label: "雷雨",
      icon: "⛈️"
    };

  }

  return {
    label: "天気情報",
    icon: "☁️"
  };

}


/* =========================================================
   ミュージック
========================================================= */

const musicFile =
  $("musicFile");

const audioPlayer =
  $("audioPlayer");

let musicObjectURL = null;

function selectMusic() {

  musicFile.click();

}

musicFile.addEventListener(
  "change",
  () => {

    const file =
      musicFile.files[0];

    if (!file) return;

    if (musicObjectURL) {
      URL.revokeObjectURL(
        musicObjectURL
      );
    }

    musicObjectURL =
      URL.createObjectURL(file);

    audioPlayer.src =
      musicObjectURL;

    const title =
      file.name.replace(
        /\.[^/.]+$/,
        ""
      );

    $("musicTitle")
      .textContent =
      title;

    $("musicArtist")
      .textContent =
      "この端末の音楽";

    audioPlayer.play()
      .catch(() => {});

  }
);

audioPlayer.addEventListener(
  "play",
  showMusicIsland
);

audioPlayer.addEventListener(
  "pause",
  () => {

    if (timerID) {

      showTimerIsland(
        timerText()
      );

    } else {

      resetIsland();

    }

  }
);

audioPlayer.addEventListener(
  "ended",
  () => {

    if (timerID) {

      showTimerIsland(
        timerText()
      );

    } else {

      resetIsland();

    }

  }
);


/* =========================================================
   設定カテゴリー
========================================================= */

document
  .querySelectorAll(
    ".settingsNavButton"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".settingsNavButton"
          )
          .forEach(item =>
            item.classList.remove(
              "active"
            )
          );

        document
          .querySelectorAll(
            ".settingSection"
          )
          .forEach(section =>
            section.classList.remove(
              "active"
            )
          );

        button.classList.add(
          "active"
        );

        const section =
          $(
            "setting-" +
            button.dataset.setting
          );

        if (section) {
          section.classList.add(
            "active"
          );
        }

      }
    );

  });


/* =========================================================
   表示設定
========================================================= */

const secondsToggle =
  $("secondsToggle");

const homeReminderToggle =
  $("homeReminderToggle");

const homeWeatherToggle =
  $("homeWeatherToggle");

secondsToggle.checked =
  showSeconds;

homeReminderToggle.checked =
  localStorage.getItem(
    "lumaHomeReminders"
  ) !== "false";

homeWeatherToggle.checked =
  localStorage.getItem(
    "lumaHomeWeather"
  ) !== "false";

secondsToggle.addEventListener(
  "change",
  () => {

    showSeconds =
      secondsToggle.checked;

    localStorage.setItem(
      "lumaSeconds",
      String(showSeconds)
    );

    updateClock();

  }
);

homeReminderToggle.addEventListener(
  "change",
  () => {

    localStorage.setItem(
      "lumaHomeReminders",
      String(
        homeReminderToggle.checked
      )
    );

    updateHomeSettings();

  }
);

homeWeatherToggle.addEventListener(
  "change",
  () => {

    localStorage.setItem(
      "lumaHomeWeather",
      String(
        homeWeatherToggle.checked
      )
    );

    updateHomeSettings();

  }
);

function updateHomeSettings() {

  $("homeReminderArea")
    .style.display =
    homeReminderToggle.checked
      ? "block"
      : "none";

  const homeActive =
    $("homePage")
      .classList
      .contains("active");

  weatherMini.style.display =
    homeActive &&
    homeWeatherToggle.checked
      ? "flex"
      : "none";

}


/* =========================================================
   壁紙
========================================================= */

const wallpaperFile =
  $("wallpaperFile");

const wallpaperBrightness =
  $("wallpaperBrightness");

let wallpaperData =
  localStorage.getItem(
    "lumaWallpaper"
  );

function selectWallpaper() {

  wallpaperFile.click();

}

wallpaperFile.addEventListener(
  "change",
  () => {

    const file =
      wallpaperFile.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

      alert(
        "画像ファイルを選択してください"
      );

      return;

    }

    const reader =
      new FileReader();

    reader.onload =
      event => {

        const img =
          new Image();

        img.onload = () => {

          try {

            const canvas =
              document.createElement(
                "canvas"
              );

            const maxWidth = 1600;

            const scale =
              Math.min(
                1,
                maxWidth / img.width
              );

            canvas.width =
              Math.round(
                img.width * scale
              );

            canvas.height =
              Math.round(
                img.height * scale
              );

            const ctx =
              canvas.getContext("2d");

            ctx.drawImage(
              img,
              0,
              0,
              canvas.width,
              canvas.height
            );

            wallpaperData =
              canvas.toDataURL(
                "image/jpeg",
                .82
              );

            try {

              localStorage.setItem(
                "lumaWallpaper",
                wallpaperData
              );

            } catch {

              alert(
                "画像が大きすぎて保存できませんでした。別の画像をお試しください。"
              );

              return;

            }

            applyWallpaper();

          } catch (error) {

            console.error(error);

          }

        };

        img.src =
          event.target.result;

      };

    reader.readAsDataURL(file);

  }
);

function applyWallpaper() {

  if (wallpaperData) {

    $("wallpaper")
      .style.backgroundImage =
      `url("${wallpaperData}")`;

    $("wallpaperPreview")
      .style.backgroundImage =
      `url("${wallpaperData}")`;

  } else {

    $("wallpaper")
      .style.backgroundImage = "";

    $("wallpaperPreview")
      .style.backgroundImage = "";

  }

}

function resetWallpaper() {

  localStorage.removeItem(
    "lumaWallpaper"
  );

  wallpaperData = null;

  applyWallpaper();

}

let savedWallpaperBrightness =
  Number(
    localStorage.getItem(
      "lumaWallpaperBrightness"
    ) || 100
  );

wallpaperBrightness.value =
  savedWallpaperBrightness;

function applyWallpaperBrightness() {

  const value =
    Number(
      wallpaperBrightness.value
    );

  $("wallpaperBrightnessValue")
    .textContent =
    `${value}%`;

  $("wallpaper")
    .style.filter =
    `brightness(${value / 100})`;

}

wallpaperBrightness.addEventListener(
  "input",
  () => {

    localStorage.setItem(
      "lumaWallpaperBrightness",
      wallpaperBrightness.value
    );

    applyWallpaperBrightness();

  }
);


/* =========================================================
   ガラス時計設定
========================================================= */

const clockOpacity =
  $("clockOpacity");

const clockBrightness =
  $("clockBrightness");

const clockFont =
  $("clockFont");

const clockColors = {

  white: "255,255,255",
  blue: "66,174,255",
  purple: "190,95,255",
  pink: "255,93,155",
  orange: "255,160,74",
  green: "67,220,137"

};

let selectedClockColor =
  localStorage.getItem(
    "lumaClockColor"
  ) || "white";

clockOpacity.value =
  localStorage.getItem(
    "lumaClockOpacity"
  ) || "70";

clockBrightness.value =
  localStorage.getItem(
    "lumaClockBrightness"
  ) || "100";

clockFont.value =
  localStorage.getItem(
    "lumaClockFont"
  ) || "normal";

function applyClockSettings() {

  const rgb =
    clockColors[
      selectedClockColor
    ] || clockColors.white;

  const opacity =
    Number(
      clockOpacity.value
    ) / 100;

  const brightness =
    Number(
      clockBrightness.value
    ) / 100;

  root.style.setProperty(
    "--glass-rgb",
    rgb
  );

  root.style.setProperty(
    "--clock-opacity",
    opacity
  );

  root.style.setProperty(
    "--clock-brightness",
    brightness
  );

  $("clockOpacityValue")
    .textContent =
    `${clockOpacity.value}%`;

  $("clockBrightnessValue")
    .textContent =
    `${clockBrightness.value}%`;

  document
    .querySelectorAll(
      ".colorChoice"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.clockColor ===
          selectedClockColor
      );

    });

  let weight = "200";

  if (clockFont.value === "thin") {
    weight = "100";
  }

  if (clockFont.value === "bold") {
    weight = "400";
  }

  $("clockText")
    .style.fontWeight =
    weight;

  $("clockPreview")
    .style.fontWeight =
    weight;

}

document
  .querySelectorAll(
    ".colorChoice"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        selectedClockColor =
          button.dataset.clockColor;

        localStorage.setItem(
          "lumaClockColor",
          selectedClockColor
        );

        applyClockSettings();

      }
    );

  });

clockOpacity.addEventListener(
  "input",
  () => {

    localStorage.setItem(
      "lumaClockOpacity",
      clockOpacity.value
    );

    applyClockSettings();

  }
);

clockBrightness.addEventListener(
  "input",
  () => {

    localStorage.setItem(
      "lumaClockBrightness",
      clockBrightness.value
    );

    applyClockSettings();

  }
);

clockFont.addEventListener(
  "change",
  () => {

    localStorage.setItem(
      "lumaClockFont",
      clockFont.value
    );

    applyClockSettings();

  }
);


/* =========================================================
   Dynamic Island 設定
========================================================= */

const timerIslandToggle =
  $("timerIslandToggle");

const musicIslandToggle =
  $("musicIslandToggle");

timerIslandToggle.checked =
  localStorage.getItem(
    "lumaTimerIsland"
  ) !== "false";

musicIslandToggle.checked =
  localStorage.getItem(
    "lumaMusicIsland"
  ) !== "false";

timerIslandToggle.addEventListener(
  "change",
  () => {

    localStorage.setItem(
      "lumaTimerIsland",
      String(
        timerIslandToggle.checked
      )
    );

    if (!timerIslandToggle.checked) {
      resetIsland();
    }

  }
);

musicIslandToggle.addEventListener(
  "change",
  () => {

    localStorage.setItem(
      "lumaMusicIsland",
      String(
        musicIslandToggle.checked
      )
    );

    if (
      !musicIslandToggle.checked &&
      !timerID
    ) {
      resetIsland();
    }

  }
);


/* =========================================================
   データ初期化
========================================================= */

function resetLumaData() {

  const ok =
    confirm(
      "Lumaの設定・リマインダー・アラーム・壁紙を初期化しますか？"
    );

  if (!ok) return;

  const keys = [

    "lumaSeconds",
    "lumaHomeReminders",
    "lumaHomeWeather",
    "lumaWallpaper",
    "lumaWallpaperBrightness",
    "lumaClockColor",
    "lumaClockOpacity",
    "lumaClockBrightness",
    "lumaClockFont",
    "lumaTimerIsland",
    "lumaMusicIsland",
    "lumaReminders",
    "lumaAlarms",
    "lumaWeatherLocation"

  ];

  keys.forEach(
    key =>
      localStorage.removeItem(key)
  );

  location.reload();

}


/* =========================================================
   モーダル背景クリック
========================================================= */

$("reminderModal")
  .addEventListener(
    "click",
    event => {

      if (
        event.target ===
        $("reminderModal")
      ) {
        closeReminderEditor();
      }

    }
  );

$("weatherModal")
  .addEventListener(
    "click",
    event => {

      if (
        event.target ===
        $("weatherModal")
      ) {
        closeWeatherSearch();
      }

    }
  );


/* =========================================================
   Enterで天気検索
========================================================= */

$("weatherSearchInput")
  .addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {
        searchWeatherCity();
      }

    }
  );


/* =========================================================
   起動
========================================================= */

function startLuma() {

  drawTimer();
  drawStopwatch();

  drawReminders();
  drawHomeReminders();
  drawAlarms();

  updateWorldClock();

  applyWallpaper();
  applyWallpaperBrightness();

  applyClockSettings();
  updateHomeSettings();

  resetIsland();

  if (weatherLocation) {
    loadWeather();
  }

  openPage("home");

}

startLuma();
