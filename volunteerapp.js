import { onUserStateChange, getUserRole, logOut } from "./auth.js";
import { getNeeds, addVolunteer, getVolunteers } from "./dataService.js";

let currentUser = null;
let allNeeds    = [];


onUserStateChange(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;

 
  const data = await getUserRole(user.uid);
  if (data?.role === "ngo") {
    window.location.href = "index.html"; // NGOs go to NGO dashboard
    return;
  }

 
  const name = data?.name || user.email || user.phoneNumber || "Volunteer";
  document.getElementById("welcomeMsg").textContent = `Welcome, ${name}!`;

  
  await loadNeeds();
});


async function loadNeeds() {
  allNeeds = await getNeeds();
  renderAllNeeds();
  updateStats();
}


document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const volunteer = {
    name:         document.getElementById("pName").value.trim(),
    skill:        document.getElementById("pSkill").value.trim(),
    location:     document.getElementById("pLocation").value.trim(),
    availability: document.getElementById("pAvail").value.trim() || "Flexible",
    uid:          currentUser.uid,
  };

  // Save to Firebase (as volunteer)
  await addVolunteer(volunteer);

  // Run matching for this volunteer
  findMyMatches(volunteer);
});


function findMyMatches(volunteer) {
  if (!allNeeds.length) {
    document.getElementById("myMatchesList").innerHTML =
      '<div class="empty-state">No open tasks available right now.</div>';
    return;
  }

  
  const results = window.runMatchingEngine([volunteer], allNeeds);

  const matched = results.filter(r => r.matched && r.score > 0);

  document.getElementById("v-myMatches").textContent = matched.length;

  const el = document.getElementById("myMatchesList");
  if (!matched.length) {
    el.innerHTML = '<div class="empty-state">No strong matches found. Try updating your skill or location.</div>';
    return;
  }

  el.innerHTML = matched.map(r => `
    <div class="match-item">
      <div class="match-header-row">
        <div class="item-main">${r.needTitle}</div>
        <span class="match-score">${r.score}%</span>
      </div>
      <div class="item-sub" style="margin-bottom:6px;">
        ${r.needSkill} · ${r.needLocation}
      </div>
      <div class="match-reasons">
        <span class="match-reason ${r.skillMatch ? 'hit' : 'miss'}">Skill ${r.skillMatch ? '✓' : '✗'}</span>
        <span class="match-reason ${r.locMatch   ? 'hit' : 'miss'}">Location ${r.locMatch ? '✓' : '✗'}</span>
        <span class="badge badge-${r.urgency.toLowerCase()}">${r.urgency}</span>
      </div>
      <button class="btn btn-secondary" style="margin-top:10px;padding:7px;"
        onclick="acceptTask('${r.needTitle}', this)">
        ✋ Accept Task
      </button>
    </div>
  `).join("");
}


window.acceptTask = function (taskTitle, btn) {
  btn.textContent  = "✅ Accepted!";
  btn.disabled     = true;
  btn.style.background = "rgba(34,197,94,0.2)";
  btn.style.color  = "#86efac";
  btn.style.border = "1px solid rgba(34,197,94,0.3)";

  const current = parseInt(document.getElementById("v-accepted").textContent) || 0;
  document.getElementById("v-accepted").textContent = current + 1;
};


function renderAllNeeds() {
  const el = document.getElementById("allNeedsList");
  if (!allNeeds.length) {
    el.innerHTML = '<div class="empty-state">No open tasks right now. Check back later!</div>';
    return;
  }

  const sorted = [...allNeeds].sort((a, b) => {
    const rank = { High: 3, Medium: 2, Low: 1 };
    return rank[b.urgency] - rank[a.urgency];
  });

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">
      ${sorted.map(n => `
        <div class="need-item" style="flex-direction:column;align-items:flex-start;gap:6px;">
          <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
            <div class="item-main">${n.title}</div>
            <span class="badge badge-${n.urgency.toLowerCase()}">${n.urgency}</span>
          </div>
          <div class="item-sub">${n.skill} · ${n.location}</div>
        </div>
      `).join("")}
    </div>
  `;
}


function updateStats() {
  document.getElementById("v-totalNeeds").textContent = allNeeds.length;
  document.getElementById("v-highNeeds").textContent  = allNeeds.filter(n => n.urgency === "High").length;
}


window.handleLogout = async function () {
  await logOut();
  window.location.href = "login.html";
};