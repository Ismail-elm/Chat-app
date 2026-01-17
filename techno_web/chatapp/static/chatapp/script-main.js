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