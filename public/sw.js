function saveNotification(notification) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('notificationsDB', 1);

        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('notifications')) {
                const store = db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp');
            }
        };

        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['notifications'], 'readwrite');
            const store = transaction.objectStore('notifications');
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = function() {
                const existingNotifications = getAllRequest.result;

                const isDuplicate = existingNotifications.some(n =>
                    n.title === notification.title &&
                    n.body === notification.body &&
                    n.url === notification.url
                );

                if (isDuplicate) {
                    //console.log('Duplicate notification, skipping storage.');
                    resolve();
                } else {
                    store.add(notification);
                    transaction.oncomplete = resolve;
                    transaction.onerror = reject;
                }
            };

            getAllRequest.onerror = function(event) {
                reject(event.target.error);
            };
        };

        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

self.addEventListener('push', function(event) {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (error) {
            console.error('Failed to parse push event data:', error);
        }
    }

    const notificationData = {
        title: data.title || 'Sanpush',
        body: data.body || 'Sanpush Free Web Push Updates',
        timestamp: new Date().toISOString(),
        url: data.url || 'https://yoursite.com'
    };

    const options = {
        body: notificationData.body,
        icon: '/192.png',
        badge: '/192.png',
        data: {
            url: notificationData.url
        }
    };

    const showNotification = self.registration.showNotification(notificationData.title, options);

    const saveToDb = saveNotification(notificationData);

    const sendMessageToClients = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'notification',
                notification: notificationData
            });
        });
    }).catch(error => {
        console.error('Failed to send message to clients:', error);
    });

    event.waitUntil(Promise.all([showNotification, saveToDb, sendMessageToClients]));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const url = event.notification.data.url || 'https://yoursite.com';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        }).catch(error => {
            console.error('Failed to handle notification click:', error);
        })
    );
});

let deferredPrompt;
self.addEventListener('beforeinstallprompt', function(event) {
    event.preventDefault();
    deferredPrompt = event;
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'beforeinstallprompt'
            });
        });
    });
});
