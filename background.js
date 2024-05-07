chrome.commands.onCommand.addListener(function (command) {
    console.log("Received command:", command);
    if (command === "capture_page") {
        chrome.system.display.getInfo((displays) => {
            const primaryDisplay = displays.find(display => display.isPrimary);
            const fullWidth = primaryDisplay.bounds.width;
            chrome.windows.getCurrent({}, (currentWindow) => {
                // Check if the window is in full-screen mode
                if (currentWindow.state === "fullscreen") {
                    // Exit full-screen
                    chrome.windows.update(currentWindow.id, { state: "normal" }, () => {
                        // After exiting full-screen, resize the window to full width
                        chrome.windows.update(currentWindow.id, {
                            left: 0,
                            width: fullWidth
                        });
                    });
                } else {
                    // If not in full-screen, directly resize to full width
                    chrome.windows.update(currentWindow.id, {
                        left: 0,
                        width: fullWidth
                    });
                }
            });
        });
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            let activeTab = tabs[0];
            console.log("Active tab details:", activeTab);
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['content.js']
            }, () => console.log("Content script injected successfully"));
        });
    }
});




chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("Message received:", request.action);
    if (request.action === "captureOne") {
        chrome.tabs.captureVisibleTab(null, { format: "jpeg" , quality:10 }, dataUrl => {
            console.log("Captured:", dataUrl);
            sendResponse({ dataUrl: dataUrl });
        });
        return true;
    }
    
    if (request.action === "show_captures") {
        let captures = request.captures;
        let htmlContent = '<html><body style="margin:0; padding:0; display:flex; flex-direction:column;">';
        captures.forEach(dataUrl => {
            if(!dataUrl) return;
            htmlContent += `<img src="${dataUrl}" style="width:100%; height:auto; display:block;">`;
        });
        htmlContent += '</body></html>';
        console.log("HTML content created for new window", htmlContent);

        chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
            let activeTab = tabs[0];
            let window = await new Promise(resolve => {
                chrome.windows.get(activeTab.windowId, {}, resolve);
            });
            let currentWidth = window.width;
            let currentHeight = window.height;
            let newWindowWidth = Math.floor(currentWidth / 2);
            let newWindowHeight = currentHeight;

            let newWindow = await new Promise(resolve => {
                chrome.windows.create({
                    url: 'data:text/html,' + encodeURIComponent(htmlContent),
                    type: 'popup',
                    width: newWindowWidth,
                    height: newWindowHeight,
                    left: newWindowWidth,
                    top: window.top // To align it with the current window
                }, resolve);
            });

            // Resize the current window to make it side by side with the new window
            chrome.windows.update(activeTab.windowId, {
                left: 0,
                width: newWindowWidth,
                height: newWindowHeight
            });

            console.log("New window created for displaying captures");
        });
    }
});



