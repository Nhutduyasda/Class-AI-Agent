import { writeFile } from "node:fs/promises";
const pages = await fetch("http://127.0.0.1:9223/json").then((r) => r.json());
const ws = new WebSocket(
  pages.find((x) => x.type === "page").webSocketDebuggerUrl,
);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0;
const pending = new Map();
const requests = [];
ws.addEventListener("message", (e) => {
  const x = JSON.parse(e.data);
  if (x.method === "Network.requestWillBeSent")
    requests.push(x.params.request.url);
});
ws.addEventListener("message", (e) => {
  const x = JSON.parse(e.data);
  if (x.id) {
    const p = pending.get(x.id);
    pending.delete(x.id);
    x.error ? p.reject(Error(x.error.message)) : p.resolve(x.result);
  }
});
function cmd(method, params = {}) {
  return new Promise((resolve, reject) => {
    let id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
const evalJs = async (expression) =>
  (
    await cmd("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
  ).result.value;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
await cmd("Network.enable");
await cmd("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await cmd("Page.navigate", { url: "http://127.0.0.1:5173/" });
await delay(3000);
if (!(await evalJs('document.body.innerText.includes("MOCK_OFFLINE")')))
  throw Error("PAGE_NOT_LOADED");
const shot = async (name) => {
  const x = await cmd("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile("evidence/" + name, Buffer.from(x.data, "base64"));
};
await shot("desktop-overview.png");
const nav = async (label) => {
  await evalJs(
    `Array.from(document.querySelectorAll('nav button')).find(x=>x.textContent.includes(${JSON.stringify(label)})).click()`,
  );
  await delay(180);
  if (
    !(await evalJs(
      `document.querySelector('h1').textContent===${JSON.stringify(label)}`,
    ))
  )
    throw Error("NAV_FAILED_" + label);
};
for (const label of [
  "English Learning",
  "Product Showcase",
  "Video Jobs",
  "Preview & Review",
  "Presenter Minh",
  "Voice Profiles",
  "Budget & Scheduling",
])
  await nav(label);
await nav("English Learning");
if (!(await evalJs('document.body.innerText.includes("I ate an apple.")')))
  throw Error("SCRIPT_MISSING");
await evalJs('document.querySelector("form button.primary").click()');
await delay(500);
if (!(await evalJs('document.body.innerText.includes("UNRENDERED DRAFT")')))
  throw Error("LEARNING_DRAFT_FAILED");
await nav("Product Showcase");
await evalJs('document.querySelector("form button.primary").click()');
await delay(150);
if (await evalJs('document.body.innerText.includes("Đã lưu bản nháp")'))
  throw Error("EMPTY_PRODUCT_ACCEPTED");
await evalJs(
  `(()=>{let inputs=Array.from(document.querySelectorAll('form input'));let vals=['https://shopee.vn/demo-case','Ốp mẫu','Màu xanh','Màu xanh','Ảnh người dùng cung cấp',new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16),'Xem thông tin chi tiết.',''];inputs.forEach((e,i)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,vals[i]);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})})()`,
);
await evalJs('document.querySelector("form button.primary").click()');
await delay(1200);
if (!(await evalJs('document.body.innerText.includes("UNRENDERED DRAFT")')))
  throw Error(
    "PRODUCT_DRAFT_FAILED " +
      JSON.stringify(await evalJs("document.body.innerText.slice(-900)")) +
      " " +
      JSON.stringify(
        await evalJs(
          'Array.from(document.querySelectorAll("form input")).map(x=>x.value)',
        ),
      ),
  );
await nav("Preview & Review");
await evalJs('document.querySelector(".select-job select").value="pilot-video06-preparation";document.querySelector(".select-job select").dispatchEvent(new Event("change",{bubbles:true}))');
await delay(250);
if (!(await evalJs('document.body.innerText.includes("PENDING OWNER APPROVAL") && document.body.innerText.includes("Audio: BLOCKED") && !document.querySelector(".review-actions") && !document.querySelector("video")'))) throw Error("PILOT_STATE_INVALID");
await shot("desktop-pilot-state.png");
const fixture = await evalJs(
  'Array.from(document.querySelectorAll(".select-job option")).some(x=>x.textContent.includes("fixture"))',
);
if (!fixture) throw Error("FIXTURE_MISSING");
await evalJs(
  'document.querySelector(".select-job select").value="offline-remotion-learning";document.querySelector(".select-job select").dispatchEvent(new Event("change",{bubbles:true}))',
);
await delay(250);
if (!(await evalJs('!!document.querySelector("video")')))
  throw Error("VIDEO_MISSING");
await shot("desktop-review.png");
await evalJs(
  `(()=>{let e=document.querySelector('.review-actions textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'Đã xem fixture offline');e.dispatchEvent(new Event('input',{bubbles:true}))})()`,
);
await delay(100);
await evalJs(
  'document.querySelector(".review-actions .buttons button").click()',
);
await delay(300);
if (!(await evalJs('document.body.innerText.includes("OWNER_ACCEPTED")')))
  throw Error("REVIEW_ACTION_FAILED");
await cmd("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await nav("Overview");
await delay(250);
await shot("mobile-overview.png");
await nav("Product Showcase");
await shot("mobile-product.png");
const overflow = await evalJs(
  "document.documentElement.scrollWidth>window.innerWidth+1",
);
if (overflow) throw Error("MOBILE_OVERFLOW");
const external = requests.filter(
  (u) => !u.startsWith("http://127.0.0.1:") && !u.startsWith("data:"),
);
if (external.length)
  throw Error("EXTERNAL_NETWORK_REQUEST " + JSON.stringify(external));
console.log(
  JSON.stringify({
    networkRequests: requests.length,
    navigation: 8,
    learningDraft: true,
    productEmptyRejected: true,
    productDraft: true,
    fixtureVideo: true,
    reviewAction: true,
    pilotState: true,
    desktop: "1440x900",
    mobile: "390x844",
    horizontalOverflow: false,
    screenshots: [
      "desktop-overview.png",
      "desktop-review.png",
      "mobile-overview.png",
      "mobile-product.png",
    ],
  }),
);
ws.close();
