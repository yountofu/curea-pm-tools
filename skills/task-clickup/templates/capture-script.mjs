/**
 * Puppeteer 스크린샷 캡처 스크립트 템플릿
 *
 * 사용법:
 *   1. captures 배열에 캡처 대상 정의
 *   2. BASE URL의 포트를 실제 dev 서버에 맞게 수정
 *   3. NODE_PATH=$(npm root -g) node /tmp/clickup-capture-{도메인}.mjs
 *
 * 네이밍: {prefix}-{nn}-{설명-kebab}.png
 */

import { createRequire } from "module";
import path from "path";
import { mkdirSync } from "fs";

const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer");

const BASE = "http://localhost:{포트}/ko"; // 포트 동적 반영
const DIR = "/tmp/clickup-screenshots";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(DIR, { recursive: true });

async function shot(page, name) {
  const fp = path.join(DIR, `${name}.png`);
  await page.screenshot({ path: fp, fullPage: false });
  console.log(`✓ ${name}`);
}

async function clickNav(page, tab) {
  await page.evaluate((t) => {
    const btns = [...document.querySelectorAll("button")];
    const target = btns.find(
      (b) => b.textContent?.trim() === t && !b.closest("dialog")
    );
    if (target) target.click();
  }, tab);
  await wait(2000);
}

async function clickBtn(page, text, nth = 0) {
  return page.evaluate(
    (t, i) => {
      const btns = [...document.querySelectorAll("button")].filter(
        (b) =>
          b.textContent?.trim() === t &&
          !b.closest("nav") &&
          !b.closest("aside") &&
          !b.closest("dialog")
      );
      if (btns[i]) {
        btns[i].click();
        return true;
      }
      return false;
    },
    text,
    nth
  );
}

async function closeDialog(page) {
  await page.keyboard.press("Escape");
  await wait(1000);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/{경로}`, {
    waitUntil: "networkidle0",
    timeout: 30000,
  });
  await wait(3000);

  // === 캡처 시작 ===

  // 1. 탭 뷰
  await shot(page, "{prefix}-01-{탭명}");

  // 2. 모달 열기
  if (await clickBtn(page, "{버튼텍스트}", 0)) {
    await wait(1500);
    await shot(page, "{prefix}-02-{모달명}");

    // 3. 폼 입력 (선택)
    // const input = await page.$('input[type="text"]');
    // if (input) { await input.type("test"); await wait(500); }
    // await shot(page, "{prefix}-03-{입력상태}");

    await closeDialog(page);
  }

  // === 캡처 끝 ===

  await browser.close();
  console.log("\n완료!");
})();
