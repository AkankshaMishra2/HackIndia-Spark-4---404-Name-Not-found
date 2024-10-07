document.addEventListener('DOMContentLoaded', function() {
    const profileDropdown = document.getElementById('profileDropdown');
    const profileButton = document.getElementById('profileButton');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const logoutBtn = document.getElementById('logoutBtn');
    const signUpBtn = document.getElementById('signUpBtn');
    const loginBtn = document.getElementById('loginBtn');

    if (!profileDropdown || !profileButton || !profileName || !profileEmail || !logoutBtn || !signUpBtn || !loginBtn) {
        console.error('One or more elements are missing in the DOM');
        return;
    }

    async function fetchUserData() {
        try {
            const response = await fetch('/api/user/profile', {
                method: 'GET',
                credentials: 'include' // This is important for including cookies in the request
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

    async function updateProfileDropdown() {
        const userData = await fetchUserData();
        if (userData) {
            profileName.textContent = userData.name;
            profileEmail.textContent = userData.email;
            profileDropdown.style.display = 'block';
            signUpBtn.style.display = 'none';
            loginBtn.style.display = 'none';
        } else {
            profileDropdown.style.display = 'none';
            signUpBtn.style.display = 'inline-block';
            loginBtn.style.display = 'inline-block';
        }
    }

    updateProfileDropdown();

    profileButton.addEventListener('click', function() {
        const dropdownContent = profileButton.nextElementSibling;
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
                updateProfileDropdown();
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    });
});