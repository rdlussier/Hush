const V='hush-v4';
const FILES=['./','index.html','manifest.webmanifest','noise.ogg','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>fetch(new Request(f,{cache:'reload'})).then(r=>c.put(f==='./'?'./':f,r))))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
async function ranged(req,res){
  const m=/bytes=(\d*)-(\d*)/.exec(req.headers.get('range'));
  const buf=await res.arrayBuffer(),n=buf.byteLength;
  let s=m[1]?+m[1]:0,e=m[2]?+m[2]:n-1; if(!m[1]&&m[2]){s=n-+m[2];e=n-1}
  e=Math.min(e,n-1);
  return new Response(buf.slice(s,e+1),{status:206,headers:{'Content-Type':res.headers.get('Content-Type')||'audio/ogg',
   'Content-Range':`bytes ${s}-${e}/${n}`,'Content-Length':e-s+1,'Accept-Ranges':'bytes'}});
}
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return;
  e.respondWith((async()=>{
    const hit=await caches.match(r,{ignoreSearch:true,ignoreVary:true}) || await caches.match(new Request(r.url));
    let res=hit;
    if(!res){try{res=await fetch(r);return res}catch(err){return caches.match('index.html')}}
    if(r.headers.get('range')&&res.status===200)return ranged(r,res);
    // refresh in background
    if(!r.headers.get('range'))fetch(r,{cache:'no-cache'}).then(n=>{if(n.ok)caches.open(V).then(c=>c.put(r,n))}).catch(()=>{});
    return res;
  })());
});
