/* =========================
   Luma β 0.2
========================= */

const menuButton =
  document.getElementById("menuButton");

const closeButton =
  document.getElementById("closeButton");

const sideMenu =
  document.getElementById("sideMenu");

const menuOverlay =
  document.getElementById("menuOverlay");

const weatherMini =
  document.getElementById("weatherMini");

const island =
  document.getElementById("island");

const islandLeft =
  document.getElementById("islandLeft");

const islandCenter =
  document.getElementById("islandCenter");

const islandRight =
  document.getElementById("islandRight");


/* =========================
   時計
========================= */

let showSeconds = false;


function updateClock() {

  const now = new Date();

  const hour =
    String(now.getHours()).padStart(2, "0");

  const minute =
    String(now.getMinutes()).padStart(2, "0");

  const second =
    String(now.getSeconds()).padStart(2, "0");


  document.getElementById("clockText").textContent =
    showSeconds
      ? `${hour}:${minute}:${second}`
      : `${hour}:${minute}`;


  const week =
    ["日", "月", "火", "水", "木", "金", "土"];


  document.getElementById("dateText").textContent =
    `${now.getMonth() + 1}月${now.getDate()}日（${week[now.getDay()]}）`;


  updateWorldClock();
}


updateClock();

setInterval(updateClock, 1000);


/* =========================
   メニュー
========================= */

menuButton.addEventListener("click", function () {

  sideMenu.classList.add("show");

  menuOverlay.classList.add("show");

});


menuOverlay.addEventListener("click", closeMenu);


function closeMenu() {

  sideMenu.classList.remove("show");

  menuOverlay.classList.remove("show");

}


/* =========================
   ページ切替
========================= */

function openPage(name) {

  document
    .querySelectorAll(".page")
    .forEach(function (page) {

      page.classList.remove("active");

    });


  const target =
    document.getElementById(name + "Page");


  if (target) {

    target.classList.add("active");

  }


  const home =
    name === "home";


  menuButton.style.display =
    home ? "flex" : "none";


  closeButton.style.display =
    home ? "none" : "block";


  weatherMini.style.display =
    home ? "flex" : "none";


  closeMenu();

}


closeButton.addEventListener("click", function () {

  openPage("home");

});


/* =========================
   HOME チェック
========================= */

document
  .querySelectorAll(".circleCheck")
  .forEach(function (button) {

    button.addEventListener("click", function () {

      button.classList.toggle("done");

    });

  });


/* =========================
   Dynamic Island
========================= */

function resetIsland() {

  island.className = "";

  islandLeft.textContent = "";

  islandCenter.textContent = "";

  islandRight.textContent = "";

}


function showTimerIsland(text) {

  island.className = "timer";

  islandLeft.textContent = "◴";

  islandCenter.textContent = "";

  islandRight.textContent = text;

}


function showMusicIsland() {

  island.className = "music";

  islandLeft.textContent = "";

  islandCenter.textContent = "";

  islandRight.textContent = "♪";

}


/* =========================
   タイマー
========================= */

let timerDefault = 300;

let timerSeconds = 300;

let timerID = null;


function timerText() {

  const minutes =
    Math.floor(timerSeconds / 60);

  const seconds =
    timerSeconds % 60;


  return (
    String(minutes).padStart(2, "0")
    + ":"
    + String(seconds).padStart(2, "0")
  );

}


function drawTimer() {

  const text = timerText();


  document.getElementById(
    "timerDisplay"
  ).textContent = text;


  if (timerID) {

    showTimerIsland(text);

  }

}


function setTimer(seconds) {

  pauseTimer();

  timerDefault = seconds;

  timerSeconds = seconds;

  drawTimer();

}


function startTimer() {

  if (timerID) {
    return;
  }


  showTimerIsland(timerText());


  timerID =
    setInterval(function () {

      timerSeconds--;


      if (timerSeconds <= 0) {

        timerSeconds = 0;

        drawTimer();

        clearInterval(timerID);

        timerID = null;

        resetIsland();

        alert("タイマーが終了しました");

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

}


function resetTimer() {

  pauseTimer();

  timerSeconds = timerDefault;

  drawTimer();

  resetIsland();

}


/* =========================
   ストップウォッチ
========================= */

let stopwatchElapsed = 0;

let stopwatchStart = 0;

let stopwatchID = null;


function startStopwatch() {

  if (stopwatchID) {
    return;
  }


  stopwatchStart =
    Date.now() - stopwatchElapsed;


  stopwatchID =
    setInterval(function () {

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


  document.getElementById(
    "stopwatchDisplay"
  ).textContent =
    String(minutes).padStart(2, "0")
    + ":"
    + String(seconds).padStart(2, "0")
    + "."
    + decimal;

}


drawStopwatch();


/* =========================
   世界時計
========================= */

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

  document.getElementById(
    "tokyoTime"
  ).textContent =
    zoneTime("Asia/Tokyo");


  document.getElementById(
    "londonTime"
  ).textContent =
    zoneTime("Europe/London");


  document.getElementById(
    "newYorkTime"
  ).textContent =
    zoneTime("America/New_York");

}


/* =========================
   リマインダー
========================= */

let reminders = [];


try {

  reminders =
    JSON.parse(
      localStorage.getItem("lumaReminders")
    ) || [];

}
catch {

  reminders = [];

}


function saveReminders() {

  localStorage.setItem(
    "lumaReminders",
    JSON.stringify(reminders)
  );

}


function addReminder() {

  const text =
    prompt("リマインダーを入力してください");


  if (!text) {
    return;
  }


  reminders.push({
    id: Date.now(),
    text: text
  });


  saveReminders();

  drawReminders();

}


function deleteReminder(id) {

  reminders =
    reminders.filter(function (item) {

      return item.id !== id;

    });


  saveReminders();

  drawReminders();

}


function drawReminders() {

  const list =
    document.getElementById("reminderList");


  list.innerHTML = "";


  if (reminders.length === 0) {

    list.innerHTML =
      '<div style="text-align:center;opacity:.55;margin-top:60px;">リマインダーはありません</div>';

    return;

  }


  reminders.forEach(function (item) {

    const row =
      document.createElement("div");


    row.className = "reminderItem";


    const button =
      document.createElement("button");


    button.addEventListener("click", function () {

      deleteReminder(item.id);

    });


    const text =
      document.createElement("span");


    text.textContent = item.text;


    row.appendChild(button);

    row.appendChild(text);

    list.appendChild(row);

  });

}


drawReminders();


/* =========================
   天気 都市
========================= */

function changeCity() {

  const city =
    prompt(
      "市町村名を入力してください\n例：周南市"
    );


  if (!city) {
    return;
  }


  localStorage.setItem(
    "lumaWeatherCity",
    city
  );


  document.getElementById(
    "miniCity"
  ).textContent = city;


  document.getElementById(
    "weatherCity"
  ).textContent = city;


  document.getElementById(
    "weatherCondition"
  ).textContent =
    "天気APIは次のアップデートで接続";

}


const savedCity =
  localStorage.getItem("lumaWeatherCity");


if (savedCity) {

  document.getElementById(
    "miniCity"
  ).textContent = savedCity;


  document.getElementById(
    "weatherCity"
  ).textContent = savedCity;

}


/* =========================
   ミュージック
========================= */

const musicFile =
  document.getElementById("musicFile");

const audioPlayer =
  document.getElementById("audioPlayer");


function selectMusic() {

  musicFile.click();

}


musicFile.addEventListener(
  "change",
  function () {

    const file =
      musicFile.files[0];


    if (!file) {
      return;
    }


    const url =
      URL.createObjectURL(file);


    audioPlayer.src = url;


    document.getElementById(
      "musicTitle"
    ).textContent = file.name;


    audioPlayer.play();

  }
);


audioPlayer.addEventListener(
  "play",
  function () {

    showMusicIsland();

  }
);


audioPlayer.addEventListener(
  "pause",
  function () {

    if (!timerID) {

      resetIsland();

    }

  }
);


/* =========================
   設定
========================= */

const secondsToggle =
  document.getElementById("secondsToggle");

const homeReminderToggle =
  document.getElementById("homeReminderToggle");


showSeconds =
  localStorage.getItem(
    "lumaSeconds"
  ) === "true";


secondsToggle.checked =
  showSeconds;


secondsToggle.addEventListener(
  "change",
  function () {

    showSeconds =
      secondsToggle.checked;


    localStorage.setItem(
      "lumaSeconds",
      showSeconds
    );


    updateClock();

  }
);


const reminderSetting =
  localStorage.getItem(
    "lumaHomeReminders"
  );


if (reminderSetting !== null) {

  homeReminderToggle.checked =
    reminderSetting === "true";

}


function updateReminderSetting() {

  document.getElementById(
    "homeReminderList"
  ).style.display =
    homeReminderToggle.checked
      ? "block"
      : "none";

}


homeReminderToggle.addEventListener(
  "change",
  function () {

    localStorage.setItem(
      "lumaHomeReminders",
      homeReminderToggle.checked
    );


    updateReminderSetting();

  }
);


updateReminderSetting();


/* =========================
   起動
========================= */

openPage("home");

drawTimer();

updateWorldClock();
