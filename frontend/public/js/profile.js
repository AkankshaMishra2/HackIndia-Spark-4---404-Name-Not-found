document.addEventListener("DOMContentLoaded", function() {
    function fetchUserProfile() {
        fetch('/api/user/profile', {
            method: 'GET',
            credentials: 'include' // This is important for including cookies in the request
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized');
                }
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.user) {
                updateProfileUI(data.user);
            } else {
                throw new Error('User data not found');
            }
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
            if (error.message === 'Unauthorized') {
                showLoginPrompt();
            } else {
                showErrorMessage('An error occurred while fetching your profile. Please try again later.');
            }
        });
    }

    function updateProfileUI(user) {
        document.getElementById('profileName').textContent = user.name || 'N/A';
        document.getElementById('profileEmail').textContent = user.email || 'N/A';
        document.getElementById('profileTier').textContent = user.tier || 'N/A';
        document.getElementById('profileSkills').textContent = user.skills ? user.skills.join(', ') : 'N/A';
        document.getElementById('profileExperience').textContent = user.experience || 'N/A';
        document.getElementById('profileBio').textContent = user.bio || 'No bio available';
        
        // Show the profile container
        document.querySelector('.profile-container').style.display = 'block';
    }

    function showLoginPrompt() {
        const profileContainer = document.querySelector('.profile-container');
        profileContainer.innerHTML = `
            <div class="login-prompt">
                <h2>Please Log In</h2>
                <p>You need to be logged in to view your profile.</p>
                <a href="login.html" class="button">Log In</a>
            </div>
        `;
        profileContainer.style.display = 'block';
    }

    function showErrorMessage(message) {
        const profileContainer = document.querySelector('.profile-container');
        profileContainer.innerHTML = `
            <div class="error-message">
                <h2>Error</h2>
                <p>${message}</p>
                <a href="index.html" class="button">Return to Home</a>
            </div>
        `;
        profileContainer.style.display = 'block';
    }

    fetchUserProfile();
});