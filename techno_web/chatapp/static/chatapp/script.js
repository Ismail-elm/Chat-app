
window.addEventListener('DOMContentLoaded', () => {
    const messagesDiv = document.getElementById('messages');

    function scrollToBottom() {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    scrollToBottom(); // scroll initial

    const form = document.getElementById('text-area');
    form.addEventListener('submit', () => {
        setTimeout(scrollToBottom, 100);
    });
});
