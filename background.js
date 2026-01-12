// Background service worker
// Handles extension lifecycle and can be used for future background tasks

chrome.runtime.onInstalled.addListener(() => {
    console.log('Website Data Extractor extension installed');
});

// Listen for tab updates if needed for future features
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Can be used for automatic extraction or badge updates
});
