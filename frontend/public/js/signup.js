document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('signupForm');
    
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const userData = Object.fromEntries(formData.entries());
        
        // Convert skills to an array
        userData.skills = userData.skills.split(',').map(skill => skill.trim());
        
        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Sign up successful! Please log in.');
                window.location.href = '/login.html';
            } else {
                // Display error message
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = data.message || 'An error occurred during sign up.';
                form.insertBefore(errorMessage, form.firstChild);
            }
        } catch (error) {
            console.error('Sign up error:', error);
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'An error occurred. Please try again.';
            form.insertBefore(errorMessage, form.firstChild);
        }
    });
});