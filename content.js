async function captureFullPage() {
    let totalHeight = document.documentElement.scrollHeight;
    let viewportHeight = window.innerHeight;
    let captures = [];
    console.log("Starting full page capture", totalHeight, viewportHeight);

    for (let i = 0; i < totalHeight; i += viewportHeight) {
        window.scrollTo(0, i);
        console.log("Scrolled to position:", i);
        await new Promise(r => setTimeout(r, 500));  // wait for scrolling to settle
        console.log("scrolling settled")
        await new Promise(async (resolve, reject) => {
            chrome.runtime.sendMessage({ action: "captureOne" }, function (response) {
            if (response.error) {
                console.error("Error capturing:", response.error);
                reject(response.error);
            } else {
                captures.push(response.dataUrl);
                console.log("Capture successful:", response.dataUrl);
                resolve();
            }
            });
        });
        console.log("Step complete");
    }

    window.scrollTo(0, 0);  // scroll back to top
    console.log("Captures complete, sending to background");
    chrome.runtime.sendMessage({ action: "show_captures", captures: captures });  // send all captures to background
}

captureFullPage();
