'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((registration) => {
                        console.log('SW registration successful:', registration.scope);
                        // Forzar update si hay nueva versión
                        registration.update();
                    })
                    .catch((err) => {
                        console.log('SW registration failed:', err);
                    });
            });
        }
    }, []);

    return null;
}
