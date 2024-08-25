# Sanpush 📲

Free Web Push Notification Updates: Just Subscribe to receive notifications.  

## Built with

- Node.js
- Express.js for API
- HTML, Bulma CSS and Javascript for Front-end
- Browser IndexedDB Support for Store Push Notifications
- PWA install Support
- Web Push Notifications with VAPID: <https://rossta.net/blog/using-the-web-push-api-with-vapid.html>  

## Usage and Features

- API Routes for `/api/subscribe`, `/api/unsubscribe`, `/api/resubscribe`, `/api/send-notification`
- All Client Subscribed data was stored in `db` folder in jSON File Format
- Automatically removed and Update inactive client tokens in JSON File
- Bearer Token Support for Send Notification API Route
- Clone or Download the Repo
- install dependencies (pnpm recommended)  

```sh

# dev server
pnpm dev

# Production server
pnpm start

```

- Fully Self-Hosted no third party sdk or api not required
- Generate web push vapid key  

```sh
npx web-push generate-vapid-keys [--json]
```

- Create `db` folder for store client tokens

```sh
mkdir -p db
```

- `index.js` - add vapid key details and Email-ID
- `src/middleware/auth.js` add custom key for Bearer Auth Header
- `public/sw.js` Update your Website URL
- `public/main.js` Update your PUblic Vapid Key
- Send Push NOtification to all clients

```sh
curl -X POST http://localhost:5024/api/send-notification -H "Authorization: Bearer YOURKEY" -H "Content-Type: application/json" -d '{"title": "First Push", "body": "Hello World"}'
```

## Known issues

- Send to only one device: <https://github.com/K0IN/Notify/issues/122>  

## Credits

- Project idea from : <https://github.com/K0IN/Notify>
- Concept Web Push from service worker : <https://github.com/gauntface/simple-push-demo>
- VAPID : <https://developer.chrome.com/blog/web-push-interop-wins>
- Project base concept : <https://dev.to/wteja/how-to-make-push-notification-using-nodejs-and-service-worker-jaa>  

## LICENSE

MIT
