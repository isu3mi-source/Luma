* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;

  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Helvetica Neue",
    sans-serif;

  color: white;
  background: #090909;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}


/* 背景 */

.background {
  position: fixed;
  inset: 0;

  background:
    radial-gradient(
      circle at 20% 45%,
      rgba(255, 178, 105, .82),
      transparent 33%
    ),
    radial-gradient(
      circle at 78% 65%,
      rgba(167, 102, 85, .72),
      transparent 35%
    ),
    radial-gradient(
      circle at 55% 15%,
      rgba(105, 91, 118, .35),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      #463126,
      #151414 55%,
      #080808
    );

  transform: scale(1.08);
}


/* 縦向き */

#portraitWarning {
  display: none;

  position: fixed;
  inset: 0;

  z-index: 9999;

  align-items: center;
  justify-content: center;

  background:
    linear-gradient(
      145deg,
      #2d211b,
      #080808
    );
}

.rotate-card {
  padding: 35px 50px;

  text-align: center;

  border: 1px solid rgba(255,255,255,.25);
  border-radius: 32px;

  background: rgba(255,255,255,.09);

  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
}

.rotate-icon {
  font-size: 55px;
}

@media (orientation: portrait) {

  #app {
    display: none;
  }

  #portraitWarning {
    display: flex;
  }

}


/* 共通ガラス */

.glass-circle,
.glass-button,
.main-button {
  border: 1px solid rgba(255,255,255,.23);

  color: white;

  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.18),
      rgba(255,255,255,.06)
    );

  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);

  box-shadow:
    inset 0 1px rgba(255,255,255,.35),
    0 10px 30px rgba(0,0,0,.15);
}


/* メニューボタン */

#menuButton,
#closePageButton {
  position: fixed;

  top: 24px;
  left: 26px;

  width: 62px;
  height: 62px;

  border-radius: 50%;

  z-index: 250;
}

#menuButton {
  display: flex;

  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 6px;
}

#menuButton span {
  width: 27px;
  height: 3px;

  border-radius: 20px;

  background: white;
}

.close-page {
  display: none;

  font-size: 34px;
  line-height: 1;
}


/* Dynamic Island */

.island {
  position: fixed;

  top: 17px;
  left: 50%;

  transform: translateX(-50%);

  width: 126px;
  height: 48px;

  padding: 0 18px;

  border: 0;
  border-radius: 30px;

  z-index: 300;

  color: white;
  background: #000;

  display: flex;
  align-items: center;
  justify-content: space-between;

  overflow: hidden;

  transition:
    width .45s cubic-bezier(.2,.9,.2,1.15),
    height .45s cubic-bezier(.2,.9,.2,1.15);
}

.island.idle {
  width: 126px;
}

.island.music {
  width: 205px;
}

.island.timer {
  width: 260px;
}

.island.expanded {
  width: 360px;
  height: 105px;
}

#islandLeft,
#islandCenter,
#islandRight {
  display: flex;
  align-items: center;

  font-weight: 600;
}

#islandCenter {
  margin: auto;
}

#islandRight {
  margin-left: auto;
}


/* Island通知 */

#islandNotification {
  position: fixed;

  top: 52px;
  left: 50%;

  width: 330px;

  padding: 22px;

  z-index: 290;

  border-radius: 0 0 30px 30px;

  background: rgba(5,5,5,.9);

  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);

  transform:
    translateX(-50%)
    translateY(-160%);

  opacity: 0;

  transition:
    transform .5s cubic-bezier(.2,.9,.2,1.15),
    opacity .25s;
}

#islandNotification.show {
  transform:
    translateX(-50%)
    translateY(0);

  opacity: 1;
}

.notification-title {
  font-size: 13px;
  opacity: .6;
}

.notification-text {
  margin-top: 5px;

  font-size: 20px;
  font-weight: 650;
}

.notification-actions {
  display: flex;

  gap: 10px;

  margin-top: 18px;
}

.notification-actions button {
  flex: 1;

  padding: 10px;

  border: 0;
  border-radius: 18px;

  color: white;

  background: rgba(255,255,255,.14);
}


/* ページ */

.page {
  position: fixed;
  inset: 0;

  display: none;

  z-index: 10;
}

.page.active {
  display: block;
}


/* ホーム */

.clock-area {
  position: absolute;

  top: 50%;
  left: 50%;

  transform: translate(-50%, -45%);

  width: 90%;

  text-align: center;
}

#date {
  font-size: clamp(21px, 3vw, 38px);

  font-weight: 650;
}

#clock {
  font-size: clamp(100px, 19vw, 230px);

  font-weight: 200;

  letter-spacing: -8px;

  line-height: .95;

  text-shadow:
    0 4px 15px rgba(0,0,0,.16);
}


/* ホームリマインダー */

.home-reminders {
  width: 470px;

  max-width: 70vw;

  margin: 18px auto 0;

  text-align: left;
}

.reminder-row {
  display: flex;
  align-items: center;

  gap: 12px;

  min-height: 38px;

  font-size: 19px;
}

.reminder-row time {
  margin-left: auto;

  opacity: .75;
}

.check {
  width: 25px;
  height: 25px;

  flex: 0 0 25px;

  border-radius: 50%;

  border: 2px solid rgba(255,255,255,.85);

  background: transparent;

  color: white;
}

.check.done::after {
  content: "✓";

  display: grid;
  place-items: center;

  font-size: 16px;
}


/* 天気ミニ */

.weather-mini {
  position: fixed;

  top: 24px;
  right: 27px;

  z-index: 220;

  display: flex;
  align-items: center;

  gap: 11px;

  min-width: 145px;

  padding: 9px 17px;

  color: white;

  border: 1px solid rgba(255,255,255,.22);
  border-radius: 28px;

  background: rgba(255,255,255,.09);

  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
}

.weather-mini-text {
  text-align: left;
}

.weather-mini strong {
  display: block;

  font-size: 23px;
}

.weather-mini small {
  display: block;

  opacity: .7;
}


/* 各機能画面 */

.feature-panel,
.weather-panel {
  position: absolute;

  inset: 16px;

  overflow: auto;

  border: 1px solid rgba(255,255,255,.16);
  border-radius: 38px;

  background:
    linear-gradient(
      145deg,
      rgba(25,25,25,.55),
      rgba(5,5,5,.36)
    );

  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);

  box-shadow:
    inset 0 1px rgba(255,255,255,.22);
}

.page-title {
  padding-top: 30px;

  text-align: center;

  font-size: 27px;
  font-weight: 650;
}

.empty-message {
  position: absolute;

  top: 50%;
  left: 50%;

  transform: translate(-50%, -50%);

  width: 80%;

  text-align: center;
}

.big-symbol {
  font-size: 60px;

  opacity: .75;
}

.empty-message p {
  opacity: .65;
}


/* タイマー */

.timer-display {
  margin-top: 55px;

  text-align: center;

  font-size: clamp(75px, 13vw, 150px);

  font-weight: 200;

  font-variant-numeric: tabular-nums;
}

.timer-buttons {
  display: flex;
  justify-content: center;

  gap: 12px;

  margin-top: 20px;
}

.glass-button,
.main-button {
  min-width: 105px;

  padding: 12px 22px;

  border-radius: 24px;
}

.main-button {
  background: rgba(255,255,255,.22);
}


/* 世界時計 */

.world-list {
  width: min(650px, 80%);

  margin: 55px auto;
}

.world-card {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 20px 25px;

  margin-bottom: 12px;

  border: 1px solid rgba(255,255,255,.15);
  border-radius: 24px;

  background: rgba(255,255,255,.07);
}

.world-card span {
  font-size: 20px;
}

.world-card strong {
  font-size: 34px;

  font-weight: 350;
}


/* リマインダー */

.add-reminder,
.add-city {
  position: absolute;

  top: 22px;
  right: 24px;

  width: 55px;
  height: 55px;

  border: 1px solid rgba(255,255,255,.2);
  border-radius: 50%;

  color: white;

  background: rgba(255,255,255,.1);

  font-size: 30px;
}

.reminder-list {
  width: min(700px, 80%);

  margin: 45px auto;
}

.reminder-item {
  display: flex;
  align-items: center;

  gap: 14px;

  padding: 17px 20px;

  margin-bottom: 10px;

  border-radius: 22px;

  background: rgba(255,255,255,.08);
}

.reminder-item button {
  width: 26px;
  height: 26px;

  border: 2px solid white;
  border-radius: 50%;

  background: transparent;
}


/* 天気 */

.weather-panel {
  background:
    radial-gradient(
      circle at 50% 20%,
      rgba(89,145,194,.6),
      transparent 42%
    ),
    linear-gradient(
      180deg,
      rgba(30,72,108,.78),
      rgba(11,26,42,.75)
    );
}

.weather-main {
  padding-top: 75px;

  text-align: center;
}

.weather-main h2 {
  margin: 0;

  font-size: 31px;
}

.big-temp {
  font-size: clamp(90px, 14vw, 150px);

  font-weight: 200;

  line-height: 1.05;
}

.weather-note {
  margin-top: 30px;

  font-size: 14px;
  line-height: 1.6;

  opacity: .55;
}


/* 音楽 */

.music-card {
  width: min(520px, 75%);

  margin: 50px auto;

  text-align: center;
}

.music-note {
  font-size: 75px;
}

.music-card p {
  opacity: .6;
}

#audioPlayer {
  display: block;

  width: 100%;

  margin-top: 25px;
}


/* 設定 */

.settings-list {
  width: min(650px, 80%);

  margin: 50px auto;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 18px 22px;

  margin-bottom: 10px;

  border-radius: 22px;

  background: rgba(255,255,255,.08);
}


/* サイドメニュー */

#menuOverlay {
  position: fixed;
  inset: 0;

  z-index: 390;

  pointer-events: none;

  opacity: 0;

  background: rgba(0,0,0,.18);

  transition: .35s;
}

#menuOverlay.show {
  pointer-events: auto;

  opacity: 1;

  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
}

#sideMenu {
  position: fixed;

  top: 0;
  left: 0;

  width: 320px;
  max-width: 72vw;

  height: 100%;

  z-index: 400;

  padding: 34px 20px 25px;

  transform: translateX(-105%);

  border-right: 1px solid rgba(255,255,255,.22);

  background:
    linear-gradient(
      145deg,
      rgba(55,55,55,.62),
      rgba(8,8,8,.53)
    );

  backdrop-filter: blur(38px);
  -webkit-backdrop-filter: blur(38px);

  transition:
    transform .45s cubic-bezier(.2,.9,.2,1);
}

#sideMenu.show {
  transform: translateX(0);
}

#sideMenu h2 {
  margin: 0 0 22px 12px;

  font-size: 28px;
}

#sideMenu button {
  width: 100%;

  padding: 12px 15px;

  border: 0;
  border-radius: 16px;

  text-align: left;

  color: white;

  background: transparent;

  font-size: 17px;
}

#sideMenu button:active {
  background: rgba(255,255,255,.14);
}

.menu-divider {
  height: 1px;

  margin: 10px;

  background: rgba(255,255,255,.15);
}
