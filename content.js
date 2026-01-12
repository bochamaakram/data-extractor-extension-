// Content script - runs in the context of web pages
// This script extracts data from the current page

function extractDataFromPage() {
    const data = {
        emails: [],
        phones: [],
        socialLinks: []
    };

    // Get page text content
    const pageText = document.body.innerText;

    // Email regex pattern
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = pageText.match(emailRegex) || [];
    data.emails = [...new Set(emails)]; // Remove duplicates

    // Extract phone numbers from tel: links only
    const telLinks = document.querySelectorAll('a[href^="tel:"]');
    const phones = new Set();
    telLinks.forEach(link => {
        // Get the phone number from href, removing "tel:" prefix
        const phone = link.href.replace('tel:', '').trim();
        if (phone) {
            phones.add(phone);
        }
    });
    data.phones = [...phones];

    // Social media platforms to detect
    const socialPlatforms = {
        facebook: /facebook\.com/i,
        twitter: /(?:twitter\.com|x\.com)/i,
        linkedin: /linkedin\.com/i,
        instagram: /instagram\.com/i,
        youtube: /youtube\.com/i,
        github: /github\.com/i,
        tiktok: /tiktok\.com/i
    };

    // Extract social links from href attributes (use full URL)
    const allLinks = document.querySelectorAll('a[href]');
    const socialLinks = new Map();

    allLinks.forEach(link => {
        const href = link.href;

        for (const [platform, pattern] of Object.entries(socialPlatforms)) {
            if (pattern.test(href)) {
                // Use the full href URL (preserves query parameters)
                if (!socialLinks.has(href)) {
                    socialLinks.set(href, { platform, url: href });
                }
                break; // Only match first platform
            }
        }
    });

    data.socialLinks = [...socialLinks.values()];

    return data;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractData') {
        const data = extractDataFromPage();
        sendResponse(data);
    }
    return true; // Keep message channel open for async response
});
