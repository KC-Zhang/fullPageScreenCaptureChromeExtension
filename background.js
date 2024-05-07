function handleCapturePage() {
    chrome.system.display.getInfo((displays) => {
        const primaryDisplay = displays.find(display => display.isPrimary);
        const fullHeight = primaryDisplay.bounds.height;
        const fullWidth = primaryDisplay.bounds.width;
        chrome.windows.getCurrent({}, (currentWindow) => {
            console.log("Current window state:", currentWindow.state);
            if (currentWindow.state !== "normal") {
                chrome.windows.update(currentWindow.id, { state: "normal" }, () => {
                    chrome.windows.update(currentWindow.id, {
                        left: 0,
                        width: fullWidth,
                        top: 0,
                        height: fullHeight
                    });
                });
            } else {
                chrome.windows.update(currentWindow.id, {
                    left: 0,
                    width: fullWidth,
                    top: 0,
                    height: fullHeight
                });
            }
        });
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            let activeTab = tabs[0];
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['content.js']
            }, () => console.log("Content script injected successfully"));
        });
    });
}

chrome.commands.onCommand.addListener(function (command) {
    console.log("Received command:", command);
    if (command === "capture_page") {
        handleCapturePage();
    }
});

chrome.action.onClicked.addListener((tab) => {
    handleCapturePage();
});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("Message received:", request.action);
    if (request.action === "captureOne") {
        chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 30 }, dataUrl => {
            console.log("Captured:", dataUrl);
            sendResponse({ dataUrl: dataUrl });
        });
        return true;
    }

    if (request.action === "show_captures") {
        let captures = request.captures;
        let htmlContent = '<html><body style="margin:0; padding:0; display:flex; flex-direction:column;">';
        captures.forEach(dataUrl => {
            if (!dataUrl) return;
            htmlContent += `<img src="${dataUrl}" style="width:100%; height:auto; display:block;">`;
        });
        htmlContent += '</body></html>';

        chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
            let activeTab = tabs[0];
            let window = await new Promise(resolve => {
                chrome.windows.get(activeTab.windowId, {}, resolve);
            });
            let currentWidth = window.width;
            let currentHeight = window.height;
            let newWindowWidth = currentWidth;
            let newWindowHeight = Math.floor(currentHeight / 2);

            // Resize the current window to make it side by side with the new window
            chrome.windows.update(activeTab.windowId, {
                left: 0,
                top: 0,
                width: newWindowWidth,
                height: newWindowHeight
            });
            let newWindow = await new Promise(resolve => {
                chrome.windows.create({
                    url: 'data:text/html,' + encodeURIComponent(htmlContent),
                    type: 'popup',
                    width: newWindowWidth,
                    height: newWindowHeight,
                    left: 0,
                    top: newWindowHeight,
                }, resolve);
            });
            console.log("New window created for displaying captures");
        });
    }
});



