// profile-circle.js
document.addEventListener('DOMContentLoaded', function() {
    const profileDropdown = document.getElementById('profileDropdown');
    const profileCircle = document.getElementById('profileCircle');
    const signUpBtn = document.getElementById('signUpBtn');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    async function fetchUserData() {
        try {
            const response = await fetch('/api/user/profile', {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const userData = await response.json();
                return userData.user;
            } else {
                console.error('Failed to fetch user data');
                return null;
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }

    async function updateProfileCircle() {
        const userData = await fetchUserData();
        if (userData) {
            profileCircle.textContent = userData.name.charAt(0).toUpperCase();
            profileDropdown.style.display = 'inline-block';
            signUpBtn.style.display = 'none';
            loginBtn.style.display = 'none';
        } else {
            profileDropdown.style.display = 'none';
            signUpBtn.style.display = 'inline-block';
            loginBtn.style.display = 'inline-block';
        }
    }

    updateProfileCircle();

    profileCircle.addEventListener('click', function() {
        const dropdownContent = profileCircle.nextElementSibling;
        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
    });

    logoutBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                window.location.href = '/index.html';
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    });

    // Close the dropdown when clicking outside
    window.addEventListener('click', function(event) {
        if (!event.target.matches('.profile-circle')) {
            const dropdowns = document.getElementsByClassName("dropdown-content");
            for (let i = 0; i < dropdowns.length; i++) {
                const openDropdown = dropdowns[i];
                if (openDropdown.style.display === 'block') {
                    openDropdown.style.display = 'none';
                }
            }
        }
    });
});