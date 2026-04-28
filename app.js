import { onUserStateChange, getUserRole, logOut } from "./auth.js";
import { addNeed, addVolunteer, getNeeds, getVolunteers, deleteNeed, deleteVolunteer } from "./dataService.js";

// ── Auth Guard ─────
onUserStateChange(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const data = await getUserRole(user.uid);

  if (!data || data.role !== "ngo") {
    window.location.href = data?.role === "volunteer"
      ? "volunteer.html"
      : "login.html";
    return;
  }

  const name = data?.name || user.email || "Admin";
  const welcomeEl = document.getElementById("welcomeMsg");
  if (welcomeEl) {
    welcomeEl.textContent = `Welcome, ${name}!`;
  }
});

// ── State ─────
let needs = [];
let volunteers = [];

// ── Boot ───────
async function init() {
  needs = await getNeeds();
  volunteers = await getVolunteers();
  renderNeeds();
  renderVolunteers();
  updateStats();
  autoMatch();
}

// ── Form: Add Need ────
const needForm = document.getElementById("needForm");
if (needForm) {
  needForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const need = {
      title:    document.getElementById("title").value.trim(),
      location: document.getElementById("location").value.trim(),
      skill:    document.getElementById("skill").value.trim(),
      urgency:  document.getElementById("urgency").value,
    };
    const id = await addNeed(need);
    needs.push({ ...need, id });
    renderNeeds();
    updateStats();
    autoMatch();
    e.target.reset();
    document.querySelectorAll(".urgency-btn").forEach(b => b.classList.remove("active-low","active-med","active-high"));
    const medBtn = document.querySelector('[data-value="Medium"]');
    if (medBtn) medBtn.classList.add("active-med");
    document.getElementById("urgency").value = "Medium";
  });
}

// ── Form: Add Volunteer ───
const volForm = document.getElementById("volForm");
if (volForm) {
  volForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const contact = document.getElementById("vcontact").value.trim();

    if (volunteers.some(v => v.contact === contact)) {
      showToast("A volunteer with this contact already exists.", "warn");
      return;
    }

    const vol = {
      name:         document.getElementById("vname").value.trim(),
      contact,
      skill:        document.getElementById("vskill").value.trim(),
      location:     document.getElementById("vlocation").value.trim(),
      availability: document.getElementById("vavail").value.trim() || "Flexible",
    };

    const id = await addVolunteer(vol);
    volunteers.push({ ...vol, id });
    renderVolunteers();
    updateStats();
    autoMatch();
    e.target.reset();
    if (typeof window.resetTags === "function") window.resetTags();
  });
}

// ── Delete: Need ──────
window.deleteNeedItem = async function (id, idx) {
  await deleteNeed(id);
  needs.splice(idx, 1);
  renderNeeds();
  updateStats();
  autoMatch();
};

// ── Delete: Volunteer ───
window.deleteVolItem = async function (id, idx) {
  await deleteVolunteer(id);
  volunteers.splice(idx, 1);
  renderVolunteers();
  updateStats();
  autoMatch();
};

// ── Auto-match ────
function autoMatch() {
  const listEl = document.getElementById("matchesList");
  const statsEl = document.getElementById("s-matches");

  if (!needs.length || !volunteers.length) {
    if (listEl) listEl.innerHTML = '<div class="empty-state">Add at least one need and one volunteer to see matches</div>';
    if (statsEl) statsEl.textContent = 0;
    return;
  }

  if (typeof window.runMatchingEngine === "function") {
    const results = window.runMatchingEngine(volunteers, needs);
    renderMatches(results);
    if (statsEl) statsEl.textContent = results.filter(r => r.matched).length;

    // Refresh map if it's already open
    if (window._mapTabOpen && typeof window.refreshMap === "function") {
      window.refreshMap(needs, volunteers);
    }
  }
}

// ── Manual re-run button ──
window.findMatches = function () {
  autoMatch();
  showToast("Matching complete!", "success");
};

// ── Render: Needs List ───
function renderNeeds() {
  const el = document.getElementById("needsList");
  const countEl = document.getElementById("needCount");
  if (countEl) countEl.textContent = needs.length;

  if (!el) return;
  if (!needs.length) {
    el.innerHTML = '<div class="empty-state">No needs added yet</div>';
    renderChart();
    return;
  }
  el.innerHTML = needs.map((n, i) => `
    <div class="need-item">
      <div>
        <div class="item-main">
          ${n.title}
          <span class="badge badge-${n.urgency.toLowerCase()}">${n.urgency}</span>
        </div>
        <div class="item-sub">${n.skill} · ${n.location}</div>
      </div>
      <button class="delete-btn" onclick="deleteNeedItem('${n.id}', ${i})" title="Remove">×</button>
    </div>`).join("");
  renderChart();
}

// ── Render: Volunteers List ─
function renderVolunteers() {
  const el = document.getElementById("volunteersList");
  const countEl = document.getElementById("volCount");
  if (countEl) countEl.textContent = volunteers.length;

  if (!el) return;
  if (!volunteers.length) {
    el.innerHTML = '<div class="empty-state">No volunteers registered yet</div>';
    return;
  }
  el.innerHTML = volunteers.map((v, i) => `
    <div class="vol-item">
      <div>
        <div class="item-main">${v.name}</div>
        <div class="item-sub">${v.skill} · ${v.location} · ${v.availability}</div>
      </div>
      <button class="delete-btn" onclick="deleteVolItem('${v.id}', ${i})" title="Remove">×</button>
    </div>`).join("");
}

// ── Render: Match Cards ──
function renderMatches(results) {
  const el = document.getElementById("matchesList");
  if (!el) return;
  if (!results.length) {
    el.innerHTML = '<div class="empty-state">No matches found</div>';
    return;
  }

  el.innerHTML = results.map(r => {
    const skillHit = r.skillMatch ? "hit" : "miss";
    const locHit   = r.locMatch   ? "hit" : "miss";
    const availHit = r.availMatch ? "hit" : "miss";

    return `
    <div class="match-item">
      <div class="match-header-row">
        <div class="item-main">${r.needTitle} → ${r.volunteerName}</div>
        <span class="match-score">${r.score}%</span>
      </div>
      <div class="item-sub" style="margin-bottom:6px;">${r.needSkill} · ${r.needLocation}</div>
      <div class="match-reasons">
        <span class="match-reason ${skillHit}">Skill ${r.skillMatch ? "✓" : "✗"}</span>
        <span class="match-reason ${locHit}">Location ${r.locMatch ? "✓" : "✗"}</span>
        <span class="match-reason ${availHit}">Available ${r.availMatch ? "✓" : "✗"}</span>
      </div>
    </div>`;
  }).join("");
}

// ── Render: Breakdown Chart ──
function renderChart() {
  const el = document.getElementById("chartArea");
  if (!el) return;
  if (!needs.length) {
    el.innerHTML = '<div class="empty-state">Add needs to see breakdown</div>';
    return;
  }

  const counts = { High: 0, Medium: 0, Low: 0 };
  needs.forEach(n => { if (counts[n.urgency] !== undefined) counts[n.urgency]++; });
  const max = Math.max(...Object.values(counts), 1);
  const colors = { High: "#ef4444", Medium: "#f59e0b", Low: "#22c55e" };

  el.innerHTML = Object.entries(counts).map(([label, count]) => `
    <div class="chart-bar-row">
      <div class="chart-bar-label">${label}</div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width:${Math.round((count/max)*100)}%; background:${colors[label]};"></div>
      </div>
      <div class="chart-bar-count">${count}</div>
    </div>`).join("");

  const skillMap = {};
  needs.forEach(n => { skillMap[n.skill] = (skillMap[n.skill] || 0) + 1; });
  const topSkills = Object.entries(skillMap).sort((a,b) => b[1]-a[1]).slice(0, 5);
  const maxS = Math.max(...topSkills.map(s => s[1]), 1);

  el.innerHTML += `<div class="section-label" style="margin-top:14px;">Top Skills Needed</div>`;
  el.innerHTML += topSkills.map(([skill, count]) => `
    <div class="chart-bar-row">
      <div class="chart-bar-label" style="width:80px;font-size:11px;">${skill}</div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width:${Math.round((count/maxS)*100)}%; background:#4f8cff;"></div>
      </div>
      <div class="chart-bar-count">${count}</div>
    </div>`).join("");
}

// ── Update Stats ───
function updateStats() {
  const nEl = document.getElementById("s-needs");
  const vEl = document.getElementById("s-vols");
  const hEl = document.getElementById("s-high");

  if (nEl) nEl.textContent = needs.length;
  if (vEl) vEl.textContent = volunteers.length;
  if (hEl) hEl.textContent = needs.filter(n => n.urgency === "High").length;
}

// ── CSV Upload ───
window.handleCSV = async function (event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const lines = e.target.result.trim().split("\n").slice(1);
    let imported = 0;
    for (const line of lines) {
      const parts = line.split(",").map(s => s.trim());
      if (parts.length < 3) continue;
      const [title, location, skill, urgency] = parts;
      if (!title) continue;
      const need = { title, location, skill, urgency: urgency || "Medium" };
      const id = await addNeed(need);
      needs.push({ ...need, id });
      imported++;
    }
    renderNeeds();
    updateStats();
    autoMatch();
    const statusEl = document.getElementById("csvStatus");
    if (statusEl) statusEl.textContent = `✓ Imported ${imported} needs`;
    event.target.value = "";
  };
  reader.readAsText(file);
};

// ── Tab Switching ───
window.switchTab = function (tab, btn) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  
  const chart = document.getElementById("tab-chart");
  const map = document.getElementById("tab-map");
  const exp = document.getElementById("tab-export");

  if (chart) chart.style.display = tab === "chart" ? "" : "none";
  if (map) map.style.display = tab === "map" ? "" : "none";
  if (exp) exp.style.display = tab === "export" ? "" : "none";

  if (tab === "map") {
    window._mapTabOpen = true;
    if (typeof window.onMapTabOpen === "function") {
      window.onMapTabOpen(needs, volunteers);
    }
  } else {
    window._mapTabOpen = false;
  }
};

// ── Export CSV ───
window.exportNeeds = function () {
  const rows = [["Title","Location","Skill","Urgency"],
    ...needs.map(n => [n.title, n.location, n.skill, n.urgency])];
  downloadCSV(rows, "needs.csv");
};

window.exportVolunteers = function () {
  const rows = [["Name","Contact","Skill","Location","Availability"],
    ...volunteers.map(v => [v.name, v.contact, v.skill, v.location, v.availability])];
  downloadCSV(rows, "volunteers.csv");
};

window.exportMatches = function () {
  if (!needs.length || !volunteers.length) { showToast("No data to export", "warn"); return; }
  if (typeof window.runMatchingEngine === "function") {
    const results = window.runMatchingEngine(volunteers, needs);
    const rows = [["Need","Volunteer","Score","Skill Match","Location Match","Availability Match"],
      ...results.map(r => [r.needTitle, r.volunteerName, r.score, r.skillMatch, r.locMatch, r.availMatch])];
    downloadCSV(rows, "matches.csv");
  }
};

function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Toast Notifications ────
function showToast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => { 
    t.classList.remove("show"); 
    setTimeout(() => t.remove(), 300); 
  }, 2800);
}

// ── Start ──
init();