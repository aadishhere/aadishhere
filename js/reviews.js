import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore.js";

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

const dynamicIsland = document.getElementById('dynamic-island');
let currentIslandState = 'initial';

function setIslandState(newState) {
    if (currentIslandState === newState) return;
    currentIslandState = newState;

    dynamicIsland.classList.remove('expanded', 'showing-review-submitted');

    if (newState !== 'initial') {
        dynamicIsland.classList.add('expanded', `showing-${newState}`);
    }
}

const form = document.getElementById('review-form');
const formMessage = document.getElementById('form-message');
const submitButton = form.querySelector('.submit-btn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
    
    try {
        await addDoc(collection(db, "reviews"), {
            name: form.name.value,
            email: form.email.value,
            message: form.message.value,
            createdAt: new Date()
        });
        
        form.reset();
        formMessage.textContent = "";
        
        setIslandState('review-submitted');
        
        setTimeout(() => {
            setIslandState('initial');
        }, 4000);

    } catch (error) {
        console.error("Error adding document: ", error);
        formMessage.textContent = "Something went wrong. Please try again.";
        formMessage.style.color = "red";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Review";
    }
});

const reviewsContainer = document.getElementById('reviews-container');

async function displayReviews() {
    const reviewsQuery = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    reviewsSnapshot.forEach((doc) => {
        const review = doc.data();
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `<p>${review.message}</p><strong>- ${review.name}</strong>`;
        reviewsContainer.appendChild(card);
    });
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
displayReviews();