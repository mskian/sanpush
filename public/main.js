document.addEventListener('DOMContentLoaded', () => {
    const subscribeBtn = document.getElementById('subscribeBtn');
    const unsubscribeBtn = document.getElementById('unsubscribeBtn');
    const resubscribeBtn = document.getElementById('resubscribeBtn');
    const statusMessage = document.getElementById('statusMessage');
    const notificationList = document.getElementById('notificationList');
    const pagination = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    const notificationsPerPage = 3;
    let currentPage = 1;
    let notifications = [];
    let db;
    const storeName = 'notifications';

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        statusMessage.textContent = 'Push messaging is not supported in your browser.';
        return;
    }

    let serviceWorkerRegistration;

    function updateSubscriptionStatus() {
        serviceWorkerRegistration.pushManager.getSubscription().then(subscription => {
            if (subscription) {
                statusMessage.textContent = 'You are currently subscribed to push notifications Updates.';
                subscribeBtn.style.display = 'none';
                unsubscribeBtn.style.display = 'inline-block';
                resubscribeBtn.style.display = 'none';
            } else {
                statusMessage.textContent = 'You are not subscribed to push notifications Updates.';
                subscribeBtn.style.display = 'inline-block';
                unsubscribeBtn.style.display = 'none';
                resubscribeBtn.style.display = 'none';
            }
        }).catch(error => {
            console.error('Error updating subscription status:', error);
            statusMessage.textContent = 'Failed to check subscription status.';
        });
    }

    function subscribeToPush(registration) {
        registration.pushManager.getSubscription().then(subscription => {
            if (subscription) {
                statusMessage.textContent = 'Already subscribed to push notifications.';
                return;
            }

            const applicationServerKey = urlBase64ToUint8Array('Your Public Vapid Key');
            registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            }).then(subscription => {
                return fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription)
                });
            }).then(response => {
                if (response.ok) {
                    statusMessage.innerHTML = 'Subscribed successfully!';
                    updateSubscriptionStatus();
                } else {
                    statusMessage.textContent = 'Failed to subscribe.';
                }
            }).catch(error => {
                console.error('Subscription error:', error);
                statusMessage.textContent = 'Subscription error.';
            });
        }).catch(error => {
            console.error('Error getting subscription:', error);
            statusMessage.textContent = 'Subscription error.';
        });
    }

    function unsubscribeFromPush(registration) {
        registration.pushManager.getSubscription().then(subscription => {
            if (!subscription) {
                statusMessage.textContent = 'No subscription found.';
                return;
            }

            subscription.unsubscribe().then(() => {
                return fetch('/api/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });
            }).then(response => {
                if (response.ok) {
                    statusMessage.textContent = 'Unsubscribed successfully!';
                    updateSubscriptionStatus();
                } else {
                    statusMessage.textContent = 'Failed to unsubscribe.';
                }
            }).catch(error => {
                console.error('Unsubscribe error:', error);
                statusMessage.textContent = 'Unsubscribe error.';
            });
        }).catch(error => {
            console.error('Error getting subscription:', error);
            statusMessage.textContent = 'Unsubscribe error.';
        });
    }

    function resubscribeToPush(registration) {
        registration.pushManager.getSubscription().then(subscription => {
            if (!subscription) {
                statusMessage.textContent = 'No subscription found. Please subscribe first.';
                return;
            }

            const applicationServerKey = urlBase64ToUint8Array('Your Public Vapid Key');
            subscription.update({
                userVisibleOnly: true,
                applicationServerKey
            }).then(subscription => {
                return fetch('/api/resubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription)
                });
            }).then(response => {
                if (response.ok) {
                    statusMessage.textContent = 'Resubscribed successfully!';
                    updateSubscriptionStatus();
                } else {
                    statusMessage.textContent = 'Failed to resubscribe.';
                }
            }).catch(error => {
                console.error('Resubscribe error:', error);
                statusMessage.textContent = 'Resubscribe error.';
            });
        }).catch(error => {
            console.error('Error getting subscription:', error);
            statusMessage.textContent = 'Resubscribe error.';
        });
    }

    function initializeIndexedDB() {
        const request = indexedDB.open('notificationsDB', 1);

        request.onupgradeneeded = function(event) {
            db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = function(event) {
            db = event.target.result;
            initialize();
        };

        request.onerror = function(event) {
            console.error('IndexedDB error:', event.target.errorCode);
        };
    }

    function storeNotification(notification) {
        if (!db) {
            console.error('Database not initialized.');
            return;
        }

        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(notification);
        transaction.oncomplete = () => {
            console.log('Notification stored.');
            notifications.unshift(notification);
            renderNotifications();
        };
        transaction.onerror = (event) => {
            console.error('Error storing notification:', event.target.error);
        };
    }

    function clearDataFromIndexedDB() {

        if (!db) {
            console.error('Database is not initialized.');
            statusMessage.textContent = 'Database is not initialized.';
            return;
        }
    
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const clearRequest = store.clear();
    
        clearRequest.onsuccess = () => {
            console.log('All notifications cleared from IndexedDB.');
            statusMessage.textContent = 'All notifications have been cleared.';
            notifications = [];
            renderNotifications();
            updatePaginationControls();
            setTimeout(() => {
                window.location.reload();
              }, 2000);
        };
    
        clearRequest.onerror = (event) => {
            console.error('Error clearing data from IndexedDB:', event.target.error);
            statusMessage.textContent = 'Failed to clear notifications.';
        };
    }
    
    clearDataBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
            clearDataFromIndexedDB();
        }
    });

    function fetchNotifications() {
        if (!db) {
            console.error('Database is not initialized.');
            return;
        }

        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
            notifications = request.result.reverse();
            currentPage = 1;
            renderNotifications();
            updatePaginationControls();
        };

        request.onerror = (event) => {
            console.error('Error fetching notifications:', event.target.error);
        };
    }

    function renderNotifications() {
        notificationList.innerHTML = '';
        const start = (currentPage - 1) * notificationsPerPage;
        const end = start + notificationsPerPage;

        notifications.slice(start, end).forEach(notification => {
            const listItem = document.createElement('li');
            listItem.className = 'notification-card';
            listItem.innerHTML = `
                <div class="notification-body">> ${notification.title}</div><br>
                <div class="notification-body quote">${notification.body}</div>
            `;
            notificationList.appendChild(listItem);
        });

        updatePaginationControls();
    }

    function updatePaginationControls() {
        if (notifications.length === 0) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage * notificationsPerPage >= notifications.length;
    }

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    function initialize() {
        fetchNotifications();
    }

    navigator.serviceWorker.register('sw.js').then((registration) => {
        serviceWorkerRegistration = registration;
        console.log('Service Worker registered with scope:', registration.scope);
        updateSubscriptionStatus();

        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'notification') {
                const notification = event.data.notification;
                notifications.unshift(notification);
                renderNotifications();
                //storeNotification(notification);
            }
        });
    }).catch((error) => {
        console.error('Service Worker registration failed:', error);
        statusMessage.textContent = 'Service Worker registration failed.';
    });

    subscribeBtn.addEventListener('click', () => {
        subscribeToPush(serviceWorkerRegistration);
    });

    unsubscribeBtn.addEventListener('click', () => {
        unsubscribeFromPush(serviceWorkerRegistration);
    });

    resubscribeBtn.addEventListener('click', () => {
        resubscribeToPush(serviceWorkerRegistration);
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderNotifications();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage * notificationsPerPage < notifications.length) {
            currentPage++;
            renderNotifications();
        }
    });

    initializeIndexedDB();
});

let deferredPrompt;
const installButton = document.getElementById('installButton');

function checkIfAppInstalled() {
    const isInstalled = localStorage.getItem('isInstalled') === 'true';
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone || isInstalled) {
        installButton.style.display = 'none';
    } else {
        installButton.style.display = 'block';
    }
}

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    localStorage.setItem('isInstalled', 'true');
    installButton.style.display = 'none';
});

document.addEventListener('DOMContentLoaded', () => {
    checkIfAppInstalled();
});

navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'beforeinstallprompt') {
        checkIfAppInstalled();
    }
});

installButton.addEventListener('click', () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(choiceResult => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the PWA prompt');
                localStorage.setItem('isInstalled', 'true');
                installButton.style.display = 'none';
            } else {
                console.log('User dismissed the PWA prompt');
            }
            deferredPrompt = null;
        });
    }
});

window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    checkIfAppInstalled();
});
