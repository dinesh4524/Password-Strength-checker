const API_URL = 'http://localhost:5000/api';

// ===== DOM Elements =====
const passwordInput = document.getElementById('password-input');
const toggleVisibilityBtn = document.getElementById('toggle-password-visibility');
const eyeOpenIcon = document.getElementById('eye-open-icon');
const eyeClosedIcon = document.getElementById('eye-closed-icon');

const strengthLabel = document.getElementById('strength-label');
const strengthScoreText = document.getElementById('strength-score-text');
const meterFill = document.getElementById('meter-fill');

const timeOnline = document.getElementById('time-online');
const timeOffline = document.getElementById('time-offline');

const suggestionsBox = document.getElementById('suggestions-box');
const suggestionsList = document.getElementById('suggestions-list');

const ruleLength = document.getElementById('rule-length');
const ruleUppercase = document.getElementById('rule-uppercase');
const ruleLowercase = document.getElementById('rule-lowercase');
const ruleNumber = document.getElementById('rule-number');
const ruleSpecial = document.getElementById('rule-special');
const ruleRepeated = document.getElementById('rule-repeated');
const ruleCommon = document.getElementById('rule-common');

const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

const genLength = document.getElementById('gen-length');
const genLenVal = document.getElementById('gen-len-val');
const genUpper = document.getElementById('gen-upper');
const genLower = document.getElementById('gen-lower');
const genNumbers = document.getElementById('gen-numbers');
const genSpecial = document.getElementById('gen-special');
const generateBtn = document.getElementById('generate-btn');

const suggestTexts = [
  document.getElementById('suggest-1'),
  document.getElementById('suggest-2'),
  document.getElementById('suggest-3')
];
const copyBtns = document.querySelectorAll('.btn-copy');
const toast = document.getElementById('toast');

// Auth Elements
const authLoggedOut = document.getElementById('auth-logged-out');
const authLoggedIn = document.getElementById('auth-logged-in');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authErrorMsg = document.getElementById('auth-error-msg');

const userEmailDisplay = document.getElementById('user-email-display');
const logoutBtn = document.getElementById('logout-btn');
const scannerStatus = document.getElementById('scanner-status');
const scannerText = document.getElementById('scanner-text');
const saveHistoryBtn = document.getElementById('save-history-btn');

// Common Passwords Dictionary
const commonPasswords = ['password', '123456', '12345678', '123456789', '12345', '1234', 'qwerty', 'admin', 'welcome', 'letmein', 'password123', 'iloveyou', 'sunshine'];

// State
let isLoginMode = true;
let checkHistoryTimeout = null;
let currentPasswordHash = ''; 
let userToken = localStorage.getItem('shieldpass_token');
let userEmail = localStorage.getItem('shieldpass_email');

// ===== Initialization =====
function init() {
  // Theme initialization
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.replace('dark-theme', 'light-theme');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }

  // Generate initial suggestions
  generateSuggestions();
  updateAuthUI();
}

// ===== Theme Toggle =====
themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark-theme');
  if (isDark) {
    document.body.classList.replace('dark-theme', 'light-theme');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
    localStorage.setItem('theme', 'light');
  } else {
    document.body.classList.replace('light-theme', 'dark-theme');
    moonIcon.classList.add('hidden');
    sunIcon.classList.remove('hidden');
    localStorage.setItem('theme', 'dark');
  }
});

// ===== Password Visibility =====
toggleVisibilityBtn.addEventListener('click', () => {
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeClosedIcon.classList.add('hidden');
    eyeOpenIcon.classList.remove('hidden');
  } else {
    passwordInput.type = 'password';
    eyeOpenIcon.classList.add('hidden');
    eyeClosedIcon.classList.remove('hidden');
  }
});

// ===== Password Analysis =====
passwordInput.addEventListener('input', (e) => {
  const pwd = e.target.value;
  analyzePassword(pwd);
  
  if (userToken && pwd.length > 0) {
    // Debounce history check
    clearTimeout(checkHistoryTimeout);
    setScannerState('checking', 'Scanning cloud history...');
    saveHistoryBtn.disabled = true;
    checkHistoryTimeout = setTimeout(() => checkPasswordHistory(pwd), 800);
  } else if (userToken) {
    setScannerState('idle', 'Type a password to check for reuse');
    saveHistoryBtn.disabled = true;
  }
});

function setRuleStatus(element, isMet) {
  if (isMet) {
    element.classList.remove('unmet');
    element.classList.add('met');
    element.querySelector('.status-icon').textContent = '✓';
  } else {
    element.classList.remove('met');
    element.classList.add('unmet');
    element.querySelector('.status-icon').textContent = '✗';
  }
}

function analyzePassword(pwd) {
  if (!pwd) {
    resetMeter();
    return;
  }

  // Check rules
  const hasLen = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const hasRepeated = /(.)\1{2,}/.test(pwd); // 3 or more consecutive
  const isCommon = commonPasswords.includes(pwd.toLowerCase());

  setRuleStatus(ruleLength, hasLen);
  setRuleStatus(ruleUppercase, hasUpper);
  setRuleStatus(ruleLowercase, hasLower);
  setRuleStatus(ruleNumber, hasNumber);
  setRuleStatus(ruleSpecial, hasSpecial);
  setRuleStatus(ruleRepeated, !hasRepeated);
  setRuleStatus(ruleCommon, !isCommon);

  // Suggestions array
  let suggestions = [];
  if (!hasLen) suggestions.push("Make it at least 8 characters long (12+ is ideal).");
  if (!hasUpper) suggestions.push("Add uppercase letters.");
  if (!hasLower) suggestions.push("Add lowercase letters.");
  if (!hasNumber) suggestions.push("Include numbers.");
  if (!hasSpecial) suggestions.push("Use special characters (e.g., !@#$%).");
  if (hasRepeated) suggestions.push("Avoid repeated characters (e.g., 'aaa').");
  if (isCommon) suggestions.push("This is a very common password! Change it immediately.");

  // Calculate Entropy and Crack Time
  let score = 0; // 0 to 4
  let crackTimeOnline = "Instant";
  let crackTimeOffline = "Instant";
  let percentage = 0;

  if (window.zxcvbn) {
    const result = zxcvbn(pwd);
    score = result.score;
    crackTimeOnline = result.crack_times_display.online_throttling_100_per_hour;
    crackTimeOffline = result.crack_times_display.offline_fast_hashing_1e10_per_second;
    
    // Supplement zxcvbn suggestions with our own if empty
    if (result.feedback.suggestions.length > 0) {
       suggestions = result.feedback.suggestions;
    }
  } else {
    // Custom Entropy Fallback
    let pool = 0;
    if (hasLower) pool += 26;
    if (hasUpper) pool += 26;
    if (hasNumber) pool += 10;
    if (hasSpecial) pool += 33;
    
    const entropy = pool > 0 ? pwd.length * Math.log2(pool) : 0;
    
    // Scoring logic based on entropy
    if (entropy < 28 || isCommon) score = 0;
    else if (entropy < 35) score = 1;
    else if (entropy < 59) score = 2;
    else if (entropy < 80) score = 3;
    else score = 4;

    // Very rough estimations for UI
    const combinations = Math.pow(2, entropy);
    const onlineSecs = combinations / 100;
    const offlineSecs = combinations / 1e10;
    
    crackTimeOnline = formatTime(onlineSecs);
    crackTimeOffline = formatTime(offlineSecs);
  }

  // Force score to 0 if very weak rules apply
  if (isCommon) score = 0;

  // Update UI
  percentage = (score + 1) * 20;
  strengthScoreText.textContent = `${percentage}%`;
  meterFill.style.width = `${percentage}%`;
  
  const colors = [
    { label: 'Very Weak', color: 'var(--danger)' },
    { label: 'Weak', color: 'var(--warning)' },
    { label: 'Medium', color: 'var(--medium)' },
    { label: 'Strong', color: 'var(--good)' },
    { label: 'Very Strong', color: 'var(--excellent)' }
  ];
  
  strengthLabel.textContent = colors[score].label;
  strengthLabel.style.color = colors[score].color;
  meterFill.style.backgroundColor = colors[score].color;

  timeOnline.textContent = crackTimeOnline;
  timeOffline.textContent = crackTimeOffline;

  // Render Suggestions
  if (score < 4 && suggestions.length > 0) {
    suggestionsBox.classList.remove('hidden');
    suggestionsList.innerHTML = suggestions.map(s => `<li>${s}</li>`).join('');
  } else {
    suggestionsBox.classList.add('hidden');
  }
}

function resetMeter() {
  strengthLabel.textContent = 'Empty';
  strengthLabel.style.color = 'inherit';
  strengthScoreText.textContent = '0%';
  meterFill.style.width = '0%';
  meterFill.style.backgroundColor = 'var(--text-secondary)';
  timeOnline.textContent = 'Instant';
  timeOffline.textContent = 'Instant';
  suggestionsBox.classList.add('hidden');
  
  const elements = [ruleLength, ruleUppercase, ruleLowercase, ruleNumber, ruleSpecial, ruleRepeated, ruleCommon];
  elements.forEach(el => setRuleStatus(el, false));
  setRuleStatus(ruleRepeated, true);
  setRuleStatus(ruleCommon, true);
}

function formatTime(seconds) {
  if (seconds < 1) return "Instant";
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`;
  return "Centuries";
}

// ===== Password Generator =====
genLength.addEventListener('input', (e) => {
  genLenVal.textContent = e.target.value;
});

function generatePassword(length, useUpper, useLower, useNumbers, useSpecial) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
  
  let chars = '';
  let pwd = '';
  
  if (useUpper) chars += upper;
  if (useLower) chars += lower;
  if (useNumbers) chars += numbers;
  if (useSpecial) chars += special;
  
  if (chars === '') {
    chars = lower; // fallback
    genLower.checked = true;
  }
  
  // Ensure at least one of each selected type to guarantee strength
  if (useUpper) pwd += upper[Math.floor(Math.random() * upper.length)];
  if (useLower) pwd += lower[Math.floor(Math.random() * lower.length)];
  if (useNumbers) pwd += numbers[Math.floor(Math.random() * numbers.length)];
  if (useSpecial) pwd += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest
  for (let i = pwd.length; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Shuffle
  return pwd.split('').sort(() => 0.5 - Math.random()).join('');
}

function generateSuggestions() {
  const len = parseInt(genLength.value);
  const u = genUpper.checked;
  const l = genLower.checked;
  const n = genNumbers.checked;
  const s = genSpecial.checked;
  
  suggestTexts.forEach((el, index) => {
    el.textContent = generatePassword(len, u, l, n, s);
  });
}

generateBtn.addEventListener('click', () => {
  generateSuggestions();
  // Fill input with first suggestion and analyze
  const newPwd = suggestTexts[0].textContent;
  passwordInput.value = newPwd;
  analyzePassword(newPwd);
  if(userToken) checkPasswordHistory(newPwd);
});

// ===== Copy to Clipboard =====
copyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const textToCopy = document.getElementById(targetId).textContent;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast();
    });
  });
});

function showToast() {
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2500);
}

// ===== Auth & History Integration =====
tabLogin.addEventListener('click', () => {
  isLoginMode = true;
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  authSubmitBtn.textContent = 'Login';
  authErrorMsg.classList.add('hidden');
});

tabRegister.addEventListener('click', () => {
  isLoginMode = false;
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  authSubmitBtn.textContent = 'Register';
  authErrorMsg.classList.add('hidden');
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = authEmail.value;
  const password = authPassword.value;
  const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
  
  authSubmitBtn.textContent = 'Wait...';
  authSubmitBtn.disabled = true;
  
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (res.ok && data.success) {
      userToken = data.data.token;
      userEmail = data.data.email;
      localStorage.setItem('shieldpass_token', userToken);
      localStorage.setItem('shieldpass_email', userEmail);
      updateAuthUI();
      authForm.reset();
      
      // Trigger a check if password field has content
      if (passwordInput.value) {
        checkPasswordHistory(passwordInput.value);
      }
    } else {
      showAuthError(data.message || 'Authentication failed');
    }
  } catch (err) {
    showAuthError('Server is offline or unreachable.');
  } finally {
    authSubmitBtn.textContent = isLoginMode ? 'Login' : 'Register';
    authSubmitBtn.disabled = false;
  }
});

function showAuthError(msg) {
  authErrorMsg.textContent = msg;
  authErrorMsg.classList.remove('hidden');
}

function updateAuthUI() {
  if (userToken && userEmail) {
    authLoggedOut.classList.add('hidden');
    authLoggedIn.classList.remove('hidden');
    userEmailDisplay.textContent = userEmail;
    setScannerState('idle', 'Type a password to check for reuse');
  } else {
    authLoggedOut.classList.remove('hidden');
    authLoggedIn.classList.add('hidden');
  }
}

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('shieldpass_token');
  localStorage.removeItem('shieldpass_email');
  userToken = null;
  userEmail = null;
  updateAuthUI();
});

function setScannerState(state, text) {
  scannerStatus.className = `scanner-status ${state}`;
  scannerText.textContent = text;
}

async function checkPasswordHistory(pwd) {
  if (!userToken) return;
  
  try {
    const res = await fetch(`${API_URL}/passwords/check-reuse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ password: pwd })
    });
    
    const data = await res.json();
    if (res.ok) {
      if (data.reused) {
        setScannerState('warning', '⚠️ Warning: This password was previously used by you!');
        saveHistoryBtn.disabled = true;
      } else {
        setScannerState('safe', 'Never used before (Secure!)');
        saveHistoryBtn.disabled = false;
      }
    } else if (res.status === 401) {
      // Token expired
      logoutBtn.click();
    }
  } catch (error) {
    setScannerState('warning', 'Unable to reach cloud scanner');
  }
}

saveHistoryBtn.addEventListener('click', async () => {
  const pwd = passwordInput.value;
  if (!pwd || !userToken) return;
  
  saveHistoryBtn.disabled = true;
  saveHistoryBtn.textContent = 'Saving...';
  
  try {
    const res = await fetch(`${API_URL}/passwords/save-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ password: pwd })
    });
    
    if (res.ok) {
      setScannerState('warning', '⚠️ Warning: This password was previously used by you!');
      toast.textContent = 'Saved to History!';
      showToast();
      setTimeout(() => { toast.textContent = 'Copied to clipboard!'; }, 2500);
    }
  } catch (err) {
    console.error(err);
  } finally {
    saveHistoryBtn.textContent = 'Save current password to history';
  }
});

// Start app
init();
