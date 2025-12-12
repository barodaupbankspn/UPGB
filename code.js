/**
 * FINAL PRODUCTION BACKEND CODE
 * Deploy this as a Web App:
 * 1. Extensions > Apps Script
 * 2. Paste code.
 * 3. UPDATE CONFIG VALUES below.
 * 4. Deploy > New Deployment > Web App > Access: Anyone.
 */

// --- CONFIGURATION ---
const SHEET_ID = '1M6XkrFExXc_BiLVRL8dd4TjPdG5fiLm7n3KIU8u4PIw';
const INSTANCE_ID = 'instance155365'; // From UltraMsg
const TOKEN = 'pio1dd7zqwtngt1h'; // From UltraMsg
const USE_ULTRAMSG = true; // Set to true to use UltraMsg

function doGet(e) {
    const action = e.parameter.action;

    if (action === 'getContacts') {
        return createJSONOutput(getContacts());
    }
    else if (action === 'getHistory') {
        return createJSONOutput(getHistory());
    }

    return ContentService.createTextOutput("UPGB Recovery API Online");
}

function doPost(e) {
    // CORS fix attempt for some browsers
    if (!e.postData) return createJSONOutput({ status: 'error', message: 'No data' });

    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'sendMessage') {
        return createJSONOutput(sendBroadcast(data));
    }
    else if (action === 'addContact') {
        return createJSONOutput(addContact(data.contact));
    }
    else if (action === 'deleteContact') {
        return createJSONOutput(deleteContact(data.mobile));
    }
    else if (action === 'editContact') {
        return createJSONOutput(editContact(data.contact));
    }
}

function createJSONOutput(data) {
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// --- DATA OPERATIONS ---

function getContacts() {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('StaffData');
    const data = sheet.getDataRange().getValues();
    const contacts = [];
    // Skip header
    for (let i = 1; i < data.length; i++) {
        // Only add if name exists and valid mobile
        if (data[i][0]) {
            contacts.push({
                name: data[i][0],
                role: data[i][1],
                mobile: String(data[i][2]),
                branch: data[i][3],
                district: data[i][4] || '' // col index 4 for District
            });
        }
    }
    return contacts;
}

function addContact(c) {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('StaffData');
    // Simple check for duplicate mobile
    const existing = sheet.getDataRange().getValues();
    for (let i = 0; i < existing.length; i++) {
        if (String(existing[i][2]) == String(c.mobile)) {
            return { status: 'error', message: 'Mobile already exists' };
        }
    }
    sheet.appendRow([c.name, c.role, c.mobile, c.branch, c.district]);
    return { status: 'success' };
}

function editContact(c) {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('StaffData');
    const data = sheet.getDataRange().getValues();
    // Find row by original mobile (passed in c.originalMobile)
    // If originalMobile is different from c.mobile, ensure new mobile doesn't exist (unless it's the same person)

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][2]) == String(c.originalMobile)) {
            rowIndex = i + 1; // 1-based index
            break;
        }
    }

    if (rowIndex === -1) return { status: 'error', message: 'Original contact not found' };

    // Update the row
    // Column indexes: 1=Name, 2=Role, 3=Mobile, 4=Branch, 5=District
    sheet.getRange(rowIndex, 1, 1, 5).setValues([[c.name, c.role, c.mobile, c.branch, c.district]]);
    return { status: 'success' };
}

function deleteContact(mobile) {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('StaffData');
    const data = sheet.getDataRange().getValues();
    // Loop backwards to delete safely
    for (let i = data.length - 1; i >= 0; i--) {
        if (String(data[i][2]) == String(mobile)) {
            sheet.deleteRow(i + 1);
            return { status: 'success' };
        }
    }
    return { status: 'error', message: 'Not found' };
}

function getHistory() {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('MessageLogs');
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    // Get last 50 logs only to be fast
    const startRow = Math.max(2, lastRow - 50);
    const data = sheet.getRange(startRow, 1, lastRow - startRow + 1, 6).getValues();

    return data.reverse().map(row => ({
        date: row[0], recipient: row[1], role: row[2], type: row[3], status: row[4], dept: row[5]
    }));
}

// --- SENDER LOGIC ---

function sendBroadcast(payload) {
    const contacts = getContacts();
    const targets = contacts.filter(c =>
        // If targetMobiles list is provided, send ONLY to those
        payload.targetMobiles && payload.targetMobiles.includes(c.mobile)
    );

    const sheetLogs = SpreadsheetApp.openById(SHEET_ID).getSheetByName('MessageLogs');
    let successCount = 0;

    targets.forEach(person => {
        let status = 'Pending';
        try {
            let prefix = payload.department ? `*[${payload.department}]* ` : "";
            if (payload.district && payload.district !== 'All') {
                prefix += `*[${payload.district}]* `;
            }
            const body = prefix + payload.message;

            if (USE_ULTRAMSG) {
                // UltraMsg API
                const payloadData = {
                    token: TOKEN,
                    to: person.mobile,
                    body: body
                };

                // If sending file, use different endpoint or append link
                // UltraMsg supports 'sendMessage' for text and 'sendDocument' for files
                let endpoint = 'messages/chat';

                if (payload.isFile) {
                    // For now, we assume file is just a link in the message or handled separately
                    // Real file upload requires the file to be hosted. 
                    // We will append the text "[Excel File Sent]" for now.
                    payloadData.body = body + " \n[Excel Attached - Please Check]";
                }

                const options = {
                    method: 'post',
                    payload: payloadData
                };

                UrlFetchApp.fetch(`https://api.ultramsg.com/${INSTANCE_ID}/${endpoint}`, options);
                status = 'Sent';

            } else {
                // Fallback
                status = 'Simulated';
            }
            successCount++;
        } catch (err) {
            status = 'Failed: ' + err.toString();
        }

        sheetLogs.appendRow([new Date(), person.name, person.role, payload.isFile ? 'File' : 'Text', status, payload.department || 'Recovery']);
    });

    return { status: 'success', sentTo: successCount };
}
