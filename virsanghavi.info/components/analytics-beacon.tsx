import { COLLECTOR_PATH, EXCLUDE_COOKIE } from "@/lib/analytics/policy";

/**
 * The whole client side of analytics, inlined so there is no extra request:
 * a page view when a page is shown (including client-side navigations, by
 * wrapping history.pushState), and a leave with the time the page was
 * visible when it is hidden. Under a kilobyte, no cookie, no library.
 *
 * It stays silent when the browser asks not to be tracked (Do Not Track or
 * Global Privacy Control), in the owner's own browser (the cookie a sign-in
 * to /admin leaves behind), and on the admin pages.
 */
const script = `
(function(){
  var n=navigator,w=window,d=document;
  if(n.doNotTrack==="1"||w.doNotTrack==="1"||n.globalPrivacyControl===true)return;
  if(/(?:^|;\\s*)${EXCLUDE_COOKIE}=1(?:;|$)/.test(d.cookie))return;
  var ss;try{ss=w.sessionStorage}catch(e){return}
  var sid=ss.getItem("vs_s");if(!sid){sid=Math.random().toString(36).slice(2,12)+Date.now().toString(36);ss.setItem("vs_s",sid)}
  var path=null,shown=0,visible=0,sent=false;
  function send(b){try{var blob=new Blob([JSON.stringify(b)],{type:"text/plain"});if(!(n.sendBeacon&&n.sendBeacon(${JSON.stringify(COLLECTOR_PATH)},blob)))fetch(${JSON.stringify(COLLECTOR_PATH)},{method:"POST",body:blob,keepalive:true,credentials:"omit"}).catch(function(){})}catch(e){}}
  function skip(p){return p.indexOf("/admin")===0}
  function view(){
    var p=location.pathname;if(p===path)return;
    leave();path=p;sent=false;shown=Date.now();visible=0;
    if(skip(p))return;
    send({e:"view",p:p,r:d.referrer||"",s:sid,u:location.href});
  }
  function leave(){
    if(!path||sent||skip(path))return;sent=true;
    var dur=visible+(d.visibilityState==="visible"?Date.now()-shown:0);
    send({e:"leave",p:path,s:sid,d:dur});
  }
  d.addEventListener("visibilitychange",function(){
    if(d.visibilityState==="hidden"){visible+=Date.now()-shown;leave()}
    else{shown=Date.now();sent=false}
  });
  w.addEventListener("pagehide",leave);
  var ps=history.pushState;history.pushState=function(){var r=ps.apply(this,arguments);setTimeout(view,0);return r};
  w.addEventListener("popstate",function(){setTimeout(view,0)});
  view();
})();`;

export function AnalyticsBeacon() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
