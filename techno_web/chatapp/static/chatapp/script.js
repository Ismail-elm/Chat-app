// Globals
let salonId = null;
let messagesDiv = null;
let memberElements = null;
let lastMessageId = 0;

window.addEventListener('DOMContentLoaded', () => {
    // Elements principaux
    messagesDiv = document.getElementById('messages');
    const messagesListDiv = document.getElementById('messages-list');
    salonId = messagesListDiv.dataset.salonId;

    // Initialize lastMessageId from existing messages
    const messageElements = document.querySelectorAll('#messages-list .message');
    messageElements.forEach(msg => {
        const id = parseInt(msg.dataset.id);
        if (id > lastMessageId) lastMessageId = id;
    });

    // **CRITICAL: Initialize data-id for ALL existing salon elements**
    const existingSalons = document.querySelectorAll('#salons-list a');
    console.log('Found existing salons:', existingSalons.length);
    
    existingSalons.forEach(el => {
        const match = el.href.match(/\/(\d+)\//);
        if (match && !el.dataset.id) {
            el.dataset.id = match[1];
            console.log('Set data-id:', match[1], 'for salon:', el.textContent.trim());
        }
    });

    // Scroll initial
    scrollToBottom();

    // Scroll après envoi de message
    const form = document.getElementById('text-area');
    form.addEventListener('submit', (e) => {
        setTimeout(scrollToBottom, 100);
    });

    // Emoji picker code...
    const emojiIcon = document.querySelector('.emoji-icon');
    const messageInput = document.querySelector('input[name="my_message"]');
    // ... all your emoji picker code ...

    // Hide emoji picker when clicking outside
    document.addEventListener('click', (e) => {
        if (!emojiIcon.contains(e.target) && !emojiPicker.contains(e.target)) {
            emojiPicker.style.display = 'none';
        }
    });

    // ========================================
    // ADD THE MODAL CODE HERE - BEFORE THE INTERVALS
    // ========================================
    
    // Member removal confirmation modal
    let formToSubmit = null;

    const modal = document.getElementById('remove-member-modal');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');
    const memberUsernameSpan = document.getElementById('member-username');

    // Intercept all remove member form submissions
    document.addEventListener('submit', (e) => {
        if (e.target.classList.contains('remove-member-form')) {
            e.preventDefault();
            
            // Get username from data attribute
            const username = e.target.dataset.username;
            
            // Update modal with username
            memberUsernameSpan.textContent = username;
            
            // Store the form reference
            formToSubmit = e.target;
            
            // Show modal
            modal.classList.add('show');
        }
    });

    modalConfirm.addEventListener('click', () => {
        if (formToSubmit) {
            formToSubmit.submit();
            formToSubmit = null;
        }
        modal.classList.remove('show');
    });

    modalCancel.addEventListener('click', () => {
        formToSubmit = null;
        modal.classList.remove('show');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            formToSubmit = null;
            modal.classList.remove('show');
        }
    });

    // ========================================
    // END OF MODAL CODE
    // ========================================

    // launch message loading loop
    setInterval(loadMessages, 1000);
    // launch member loading loop
    setInterval(loadMembers, 1000);
    // launch salon loading loop
    setInterval(loadSalons, 1000);
}); 

// Scroll to bottom
function scrollToBottom() {
    if (!messagesDiv) return;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// load new messages from server
function loadMessages() {
    if (!salonId) return;

    // Fetch ALL messages to detect deletions
    fetch(`/messages/${salonId}/`)
        .then(res => {
            if (!res.ok) throw new Error("Erreur HTTP " + res.status);
            return res.json();
        })
        .then(data => {
            const box = document.getElementById("messages-list");

            // Build server messages map
            const serverMessages = {};
            data.forEach(msg => {
                serverMessages[msg.id] = msg;
            });

            // Build DOM messages map
            const domMessages = {};
            document.querySelectorAll('#messages-list .message').forEach(el => {
                domMessages[el.dataset.id] = el;
            });

            // Add new messages
            data.forEach(message => {
                if (!domMessages[message.id]) {
                    const div = document.createElement("div");
                    div.className = `message ${message.is_me ? "me" : "other"}`;
                    div.dataset.id = message.id;
                    div.innerHTML = `
                        ${message.can_delete ? `
                        <form method="post" class="remove-message-form">
                            <input type="hidden" name="remove_message" value="${message.id}">
                            <button type="submit" class="message-delete-btn">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </form>` : ""}
                        <div class="message-header">
                            <span class="username">${message.username}</span>
                        </div>
                        <p class="message-text">${message.text}</p>
                        <span class="time">${message.time}</span>
                    `;
                    box.appendChild(div);
                    
                    // Update lastMessageId
                    lastMessageId = Math.max(lastMessageId, message.id);
                    
                    // Scroll to new message
                    scrollToBottom();
                }
            });

            // Remove deleted messages
            Object.keys(domMessages).forEach(id => {
                if (!serverMessages[id]) {
                    domMessages[id].remove();
                }
            });
        })
        .catch(err => console.error("Erreur loadMessages:", err));
}
// load members from server
function loadMembers() {
    if (!salonId) return;

    fetch(`/members/${salonId}/`)
        .then(res => {
            if (!res.ok) throw new Error("Erreur HTTP " + res.status);
            return res.json();
        })
        .then(data => {
            const box = document.getElementById("members-list");

            // Build DOM members map
            const domMembers = {};
            document.querySelectorAll('#members-list .member-item').forEach(el => {
                domMembers[el.dataset.id] = el;
            });

            // Add new members if they don't exist in DOM
            data.forEach(member => {
                if (!domMembers[member.id]) {
                    const div = document.createElement("div");
                    div.className = `member-item ${member.is_me ? "member-focused" : ""}`;
                    div.dataset.id = member.id;
                    div.innerHTML = `
                        <p>${member.is_creator ? "👑" : "👤"} ${member.username_text} ${member.is_me ? "(Vous)" : ""}</p>
                        ${member.can_remove ? `
                            <form method="post" class="remove-member-form">
                                <input type="hidden" name="remove_member" value="${member.id}">
                                <input type="submit" value="🚫" name="Remove_member" class="btn remove-btn">
                            </form>` : ""}
                    `;
                    box.appendChild(div);
                }
            });

            // Remove members not in server response
            Object.keys(domMembers).forEach(id => {
                if (!data.find(member => member.id == id)) {
                    domMembers[id].remove();
                }
            });
        })
        .catch(err => console.error("Erreur loadMembers:", err));
}

function loadSalons() {
    fetch(`/salons/`)
        .then(res => {
            if (!res.ok) throw new Error("Erreur HTTP " + res.status);
            return res.json();
        })
        .then(data => {
            const box = document.getElementById("salons-list");
            const username = box.dataset.username;
            
            // Get current salon ID from messages-list (the salon we're currently viewing)
            const currentSalonId = document.getElementById('messages-list')?.dataset.salonId;

            // Build DOM salons map
            const domSalons = {};
            document.querySelectorAll('#salons-list a[data-id]').forEach(el => {
                domSalons[el.dataset.id] = el;
            });

            // Add new salons if they don't exist in DOM
            data.forEach((salon, index) => {
                const idStr = salon.id.toString();
                const isFocused = idStr === currentSalonId;
                
                if (!domSalons[idStr]) {
                    // Create new salon element
                    const a = document.createElement("a");
                    a.href = `/main/${username}/${salon.id}/`;
                    a.className = `salon-item ${isFocused ? "focused-salon" : ""}`;
                    a.dataset.id = idStr;
                    a.innerHTML = `
                        <p>${salon.salon_name} ${salon.is_me_creator ? "<span style='color: red;'>(Owner)</span>" : "<span style='color: green;'>(Invited)</span>"}</p>
                        <p>${salon.created_at}</p>
                    `;
                    
                    // Insert at the correct position based on server order
                    if (index === 0) {
                        box.prepend(a); // Add to top for most recent
                    } else {
                        // Find the previous salon in the server data and insert after it
                        const prevSalonId = data[index - 1].id.toString();
                        const prevElement = domSalons[prevSalonId];
                        if (prevElement && prevElement.nextSibling) {
                            box.insertBefore(a, prevElement.nextSibling);
                        } else if (prevElement) {
                            prevElement.after(a);
                        } else {
                            box.prepend(a); // Fallback to prepend
                        }
                    }
                } else {
                    // Update focus for existing salon
                    if (isFocused) {
                        domSalons[idStr].classList.add("focused-salon");
                    } else {
                        domSalons[idStr].classList.remove("focused-salon");
                    }
                }
            });

            // Remove salons not in server response
            Object.keys(domSalons).forEach(id => {
                if (!data.find(salon => salon.id.toString() === id)) {
                    domSalons[id].remove();
                }
            });
        })
        .catch(err => console.error("Erreur loadSalons:", err));
}