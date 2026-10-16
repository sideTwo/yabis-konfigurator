// Bildschirmfoto per Edge (DevTools-Protokoll): node _dev/schirm.mjs <datei.png> <url> [breite] [hoehe] [handy] [js-vorher] [warte-ms]
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const [datei, url, b = "1440", h = "900", handy = "", vorher = "", warte = "2500"] = process.argv.slice(2);
const MOBIL = handy === "handy", DPR = MOBIL ? 2 : 1;
const PORT = 9300 + Math.floor(Math.random() * 500);
const edge = spawn(EDGE, ["--headless=new", "--hide-scrollbars", "--no-first-run", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "yk-"))}`, "about:blank"], { stdio: "ignore" });
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
try {
  let wsUrl;
  for (let i = 0; i < 60 && !wsUrl; i++) { try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl; } catch { await pause(200); } }
  ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 1; const offen = new Map(); const meldungen = [];
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && offen.has(m.id)) { const { ok, nein } = offen.get(m.id); offen.delete(m.id); m.error ? nein(new Error(JSON.stringify(m.error))) : ok(m.result); }
    else if (m.method === "Runtime.exceptionThrown") meldungen.push("FEHLER " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    else if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) meldungen.push(m.params.type + " " + m.params.args.map((a) => a.value ?? a.description).join(" "));
  });
  const send = (method, params = {}, sessionId) => new Promise((ok, nein) => { const i = id++; offen.set(i, { ok, nein }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  await s("Page.enable"); await s("Runtime.enable");
  await s("Emulation.setDeviceMetricsOverride", { width: +b, height: +h, deviceScaleFactor: DPR, mobile: MOBIL });
  await s("Page.navigate", { url });
  await pause(2500);
  if (vorher) { const r = await s("Runtime.evaluate", { expression: vorher, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) meldungen.push("JS " + r.exceptionDetails.text); await pause(+warte); }
  const { data } = await s("Page.captureScreenshot", { format: "png" });
  writeFileSync(datei, Buffer.from(data, "base64"));
  console.log(datei, meldungen.length ? "\n" + meldungen.join("\n") : "");
} finally { try { ws?.close(); } catch {} edge.kill(); }
