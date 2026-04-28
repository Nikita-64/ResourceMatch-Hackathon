import {
  signUpWithEmail,
  signInWithEmail,
  setupRecaptcha,
  sendOTP,
  verifyOTP,
} from "./auth.js";


let currentTab    = "signin";   // "signin" | "signup"
let currentMethod = "email";    // "email"  | "phone"
let selectedRole  = "";         // "ngo"    | "volunteer"

window.switchAuthTab = function (tab, btn) {
  currentTab = tab;
  document.querySelectorAll(".auth-tab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  const isSignup = tab === "signup";

  // Show/hide role selector
  document.getElementById("roleSection").style.display  = isSignup ? "block" : "none";

  // Show/hide name fields
  document.getElementById("nameGroup").style.display      = isSignup ? "block" : "none";
  document.getElementById("phoneNameGroup").style.display = isSignup ? "block" : "none";

  // Update email button label
  document.getElementById("emailBtn").textContent = isSignup ? "Create Account" : "Sign In";

  clearAlerts();
};


window.switchMethod = function (method, btn) {
  currentMethod = method;
  document.querySelectorAll(".method-tab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  document.getElementById("emailForm").style.display = method === "email" ? "block" : "none";
  document.getElementById("phoneForm").style.display = method === "phone" ? "block" : "none";

  if (method === "phone") setupRecaptcha("sendOtpBtn");
  clearAlerts();
};


window.selectRole = function (role) {
  selectedRole = role;
  document.getElementById("roleNGO").className = "role-card" + (role === "ngo" ? " active-ngo" : "");
  document.getElementById("roleVol").className = "role-card" + (role === "volunteer" ? " active-volunteer" : "");

  // Show admin code only when NGO is selected
  document.getElementById("adminCodeGroup").style.display = role === "ngo" ? "block" : "none";
};


function redirectByRole(role) {
  if (role === "ngo") {
    window.location.href = "index.html";
  } else {
    window.location.href = "volunteer.html";
  }
}


window.handleEmail = async function () {
  const email    = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  const name     = document.getElementById("authName").value.trim();

  // Validation
  if (!email || !password) {
    showError("Please enter your email and password.");
    return;
  }

  if (currentTab === "signup") {
    if (!selectedRole) {
      showError("Please select your role — NGO or Volunteer.");
      return;
    }
      // Admin code check
    if (selectedRole === "ngo") {
      const enteredCode = document.getElementById("adminCode").value.trim();
      if (enteredCode !== "NGO@2025") {
        showError("Invalid admin code. Contact your organization for the code.");
        return;
      }
    }
    if (!name) {
      showError("Please enter your full name.");
      return;
    }
    if (password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }
  }

  const btn = document.getElementById("emailBtn");
  btn.textContent = "Please wait...";
  btn.disabled    = true;

  let result;
  if (currentTab === "signup") {
    result = await signUpWithEmail(email, password, selectedRole, name);
  } else {
    result = await signInWithEmail(email, password);
  }

  btn.disabled = false;
  btn.textContent = currentTab === "signup" ? "Create Account" : "Sign In";

  if (result.success) {
    showSuccess(currentTab === "signup" ? "Account created! Redirecting..." : "Signed in! Redirecting...");
    setTimeout(() => redirectByRole(result.role), 1200);
  } else {
    showError(friendlyError(result.error));
  }
};

// ── Phone: Send OTP ───
window.handleSendOTP = async function () {
  const phone = document.getElementById("authPhone").value.trim();

  if (!phone) {
    showError("Please enter your phone number.");
    return;
  }

  if (currentTab === "signup" && !selectedRole) {
    showError("Please select your role — NGO or Volunteer.");
    return;
  }

  const btn = document.getElementById("sendOtpBtn");
  btn.textContent = "Sending...";
  btn.disabled    = true;

  const result = await sendOTP(phone);

  btn.disabled    = false;
  btn.textContent = "Send OTP";

  if (result.success) {
    document.getElementById("otpGroup").style.display = "block";
    showSuccess("OTP sent! Check your phone.");
  } else {
    showError(friendlyError(result.error));
  }
};

window.handleVerifyOTP = async function () {
  const otp  = document.getElementById("authOTP").value.trim();
  const name = document.getElementById("authPhoneName").value.trim();

  if (!otp) {
    showError("Please enter the OTP.");
    return;
  }

  const result = await verifyOTP(otp, selectedRole, name);

  if (result.success) {
    showSuccess("Verified! Redirecting...");
    setTimeout(() => redirectByRole(result.role), 1200);
  } else {
    showError(friendlyError(result.error));
  }
};

function showError(msg) {
  const el = document.getElementById("alertError");
  el.textContent    = msg;
  el.style.display  = "block";
  document.getElementById("alertSuccess").style.display = "none";
}

function showSuccess(msg) {
  const el = document.getElementById("alertSuccess");
  el.textContent    = msg;
  el.style.display  = "block";
  document.getElementById("alertError").style.display = "none";
}

function clearAlerts() {
  document.getElementById("alertError").style.display   = "none";
  document.getElementById("alertSuccess").style.display = "none";
}


function friendlyError(msg) {
  if (!msg) return "Something went wrong. Please try again.";
  if (msg.includes("email-already-in-use"))  return "This email is already registered. Try signing in.";
  if (msg.includes("wrong-password"))        return "Incorrect password. Please try again.";
  if (msg.includes("user-not-found"))        return "No account found with this email. Try signing up.";
  if (msg.includes("weak-password"))         return "Password must be at least 6 characters.";
  if (msg.includes("invalid-email"))         return "Please enter a valid email address.";
  if (msg.includes("invalid-phone"))         return "Invalid phone number. Use format: +91XXXXXXXXXX";
  if (msg.includes("invalid-verification"))  return "Wrong OTP. Please try again.";
  if (msg.includes("too-many-requests"))     return "Too many attempts. Please wait and try again.";
  return "Something went wrong. Please try again.";
}
