/* =========================
   時計
========================= */

function updateClock() {

  const now = new Date();

  const hours =
    String(now.getHours()).padStart(2, "0");

  const minutes =
    String(now.getMinutes()).padStart(2, "0");

  document.getElementById("clock").textContent =
    `${hours}:${minutes}`;


  const weekdays =
    ["日", "月", "火", "水", "木", "金", "土"];

  const month =
    now.getMonth() + 1;

  const day =
    now.getDate();

  const weekday =
    weekdays[now.getDay()];

  document.getElementById("date").textContent =
    `${month}月${day}日（${weekday}）`;
}

updateClock();

setInterval(updateClock, 1000);



/* =========================
   メニュー
========================= */

const menuButton =
  document.getElementById("menuButton");

const sideMenu =
  document.getElementById("sideMenu");

const menuOverlay =
  document.getElementById("menuOverlay");


menuButton.addEventListener("click", () => {

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
    .forEach(page => {
      page.classList.remove("active");
    });


  if (name === "home") {

    document
      .getElementById("homePage")
      .classList.add("active");

  }


  if (name === "weather") {

    document
      .getElementById("weatherPage")
      .classList.add("active");

  }

  closeMenu();
}



/* =========================
   リマインダー完了
========================= */

document
  .querySelectorAll(".check")
  .forEach(button => {

    button.addEventListener("click", () => {

      button.classList.toggle("done");

    });

  });



/* =========================
   Dynamic Island
========================= */

const island =
  document.getElementById("island");

const islandLeft =
  document.getElementById("islandLeft");

const islandRight =
  document.getElementById("islandRight");


function resetIsland() {

  island.className = "island idle";

  islandLeft.textContent = "";

  islandRight.textContent = "";

}



/* =========================
   音楽デモ
========================= */

function startMusicDemo() {

  closeMenu();

  island.className =
    "island music";

  islandLeft.textContent = "";

  // H案：右側に♪だけ
  islandRight.textContent = "♪";

}



/* =========================
   タイマーデモ
========================= */

let timerSeconds = 12 * 60 + 24;

let timerInterval = null;


function startDemoTimer() {

  closeMenu();

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  island.className =
    "island timer";

  // 左：タイマーマーク
  islandLeft.textContent = "◴";


  function drawTimer() {

    const minutes =
      Math.floor(timerSeconds / 60);

    const seconds =
      timerSeconds % 60;

    islandRight.textContent =
      `${minutes}:${String(seconds).padStart(2, "0")}`;

  }


  drawTimer();


  timerInterval =
    setInterval(() => {

      timerSeconds--;

      drawTimer();


      if (timerSeconds <= 0) {

        clearInterval(timerInterval);

        timerInterval = null;

        showNotification(
          "タイマー",
          "タイマーが終了しました"
        );

        resetIsland();

      }

    }, 1000);

}



/* =========================
   下にニョッ通知
========================= */

function showNotification(title, text) {

  document
    .getElementById("notificationTitle")
    .textContent = title;

  document
    .getElementById("notificationText")
    .textContent = text;


  document
    .getElementById("islandNotification")
    .classList.add("show");

}


function closeNotification() {

  document
    .getElementById("islandNotification")
    .classList.remove("show");

}



/* =========================
   天気：都市設定
   ※今は画面だけ
========================= */

function changeCity() {

  const city =
    prompt("市町村名を入力してください");

  if (!city) return;


  localStorage.setItem(
    "lumaWeatherCity",
    city
  );


  document
    .getElementById("weatherCity")
    .textContent = city;

  document
    .getElementById("weatherPageCity")
    .textContent = city;

}



/* =========================
   保存済み都市を復元
========================= */

const savedCity =
  localStorage.getItem("lumaWeatherCity");


if (savedCity) {

  document
    .getElementById("weatherCity")
    .textContent = savedCity;

  document
    .getElementById("weatherPageCity")
    .textContent = savedCity;

}
