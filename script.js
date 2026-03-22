const { jsPDF } = window.jspdf;

// Paste your free Gemini API Key here
const API_KEY = 'YOUR_API_KEY_HERE'; 

// Simple Router to switch between views
function navigate(viewId) {
    const views = ['homeView', 'standardView', 'aiView', 'editingBay', 'historyView', 'historyDetailView'];
    views.forEach(v => {
        const el = document.getElementById(v);
        if(el) el.classList.add('hidden');
    });
    
    const target = document.getElementById(viewId);
    if(target) target.classList.remove('hidden');
}

// Keeping the delay at 150ms as requested
function delayedNavigate(viewId) {
    setTimeout(() => {
        navigate(viewId);
    }, 150); 
}

// Generates the standard event draft
function draftStandard() {
    // 1. Gather User Details
    const name = document.getElementById('stdName').value || "[Your Name]";
    const department = document.getElementById('stdDepartment').value || "[Your Department]";
    const college = document.getElementById('stdCollege').value || "[Your College Name]";
    const eventName = document.getElementById('stdEvent').value || "[Event Name]";
    const eventLocation = document.getElementById('stdLocation').value || "[Event Location]";
    
    // 2. Remember Me Logic
    const rememberCheckbox = document.getElementById('rememberMe').checked;
    if (rememberCheckbox) {
        const userData = { name, dept: department, college };
        localStorage.setItem('savedUser', JSON.stringify(userData));
    } else {
        localStorage.removeItem('savedUser');
    }

    // 3. Date & Multi-day Logic
    const isMulti = document.getElementById('isMultiDay').checked;
    const rawDate = document.getElementById('stdDateTime').value;
    const rawEndDate = document.getElementById('stdEndDateTime').value;
    
    let dateString = "[Date]";
    let histDateDisplay = "N/A";

    if (rawDate) {
        const startDate = rawDate.split('-').reverse().join('-');
        if (isMulti && rawEndDate) {
            const endDate = rawEndDate.split('-').reverse().join('-');
            dateString = `from ${startDate} to ${endDate}`;
            histDateDisplay = `${startDate} - ${endDate}`;
        } else {
            dateString = `on ${startDate}`;
            histDateDisplay = startDate;
        }
    }

    // 4. Current Date for Header & Precise Generation Time
    const now = new Date();
    const todayStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    
    // NEW: Capture Time & Date for History View
    const timestamp = now.toLocaleString('en-GB', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
    }).toUpperCase();

    // 5. Friends Logic
    const friendInputs = document.querySelectorAll('.friend-name');
    let friendsArray = [];
    friendInputs.forEach(input => {
        if(input.value.trim() !== '') friendsArray.push(input.value.trim()); 
    });

    const allNamesArray = [name, ...friendsArray];
    const signatureBlock = allNamesArray.join('\n');

    // 6. Body Construction
    let bodyText = friendsArray.length > 0 
        ? `We are writing to formally request Duty Leave (DL) / Attendance for our absence ${dateString}. We participated in the ${eventName} held at ${eventLocation}.\n\nAttending this event provided us with valuable practical exposure. We will ensure that any coursework missed during this period is completed promptly.`
        : `I am writing to formally request Duty Leave (DL) / Attendance for my absence ${dateString}. I participated in the ${eventName} held at ${eventLocation}.\n\nAttending this event provided me with valuable practical exposure. I will ensure that any coursework missed during this period is completed promptly.`;

    const fullLetter = `To,
The Class Tutor,
${department},
${college}

Date: ${todayStr}

Subject: Request for On-Duty (OD) Leave

Respected Sir/Madam,

${bodyText}

Thank you for your time and consideration.

Yours faithfully,

${signatureBlock}`;

    // 7. DISPLAY RESULT BELOW (Scrolling behavior)
    const editingBay = document.getElementById('editingBay');
    document.getElementById('fullDraftLetter').value = fullLetter;
    editingBay.classList.remove('hidden');
    editingBay.scrollIntoView({ behavior: 'smooth' });

    // 8. Save to History (Including the generation timestamp)
    saveToHistory({
        eventName: eventName !== "[Event Name]" ? eventName : "Standard Request",
        date: histDateDisplay,
        friendsCount: friendsArray.length,
        letterText: fullLetter,
        generatedAt: timestamp
    });
}

// --- HISTORY LOGIC ---

function saveToHistory(entryData) {
    let history = JSON.parse(localStorage.getItem('letterHistory') || '[]');
    history.unshift(entryData);
    if (history.length > 5) history = history.slice(0, 5);
    localStorage.setItem('letterHistory', JSON.stringify(history));
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('letterHistory') || '[]');
    const container = document.getElementById('historyListContainer');
    container.innerHTML = ''; 

    if (history.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888; margin-top: 2rem;">No history found.</p>';
        return;
    }

    history.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'option-card'; 
        div.style.textAlign = 'left';
        div.onclick = () => openHistoryDetail(index);
        
        // Displaying Event Name, Details, and Generation Time
        div.innerHTML = `
            <div style="font-size: 1.1rem; font-weight: 900; text-transform: uppercase; color: #ffffff;">${item.eventName}</div>
            <div style="font-size: 0.8rem; color: #aaa;">${item.date} | Friends: ${item.friendsCount}</div>
            <div style="font-size: 0.65rem; color: #666; margin-top: 5px; font-family: monospace;">
                GENERATED: ${item.generatedAt || 'N/A'}
            </div>
        `;
        container.appendChild(div);
    });
}

// ... Rest of the toggleDateRange, generateFriendFields, and PDF functions remain the same ...

function openHistoryDetail(index) {
    const history = JSON.parse(localStorage.getItem('letterHistory') || '[]');
    const item = history[index];
    if (item) {
        document.getElementById('historyFullDraftLetter').value = item.letterText;
        document.getElementById('historyFullDraftLetter').setAttribute('data-event', item.eventName); 
        delayedNavigate('historyDetailView');
    }
}

function clearHistory() {
    if (confirm("Clear all draft history?")) {
        localStorage.removeItem('letterHistory');
        loadHistory();
    }
}

function toggleDateRange() {
    const isMulti = document.getElementById('isMultiDay').checked;
    const endGroup = document.getElementById('endDateGroup');
    const dateLabel = document.getElementById('dateLabel');
    
    if (isMulti) {
        endGroup.classList.remove('hidden');
        dateLabel.innerText = "FROM DATE";
    } else {
        endGroup.classList.add('hidden');
        dateLabel.innerText = "DATE OF THE EVENT";
    }
}

function generateFriendFields() {
    let numInput = document.getElementById('numFriends').value;
    if (parseInt(numInput) > 15) {
        document.getElementById('numFriends').value = 15;
        numInput = 15;
    }
    const num = numInput === "" ? 0 : parseInt(numInput);
    const container = document.getElementById('friendsContainer');
    container.innerHTML = ''; 
    for (let i = 1; i <= num; i++) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `<label>Friend ${i} Name</label><input type="text" class="friend-name" placeholder="E.G., JOHN DOE">`;
        container.appendChild(div);
    }
}

function downloadPDF() {
    const doc = new jsPDF();
    const eventInput = document.getElementById('stdEvent').value.trim();
    const fileName = eventInput ? `${eventInput} DL.pdf` : "Leave_Letter.pdf";
    const fullText = document.getElementById('fullDraftLetter').value;
    doc.setFont("courier", "normal");
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(fullText, 170);
    doc.text(splitText, 20, 20);
    doc.save(fileName);
}

function downloadHistoryPDF() {
    const doc = new jsPDF();
    const textArea = document.getElementById('historyFullDraftLetter');
    const eventName = textArea.getAttribute('data-event') || "Leave_Letter";
    doc.setFont("courier", "normal");
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(textArea.value, 170);
    doc.text(splitText, 20, 20);
    doc.save(`${eventName} DL.pdf`);
}

window.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('savedUser');
    if (savedData) {
        const data = JSON.parse(savedData);
        if(document.getElementById('stdName')) document.getElementById('stdName').value = data.name || "";
        if(document.getElementById('stdDepartment')) document.getElementById('stdDepartment').value = data.dept || "";
        if(document.getElementById('stdCollege')) document.getElementById('stdCollege').value = data.college || "";
        if(document.getElementById('rememberMe')) document.getElementById('rememberMe').checked = true;
    }
});