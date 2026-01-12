// Extracted data storage
let extractedData = {
    emails: [],
    phones: [],
    socialLinks: []
};

// DOM Elements
const extractBtn = document.getElementById('extractBtn');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');
const noDataDiv = document.getElementById('noData');
const downloadBtn = document.getElementById('downloadBtn');
const formatSelect = document.getElementById('formatSelect');

// Extract button click handler
extractBtn.addEventListener('click', async () => {
    // Show loading state
    extractBtn.disabled = true;
    resultsDiv.classList.add('hidden');
    noDataDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    try {
        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Send message to content script
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });

        // Process results
        extractedData = response;
        displayResults();
    } catch (error) {
        console.error('Extraction error:', error);
        noDataDiv.classList.remove('hidden');
    } finally {
        loadingDiv.classList.add('hidden');
        extractBtn.disabled = false;
    }
});

// Display extracted data
function displayResults() {
    const { emails, phones, socialLinks } = extractedData;

    // Check if any data was found
    if (emails.length === 0 && phones.length === 0 && socialLinks.length === 0) {
        noDataDiv.classList.remove('hidden');
        return;
    }

    // Update counts
    document.getElementById('emailCount').textContent = emails.length;
    document.getElementById('phoneCount').textContent = phones.length;
    document.getElementById('socialCount').textContent = socialLinks.length;

    // Populate email list
    const emailList = document.getElementById('emailList');
    emailList.innerHTML = emails.map(email =>
        `<div class="data-item">
      <a href="mailto:${email}">${email}</a>
      <button class="btn-copy" data-copy="${email}" title="Copy">
        <i class="bi bi-clipboard"></i>
      </button>
    </div>`
    ).join('');

    // Populate phone list
    const phoneList = document.getElementById('phoneList');
    phoneList.innerHTML = phones.map(phone =>
        `<div class="data-item">
      <a href="tel:${phone}">${phone}</a>
      <button class="btn-copy" data-copy="${phone}" title="Copy">
        <i class="bi bi-clipboard"></i>
      </button>
    </div>`
    ).join('');

    // Populate social links list
    const socialList = document.getElementById('socialList');
    socialList.innerHTML = socialLinks.map(link =>
        `<div class="data-item">
      <a href="${link.url}" target="_blank">${link.platform}: ${link.url}</a>
      <button class="btn-copy" data-copy="${link.url}" title="Copy">
        <i class="bi bi-clipboard"></i>
      </button>
    </div>`
    ).join('');

    // Add copy event listeners
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', handleCopy);
    });

    resultsDiv.classList.remove('hidden');
}

// Handle copy button click
async function handleCopy(e) {
    const btn = e.currentTarget;
    const textToCopy = btn.dataset.copy;

    try {
        await navigator.clipboard.writeText(textToCopy);

        // Visual feedback
        btn.classList.add('copied');
        btn.querySelector('i').className = 'bi bi-check';

        setTimeout(() => {
            btn.classList.remove('copied');
            btn.querySelector('i').className = 'bi bi-clipboard';
        }, 1500);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

// Download button click handler
downloadBtn.addEventListener('click', () => {
    const format = formatSelect.value;

    if (format === 'json') {
        downloadJSON();
    } else {
        downloadCSV();
    }
});

// Download as JSON
function downloadJSON() {
    const data = {
        extractedAt: new Date().toISOString(),
        source: 'Website Data Extractor',
        data: extractedData
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadFile(blob, 'extracted-data.json');
}

// Download as CSV
function downloadCSV() {
    const rows = [];

    // Header
    rows.push(['Type', 'Value', 'Platform']);

    // Emails
    extractedData.emails.forEach(email => {
        rows.push(['Email', email, '']);
    });

    // Phones
    extractedData.phones.forEach(phone => {
        rows.push(['Phone', phone, '']);
    });

    // Social Links
    extractedData.socialLinks.forEach(link => {
        rows.push(['Social Link', link.url, link.platform]);
    });

    // Convert to CSV string
    const csvContent = rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadFile(blob, 'extracted-data.csv');
}

// Helper function to download file
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
