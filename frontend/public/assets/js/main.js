document.addEventListener("DOMContentLoaded", function() {
  // Add the Solana Web3.js script
  const solanaScript = document.createElement('script');
  solanaScript.src = 'https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js';
  solanaScript.onload = function() {
    window.Buffer = solanaWeb3.Buffer;
  };
  document.head.appendChild(solanaScript);

  // Navigation menu toggle
  const navMenu = document.getElementById("nav-menu");
  const navToggle = document.getElementById("nav-toggle");

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.toggle("show-menu");
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Profile rendering and filtering
  const profilesContainer = document.getElementById('profilesContainer');
  const profileSearch = document.getElementById('profileSearch');
  const categoryButtons = document.querySelectorAll('.category-btn');

  let profiles = [];
  let isLoggedIn = false;

  async function checkLoginStatus() {
    try {
      const response = await fetch('/api/user/check-login', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        isLoggedIn = data.isLoggedIn;
        updateUIForLoginStatus();
      } else {
        console.error('Failed to check login status');
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  }

  function updateUIForLoginStatus() {
    const connectWalletButton = document.getElementById('connectWallet');
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');

    if (isLoggedIn) {
      if (connectWalletButton) connectWalletButton.style.display = 'block';
      if (loginButton) loginButton.style.display = 'none';
      if (logoutButton) logoutButton.style.display = 'block';
    } else {
      if (connectWalletButton) connectWalletButton.style.display = 'none';
      if (loginButton) loginButton.style.display = 'block';
      if (logoutButton) logoutButton.style.display = 'none';
    }

    // Update profile cards
    document.querySelectorAll('.profile-card').forEach(card => {
      const sendTokensButton = card.querySelector('.btn-send-tokens');
      if (sendTokensButton) {
        sendTokensButton.disabled = !isLoggedIn;
      }
    });
  }

  async function fetchProfiles() {
    try {
      const response = await fetch('/api/profiles', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }

      profiles = await response.json();
      renderProfiles(profiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      profilesContainer.innerHTML = '<p>Error loading profiles. Please try again later.</p>';
    }
  }



  // ************************ Fetch Wallet Addresses: Anushi ************************************************
  function createProfileCard(profile) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.dataset.userid = profile._id;
    card.innerHTML = `
      <img src="${profile.image || '/placeholder.svg?height=100&width=100'}" alt="${profile.name}" class="profile-image">
      <h3>${profile.name}</h3>
      <p>${profile.skills.join(', ')}</p>
      <p>${profile.college || 'Not specified'}</p>
      <span class="tier ${profile.tier.toLowerCase()}">${profile.tier}</span>
      <p class="token-count">Token Count: <span id="tokenCount-${profile._id}">${profile.tokenCount || 0}</span></p>
      
      <!-- Wallet Address Section -->
      <div class="wallet-address-section">
        <p>Wallet Address: <span id="walletAddress-${profile._id}">${profile.walletAddress || 'null'}</span></p>
        <button class="btn-copy" data-userid="${profile._id}" ${profile.walletAddress ? '' : 'disabled'}>Copy Wallet Address</button>
      </div>
      
      <div class="profile-actions">
        <button class="btn btn-message" data-userid="${profile._id}">Message</button>
        <button class="btn btn-send-tokens" data-userid="${profile._id}" ${isLoggedIn ? '' : 'disabled'}>Send Tokens</button>
      </div>
    `;

    // Add event listeners for message and token send actions
    card.querySelector('.btn-message').addEventListener('click', () => openChatWindow(profile._id));
    card.querySelector('.btn-send-tokens').addEventListener('click', () => openSolTransferApp(profile._id));

    // Add event listener for copying wallet address, only if wallet address exists
    if (profile.walletAddress) {
      card.querySelector('.btn-copy').addEventListener('click', () => copyToClipboard(profile.walletAddress));
    }

    return card;
  }

  // Function to copy wallet address to clipboard
  function copyToClipboard(walletAddress) {
    if (!walletAddress) {
      console.error("No wallet address to copy.");
      return;
    }
    navigator.clipboard.writeText(walletAddress)
      .then(() => alert("Wallet address copied to clipboard!"))
      .catch(err => console.error("Failed to copy wallet address: ", err));
  }

  function openSolTransferApp(profileId) {
    if (!isLoggedIn) {
      showStatus('Please log in to send tokens.', false, 'global');
      return;
    }

    // Use Next.js routing to navigate to the SOL transfer page
    window.location.href = `http://localhost:3001?profileId=${profileId}`;
  }

  function openChatWindow(userId) {
    const chatWindow = window.open(`http://localhost:4000/?userId=${userId}`, 'ChatWindow', 'width=400,height=600');
    
    if (chatWindow) {
      chatWindow.focus();
    } else {
      alert('Please allow popups for this website to use the chat feature.');
    }
  }

  function renderProfiles(profilesToRender) {
    const fragment = document.createDocumentFragment();
    profilesToRender.forEach(profile => {
      fragment.appendChild(createProfileCard(profile));
    });
    profilesContainer.innerHTML = '';
    profilesContainer.appendChild(fragment);
  }

  async function updateTokenCount(profileId, amount) {
    try {
      const response = await fetch('/api/user/update-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileId, amount }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update token count');
      }

      const data = await response.json();
      console.log(data.message);
      
      // Update the token count display
      const tokenCountElement = document.getElementById(`tokenCount-${profileId}`);
      if (tokenCountElement) {
        tokenCountElement.textContent = data.user.tokenCount;
      }
    } catch (error) {
      console.error('Error updating token count:', error);
    }
  }

  function showStatus(message, isSuccess, id) {
    const statusDiv = id === 'global' ? 
      document.getElementById('globalStatus') || createGlobalStatusDiv() :
      document.getElementById(`status-${id}`);
    
    statusDiv.style.display = 'block';
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + (isSuccess ? 'success' : 'error');

    if (id !== 'global') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 5000);
    }
  }

  function createGlobalStatusDiv() {
    const globalStatus = document.createElement('div');
    globalStatus.id = 'globalStatus';
    globalStatus.className = 'status';
    globalStatus.style.position = 'fixed';
    globalStatus.style.top = '10px';
    globalStatus.style.right = '10px';
    globalStatus.style.zIndex = '1000';
    document.body.appendChild(globalStatus);
    return globalStatus;
  }

  async function requestAirdrop(profileId) {
    if (!isLoggedIn) {
      showStatus('Please log in to request an airdrop.', false, 'global');
      return;
    }

    if (!walletPublicKey) {
      showStatus('Please connect your Solana wallet first!', false, profileId);
      return;
    }

    try {
      const signature = await solanaConnection.requestAirdrop(walletPublicKey, solanaWeb3.LAMPORTS_PER_SOL);
      await solanaConnection.confirmTransaction(signature);
      showStatus('Airdrop of 1 SOL successful!', true, profileId);
    } catch (error) {
      console.error('Airdrop failed:', error);
      showStatus('Airdrop failed. Please try again later.', false, profileId);
    }
  }

  profileSearch.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const filteredProfiles = profiles.filter(profile => 
      profile.name.toLowerCase().includes(searchTerm) || 
      profile.skills.some(skill => skill.toLowerCase().includes(searchTerm))
    );
    renderProfiles(filteredProfiles);
  });

  // Event listener for category buttons
  categoryButtons.forEach(button => {
    button.addEventListener('click', function() {
      const category = this.dataset.category;
      const filteredProfiles = profiles.filter(profile => profile.skills.includes(category));
      renderProfiles(filteredProfiles);
    });
  });

  // Initial function calls
  checkLoginStatus();
  fetchProfiles();
});
