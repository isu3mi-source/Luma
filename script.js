"use strict";

/* =========================================================
   Luma OS 2.0
   ========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const safe = (fn) => {
  try {
    return fn();
  } catch (error) {
    console.error("Luma:", error);
  }
};

const safeAsync = async (fn) => {
  try {
    return await fn();
  } catch (error) {
    console.error("Luma:", error);
  }
};


/* =========================================================
   STATE
   ========================================================= */

let settings = {
  seconds: false,
  trail: true,
  scene: true,
  brightness: 100,
  blur: 0,
  zoom: 100,
  glassOpacity: 18,
  glassBlur: 24,
  reflection: 65
};

let alarms = [];
let reminders = [];

let timerSeconds = 300;
let timerRemaining = 300;
let timerInterval = null;
let timerRunning = false;

let stopwatchStartTime = 0;
let stopwatchElapsed = 0;
let stopwatchInterval = null;

let focusRemaining = 25 * 60;
let focusInterval = null;

let currentWeather = null;

let peekTimer = null;


/* =========================================================
   STORAGE
   ========================================================= */

function loadState() {
  safe(() => {
    const savedSettings = localStorage.getItem("luma2_settings");
    const savedAlarms = localStorage.getItem("luma2_alarms");
    const savedReminders = localStorage.getItem("luma2_reminders");

    if (savedSettings) {
      settings = {
        ...settings,
        ...JSON.parse(savedSettings)
      };
    }

    if (savedAlarms) {
      alarms = JSON.parse(savedAlarms);
    }

    if (savedReminders) {
      reminders = JSON.parse(savedReminders);
    }
  });
}

function saveSettings() {
  localStorage.setItem(
    "luma2_settings",
    JSON.stringify(settings)
  );
}

function saveAlarms() {
  localStorage.setItem(
    "luma2_alarms",
    JSON.stringify(alarms)
  );
}

function saveReminders() {
  localStorage.setItem(
    "luma2_reminders",
    JSON.stringify(reminders)
  );
}


/* =========================================================
   WALLPAPER DATABASE
   ========================================================= */

function openDB() {
  return new Promise((resolve, reject) => {
    const request =
      indexedDB.open("LumaOS2Database", 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("assets")) {
        db.createObjectStore("assets");
      }
    };

    request.onsuccess = () =>
      resolve(request.result);

    request.onerror = () =>
      reject(request.error);
  });
}

async function saveWallpaper(blob) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx =
      db.transaction("assets", "readwrite");

    tx.objectStore("assets")
      .put(blob, "wallpaper");

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getWallpaper() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx =
      db.transaction("assets", "readonly");

    const req =
      tx.objectStore("assets")
        .get("wallpaper");

    req.onsuccess = () =>
      resolve(req.result);

    req.onerror = () =>
      reject(req.error);
  });
}

async function deleteWallpaper() {
  const db = await openDB();

  const tx =
    db.transaction("assets", "readwrite");

  tx.objectStore("assets")
    .delete("wallpaper");
}


/* =========================================================
   CLOCK
   ========================================================= */

function formatTime(date, seconds = false) {
  return new Intl.DateTimeFormat(
    "ja-JP",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: seconds ? "2-digit" : undefined,
      hour12: false
    }
  ).format(date);
}

function formatDate(date) {
  return new Intl.DateTimeFormat(
    "ja-JP",
    {
      month: "long",
      day: "numeric",
      weekday: "short"
    }
  ).format(date);
}

function updateClock() {
  const now = new Date();

  const hh =
    String(now.getHours()).padStart(2, "0");

  const mm =
    String(now.getMinutes()).padStart(2, "0");

  const ss =
    String(now.getSeconds()).padStart(2, "0");

  $("#clockText").textContent =
    `${hh}:${mm}`;

  $("#clockSeconds").textContent = ss;

  $("#clockSeconds").style.display =
    settings.seconds ? "block" : "none";

  $("#homeDate").textContent =
    formatDate(now);

  $("#clockPageTime").textContent =
    `${hh}:${mm}`;

  $("#clockPageDate").textContent =
    formatDate(now);

  $("#nightTime").textContent =
    `${hh}:${mm}`;

  $("#nightDate").textContent =
    formatDate(now);

  updateWorldClocks();
  updateSunPosition(now);
  updateScene(now);
  checkAlarms(now);
}


/* =========================================================
   SUN POSITION
   ========================================================= */

function updateSunPosition(now) {
  const minutes =
    now.getHours() * 60 +
    now.getMinutes();

  const sunrise = 6 * 60;
  const sunset = 18 * 60;

  let percent =
    ((minutes - sunrise) /
      (sunset - sunrise)) * 100;

  percent =
    Math.max(0, Math.min(100, percent));

  $("#sunDot").style.left =
    `${percent}%`;
}


/* =========================================================
   LUMA SCENE
   ========================================================= */

function updateScene(now) {
  if (!settings.scene) {
    $("#sceneOverlay").style.background =
      "transparent";

    return;
  }

  const hour = now.getHours();

  let scene;

  if (hour >= 5 && hour < 10) {
    scene =
      "linear-gradient(120deg, rgba(255,220,180,.18), rgba(180,215,255,.08))";
  }

  else if (hour >= 10 && hour < 16) {
    scene =
      "linear-gradient(120deg, rgba(160,210,255,.06), rgba(255,255,255,.02))";
  }

  else if (hour >= 16 && hour < 19) {
    scene =
      "linear-gradient(120deg, rgba(255,145,110,.24), rgba(255,190,170,.10))";
  }

  else {
    scene =
      "linear-gradient(120deg, rgba(15,30,80,.38), rgba(45,25,80,.28))";
  }

  $("#sceneOverlay").style.background =
    scene;
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function openPage(id) {
  $$(".page").forEach((page) =>
    page.classList.remove("active")
  );

  const target =
    document.getElementById(id);

  if (target) {
    target.classList.add("active");
  }

  $("#sideMenu").classList.remove("open");
}

function setupNavigation() {
  $$("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      openPage(button.dataset.page);
    });
  });

  $$(".back-button").forEach((button) => {
    button.addEventListener("click", () => {
      openPage("homePage");
    });
  });

  $("#menuButton").addEventListener(
    "click",
    () => {
      $("#sideMenu").classList.add("open");
    }
  );

  $("#closeMenu").addEventListener(
    "click",
    () => {
      $("#sideMenu").classList.remove("open");
    }
  );

  $("#settingsButton").addEventListener(
    "click",
    () => {
      openPage("settingsPage");
    }
  );
}


/* =========================================================
   LIVING GLASS
   ========================================================= */

function setupLivingGlass() {
  $$("[data-glass]").forEach((glass) => {

    glass.addEventListener(
      "pointerdown",
      (event) => {

        const rect =
          glass.getBoundingClientRect();

        const x =
          event.clientX - rect.left;

        const y =
          event.clientY - rect.top;

        glass.style.setProperty(
          "--light-x",
          `${(x / rect.width) * 100}%`
        );

        glass.style.setProperty(
          "--light-y",
          `${(y / rect.height) * 100}%`
        );

        glass.classList.add("pressed");

        const ripple =
          document.createElement("span");

        ripple.className = "ripple";

        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        glass.appendChild(ripple);

        setTimeout(
          () => ripple.remove(),
          800
        );
      }
    );

    const release = () => {
      glass.classList.remove("pressed");
    };

    glass.addEventListener(
      "pointerup",
      release
    );

    glass.addEventListener(
      "pointercancel",
      release
    );

    glass.addEventListener(
      "pointerleave",
      release
    );
  });
}


/* =========================================================
   DEVICE TILT
   ========================================================= */

async function enableTilt() {
  safeAsync(async () => {

    if (
      typeof DeviceOrientationEvent !==
        "undefined" &&
      typeof DeviceOrientationEvent
        .requestPermission === "function"
    ) {
      const permission =
        await DeviceOrientationEvent
          .requestPermission();

      if (permission !== "granted") {
        return;
      }
    }

    window.addEventListener(
      "deviceorientation",
      (event) => {

        const gamma =
          Math.max(
            -20,
            Math.min(20, event.gamma || 0)
          );

        const beta =
          Math.max(
            -20,
            Math.min(20, event.beta || 0)
          );

        const rx = beta / 15;
        const ry = gamma / 15;

        $$("[data-glass]").forEach(
          (glass) => {

            glass.style.setProperty(
              "--tilt-x",
              `${-rx}deg`
            );

            glass.style.setProperty(
              "--tilt-y",
              `${ry}deg`
            );

            glass.style.setProperty(
              "--light-x",
              `${50 + gamma}%`
            );

            glass.style.setProperty(
              "--light-y",
              `${50 + beta / 2}%`
            );
          }
        );
      }
    );
  });
}


/* iOSはユーザー操作が必要なので、
   最初のタップで許可を試す */

document.addEventListener(
  "pointerdown",
  () => enableTilt(),
  { once: true }
);


/* =========================================================
   GLASS TRAIL
   ========================================================= */

const trailCanvas =
  $("#trailCanvas");

const trailCtx =
  trailCanvas.getContext("2d");

let trails = [];

function resizeTrailCanvas() {
  const dpr =
    Math.min(window.devicePixelRatio || 1, 2);

  trailCanvas.width =
    innerWidth * dpr;

  trailCanvas.height =
    innerHeight * dpr;

  trailCanvas.style.width =
    `${innerWidth}px`;

  trailCanvas.style.height =
    `${innerHeight}px`;

  trailCtx.setTransform(
    dpr, 0, 0, dpr, 0, 0
  );
}

function addTrail(x, y) {
  if (!settings.trail) return;

  trails.push({
    x,
    y,
    life: 1,
    size: 18
  });

  if (trails.length > 50) {
    trails.shift();
  }
}

function drawTrail() {
  trailCtx.clearRect(
    0,
    0,
    innerWidth,
    innerHeight
  );

  trails.forEach((point) => {

    trailCtx.beginPath();

    const gradient =
      trailCtx.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        point.size
      );

    gradient.addColorStop(
      0,
      `rgba(255,255,255,${point.life * .45})`
    );

    gradient.addColorStop(
      1,
      "rgba(255,255,255,0)"
    );

    trailCtx.fillStyle = gradient;

    trailCtx.arc(
      point.x,
      point.y,
      point.size,
      0,
      Math.PI * 2
    );

    trailCtx.fill();

    point.life -= .035;
    point.size += .35;
  });

  trails =
    trails.filter((point) =>
      point.life > 0
    );

  requestAnimationFrame(drawTrail);
}

document.addEventListener(
  "pointermove",
  (event) => {
    addTrail(
      event.clientX,
      event.clientY
    );
  }
);


/* =========================================================
   LUMA PEEK
   ========================================================= */

function showPeek() {
  $("#peekWeather").textContent =
    currentWeather
      ? `${Math.round(currentWeather.temperature)}°`
      : "--°";

  const nextReminder =
    getNextReminder();

  $("#peekReminder").textContent =
    nextReminder
      ? nextReminder.title
      : "なし";

  const nextAlarm =
    alarms
      .filter((alarm) => alarm.enabled)
      .sort((a, b) =>
        a.time.localeCompare(b.time)
      )[0];

  $("#peekAlarm").textContent =
    nextAlarm
      ? nextAlarm.time
      : "なし";

  $("#lumaPeek").classList.add("show");
}

function hidePeek() {
  $("#lumaPeek").classList.remove("show");
}

function setupPeek() {
  const clock = $("#clockGlass");

  clock.addEventListener(
    "pointerdown",
    () => {
      peekTimer =
        setTimeout(showPeek, 550);
    }
  );

  const cancel = () => {
    clearTimeout(peekTimer);

    setTimeout(
      hidePeek,
      900
    );
  };

  clock.addEventListener(
    "pointerup",
    cancel
  );

  clock.addEventListener(
    "pointercancel",
    cancel
  );
}


/* =========================================================
   CLOCK MORPH
   ========================================================= */

let clockMode = 0;

$("#clockGlass").addEventListener(
  "dblclick",
  () => {

    clockMode =
      (clockMode + 1) % 3;

    if (clockMode === 0) {
      $("#clockText").style.fontWeight = "200";
      $("#clockText").style.fontSize = "";
    }

    if (clockMode === 1) {
      $("#clockText").style.fontWeight = "500";
    }

    if (clockMode === 2) {
      $("#clockText").style.fontSize =
        "clamp(55px, 11vw, 130px)";
    }
  }
);


/* =========================================================
   ALARMS
   ========================================================= */

function renderAlarms() {
  const list = $("#alarmList");

  list.innerHTML = "";

  if (!alarms.length) {
    list.innerHTML =
      `<div class="glass list-card">
         アラームはありません
       </div>`;

    return;
  }

  alarms.forEach((alarm) => {
    const card =
      document.createElement("div");

    card.className =
      "glass list-card";

    card.innerHTML = `
      <div class="grow">
        <div style="font-size:38px">
          ${alarm.time}
        </div>
        <small>
          ${escapeHTML(alarm.name || "アラーム")}
        </small>
      </div>

      <input
        type="checkbox"
        ${alarm.enabled ? "checked" : ""}
      >

      <button>削除</button>
    `;

    const toggle =
      card.querySelector("input");

    toggle.addEventListener(
      "change",
      () => {
        alarm.enabled =
          toggle.checked;

        saveAlarms();
      }
    );

    card.querySelector("button")
      .addEventListener(
        "click",
        () => {

          alarms =
            alarms.filter(
              (item) =>
                item.id !== alarm.id
            );

          saveAlarms();
          renderAlarms();
        }
      );

    list.appendChild(card);
  });
}

function checkAlarms(now) {
  const time =
    `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

  alarms.forEach((alarm) => {

    if (
      alarm.enabled &&
      alarm.time === time &&
      alarm.lastTriggered !==
        now.toDateString()
    ) {
      alarm.lastTriggered =
        now.toDateString();

      saveAlarms();

      ring(
        alarm.name || "アラーム"
      );
    }
  });
}

function ring(name) {
  safe(() => {
    navigator.vibrate?.(
      [300,150,300,150,500]
    );
  });

  alert(`⏰ ${name}`);
}

$("#addAlarmButton")
  .addEventListener(
    "click",
    () => {
      $("#alarmDialog").showModal();
    }
  );

$("#saveAlarmButton")
  .addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      const time =
        $("#alarmTimeInput").value;

      if (!time) return;

      alarms.push({
        id: Date.now(),
        time,
        name:
          $("#alarmNameInput").value.trim(),
        enabled: true,
        lastTriggered: null
      });

      saveAlarms();
      renderAlarms();

      $("#alarmDialog").close();

      $("#alarmNameInput").value = "";
    }
  );


/* =========================================================
   TIMER
   ========================================================= */

function formatDuration(total) {
  total =
    Math.max(0, Math.floor(total));

  const h =
    Math.floor(total / 3600);

  const m =
    Math.floor((total % 3600) / 60);

  const s =
    total % 60;

  if (h > 0) {
    return (
      `${String(h).padStart(2,"0")}:` +
      `${String(m).padStart(2,"0")}:` +
      `${String(s).padStart(2,"0")}`
    );
  }

  return (
    `${String(m).padStart(2,"0")}:` +
    `${String(s).padStart(2,"0")}`
  );
}

function renderTimer() {
  const text =
    formatDuration(timerRemaining);

  $("#timerDisplay").textContent = text;
  $("#miniTimerText").textContent = text;

  $("#timerMiniCard")
    .classList.toggle(
      "hidden",
      !timerRunning
    );

  if (timerRunning) {
    $("#islandLabel").textContent =
      "タイマー";

    $("#islandValue").textContent =
      text;

    $("#islandIcon").textContent =
      "◴";
  }
}

function startTimer() {
  if (
    timerRunning ||
    timerRemaining <= 0
  ) return;

  timerRunning = true;

  renderTimer();

  timerInterval =
    setInterval(() => {

      timerRemaining--;

      renderTimer();

      if (timerRemaining <= 0) {
        clearInterval(timerInterval);

        timerRunning = false;

        renderTimer();

        ring("タイマー");
      }
    }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);

  timerRunning = false;

  renderTimer();
}

function resetTimer() {
  pauseTimer();

  timerRemaining =
    timerSeconds;

  renderTimer();
}

$$(".quick-presets button")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const minutes =
          Number(button.dataset.minutes);

        pauseTimer();

        timerSeconds =
          minutes * 60;

        timerRemaining =
          timerSeconds;

        renderTimer();
      }
    );
  });

$("#timerStart")
  .addEventListener(
    "click",
    startTimer
  );

$("#timerPause")
  .addEventListener(
    "click",
    pauseTimer
  );

$("#timerReset")
  .addEventListener(
    "click",
    resetTimer
  );


/* Quick Timer:
   ホームのタイマーボタン長押し */

let quickTimerPress = null;

$("#timerDockButton")
  .addEventListener(
    "pointerdown",
    () => {

      quickTimerPress =
        setTimeout(() => {

          const choice =
            prompt(
              "Quick Timer\n5 / 10 / 15 / 30 / 60 分",
              "10"
            );

          const minutes =
            Number(choice);

          if (
            [5,10,15,30,60]
              .includes(minutes)
          ) {
            timerSeconds =
              minutes * 60;

            timerRemaining =
              timerSeconds;

            startTimer();

            openPage("homePage");
          }
        }, 600);
    }
  );

$("#timerDockButton")
  .addEventListener(
    "pointerup",
    () => {
      clearTimeout(quickTimerPress);
    }
  );


/* =========================================================
   STOPWATCH
   ========================================================= */

function renderStopwatch() {
  const total =
    stopwatchElapsed;

  const minutes =
    Math.floor(total / 60000);

  const seconds =
    Math.floor(
      (total % 60000) / 1000
    );

  const centiseconds =
    Math.floor(
      (total % 1000) / 10
    );

  $("#stopwatchDisplay")
    .textContent =
      `${String(minutes).padStart(2,"0")}:` +
      `${String(seconds).padStart(2,"0")}.` +
      `${String(centiseconds).padStart(2,"0")}`;
}

$("#stopwatchStart")
  .addEventListener(
    "click",
    () => {

      if (stopwatchInterval) {
        clearInterval(stopwatchInterval);

        stopwatchInterval = null;

        stopwatchElapsed =
          performance.now() -
          stopwatchStartTime;

        $("#stopwatchStart")
          .textContent = "開始";

        return;
      }

      stopwatchStartTime =
        performance.now() -
        stopwatchElapsed;

      stopwatchInterval =
        setInterval(() => {

          stopwatchElapsed =
            performance.now() -
            stopwatchStartTime;

          renderStopwatch();

        }, 30);

      $("#stopwatchStart")
        .textContent = "停止";
    }
  );

$("#stopwatchReset")
  .addEventListener(
    "click",
    () => {

      clearInterval(stopwatchInterval);

      stopwatchInterval = null;
      stopwatchElapsed = 0;

      $("#stopwatchStart")
        .textContent = "開始";

      $("#lapList").innerHTML = "";

      renderStopwatch();
    }
  );

$("#stopwatchLap")
  .addEventListener(
    "click",
    () => {

      if (!stopwatchInterval) return;

      const div =
        document.createElement("div");

      div.textContent =
        $("#stopwatchDisplay").textContent;

      $("#lapList")
        .prepend(div);
    }
  );


/* =========================================================
   WORLD CLOCK
   ========================================================= */

function zoneTime(zone) {
  return new Intl.DateTimeFormat(
    "ja-JP",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: zone
    }
  ).format(new Date());
}

function updateWorldClocks() {
  $("#tokyoTime").textContent =
    zoneTime("Asia/Tokyo");

  $("#londonTime").textContent =
    zoneTime("Europe/London");

  $("#newYorkTime").textContent =
    zoneTime("America/New_York");

  $("#parisTime").textContent =
    zoneTime("Europe/Paris");
}


/* =========================================================
   REMINDERS
   ========================================================= */

function getNextReminder() {
  const now = Date.now();

  return reminders
    .filter((item) => !item.done)
    .map((item) => ({
      ...item,
      timestamp:
        new Date(
          `${item.date}T${item.time || "00:00"}`
        ).getTime()
    }))
    .filter((item) =>
      item.timestamp >= now
    )
    .sort((a,b) =>
      a.timestamp - b.timestamp
    )[0];
}

function renderReminders() {
  const list =
    $("#reminderList");

  list.innerHTML = "";

  if (!reminders.length) {
    list.innerHTML =
      `<div class="glass list-card">
         リマインダーはありません
       </div>`;
  }

  reminders
    .sort((a,b) =>
      `${a.date}${a.time}`
        .localeCompare(
          `${b.date}${b.time}`
        )
    )
    .forEach((item) => {

      const card =
        document.createElement("div");

      card.className =
        "glass list-card";

      card.innerHTML = `
        <input
          type="checkbox"
          ${item.done ? "checked" : ""}
        >

        <div class="grow">
          <strong>
            ${escapeHTML(item.title)}
          </strong>

          <div>
            <small>
              ${item.date}
              ${item.time || ""}
            </small>
          </div>
        </div>

        <button>削除</button>
      `;

      card.querySelector("input")
        .addEventListener(
          "change",
          (event) => {

            item.done =
              event.target.checked;

            saveReminders();
            updateHomeReminder();
          }
        );

      card.querySelector("button")
        .addEventListener(
          "click",
          () => {

            reminders =
              reminders.filter(
                (r) =>
                  r.id !== item.id
              );

            saveReminders();
            renderReminders();
            updateHomeReminder();
          }
        );

      list.appendChild(card);
    });

  updateHomeReminder();
}

function updateHomeReminder() {
  const next =
    getNextReminder();

  $("#nextReminderText")
    .textContent =
      next
        ? next.title
        : "予定はありません";
}

$("#addReminderButton")
  .addEventListener(
    "click",
    () => {

      $("#reminderDialog")
        .showModal();
    }
  );

$("#saveReminderButton")
  .addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      const title =
        $("#reminderTitleInput")
          .value.trim();

      const date =
        $("#reminderDateInput")
          .value;

      if (!title || !date) {
        return;
      }

      reminders.push({
        id: Date.now(),
        title,
        date,
        time:
          $("#reminderTimeInput")
            .value,
        done: false
      });

      saveReminders();
      renderReminders();

      $("#reminderDialog").close();

      $("#reminderTitleInput")
        .value = "";

      $("#reminderDateInput")
        .value = "";

      $("#reminderTimeInput")
        .value = "";
    }
  );


/* =========================================================
   WEATHER 2
   Open-Meteo
   ========================================================= */

function weatherIcon(code) {
  if (code === 0) return "☀︎";
  if (code <= 3) return "☁︎";
  if (code <= 48) return "≋";
  if (code <= 67) return "☂";
  if (code <= 77) return "❄︎";
  if (code <= 82) return "☂";
  if (code <= 86) return "❄︎";

  return "⚡";
}

function weatherText(code) {
  if (code === 0) return "晴れ";
  if (code <= 3) return "くもり";
  if (code <= 48) return "霧";
  if (code <= 67) return "雨";
  if (code <= 77) return "雪";
  if (code <= 82) return "にわか雨";
  if (code <= 86) return "雪";

  return "雷雨";
}

async function searchWeather(city) {
  return safeAsync(async () => {

    const geoURL =
      "https://geocoding-api.open-meteo.com/v1/search" +
      `?name=${encodeURIComponent(city)}` +
      "&count=5" +
      "&language=ja" +
      "&format=json";

    const geoResponse =
      await fetch(geoURL);

    const geo =
      await geoResponse.json();

    if (!geo.results?.length) {
      alert("都市が見つかりませんでした。");
      return;
    }

    const place =
      geo.results[0];

    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${place.latitude}` +
      `&longitude=${place.longitude}` +
      "&current=temperature_2m,weather_code" +
      "&hourly=temperature_2m,precipitation_probability,weather_code" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
      "&timezone=auto" +
      "&forecast_days=7";

    const response =
      await fetch(url);

    const data =
      await response.json();

    currentWeather = {
      city:
        place.name,
      temperature:
        data.current.temperature_2m,
      code:
        data.current.weather_code
    };

    localStorage.setItem(
      "luma2_weather_city",
      place.name
    );

    renderWeather(
      data,
      place.name
    );
  });
}

function renderWeather(data, city) {
  const temp =
    Math.round(
      data.current.temperature_2m
    );

  const code =
    data.current.weather_code;

  const icon =
    weatherIcon(code);

  $("#weatherIcon").textContent =
    icon;

  $("#weatherTemp").textContent =
    `${temp}°`;

  $("#weatherDescription")
    .textContent =
      weatherText(code);

  $("#weatherCity").textContent =
    city;

  $("#weatherPageIcon")
    .textContent =
      icon;

  $("#weatherPageTemp")
    .textContent =
      `${temp}°`;

  $("#weatherPageCity")
    .textContent =
      city;

  const hourly =
    $("#hourlyWeather");

  hourly.innerHTML = "";

  const now =
    new Date();

  let start =
    data.hourly.time.findIndex(
      (time) =>
        new Date(time) >= now
    );

  if (start < 0) start = 0;

  for (
    let i = start;
    i < Math.min(
      start + 8,
      data.hourly.time.length
    );
    i++
  ) {
    const item =
      document.createElement("div");

    item.className =
      "forecast-item";

    item.innerHTML = `
      <small>
        ${new Date(
          data.hourly.time[i]
        ).getHours()}時
      </small>

      <div style="font-size:25px">
        ${weatherIcon(
          data.hourly.weather_code[i]
        )}
      </div>

      <strong>
        ${Math.round(
          data.hourly.temperature_2m[i]
        )}°
      </strong>

      <small>
        ${data.hourly.precipitation_probability[i]}%
      </small>
    `;

    hourly.appendChild(item);
  }

  const daily =
    $("#dailyWeather");

  daily.innerHTML = "";

  data.daily.time
    .forEach((date, i) => {

      const item =
        document.createElement("div");

      item.className =
        "forecast-item";

      const day =
        new Intl.DateTimeFormat(
          "ja-JP",
          { weekday: "short" }
        ).format(
          new Date(`${date}T12:00`)
        );

      item.innerHTML = `
        <small>${day}</small>

        <div style="font-size:25px">
          ${weatherIcon(
            data.daily.weather_code[i]
          )}
        </div>

        <strong>
          ${Math.round(
            data.daily.temperature_2m_max[i]
          )}°
        </strong>

        <small>
          ${Math.round(
            data.daily.temperature_2m_min[i]
          )}°
        </small>
      `;

      daily.appendChild(item);
    });
}

$("#weatherSearchForm")
  .addEventListener(
    "submit",
    (event) => {

      event.preventDefault();

      const city =
        $("#weatherSearchInput")
          .value.trim();

      if (city) {
        searchWeather(city);
      }
    }
  );

$("#weatherCard")
  .addEventListener(
    "click",
    () => {
      openPage("weatherPage");
    }
  );


/* =========================================================
   WALLPAPER
   ========================================================= */

function applyWallpaperBlob(blob) {
  const url =
    URL.createObjectURL(blob);

  $("#wallpaper")
    .style.backgroundImage =
      `url("${url}")`;
}

$("#wallpaperInput")
  .addEventListener(
    "change",
    async (event) => {

      const file =
        event.target.files?.[0];

      if (!file) return;

      await safeAsync(async () => {
        await saveWallpaper(file);
        applyWallpaperBlob(file);
      });
    }
  );

$("#resetWallpaper")
  .addEventListener(
    "click",
    async () => {

      await safeAsync(
        deleteWallpaper
      );

      $("#wallpaper")
        .style.backgroundImage = "";

      $("#wallpaperInput")
        .value = "";
    }
  );


/* =========================================================
   SETTINGS
   ========================================================= */

function applySettings() {
  document.documentElement
    .style.setProperty(
      "--glass-opacity",
      settings.glassOpacity / 100
    );

  document.documentElement
    .style.setProperty(
      "--glass-blur",
      `${settings.glassBlur}px`
    );

  document.documentElement
    .style.setProperty(
      "--reflection",
      settings.reflection / 100
    );

  $("#wallpaper")
    .style.filter =
      `brightness(${settings.brightness}%) ` +
      `blur(${settings.blur}px)`;

  $("#wallpaper")
    .style.transform =
      `scale(${settings.zoom / 100})`;

  $("#secondsToggle").checked =
    settings.seconds;

  $("#trailToggle").checked =
    settings.trail;

  $("#sceneToggle").checked =
    settings.scene;

  $("#wallpaperBrightness").value =
    settings.brightness;

  $("#wallpaperBlur").value =
    settings.blur;

  $("#wallpaperZoom").value =
    settings.zoom;

  $("#glassOpacity").value =
    settings.glassOpacity;

  $("#glassBlur").value =
    settings.glassBlur;

  $("#glassReflection").value =
    settings.reflection;
}

function bindSetting(
  selector,
  key,
  converter = Number
) {
  $(selector).addEventListener(
    "input",
    (event) => {

      settings[key] =
        converter(event.target.value);

      saveSettings();
      applySettings();
    }
  );
}

bindSetting(
  "#wallpaperBrightness",
  "brightness"
);

bindSetting(
  "#wallpaperBlur",
  "blur"
);

bindSetting(
  "#wallpaperZoom",
  "zoom"
);

bindSetting(
  "#glassOpacity",
  "glassOpacity"
);

bindSetting(
  "#glassBlur",
  "glassBlur"
);

bindSetting(
  "#glassReflection",
  "reflection"
);

$("#secondsToggle")
  .addEventListener(
    "change",
    (event) => {

      settings.seconds =
        event.target.checked;

      saveSettings();
      updateClock();
    }
  );

$("#trailToggle")
  .addEventListener(
    "change",
    (event) => {

      settings.trail =
        event.target.checked;

      saveSettings();
    }
  );

$("#sceneToggle")
  .addEventListener(
    "change",
    (event) => {

      settings.scene =
        event.target.checked;

      saveSettings();
      updateClock();
    }
  );


/* =========================================================
   DYNAMIC ISLAND 2
   ========================================================= */

$("#dynamicIsland")
  .addEventListener(
    "click",
    () => {

      $("#dynamicIsland")
        .classList.toggle(
          "expanded"
        );

      if (timerRunning) {
        openPage("timerPage");
      }
    }
  );


/* =========================================================
   FOCUS
   ========================================================= */

function renderFocus() {
  $("#focusTime").textContent =
    formatDuration(
      focusRemaining
    );
}

$("#focusButton")
  .addEventListener(
    "click",
    () => {

      $("#focusMode")
        .classList.add("show");
    }
  );

$("#closeFocus")
  .addEventListener(
    "click",
    () => {

      $("#focusMode")
        .classList.remove("show");
    }
  );

$("#focusStart")
  .addEventListener(
    "click",
    () => {

      if (focusInterval) {
        clearInterval(focusInterval);

        focusInterval = null;

        $("#focusStart")
          .textContent = "▶";

        return;
      }

      $("#focusStart")
        .textContent = "Ⅱ";

      focusInterval =
        setInterval(() => {

          focusRemaining--;

          renderFocus();

          if (
            focusRemaining <= 0
          ) {
            clearInterval(
              focusInterval
            );

            focusInterval = null;

            focusRemaining =
              25 * 60;

            renderFocus();

            ring("Focus終了");

            $("#focusStart")
              .textContent = "▶";
          }

        }, 1000);
    }
  );


/* =========================================================
   NIGHT CLOCK
   ========================================================= */

$("#nightClockButton")
  .addEventListener(
    "click",
    () => {

      $("#nightClock")
        .classList.add("show");
    }
  );

$("#closeNightClock")
  .addEventListener(
    "click",
    () => {

      $("#nightClock")
        .classList.remove("show");
    }
  );


/* =========================================================
   AMBIENT MODE
   ========================================================= */

let ambientTimer = null;

function resetAmbient() {
  clearTimeout(ambientTimer);

  document.body.classList
    .remove("ambient");

  ambientTimer =
    setTimeout(() => {

      if (
        $(".page.active")?.id ===
        "homePage"
      ) {
        document.body.classList
          .add("ambient");
      }

    }, 120000);
}

["pointerdown", "pointermove", "keydown"]
  .forEach((eventName) => {

    document.addEventListener(
      eventName,
      resetAmbient,
      { passive: true }
    );
  });


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {
  const div =
    document.createElement("div");

  div.textContent =
    String(value);

  return div.innerHTML;
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function init() {
  loadState();

  applySettings();

  setupNavigation();
  setupLivingGlass();
  setupPeek();

  renderAlarms();
  renderReminders();
  renderTimer();
  renderStopwatch();
  renderFocus();

  resizeTrailCanvas();

  window.addEventListener(
    "resize",
    resizeTrailCanvas
  );

  drawTrail();

  updateClock();

  setInterval(
    updateClock,
    1000
  );

  await safeAsync(async () => {
    const wallpaper =
      await getWallpaper();

    if (wallpaper) {
      applyWallpaperBlob(
        wallpaper
      );
    }
  });

  const savedCity =
    localStorage.getItem(
      "luma2_weather_city"
    );

  if (savedCity) {
    searchWeather(savedCity);
  }

  setTimeout(() => {
    $("#bootScreen")
      .classList.add("hide");
  }, 1500);

  resetAmbient();
}

init();
