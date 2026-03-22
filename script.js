const { jsPDF } = window.jspdf;

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
    const name = document.getElementById('stdName').value || "[Your Name]";
    const department = document.getElementById('stdDepartment').value || "[Your Department]";
    const college = document.getElementById('stdCollege').value || "[Your College Name]";
    const eventName = document.getElementById('stdEvent').value || "[Event Name]";
    const eventLocation = document.getElementById('stdLocation').value || "[Event Location]";
    
    const rememberCheckbox = document.getElementById('rememberMe').checked;
    if (rememberCheckbox) {
        const userData = { name, dept: department, college };
        localStorage.setItem('savedUser', JSON.stringify(userData));
    } else {
        localStorage.removeItem('savedUser');
    }

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

    const now = new Date();
    const todayStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

    const friendInputs = document.querySelectorAll('.friend-name');
    let friendsArray = [];
    friendInputs.forEach(input => {
        if(input.value.trim() !== '') friendsArray.push(input.value.trim()); 
    });

    const allNamesArray = [name, ...friendsArray];
    const signatureBlock = allNamesArray.join('\n');

    let bodyText = friendsArray.length > 0 
        ? `I am writing to formally request Duty Leave (DL) / Attendance for our absence ${dateString}. We participated in the ${eventName} held at ${eventLocation}.\n\nAttending this event provided us with valuable practical exposure. We will ensure that any coursework missed during this period is completed promptly.`
        : `I am writing to formally request Duty Leave (DL) / Attendance for my absence ${dateString}. I participated in the ${eventName} held at ${eventLocation}.\n\nAttending this event provided me with valuable practical exposure. I will ensure that any coursework missed during this period is completed promptly.`;

    const fullLetter = `${name}
${department}
${college}

${todayStr}

The Class Tutor
${department}
${college}

Respected Sir/Madam,

Subject: Request for Duty Leave (DL) / Attendance

${bodyText}

Thank you for your time and consideration.

Yours faithfully,
${signatureBlock}`;

    const editingBay = document.getElementById('editingBay');
    const draftArea = document.getElementById('fullDraftLetter');
    
    draftArea.value = fullLetter;
    
    // Set dynamic filename based on standard view
    const safeEventName = eventName !== "[Event Name]" ? eventName : "Event";
    draftArea.setAttribute('data-filename', `${safeEventName} DL.pdf`);
    
    editingBay.classList.remove('hidden');
    editingBay.scrollIntoView({ behavior: 'smooth' });

    saveToHistory({
        eventName: eventName !== "[Event Name]" ? eventName : "Standard Request",
        date: histDateDisplay,
        friendsCount: friendsArray.length,
        letterText: fullLetter,
        generatedAt: new Date().toLocaleString([], { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    });
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

function saveToHistory(entryData) {
    let history = JSON.parse(localStorage.getItem('letterHistory') || '[]');
    history.unshift(entryData);
    if (history.length > 5) history = history.slice(0, 5);
    localStorage.setItem('letterHistory', JSON.stringify(history));
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('letterHistory') || '[]');
    const container = document.getElementById('historyListContainer');
    if(!container) return;
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

        // Logic to switch between Standard and AI formatting
        let subtext = "";
        if (item.eventName === "AI Custom Letter") {
            subtext = `To: ${item.recipient || '[Recipient]'}`;
        } else {
            subtext = `${item.date} | Friends: ${item.friendsCount}`;
        }

        div.innerHTML = `
            <div style="font-size: 1.1rem; font-weight: 900; text-transform: uppercase; color: #ffffff;">${item.eventName}</div>
            <div style="font-size: 0.8rem; color: #aaa;">${subtext}</div>
            <div style="font-size: 0.7rem; color: #666; margin-top: 5px; text-transform: uppercase;">Generated: ${item.generatedAt || 'N/A'}</div>
        `;
        container.appendChild(div);
    });
}

function openHistoryDetail(index) {
    const history = JSON.parse(localStorage.getItem('letterHistory') || '[]');
    const item = history[index];
    if (item) {
        const draftArea = document.getElementById('historyFullDraftLetter');
        draftArea.value = item.letterText;
        draftArea.setAttribute('data-event', item.eventName); 
        delayedNavigate('historyDetailView');
        window.scrollTo({ top: 0, behavior: 'instant' });
    }
}

function clearHistory() {
    if (confirm("Clear all draft history?")) {
        localStorage.removeItem('letterHistory');
        loadHistory();
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
    const textArea = document.getElementById('fullDraftLetter');
    const fullText = textArea.value;
    
    // Check the hidden attribute to determine the correct filename
    const fileName = textArea.getAttribute('data-filename') || "Formal_Letter.pdf";
    
    // Force pure black font
    doc.setTextColor(0, 0, 0); 
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
    const fullText = textArea.value;
    
    // Route filename based on history data
    const fileName = eventName === "AI Custom Letter" ? "formal_letter.pdf" : `${eventName} DL.pdf`;
    
    // Force pure black font
    doc.setTextColor(0, 0, 0);
    doc.setFont("courier", "normal");
    doc.setFontSize(11);
    
    const splitText = doc.splitTextToSize(fullText, 170);
    doc.text(splitText, 20, 20);
    doc.save(fileName);
}

window.addEventListener('DOMContentLoaded', () => {
    // Load Standard DL Saved Data
    const savedData = localStorage.getItem('savedUser');
    if (savedData) {
        const data = JSON.parse(savedData);
        if(document.getElementById('stdName')) document.getElementById('stdName').value = data.name || "";
        if(document.getElementById('stdDepartment')) document.getElementById('stdDepartment').value = data.dept || "";
        if(document.getElementById('stdCollege')) document.getElementById('stdCollege').value = data.college || "";
        if(document.getElementById('rememberMe')) document.getElementById('rememberMe').checked = true;
    }

    // Load AI View Saved Data (SENDER ONLY)
    const savedAIData = localStorage.getItem('savedAIUser');
    if (savedAIData) {
        const aiData = JSON.parse(savedAIData);
        if(document.getElementById('aiFromName')) document.getElementById('aiFromName').value = aiData.name || "";
        if(document.getElementById('aiFromAddress1')) document.getElementById('aiFromAddress1').value = aiData.add1 || "";
        if(document.getElementById('aiFromAddress2')) document.getElementById('aiFromAddress2').value = aiData.add2 || "";
        if(document.getElementById('aiRememberMe')) document.getElementById('aiRememberMe').checked = true;
    }

    // 'Enter' Key to Submit AI Form with Simulated Button Click
    const aiPromptInput = document.getElementById('aiPrompt');
    if (aiPromptInput) {
        aiPromptInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); 
                
                const submitBtn = document.getElementById('aiSubmitBtn');
                if (submitBtn) {
                    // 1. Simulate the "pressed" state matching your CSS
                    submitBtn.style.transform = 'translate(3px, 3px)';
                    submitBtn.style.boxShadow = '0px 0px 0px transparent';
                    
                    // 2. Wait 150ms, revert styles, and trigger the AI
                    setTimeout(() => {
                        submitBtn.style.transform = '';
                        submitBtn.style.boxShadow = '';
                        draftAI(); 
                    }, 150);
                } else {
                    draftAI(); // Fallback if button isn't found
                }
            }
        });
    }
});

async function draftAI() {
    // Get Raw Sender Inputs
    const rawFromName = document.getElementById('aiFromName').value;
    const rawFromAdd1 = document.getElementById('aiFromAddress1').value;
    const rawFromAdd2 = document.getElementById('aiFromAddress2').value;

    // Remember Me Logic
    const aiRememberCheckbox = document.getElementById('aiRememberMe');
    if (aiRememberCheckbox && aiRememberCheckbox.checked) {
        const aiUserData = { name: rawFromName, add1: rawFromAdd1, add2: rawFromAdd2 };
        localStorage.setItem('savedAIUser', JSON.stringify(aiUserData));
    } else {
        localStorage.removeItem('savedAIUser');
    }

    // Apply Fallbacks
    const fromName = rawFromName || "[Sender's Name]";
    const fromAdd1 = rawFromAdd1 || "[Sender Address 1]";
    const fromAdd2 = rawFromAdd2 || "[Sender Address 2]";
    const toName = document.getElementById('aiToName').value || "[Recipient Name]";
    const toAdd1 = document.getElementById('aiToAddress1').value || "[Recipient Address 1]";
    const toAdd2 = document.getElementById('aiToAddress2').value || "[Recipient Address 2]";
    const reason = document.getElementById('aiPrompt').value || "[Reason for letter]";

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

    const submitBtn = document.getElementById('aiSubmitBtn');
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "GENERATING... PLEASE WAIT";
    submitBtn.style.pointerEvents = "none";

    const promptText = `
    Write a professional formal letter based on the details below.
    FROM: ${fromName}, ${fromAdd1}, ${fromAdd2}
    TO: ${toName}, ${toAdd1}, ${toAdd2}
    DATE: ${dateStr}
    REASON: ${reason}

    STRICT FORMATING REQUIREMENTS: 
    1. Output RAW TEXT ONLY. Absolutely no Markdown (no asterisks, hashtags, or bolding).
    2. HEADER SPACING: Include exactly ONE EMPTY LINE between the From Address block and the Date.
    3. TO ADDRESS SPACING: Include exactly ONE EMPTY LINE between the Date and the To Address block.
    4. SUBJECT LINE: Keep it short (e.g., "Subject: Request for Medical Leave"). 
       DO NOT include names, departments, or DATES in the subject line.
    5. SIGN-OFF: Under the sign-off (e.g., "Sincerely,"), output the sender's name (${fromName}) directly on the next line with no empty space.
`;

    try {
        // CALL YOUR VERCEL API INSTEAD OF GOOGLE DIRECTLY
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ promptText: promptText })
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        const generatedText = data.candidates[0].content.parts[0].text;
        let cleanLetter = generatedText.replace(/[\*#_]/g, '').trim();
        cleanLetter = cleanLetter.replace(/(Sincerely,|Yours faithfully,|Yours sincerely,|Regards,|Yours truly,)\s*\n+/gi, "$1\n");

        // Update UI
        const draftArea = document.getElementById('fullDraftLetter');
        draftArea.value = cleanLetter;
        draftArea.setAttribute('data-filename', 'formal_letter.pdf');

        const editingBay = document.getElementById('editingBay');
        editingBay.classList.remove('hidden');
        editingBay.scrollIntoView({ behavior: 'smooth' });

        saveToHistory({
            eventName: "AI Custom Letter",
            recipient: toName,
            date: dateStr,
            friendsCount: null,
            letterText: cleanLetter,
            generatedAt: new Date().toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        });

    } catch (error) {
        console.error("API Error:", error);
        alert("Error: " + error.message);
    } finally {
        submitBtn.innerText = originalBtnText;
        submitBtn.style.pointerEvents = "auto";
    }
}