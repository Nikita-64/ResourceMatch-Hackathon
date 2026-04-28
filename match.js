
const skillGroups = [
  ["Medical", "Medical Assistant", "First Aid", "Nurse", "Doctor"],
  ["Logistics", "Supply Chain", "Delivery", "Packing", "Distribution"],
  ["Teaching", "Education", "Tutoring", "Training", "Coaching"],
  ["Legal", "Legal Advisor", "Lawyer", "Law", "Paralegal"],
  ["Tech", "IT", "Software", "Developer", "Engineering"],
  ["Finance", "Accounting", "Budgeting", "Economics"],
];

function areSkillsRelated(skill1, skill2) {
  const s1 = skill1.toLowerCase();
  const s2 = skill2.toLowerCase();
  if (s1.includes(s2) || s2.includes(s1)) return true;
  for (const group of skillGroups) {
    const lowerGroup = group.map(s => s.toLowerCase());
    if (
      lowerGroup.some(s => s1.includes(s) || s.includes(s1)) &&
      lowerGroup.some(s => s2.includes(s) || s.includes(s2))
    ) return true;
  }
  return false;
}

function areLocationsNearby(loc1, loc2) {
  const l1 = loc1.toLowerCase().trim();
  const l2 = loc2.toLowerCase().trim();
  const num1 = parseInt(l1.replace(/[^0-9]/g, ""));
  const num2 = parseInt(l2.replace(/[^0-9]/g, ""));
  if (!isNaN(num1) && !isNaN(num2)) return Math.abs(num1 - num2) <= 3;
  return l1.includes(l2) || l2.includes(l1);
}

// ─── AVAILABILITY CHECK 
function checkAvailability(volunteer) {
  if (!volunteer.availability) return false;
  const avail = volunteer.availability.toLowerCase();
  return avail !== "" && avail !== "none";
}

// ─── MAIN SCORING FUNCTION 
function calculateMatchScore(volunteer, need) {
  if (!volunteer.availability) return -999;

  let score = 0;
  const vSkill = volunteer.skill.toLowerCase();
  const nSkill = need.skill.toLowerCase();
  const vLoc   = volunteer.location.toLowerCase();
  const nLoc   = need.location.toLowerCase();

  // Skill Matching
  if (vSkill === nSkill) {
    score += 5;
  } else if (areSkillsRelated(vSkill, nSkill)) {
    score += 3;
  }

  // Location Matching
  if (vLoc === nLoc) {
    score += 3;
  } else if (areLocationsNearby(volunteer.location, need.location)) {
    score += 1;
  }

  // Urgency Bonus
  if (need.urgency === "High")   score += 2;
  if (need.urgency === "Medium") score += 1;

  return score;
}

// ─── MATCH LABEL 
function getMatchLabel(score) {
  if (score >= 9) return "Perfect Match";
  if (score >= 7) return "Strong Match";
  if (score >= 5) return "Good Match";
  if (score >= 3) return "Partial Match";
  return "Weak Match";
}

// ─── FIND BEST MATCH PER NEED 
function findMatchesInternal(volunteers, needs) {
  const results = [];

  needs.forEach((need) => {
    let bestMatch    = null;
    let highestScore = 0;
    let bestBreakdown = {};

    volunteers.forEach((volunteer) => {
      const score = calculateMatchScore(volunteer, need);
      if (score > highestScore) {
        highestScore = score;
        bestMatch    = volunteer;

        const vSkill = volunteer.skill.toLowerCase();
        const nSkill = need.skill.toLowerCase();
        const vLoc   = volunteer.location.toLowerCase();
        const nLoc   = need.location.toLowerCase();

        bestBreakdown = {
          // ✅ Boolean flags that app.js renderMatches() expects
          skillMatch: vSkill === nSkill || areSkillsRelated(vSkill, nSkill),
          locMatch:   vLoc === nLoc     || areLocationsNearby(volunteer.location, need.location),
          availMatch: checkAvailability(volunteer),
        };
      }
    });

    results.push({
      need,
      matchedVolunteer: highestScore > 0 ? bestMatch : null,
      score:            highestScore,
      matchLabel:       getMatchLabel(highestScore),
      breakdown:        bestBreakdown,
    });
  });

  // Sort by score desc, then urgency desc
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const urgencyRank = { High: 3, Medium: 2, Low: 1 };
    return urgencyRank[b.need.urgency] - urgencyRank[a.need.urgency];
  });

  return results;
}

// ─── FORMAT FOR FRONTEND 
function formatResultsForDisplay(matchResults) {
  return matchResults.map((result) => ({
    needTitle:         result.need.title,
    needLocation:      result.need.location,
    needSkill:         result.need.skill,
    urgency:           result.need.urgency,
    volunteerName:     result.matchedVolunteer ? result.matchedVolunteer.name     : "No match found",
    volunteerSkill:    result.matchedVolunteer ? result.matchedVolunteer.skill    : "—",
    volunteerLocation: result.matchedVolunteer ? result.matchedVolunteer.location : "—",
    score:             Math.min(Math.round((result.score / 10) * 100), 100), // ✅ % for UI badge
    matchLabel:        result.matchLabel,
    matched:           result.matchedVolunteer !== null,
    // ✅ Flat booleans for renderMatches() in app.js
    skillMatch:        result.breakdown.skillMatch  ?? false,
    locMatch:          result.breakdown.locMatch    ?? false,
    availMatch:        result.breakdown.availMatch  ?? false,
  }));
}

function runMatchingEngine(volunteers, needs) {
  if (!volunteers?.length || !needs?.length) {
    console.warn("runMatchingEngine: empty volunteers or needs array.");
    return [];
  }
  const rawMatches   = findMatchesInternal(volunteers, needs);
  const displayReady = formatResultsForDisplay(rawMatches);

  console.log("=== Match Results ===");
  displayReady.forEach((r) => {
    console.log(`[Score ${r.score}% | ${r.matchLabel}] ${r.needTitle} (${r.urgency}) → ${r.volunteerName}`);
  });

  return displayReady;
}

window.runMatchingEngine = runMatchingEngine;