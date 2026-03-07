document.addEventListener("DOMContentLoaded", function() {
    const content = document.getElementById("content");
    
    async function loadPage(pageName) {
        try {
            // Fetch HTML file
            const response = await fetch(`views/${pageName}.html`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            content.innerHTML = html;
            
        } catch (error) {
            console.error("Page error:", error);
            content.innerHTML = `<p>Page error</p>`;
        }
    }

    const sidebarLinks = document.querySelectorAll("#sidebar a");

    sidebarLinks.forEach(function(link) {
        link.addEventListener("click", function(event) {
            event.preventDefault();
            
            const pageName = this.dataset.page;
            
            if (pageName) {
                loadPage(pageName);
                sidebarLinks.forEach(l => {
                    const menuItem = l.querySelector('.menu-item');
                    if (menuItem) {
                        menuItem.classList.remove('active');
                    }
                });

                const clickedMenuItem = this.querySelector('.menu-item');
                if (clickedMenuItem) {
                    clickedMenuItem.classList.add('active');
                }
            }
        });
    });

    loadPage("dashboard");
});