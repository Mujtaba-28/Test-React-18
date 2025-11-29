
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log("This browser does not support desktop notification");
        return 'denied';
    }
    return await Notification.requestPermission();
};

export const sendNotification = (title: string, options: NotificationOptions) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            ...options,
            icon: 'https://api.dicebear.com/9.x/shapes/png?seed=Emerald&backgroundColor=10b981'
        });
        return notification;
    }
};
