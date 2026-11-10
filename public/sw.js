self.addEventListener("push", (event) => {
  let data = { title: "BalaPAY", body: "您有一筆新交易", data: { url: "/history" } };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(data.title || "BalaPAY", {
      body: data.body || "",
      icon: "/favicon.ico",
      data: data.data || { url: "/history" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/history";
  event.waitUntil(clients.openWindow(url));
});
