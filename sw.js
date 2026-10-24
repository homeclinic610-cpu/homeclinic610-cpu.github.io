const V="dental-cases-v20";
const FILES=["./","./index.html","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/wm-light.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;
e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match("./index.html"))))});

const REM=20*3600e3;
const ams=a=>{if(!a.date)return null;const[y,m,d]=a.date.split("-").map(Number),[h,n]=(a.time||"09:00").split(":").map(Number);return new Date(y,m-1,d,h,n).getTime()};
const ntxt=a=>`${a.t} — ${a.date.split("-").reverse().join("/")}${a.time?" "+(+a.time.slice(0,2)%12||12)+":"+a.time.slice(3,5)+" "+(+a.time.slice(0,2)<12?"ص":"م"):" (الصباح)"}`;
function idb(){return new Promise((res,rej)=>{const q=indexedDB.open("cases",1);q.onsuccess=()=>res(q.result);q.onerror=()=>rej()})}
async function remind(){try{const db=await idb();
  const all=await new Promise(r=>{const q=db.transaction("c").objectStore("c").getAll();q.onsuccess=()=>r(q.result);q.onerror=()=>r([])});const now=Date.now();
  for(const a of all){if(a.kind!=="appt"||a.notified)continue;const t=ams(a);if(t==null)continue;const trig=t-REM;
    if(now>=trig&&now<t&&a.id<=trig){
      await self.registration.showNotification("تذكير بموعد قريب",{body:ntxt(a),icon:"icons/icon-192.png",badge:"icons/icon-192.png",tag:"appt-"+a.id,lang:"ar",dir:"rtl"});
      a.notified=true;await new Promise(r=>{const tx=db.transaction("c","readwrite");tx.objectStore("c").put(a);tx.oncomplete=r;tx.onerror=r})}}}catch(e){}}
self.addEventListener("periodicsync",e=>{if(e.tag==="appt-rem")e.waitUntil(remind())});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(l=>l.length?l[0].focus():clients.openWindow("./")))});
