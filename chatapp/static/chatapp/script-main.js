// Dark Mode Implementation with Cookie Storage
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const htmlElement = document.documentElement;

// Cookie helper functions
function setCookie(name, value, days = 365) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function setTheme(theme) {
    if (theme === 'dark') {
        htmlElement.setAttribute('data-theme', 'dark');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        htmlElement.removeAttribute('data-theme');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
    // Save to cookie
    setCookie('theme', theme);
}

// Load saved theme from cookie on page load
const savedTheme = getCookie('theme');
if (savedTheme) {
    setTheme(savedTheme);
} else {
    setTheme('light');
}

// Toggle theme on button click
themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
});

window.addEventListener('DOMContentLoaded', () => {
    // Initialize data-id for existing salon elements
    const existingSalons = document.querySelectorAll('#salons-list a');
    
    existingSalons.forEach(el => {
        // Extract salon ID from href like /main/username/123/
        const match = el.href.match(/\/main\/[^\/]+\/(\d+)\//);
        if (match && !el.dataset.id) {
            el.dataset.id = match[1];
        }
    });

    // Launch salon loading loop
    setInterval(loadSalons, 1000);
});

function loadSalons() {
    fetch(`/salons/`)
        .then(res => {
            if (!res.ok) throw new Error("Erreur HTTP " + res.status);
            return res.json();
        })
        .then(data => {
            const box = document.getElementById("salons-list");
            const username = box.dataset.username;

            // Build DOM salons map
            const domSalons = {};
            document.querySelectorAll('#salons-list a[data-id]').forEach(el => {
                domSalons[el.dataset.id] = el;
            });

            // Add new salons if they don't exist in DOM
            data.forEach((salon, index) => {
                const idStr = salon.id.toString();
                
                if (!domSalons[idStr]) {
                    // Create new salon element
                    const a = document.createElement("a");
                    a.href = `/main/${username}/${salon.id}/`;
                    a.className = "salon-item";
                    a.dataset.id = idStr;
                    
                    // Add owner/invited label
                    const ownerLabel = salon.is_me_creator 
                        ? '<span style="color: red;">(Owner)</span>' 
                        : '<span style="color: green;">(Invited)</span>';
                    
                    a.innerHTML = `
                        <p>${salon.salon_name} ${ownerLabel}</p>
                        <p>${salon.created_at}</p>
                    `;
                    
                    // Insert at the correct position based on server order
                    if (index === 0) {
                        box.prepend(a);
                    } else {
                        const prevSalonId = data[index - 1].id.toString();
                        const prevElement = domSalons[prevSalonId];
                        if (prevElement && prevElement.nextSibling) {
                            box.insertBefore(a, prevElement.nextSibling);
                        } else if (prevElement) {
                            prevElement.after(a);
                        } else {
                            box.prepend(a);
                        }
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