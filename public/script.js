// Frontend logic: talks to the Express server using fetch()

const $ = id => document.getElementById(id);

let gpus = [];        // loaded from the server
let session = null;   // { gpu, rate, start }
let timerId = null;

// ---------- helpers ----------
function fmtTime(sec) {
  sec = Math.floor(sec);
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return h + ":" + m + ":" + s;
}

// ---------- load data from server ----------
async function loadGpus() {
  const res = await fetch("/api/gpus");
  gpus = await res.json();
  $("gpu").innerHTML = gpus
    .map(g => `<option value="${g.name}">${g.name} — $${g.rate.toFixed(2)}/hr</option>`)
    .join("");
}

async function loadHistory() {
  const res = await fetch("/api/sessions");
  const sessions = await res.json();

  const totalSec = sessions.reduce((a, s) => a + s.seconds, 0);
  const totalCost = sessions.reduce((a, s) => a + s.cost, 0);
  $("totalTime").textContent =
    totalSec >= 3600 ? (totalSec / 3600).toFixed(2) + "h" : Math.round(totalSec / 60) + "m";
  $("totalCost").textContent = "$" + totalCost.toFixed(2);

  if (sessions.length === 0) {
    $("history").innerHTML = '<p class="empty">No sessions yet. Start one above.</p>';
    return;
  }

  $("history").innerHTML =
    "<table><tr><th>GPU</th><th>Date</th><th>Duration</th><th>Cost</th></tr>" +
    sessions
      .map(s => `<tr><td>${s.gpu}</td><td>${s.date}</td><td>${fmtTime(s.seconds)}</td><td>$${s.cost.toFixed(4)}</td></tr>`)
      .join("") +
    "</table>";
}

// ---------- session timer ----------
function tick() {
  const sec = (Date.now() - session.start) / 1000;
  $("time").textContent = fmtTime(sec);
  $("cost").textContent = "$" + ((sec / 3600) * session.rate).toFixed(4);

  // simulated utilization (random, not real hardware data)
  const u = Math.floor(55 + Math.random() * 45);
  $("util").style.width = u + "%";
  $("utilLabel").textContent = "GPU utilization: " + u + "%";
}

function startSession() {
  const name = $("gpu").value;
  const gpu = gpus.find(g => g.name === name);
  session = { gpu: gpu.name, rate: gpu.rate, start: Date.now() };

  $("gpu").disabled = true;
  $("toggle").textContent = "Stop Session";
  $("toggle").classList.add("stop");
  tick();
  timerId = setInterval(tick, 1000);
}

async function stopSession() {
  clearInterval(timerId);
  const seconds = (Date.now() - session.start) / 1000;

  // send the finished session to the server
  await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gpu: session.gpu, seconds: seconds })
  });

  session = null;
  $("gpu").disabled = false;
  $("toggle").textContent = "Start Session";
  $("toggle").classList.remove("stop");
  $("time").textContent = "00:00:00";
  $("cost").textContent = "$0.0000";
  $("util").style.width = "0";
  $("utilLabel").textContent = "GPU utilization: idle";

  loadHistory();
}

// ---------- events ----------
$("toggle").addEventListener("click", () => {
  if (session) stopSession();
  else startSession();
});

$("clear").addEventListener("click", async () => {
  if (confirm("Delete all session history?")) {
    await fetch("/api/sessions", { method: "DELETE" });
    loadHistory();
  }
});

// ---------- start ----------
loadGpus();
loadHistory();
