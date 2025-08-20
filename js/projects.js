import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAy8bC4VPqwOajedDs-vLldSoKDjcJVZd0",
    authDomain: "myportfolio-aadishhere.firebaseapp.com",
    projectId: "myportfolio-aadishhere",
    storageBucket: "myportfolio-aadishhere.appspot.com",
    messagingSenderId: "483800227478",
    appId: "1:483800227478:web:994bda2c2d41a7377eecb7"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const projectsGrid = document.getElementById('projects-grid');

async function loadAllProjects() {
    if (!projectsGrid) return;

    try {
        const projectsQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        const projectsSnapshot = await getDocs(projectsQuery);

        if (projectsSnapshot.empty) {
            projectsGrid.innerHTML = '<p>No projects found yet. Stay tuned!</p>';
            return;
        }

        projectsSnapshot.forEach(doc => {
            const project = doc.data();
            const tagsHTML = project.tags.map(tag => `<span class="tech-tag">${tag}</span>`).join('');

            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <img src="${project.imageUrl || 'assets/sampleimage.webp'}" alt="${project.title}" class="project-thumbnail">
                <div class="project-info">
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-description">${project.description}</p>
                    <div class="project-tags">${tagsHTML}</div>
                    <a href="${project.sourceUrl}" target="_blank" class="project-link-button">
                        <i class="fa-brands fa-github"></i> View Source
                    </a>
                </div>
            `;
            projectsGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading projects:", error);
        projectsGrid.innerHTML = '<p>Could not load projects at this time.</p>';
    }
}

const themeIcon = document.querySelector('.theme-icon');
const body = document.body;

function setInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        body.classList.remove('dark-mode');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
}

themeIcon.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

    if (isDarkMode) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
});

setInitialTheme();
loadAllProjects();