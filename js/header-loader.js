// Load common header into all pages
async function loadHeader() {
    try {
        const response = await fetch('header.html');
        const headerContent = await response.text();
        
        // Extract the head content (meta tags, styles)
        const headMatch = headerContent.match(/<head>([\s\S]*?)<\/head>/i);
        if (headMatch) {
            const headContent = headMatch[1];
            // Append head content to document head
            const parser = new DOMParser();
            const headFragment = parser.parseFromString('<head>' + headContent + '</head>', 'text/html').head;
            
            // Only append styles, not duplicate meta tags
            Array.from(headFragment.querySelectorAll('style')).forEach(style => {
                document.head.appendChild(style.cloneNode(true));
            });
        }
        
        // Extract the navbar content
        const navMatch = headerContent.match(/<nav[\s\S]*?<\/nav>/i);
        if (navMatch) {
            const navContent = navMatch[0];
            // Insert navbar at the beginning of body
            const navContainer = document.createElement('div');
            navContainer.innerHTML = navContent;
            document.body.insertBefore(navContainer.firstElementChild, document.body.firstChild);
        }
        
        // Load dark mode script
        loadDarkModeToggle();
        
    } catch (error) {
        console.error('Error loading header:', error);
    }
}

// Dark mode toggle functionality
function loadDarkModeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="bi bi-sun-fill dark-mode-icon"></i>';
    }
    
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        themeToggle.innerHTML = isDark 
            ? '<i class="bi bi-sun-fill dark-mode-icon"></i>' 
            : '<i class="bi bi-moon-fill dark-mode-icon"></i>';
    });
}

// Load header when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
} else {
    loadHeader();
}
