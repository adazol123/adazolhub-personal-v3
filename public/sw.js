self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim())
})

// Heartbeat check
self.addEventListener('message', async event => {
  if (event.data === 'HEARTBEAT') {
    try {
      await fetch('https://v1.api.adazol.com/heartbeat', {
        method: 'GET'
      })
    } catch (error) {
      console.error('Heartbeat check failed:', error)
    }
  }
})
