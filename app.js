// --- CONFIGURATION ---
// PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzvtNL5PKKPmSbclrnaOsZuoG9VZPxH66yGPXSHaRENiDXRXT1A-bq0lgyXvGQk1y1W/exec';

let contactsData = [];
let logsData = [];

// Navigation
function showSection(sectionId) {
    document.getElementById('send-msg-section').classList.add('hidden');
    document.getElementById('history-section').classList.add('hidden');
    document.getElementById('contacts-section').classList.add('hidden');

    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    const target = document.getElementById(sectionId + '-section');
    if (target) {
        target.classList.remove('hidden');
        if (sectionId === 'send-msg') document.querySelector('a[onclick*="send-msg"]').classList.add('active');
        if (sectionId === 'history') document.querySelector('a[onclick*="history"]').classList.add('active');
        if (sectionId === 'contacts') document.querySelector('a[onclick*="contacts"]').classList.add('active');
    }

    if (sectionId === 'contacts') fetchContacts();
    else if (sectionId === 'history') fetchHistory();
}

// --- DATA FETCHING ---

function fetchContacts() {
    const list = document.getElementById('contacts-list');

    if (SCRIPT_URL.includes('PASTE')) {
        list.innerHTML = '<p style="color:red">Error: Please set SCRIPT_URL in app.js</p>';
        return;
    }

    fetch(`${SCRIPT_URL}?action=getContacts`)
        .then(res => {
            if (!res.ok) throw new Error(`Server Error: ${res.status}`);
            return res.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    throw new Error("Invalid Server Response");
                }
            });
        })
        .then(data => {
            contactsData = data;
            renderContacts(data);
            populateRoles(data);
            // Refresh recipient list if on Send page
            if (!document.getElementById('send-msg-section').classList.contains('hidden')) {
                handlePropetaryGroupChange();
            }
        })
        .catch(err => {
            list.innerHTML = `<p style="color:red">Sync Failed: ${err.message}</p>`;
            console.error(err);
        });
}

function renderContacts(data) {
    const list = document.getElementById('contacts-list');
    if (data.length === 0) {
        list.innerHTML = '<p>No contacts found.</p>';
        return;
    }

    let html = '<table><thead><tr><th>Name</th><th>Role</th><th>Mobile</th><th>Branch</th><th>District</th><th>Action</th></tr></thead><tbody>';
    data.forEach(c => {
        // Escaping for safety inside onclick
        const contactStr = JSON.stringify(c).replace(/"/g, '&quot;');
        html += `<tr>
            <td>${c.name}</td>
            <td>${c.role}</td>
            <td>${c.mobile}</td>
            <td>${c.branch}</td>
            <td>${c.district || '-'}</td>
            <td>
                <button onclick="openEditContact(${contactStr})" style="background: #ffc107; color: #000; padding: 0.25rem 0.5rem; font-size: 0.8rem; margin-right: 0.5rem;">Edit</button>
                <button onclick="deleteContact('${c.mobile}')" style="background: #dc3545; padding: 0.25rem 0.5rem; font-size: 0.8rem;">Delete</button>
            </td>
        </tr>`;
    });
    html += '</tbody></table>';
    list.innerHTML = html;
}

function populateRoles(data) {
    const roles = [...new Set(data.map(c => c.role))].filter(r => r).sort();
    const select = document.getElementById('recipientType');
    const currentVal = select.value;

    // reset but keep "All"
    select.innerHTML = `<option value="">-- Select Group --</option>
                        <option value="all">All Staff</option>`;

    // Update Datalist for Add/Edit Form
    const roleList = document.getElementById('roleList');
    roleList.innerHTML = '';

    roles.forEach(role => {
        // Dropdown
        const opt = document.createElement('option');
        opt.value = role;
        opt.textContent = role;
        select.appendChild(opt);

        // Datalist
        const dlOpt = document.createElement('option');
        dlOpt.value = role;
        roleList.appendChild(dlOpt);
    });

    if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
        select.value = currentVal;
    }
}

// --- REVIEW LIST LOGIC ---

function handlePropetaryGroupChange() {
    const group = document.getElementById('recipientType').value;
    const container = document.getElementById('recipient-review-container');
    const list = document.getElementById('recipientReviewList');

    if (!group) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');

    // Filter contacts
    const filtered = group === 'all'
        ? contactsData
        : contactsData.filter(c => c.role === group);

    renderReviewList(filtered);
}

function renderReviewList(contacts) {
    const list = document.getElementById('recipientReviewList');
    list.innerHTML = '';

    if (contacts.length === 0) {
        list.innerHTML = '<p>No staff found in this group.</p>';
        updateSelectedCount();
        return;
    }

    contacts.forEach(c => {
        const div = document.createElement('div');
        div.className = 'review-item'; // uses new CSS

        const label = document.createElement('label');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = c.mobile;
        checkbox.checked = true; // Default checked
        checkbox.onchange = updateSelectedCount;
        checkbox.className = 'recipient-checkbox';

        const text = document.createTextNode(`${c.name} (${c.role}) ${c.district ? `[${c.district}]` : ''}`);

        label.appendChild(checkbox);
        label.appendChild(text);
        div.appendChild(label);

        list.appendChild(div);
    });

    updateSelectedCount();
}

function updateSelectedCount() {
    const total = document.querySelectorAll('.recipient-checkbox:checked').length;
    document.getElementById('selected-count').innerText = `${total} selected`;
}

// Search Filter
document.getElementById('recipientSearch').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.review-item');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(term) ? 'flex' : 'none';
    });
});

function selectAllRecipients(checked) {
    const items = document.querySelectorAll('.review-item');
    items.forEach(item => {
        // Check if the item is visible (not hidden by search)
        if (item.style.display !== 'none') {
            const cb = item.querySelector('.recipient-checkbox');
            if (cb) cb.checked = checked;
        }
    });
    updateSelectedCount();
}


// --- EDIT / ADD CONTACT ---

function openEditContact(contact) {
    document.getElementById('add-contact-form').classList.remove('hidden');
    document.getElementById('originalMobile').value = contact.mobile;
    document.getElementById('newMetricName').value = contact.name;
    document.getElementById('newMetricMobile').value = contact.mobile;
    document.getElementById('newMetricRole').value = contact.role;
    document.getElementById('newMetricBranch').value = contact.branch;
    document.getElementById('newMetricDistrict').value = contact.district || '';

    const btn = document.querySelector('#add-contact-form button[type="submit"]');
    btn.textContent = 'Update Contact';

    // Scroll to form
    document.getElementById('add-contact-form').scrollIntoView({ behavior: 'smooth' });
}

function toggleAddContact() {
    const form = document.getElementById('add-contact-form');
    form.classList.toggle('hidden');
    // Reset if opening fresh
    if (!form.classList.contains('hidden')) {
        document.getElementById('originalMobile').value = '';
        form.querySelector('form').reset();
        document.querySelector('#add-contact-form button[type="submit"]').textContent = 'Save New Contact';
    }
}

function saveNewContact(e) {
    e.preventDefault();

    const originalMobile = document.getElementById('originalMobile').value;
    const isEdit = !!originalMobile;

    const contact = {
        name: document.getElementById('newMetricName').value,
        role: document.getElementById('newMetricRole').value,
        mobile: document.getElementById('newMetricMobile').value,
        branch: document.getElementById('newMetricBranch').value,
        district: document.getElementById('newMetricDistrict').value,
        originalMobile: originalMobile
    };

    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = isEdit ? 'Updating...' : 'Saving...';
    btn.disabled = true;

    const action = isEdit ? 'editContact' : 'addContact';

    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: action, contact: contact })
    })
        .then(res => res.json())
        .then(resp => {
            if (resp.status === 'success') {
                alert(isEdit ? 'Contact Updated!' : 'Contact Saved!');
                toggleAddContact(); // Close form
                fetchContacts(); // Reload list
            } else {
                alert('Error: ' + resp.message);
            }
        })
        .catch(err => {
            alert('Request sent (Check Sheet)');
            fetchContacts();
        })
        .finally(() => {
            btn.textContent = isEdit ? 'Update Contact' : 'Save Contact';
            btn.disabled = false;
        });
}


// --- OTHER ---

function fetchHistory() {
    const tbody = document.getElementById('statusTableBody');
    if (SCRIPT_URL.includes('PASTE')) return;

    fetch(`${SCRIPT_URL}?action=getHistory`)
        .then(res => res.json())
        .then(data => {
            logsData = data;
            renderHistory(data);
            updateStats();
        })
        .catch(err => console.error(err));
}

function renderHistory(data) {
    const tbody = document.getElementById('statusTableBody');
    tbody.innerHTML = '';

    data.forEach(log => {
        const tr = document.createElement('tr');
        let statusClass = 'badge-warning';
        if (log.status.includes('Sent')) statusClass = 'badge-success';
        if (log.status.includes('Failed')) statusClass = 'badge-danger';

        tr.innerHTML = `
            <td>${new Date(log.date).toLocaleString()}</td>
            <td>${log.recipient}</td>
            <td>${log.type}</td>
            <td>${log.dept ? `<b>[${log.dept}]</b> ` : ''}${log.status.includes('File') ? '[File] ' : ''}${log.dept ? '' : log.recipient}</td>
            <td><span class="badge ${statusClass}">${log.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function updateStats() {
    if (!logsData.length) return;
    const total = logsData.length;
    const delivered = logsData.filter(l => l.status.includes('Sent')).length;
    const failed = logsData.filter(l => l.status.includes('Failed')).length;

    animateValue("stat-total", 0, total, 1000);
    animateValue("stat-delivered", 0, delivered, 1000);
    animateValue("stat-failed", 0, failed, 1000);
}

function deleteContact(mobile) {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'deleteContact', mobile: mobile })
    })
        .then(() => {
            alert('Deleted');
            fetchContacts();
        });
}

function toggleOtherDept() {
    const val = document.getElementById('senderDept').value;
    const group = document.getElementById('other-dept-group');
    if (val === 'Other') group.classList.remove('hidden');
    else group.classList.add('hidden');
}



function toggleFileInput() {
    const type = document.getElementById('messageType').value;
    const fileGroup = document.getElementById('file-input-group');
    const textGroup = document.getElementById('text-input-group');

    if (type === 'file') {
        fileGroup.classList.remove('hidden');
        textGroup.classList.add('hidden');
    } else {
        fileGroup.classList.add('hidden');
        textGroup.classList.remove('hidden');
    }
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// Login
// Login
// Logout
function logout() {
    window.location.href = 'index.html';
}

// Main Send Logic
const sendForm = document.getElementById('sendForm');
if (sendForm) {
    sendForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (SCRIPT_URL.includes('PASTE')) {
            alert("Please paste your Web App URL in app.js");
            return;
        }

        // Gather Targets
        const checkboxes = document.querySelectorAll('.recipient-checkbox:checked');
        if (checkboxes.length === 0) {
            alert("Please select at least one recipient.");
            return;
        }

        const targetMobiles = Array.from(checkboxes).map(cb => cb.value);

        const btn = document.getElementById('sendBtn');
        const originalText = btn.textContent;
        btn.textContent = `Sending to ${targetMobiles.length}...`;
        btn.disabled = true;

        const deptSelect = document.getElementById('senderDept').value;
        const dept = deptSelect === 'Other' ? document.getElementById('otherDeptInput').value : deptSelect;

        const type = document.getElementById('messageType').value;
        const content = document.getElementById('messageBody').value;

        const payload = {
            action: 'sendMessage',
            recipientType: document.getElementById('recipientType').value, // kept for log reference
            targetMobiles: targetMobiles,
            message: content,
            department: dept,
            isFile: type === 'file'
        };

        fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(resp => {
                alert(`Sent to ${resp.sentTo} people!`);
                sendForm.reset();
                // Reset UI
                handlePropetaryGroupChange();
                showSection('history');
                setTimeout(fetchHistory, 1000);
            })
            .catch(err => {
                console.error(err);
                alert("Request sent (Check logs)");
                sendForm.reset();
                showSection('history');
                setTimeout(fetchHistory, 1000);
            })
            .finally(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            });
    });

    // Initial Load - Delay to ensure DOM ready? No, standard call.
    fetchHistory();
}
