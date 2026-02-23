/* Dark mode toggle - matches steipete's toggle-theme.js pattern */
var currentTheme = localStorage.getItem("theme");
var themeSetTimestamp = localStorage.getItem("themeSetTimestamp");
var userHasManuallySetTheme = false;

if (themeSetTimestamp) {
  var hoursSinceSet = (Date.now() - parseInt(themeSetTimestamp)) / 36e5;
  if (hoursSinceSet < 24) {
    userHasManuallySetTheme = true;
  } else {
    localStorage.removeItem("theme");
    localStorage.removeItem("themeSetTimestamp");
    currentTheme = null;
  }
}

function getPreferredTheme() {
  if (userHasManuallySetTheme && currentTheme) return currentTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

var themeValue = getPreferredTheme();

function reflectPreference() {
  document.documentElement.setAttribute("data-theme", themeValue);
  var btn = document.querySelector("#theme-toggle");
  if (btn) btn.setAttribute("aria-label", themeValue === "dark" ? "Switch to light mode" : "Switch to dark mode");
  if (document.body) document.body.style.colorScheme = themeValue;
}

reflectPreference();

window.addEventListener("DOMContentLoaded", function () {
  reflectPreference();

  var sunSVG = '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  var moonSVG = '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

  function updateIcon() {
    var btn = document.querySelector("#theme-toggle");
    if (!btn) return;
    btn.innerHTML = themeValue === "dark" ? sunSVG : moonSVG;
  }

  updateIcon();

  var btn = document.querySelector("#theme-toggle");
  if (btn) {
    btn.addEventListener("click", function () {
      themeValue = themeValue === "light" ? "dark" : "light";
      localStorage.setItem("theme", themeValue);
      localStorage.setItem("themeSetTimestamp", Date.now().toString());
      userHasManuallySetTheme = true;
      reflectPreference();
      updateIcon();
    });
  }
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
  if (!userHasManuallySetTheme) {
    themeValue = e.matches ? "dark" : "light";
    reflectPreference();
  }
});
