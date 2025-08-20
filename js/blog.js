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

const postsContainer = document.getElementById('posts-list');

async function loadAllPosts() {
    if (!postsContainer) return;

    try {
        const postsQuery = query(collection(db, 'posts'), orderBy('publishedAt', 'desc'));
        const postsSnapshot = await getDocs(postsQuery);

        if (postsSnapshot.empty) {
            postsContainer.innerHTML = '<p>No posts found yet.</p>';
            return;
        }

        postsSnapshot.forEach(doc => {
            const post = doc.data();
            const postElement = document.createElement('a');
            postElement.className = 'post-note-item';
            postElement.href = "#";

            postElement.innerHTML = `
                <img src="${post.coverImageUrl || 'assets/sampleimage.webp'}" alt="${post.title}" class="post-note-thumbnail">
                <div class="post-note-content">
                    <h4 class="post-note-title">${post.title}</h4>
                    <p class="post-note-summary">${post.summary}</p>
                </div>
            `;
            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error("Error loading posts:", error);
        postsContainer.innerHTML = '<p>Could not load posts.</p>';
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
loadAllPosts();