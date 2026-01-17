window.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const username = body.dataset.username;
    const salonId = parseInt(window.location.pathname.split('/')[3]); // /main/username/salonId
    const isCreator = body.dataset.isCreator === 'true';

    const messagesDiv = document.getElementById('messages');
    const membersDiv = document.getElementById('members-list');

    function scrollToBottom() {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    scrollToBottom();

    // Function to fetch chat data
    function fetchChatData() {
        fetch(`/chat/${salonId}/data/`)
            .then(res => res.json())
            .then(data => {
                if (data.salon_deleted) {
                    alert("This salon has been deleted.");
                    window.location.href = `/main/${username}/`;
                    return;
                }
                if (!data.is_member) {
                    alert("You have been removed from this salon.");
                    window.location.href = `/main/${username}/`;
                    return;
                }

                // Update messages
                updateMessages(data.messages);

                // Update members
                updateMembers(data.members);
            })
            .catch(err => console.error("Failed to fetch chat data:", err));
    }

    function updateMessages(messages) {
        messagesDiv.innerHTML = "";
        if (messages.length === 0) {
            messagesDiv.innerHTML = '<p class="no-messages">Aucun message pour le moment. Envoyez le premier !</p>';
        } else {
            messages.forEach(msg => {
                const isMe = msg.user === username;
                const messageClass = isMe ? "me" : "other";
                let deleteBtn = "";
                if (isMe || isCreator) {
                    deleteBtn = `<button class="message-delete-btn" data-message-id="${msg.id}" title="Delete message">
                        <i class="fas fa-trash-alt"></i>
                    </button>`;
                }
                messagesDiv.innerHTML += `
                    <div class="message ${messageClass}">
                        ${deleteBtn}
                        <div class="message-header">
                            <span class="username">${msg.user}</span>
                        </div>
                        <p class="message-text">${msg.text}</p>
                        <span class="time">${msg.time}</span>
                    </div>
                `;
            });
        }
        scrollToBottom();
    }

    function updateMembers(members) {
        // Keep the header and forms, update only the member items
        const header = membersDiv.querySelector('.section-title');
        const forms = membersDiv.querySelectorAll('form');
        membersDiv.innerHTML = '';
        membersDiv.appendChild(header);
        forms.forEach(form => membersDiv.appendChild(form));

        members.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.className = 'member-item';
            let icon = member.is_creator ? '👑' : '👤';
            let extra = member.username === username ? ' (Vous)' : '';
            memberDiv.innerHTML = `<p>${icon} ${member.username}${extra}</p>`;
            if (isCreator && !member.is_creator) {
                memberDiv.innerHTML += `
                    <button class="btn remove-btn" data-member-id="${member.id}">🚫</button>
                `;
            }
            membersDiv.appendChild(memberDiv);
        });
    }

    // Send message via AJAX
    const input = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
    sendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        fetch("", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-CSRFToken": csrfToken
            },
            body: `send_message=1&my_message=${encodeURIComponent(text)}&csrfmiddlewaretoken=${csrfToken}`
        }).then(() => {
            input.value = "";
            fetchChatData(); // Update immediately
        }).catch(err => console.error("Failed to send message:", err));
    });

    // Delete message via AJAX
    messagesDiv.addEventListener('click', (e) => {
        if (e.target.closest('.message-delete-btn')) {
            e.preventDefault();
            const btn = e.target.closest('.message-delete-btn');
            const messageId = btn.dataset.messageId;

            fetch("", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-CSRFToken": csrfToken
                },
                body: `Remove_message=1&remove_message=${messageId}&csrfmiddlewaretoken=${csrfToken}`
            }).then(() => {
                fetchChatData(); // Update after delete
            }).catch(err => console.error("Failed to delete message:", err));
        }
    });

    // Add member via AJAX (event delegation)
    membersDiv.addEventListener('submit', (e) => {
        if (e.target.classList.contains('add-member-form')) {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            formData.append('csrfmiddlewaretoken', csrfToken);

            fetch("", {
                method: "POST",
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    "X-CSRFToken": csrfToken
                },
                body: formData
            }).then(response => response.json()).then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    form.reset();
                    fetchChatData(); // Update members
                }
            }).catch(err => console.error("Failed to add member:", err));
        }
    });

    // Remove member via AJAX
    membersDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            e.preventDefault();
            const memberId = e.target.dataset.memberId;

            fetch("", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-CSRFToken": csrfToken
                },
                body: `Remove_member=1&remove_member=${memberId}&csrfmiddlewaretoken=${csrfToken}`
            }).then(() => {
                fetchChatData(); // Update members
            }).catch(err => console.error("Failed to remove member:", err));
        }
    });

    // Leave salon via AJAX
    const leaveBtn = document.querySelector('input[name="leave_salon"]');
    if (leaveBtn) {
        leaveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fetch("", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-CSRFToken": csrfToken
                },
                body: `leave_salon=1&csrfmiddlewaretoken=${csrfToken}`
            }).then(() => {
                window.location.href = `/main/${username}/`;
            }).catch(err => console.error("Failed to leave salon:", err));
        });
    }

    // Delete salon via AJAX
    const deleteBtn = document.querySelector('input[name="delete_salon"]');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fetch("", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-CSRFToken": csrfToken
                },
                body: `delete_salon=1&csrfmiddlewaretoken=${csrfToken}`
            }).then(() => {
                window.location.href = `/main/${username}/`;
            }).catch(err => console.error("Failed to delete salon:", err));
        });
    }

    // Poll every 2 seconds
    setInterval(fetchChatData, 2000);
    fetchChatData(); // Initial fetch
});