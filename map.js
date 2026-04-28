
const sectorCoords = {
  "sector 1":  [28.4744, 77.0266], "sector 2":  [28.4756, 77.0289],
  "sector 3":  [28.4768, 77.0312], "sector 4":  [28.4780, 77.0335],
  "sector 5":  [28.4792, 77.0358], "sector 6":  [28.4804, 77.0381],
  "sector 7":  [28.4816, 77.0404], "sector 8":  [28.4828, 77.0427],
  "sector 9":  [28.4840, 77.0450], "sector 10": [28.4852, 77.0473],
  "sector 11": [28.4680, 77.0300], "sector 12": [28.4692, 77.0323],
  "sector 13": [28.4704, 77.0346], "sector 14": [28.4716, 77.0369],
  "sector 15": [28.4728, 77.0392], "sector 16": [28.4740, 77.0415],
  "sector 17": [28.4752, 77.0438], "sector 18": [28.4620, 77.0350],
  "sector 19": [28.4632, 77.0373], "sector 20": [28.4644, 77.0396],
  "sector 21": [28.4656, 77.0419], "sector 22": [28.4668, 77.0442],
  "sector 23": [28.4580, 77.0400], "sector 24": [28.4592, 77.0423],
  "sector 25": [28.4604, 77.0446], "sector 26": [28.4616, 77.0469],
  "sector 27": [28.4540, 77.0450], "sector 28": [28.4552, 77.0473],
  "sector 29": [28.4496, 77.0500], "sector 30": [28.4508, 77.0523],
  "sector 31": [28.4520, 77.0546], "sector 32": [28.4460, 77.0550],
  "sector 33": [28.4472, 77.0573], "sector 34": [28.4484, 77.0596],
  "sector 35": [28.4420, 77.0600], "sector 36": [28.4432, 77.0623],
  "sector 37": [28.4380, 77.0650], "sector 38": [28.4392, 77.0673],
  "sector 39": [28.4404, 77.0696], "sector 40": [28.4340, 77.0700],
  "sector 41": [28.4352, 77.0723], "sector 42": [28.4300, 77.0750],
  "sector 43": [28.4312, 77.0773], "sector 44": [28.4260, 77.0800],
  "sector 45": [28.4272, 77.0823], "sector 46": [28.4220, 77.0850],
  "sector 47": [28.4232, 77.0873], "sector 48": [28.4180, 77.0900],
  "sector 49": [28.4192, 77.0923], "sector 50": [28.4140, 77.0950],
  "gurugram":  [28.4595, 77.0266],
  "gurgaon":   [28.4595, 77.0266],
  "delhi":     [28.6139, 77.2090],
  "faridabad": [28.4089, 77.3178],
  "noida":     [28.5355, 77.3910],
};


function getCoords(locationStr) {
  if (!locationStr) return null;
  const lower = locationStr.toLowerCase().trim();

  
  if (sectorCoords[lower]) return sectorCoords[lower];

  // Try sector number extraction: "Sector 14, Gurugram" → "sector 14"
  const match = lower.match(/sector\s*(\d+)/);
  if (match) {
    const key = `sector ${match[1]}`;
    if (sectorCoords[key]) return sectorCoords[key];
  }

 
  for (const [key, coords] of Object.entries(sectorCoords)) {
    if (lower.includes(key)) return coords;
  }


  return [
    28.4595 + (Math.random() - 0.5) * 0.02,
    77.0266 + (Math.random() - 0.5) * 0.02,
  ];
}


let map            = null;
let needMarkers    = L.layerGroup();
let volMarkers     = L.layerGroup();
let matchLines     = L.layerGroup();
let mapInitialized = false;


function makeIcon(color, letter) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:32px; height:32px;
        background:${color};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:2px solid rgba(255,255,255,0.8);
        box-shadow:0 2px 8px rgba(0,0,0,0.4);
        display:flex; align-items:center; justify-content:center;
      ">
        <span style="
          transform:rotate(45deg);
          color:white;
          font-size:13px;
          font-weight:700;
          font-family:sans-serif;
          line-height:1;
        ">${letter}</span>
      </div>`,
    iconSize:   [32, 32],
    iconAnchor: [16, 32],
    popupAnchor:[0, -34],
  });
}

const needIcon = makeIcon("#378ADD", "N");
const volIcon  = makeIcon("#639922", "V");


function initMap() {
  if (mapInitialized) return;

  map = L.map("resourceMap", {
    center:          [28.4595, 77.0266],
    zoom:            13,
    zoomControl:     true,
    attributionControl: true,
  });

 
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  needMarkers.addTo(map);
  volMarkers.addTo(map);
  matchLines.addTo(map);

  mapInitialized = true;
}

function refreshMap(needs, volunteers) {
  if (!mapInitialized) return;

  needMarkers.clearLayers();
  volMarkers.clearLayers();
  matchLines.clearLayers();

  const allCoords = [];

 
  needs.forEach((need) => {
    const coords = getCoords(need.location);
    if (!coords) return;
    allCoords.push(coords);

    const urgencyColor = need.urgency === "High"
      ? "#ef4444" : need.urgency === "Medium"
      ? "#f59e0b" : "#22c55e";

    const marker = L.marker(coords, { icon: needIcon })
      .bindPopup(`
        <div style="font-family:sans-serif;min-width:160px;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${need.title}</div>
          <div style="font-size:12px;color:#555;margin-bottom:6px;">${need.location}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span style="background:#E6F1FB;color:#0C447C;font-size:11px;padding:2px 8px;border-radius:99px;">${need.skill}</span>
            <span style="background:${urgencyColor}22;color:${urgencyColor};font-size:11px;padding:2px 8px;border-radius:99px;font-weight:600;">${need.urgency}</span>
          </div>
        </div>
      `);
    needMarkers.addLayer(marker);
  });


  volunteers.forEach((vol) => {
    const coords = getCoords(vol.location);
    if (!coords) return;
    allCoords.push(coords);

    const marker = L.marker(coords, { icon: volIcon })
      .bindPopup(`
        <div style="font-family:sans-serif;min-width:160px;">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${vol.name}</div>
          <div style="font-size:12px;color:#555;margin-bottom:6px;">${vol.location}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span style="background:#EAF3DE;color:#27500A;font-size:11px;padding:2px 8px;border-radius:99px;">${vol.skill}</span>
            <span style="background:#E6F1FB;color:#0C447C;font-size:11px;padding:2px 8px;border-radius:99px;">${vol.availability}</span>
          </div>
        </div>
      `);
    volMarkers.addLayer(marker);
  });

 
  if (needs.length && volunteers.length) {
    const results = window.runMatchingEngine(volunteers, needs);
    results.forEach((r) => {
      if (!r.matched) return;

      const need = needs.find((n) => n.title === r.needTitle);
      const vol  = volunteers.find((v) => v.name === r.volunteerName);
      if (!need || !vol) return;

      const nCoords = getCoords(need.location);
      const vCoords = getCoords(vol.location);
      if (!nCoords || !vCoords) return;

      const color = r.score >= 80 ? "#22c55e"
                  : r.score >= 50 ? "#f59e0b"
                  : "#ef4444";

      const line = L.polyline([nCoords, vCoords], {
        color,
        weight:    2,
        opacity:   0.75,
        dashArray: "6, 5",
      }).bindTooltip(`${r.needTitle} → ${r.volunteerName} (${r.score}%)`, {
        sticky: true,
        className: "match-tooltip",
      });

      matchLines.addLayer(line);
    });
  }

 
  if (allCoords.length > 0) {
    map.fitBounds(allCoords, { padding: [40, 40] });
  }
}

function onMapTabOpen(needs, volunteers) {
  if (!mapInitialized) {
    initMap();
    setTimeout(() => {
      map.invalidateSize();
      refreshMap(needs, volunteers);
    }, 100);
  } else {
    setTimeout(() => {
      map.invalidateSize();
      refreshMap(needs, volunteers);
    }, 50);
  }
}

// ── Expose to app.js ──────────────────────────────────────────
window.initMap        = initMap;
window.refreshMap     = refreshMap;
window.onMapTabOpen   = onMapTabOpen;