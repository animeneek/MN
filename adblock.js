document.addEventListener("DOMContentLoaded", function() {
    var iframe = document.querySelector("iframe");
    if (!iframe) return; // Exit if no iframe found

    iframe.onload = function() {
        try {
            var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

            function removeAds() {
                var adSelectors = [
                    "div.ad", 
                    "iframe[src*='ad']",
                    "script[src*='ads']",
                    "div[id*='banner']",
                    "div[class*='popup']",
                    "div[class*='overlay']",
                    "div[class*='sponsor']",
                    "div[id*='preload']", 
                    "div[class*='advertisement']", 
                    "div[class*='videoAdUi']", 
                    "video[autoplay]", 
                    "a[href*='click']", 
                    "a[target='_blank']"
                ];

                adSelectors.forEach(selector => {
                    var ads = iframeDocument.querySelectorAll(selector);
                    ads.forEach(ad => ad.remove());
                });

                // Disable popups opening in new tabs
                iframeDocument.body.addEventListener("click", function(event) {
                    if (event.target.tagName === "A" && event.target.href.includes("ads")) {
                        event.preventDefault();
                    }
                }, true);
            }

            // Run the ad blocker every 1.5 seconds
            setInterval(removeAds, 1500);
        } catch (e) {
            console.warn("Unable to access iframe content due to CORS restrictions.");
        }
    };
});
