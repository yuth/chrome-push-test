(function() {
    var isPushEnabled = false;

    window.addEventListener('load', function() {
        var pushButton = document.querySelector('#push-notification-toggle');
        pushButton.addEventListener('click', function(ev) {
            if (ev.target.checked) {
                subscribe();
            } else {
                unsubscribe();

            }
        });

        // Check that service workers are supported, if so, progressively  
        // enhance and add push messaging support, otherwise continue without it.  
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/chrome-push-test/push.js')
                .then(initialiseState);
        } else {
            console.warn('Service workers aren\'t supported in this browser.');
        }
    });

    // Once the service worker is registered set the initial state  
    function initialiseState() {

        // Are Notifications supported in the service worker?  
        if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
            console.warn('Notifications aren\'t supported.');
            return;
        }

        // Check the current Notification permission.  
        // If its denied, it's a permanent block until the  
        // user changes the permission  
        if (Notification.permission === 'denied') {
            console.warn('The user has blocked notifications.');
            return;
        }

        // Check if push messaging is supported  
        if (!('PushManager' in window)) {
            console.warn('Push messaging isn\'t supported.');
            return;
        }

        // We need the service worker registration to check for a subscription  
        navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
            // Do we already have a push message subscription?  
            serviceWorkerRegistration.pushManager.getSubscription()
                .then(function(subscription) {
                    // Enable any UI which subscribes / unsubscribes from  
                    // push messages.  
                    var pushButton = document.querySelector('#push-notification-toggle');
                    pushButton.disabled = false;


                    if (!subscription) {
                        // We aren't subscribed to push, so set UI  
                        // to allow the user to enable push  
                        return;
                    } else {
                        pushButton.checked = true;
                    }

                    // Keep your server in sync with the latest subscriptionId
                    document.querySelector('#push-key').innerText = subscription.subscriptionId;

                    // Set your UI to show they have subscribed for  
                    // push messages  
                    //pushButton.textContent = 'Disable Push Messages';  
                    isPushEnabled = true;
                })
                .catch(function(err) {
                    console.warn('Error during getSubscription()', err);
                });
        });
    }

    function subscribe() {
        // Disable the button so it can't be changed while  
        // we process the permission request  
        var pushButton = document.querySelector('#push-notification-toggle');
        pushButton.disabled = true;

        navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
            serviceWorkerRegistration.pushManager.subscribe().then(function(subscription) {
                    // The subscription was successful  
                    isPushEnabled = true;
                    pushButton.disabled = false;

                    // TODO: Send the subscription.subscriptionId and   
                    // subscription.endpoint to your server  
                    // and save it to send a push message at a later date 
                    document.querySelector('#push-key').innerText = subscription.subscriptionId;
                    return ;//sendSubscriptionToServer(subscription);
                })
                .catch(function(e) {
                    if (Notification.permission === 'denied') {
                        // The user denied the notification permission which  
                        // means we failed to subscribe and the user will need  
                        // to manually change the notification permission to  
                        // subscribe to push messages  
                        console.warn('Permission for Notifications was denied');
                        pushButton.disabled = true;
                    } else {
                        // A problem occurred with the subscription; common reasons  
                        // include network errors, and lacking gcm_sender_id and/or  
                        // gcm_user_visible_only in the manifest.  
                        console.error('Unable to subscribe to push.', e);
                        pushButton.disabled = false;
                        pushButton.textContent = 'Enable Push Messages';
                    }
                });
        });
    }
})()
