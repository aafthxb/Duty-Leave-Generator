const { jsPDF } = window.jspdf;

// Paste your free Gemini API Key here
const API_KEY = 'YOUR_API_KEY_HERE'; 

// Global variable to store the user's name for the PDF signature
let currentUserInfo = "";

// Simple Router to switch between views
function navigate(viewId) {
    document.getElementById('homeView').classList.add('hidden');
    document.getElementById('standardView').classList.add('hidden');
    document.getElementById('aiView').classList.add('hidden');
    document.getElementById('editingBay').classList.add('hidden');
    
    document.getElementById(viewId).classList.remove('hidden');
}

// Generates the standard event draft
// Generates the standard event draft
// Generates the standard event draft
// Generates the standard event draft
// Generates the standard event draft
function draftStandard() {
    const name = document.getElementById('stdName').value || "[Your Name]";
    const department = document.getElementById('stdDepartment').value || "[Your Department]";
    const college = document.getElementById('stdCollege').value || "[Your College Name]";
    
    const eventName = document.getElementById('stdEvent').value || "[Event Name]";
    const eventLocation = document.getElementById('stdLocation').value || "[Event Location]";
    const rawDate = document.getElementById('stdDateTime').value;
    let dateTime = "[Date]";
    
    if (rawDate) {
        // Split by the dash from the input
        const [year, month, day] = rawDate.split('-');
        // Reassemble with dashes for the final DD-MM-YYYY format
        dateTime = `${day}-${month}-${year}`;
    }

    // Gather all the dynamically generated friend names
    const friendInputs = document.querySelectorAll('.friend-name');
    let friendsArray = [];
    friendInputs.forEach(input => {
        if(input.value.trim() !== '') {
            friendsArray.push(input.value.trim()); 
        }
    });

    // NEW: Combine your name with the friends array and stack them vertically
    const allNamesArray = [name, ...friendsArray];
    const signatureBlock = allNamesArray.join('\n'); // The \n forces them onto new lines

    let bodyText = "";
    
    // NEW: Clean "I vs We" grammar check
    // NEW: Clean "I vs We" grammar check (Past Tense version)
    if (friendsArray.length > 0) {
        // Group format
        bodyText = `We are writing to formally request Duty Leave (DL) for our absence on ${dateTime}. We participated in the ${eventName} held at ${eventLocation}.\n\nAttending this event provided us with valuable practical exposure. We will ensure that any coursework missed during this period is completed promptly.`;
    } else {
        // Solo format
        bodyText = `I am writing to formally request Duty Leave (DL) for my absence on ${dateTime}. I participated in the ${eventName} held at ${eventLocation}.\n\nAttending this event provided valuable practical exposure. I will ensure that any coursework missed during this period is completed promptly.`;
    }

    const fullLetter = 

`To,
The Class Tutor,
${department},
${college}

Date: ${dateTime}

Subject: Request for On-Duty (OD) Leave

Respected Sir/Madam,

${bodyText}

Thank you for your time and consideration.

Yours faithfully,

${signatureBlock}`;

    document.getElementById('fullDraftLetter').value = fullLetter;
    document.getElementById('editingBay').classList.remove('hidden');
    document.getElementById('editingBay').scrollIntoView({ behavior: 'smooth' });
}

// Generates the custom AI draft
async function draftWithAI() {
    const nameInfo = document.getElementById('aiName').value || "[Your Name, Department]";
    const promptText = document.getElementById('aiPrompt').value;
    const fullDraftArea = document.getElementById('fullDraftLetter');
    const today = new Date().toLocaleDateString();
    
    document.getElementById('editingBay').classList.remove('hidden');
    fullDraftArea.value = "AI is drafting your letter... Please wait.";

    const prompt = `Write a formal, one-paragraph body for a college leave letter based on this reason: "${promptText}". 
                    Do not include the To/From addresses, date, or subject line. Just the formal body paragraph starting with "I am writing to...". Tone should be respectful and academic.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        const aiBodyText = data.candidates[0].content.parts[0].text.replace(/\*/g, '').trim();

        // Assemble the complete letter format with the AI body
        const fullLetter = `Date: ${today}

To,
The Class Tutor,
[Your Department],
[Your College Name]

Subject: Request for Leave of Absence

Respected Sir/Madam,

${aiBodyText}

Thank you for your time and consideration.

Yours faithfully,

${nameInfo}`;

        fullDraftArea.value = fullLetter;
    } catch (error) {
        fullDraftArea.value = "Error connecting to AI. Please check your API key or internet connection.";
        console.error(error);
    }
}

// Compiles the edited text into the final PDF format
// Compiles the edited text into the final PDF format
function downloadPDF() {
    const doc = new jsPDF();
    const margin = 20;
    
    // Grab the entire text block from the giant text area
    const fullText = document.getElementById('fullDraftLetter').value;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    
    // Split the entire text block to ensure it wraps correctly at the page margins
    const splitText = doc.splitTextToSize(fullText, 170);
    
    // Print the entire array of lines to the PDF starting at the top margin
    doc.text(splitText, margin, 20);

    doc.save("Leave_Letter.pdf");
}

// Dynamically generates input fields based on the number selected
function generateFriendFields() {
    const num = parseInt(document.getElementById('numFriends').value) || 0;
    const container = document.getElementById('friendsContainer');
    
    // Clear the container first in case the user changes the number down
    container.innerHTML = ''; 

    for (let i = 1; i <= num; i++) {
        const div = document.createElement('div');
        div.className = 'form-group';
        // Notice we are giving all these inputs the same class name: 'friend-name'
        div.innerHTML = `
            <label style="color: #4b5563; font-size: 0.85rem;">Person ${i} Name</label>
            <input type="text" class="friend-name" placeholder="Name of Person ${i}">
        `;
        container.appendChild(div);
    }
}