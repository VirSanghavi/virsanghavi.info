/**
 * Blocking inline script that applies the saved (or system) colour scheme
 * before first paint, so there is no flash of the wrong theme.
 *
 * A manual choice sticks for 24 hours and then expires back to the system
 * preference — the same rule the hand-written site used.
 */
export const THEME_STORAGE_KEY = "theme";
export const THEME_TIMESTAMP_KEY = "themeSetTimestamp";
export const THEME_TTL_HOURS = 24;

export const themeScript = `(function(){try{
var k=${JSON.stringify(THEME_STORAGE_KEY)},t=${JSON.stringify(THEME_TIMESTAMP_KEY)};
var saved=localStorage.getItem(k),stamp=localStorage.getItem(t),manual=false;
if(stamp){var h=(Date.now()-parseInt(stamp,10))/36e5;
if(h<${THEME_TTL_HOURS}){manual=true}else{localStorage.removeItem(k);localStorage.removeItem(t);saved=null}}
var theme=(manual&&saved)?saved:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
document.documentElement.setAttribute("data-theme",theme);
document.documentElement.style.colorScheme=theme;
}catch(e){document.documentElement.setAttribute("data-theme","light")}})();`;
