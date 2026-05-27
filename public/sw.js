const CACHE = "nhanga-v1";
const SHELL = ["/", "/learn", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  event.respondWith(
    caches.match(request).then(hit => hit || fetch(request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(request, copy));
      return res;
    }).catch(() => caches.match("/learn")))
  );
});
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "Nhanga", body: "Time to learn" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: data.url },
      icon: "/icons/icon-192.png"
    })
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/learn";
  event.waitUntil(self.clients.openWindow(url));
});
