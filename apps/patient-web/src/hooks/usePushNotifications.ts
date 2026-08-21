import { useState, useEffect } from "react";
import { api } from "../lib/api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      
      // Register service worker if not already registered
      navigator.serviceWorker.register("/sw.js").catch(err => {
        console.error("Service Worker registration failed: ", err);
      });

      // Get existing subscription
      navigator.serviceWorker.ready.then((registration) => {
        return registration.pushManager.getSubscription();
      }).then((sub) => {
        setSubscription(sub);
      }).catch(err => {
        console.error("Error getting push subscription: ", err);
      });
    }
  }, []);

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      
      setSubscription(sub);

      // Send to server
      await api.post("/notifications/subscribe", { subscription: sub });
      
    } catch (err: any) {
      setError(err);
      console.error("Failed to subscribe to push notifications: ", err);
    }
  };

  return {
    isSupported,
    subscription,
    subscribeToPush,
    error
  };
}
