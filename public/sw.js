self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "🐟 RJ Peixaria CRM";
  const options = {
    body: data.body || "Você tem uma nova atualização!",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: {
      url: data.url || "/"
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
