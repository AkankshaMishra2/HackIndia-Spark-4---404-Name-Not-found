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
  let solanaConnection;
  let walletPublicKey;
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
        <div class="profile-actions">
            <button class="btn btn-message" data-userid="${profile._id}">Message</button>
            <button class="btn btn-send-tokens" data-userid="${profile._id}" ${isLoggedIn ? '' : 'disabled'}>Send Tokens</button>
        </div>
        <div class="token-transfer-form" style="display: none;">
            <div class="input-group">
                <label for="tokenAmount-${profile._id}">Amount (SOL):</label>
                <input type="number" id="tokenAmount-${profile._id}" placeholder="Enter amount to send">
            </div>
            <button class="btn btn-confirm-token-transfer" data-userid="${profile._id}">Confirm Token Transfer</button>
            <button class="btn btn-request-airdrop" data-userid="${profile._id}" style="display: none;">Request Airdrop</button>
        </div>
        <div class="status" id="status-${profile._id}" style="display: none;"></div>
    `;

    card.querySelector('.btn-message').addEventListener('click', () => openChatWindow(profile._id));
    card.querySelector('.btn-send-tokens').addEventListener('click', () => toggleTokenTransferForm(profile._id));
    card.querySelector('.btn-confirm-token-transfer').addEventListener('click', () => sendTokens(profile));
    card.querySelector('.btn-request-airdrop').addEventListener('click', () => requestAirdrop(profile._id));

    return card;
}

  /******************************************************* Chat App Code - Anushi ********************************************************/
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


  function toggleTokenTransferForm(profileId) {
    if (!isLoggedIn) {
      showStatus('Please log in to send tokens.', false, 'global');
      return;
    }

    const card = document.querySelector(`.profile-card[data-userid="${profileId}"]`);
    if (card) {
      const tokenTransferForm = card.querySelector('.token-transfer-form');
      const airdropButton = card.querySelector('.btn-request-airdrop');
      
      if (tokenTransferForm && airdropButton) {
        if (tokenTransferForm.style.display === 'none') {
          tokenTransferForm.style.display = 'block';
          airdropButton.style.display = 'block';
        } else {
          tokenTransferForm.style.display = 'none';
          airdropButton.style.display = 'none';
        }
      }
    }
  }

  // function openChatWindow(profileId) {
  //   // Implement chat window opening logic
  //   console.log(`Opening chat window for profile: ${profileId}`);
  // }

  

  async function saveWalletAddress(address) {
    try {
      const response = await fetch('/api/user/update-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
        credentials: 'include',
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save wallet address');
      }
  
      const data = await response.json();
      console.log(data.message);
      return data;
    } catch (error) {
      console.error('Error saving wallet address:', error);
      showStatus('Failed to save wallet address: ' + error.message, false, 'global');
      throw error;
    }
  }
  
  async function connectWallet() {
    if (!isLoggedIn) {
      showStatus('Please log in to connect your wallet.', false, 'global');
      return;
    }
  
    if ('solana' in window) {
      try {
        const resp = await window.solana.connect();
        walletPublicKey = resp.publicKey;
        solanaConnection = new solanaWeb3.Connection("https://api.devnet.solana.com", "confirmed");
        
        await saveWalletAddress(walletPublicKey.toString());
        
        showStatus(`Solana wallet connected: ${walletPublicKey.toString().substring(0,6)}...${walletPublicKey.toString().substring(38)}`, true, 'global');
        updateWalletUI();
      } catch (error) {
        showStatus('Error connecting Solana wallet: ' + error.message, false, 'global');
      }
    } else {
      showStatus('Please install Phantom wallet and refresh the page!', false, 'global');
    }
  }





  // ************************ Fetch Wallet Addresses: Anushi ************************************************
  async function fetchWalletAddress(userId) {
    try {
        const response = await fetch(`/api/user/${userId}/wallet-address`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch wallet address');
        }

        const data = await response.json();
        return data.walletAddress;
    } catch (error) {
        console.error('Error fetching wallet address:', error);
        return null;
    }
}


// ************************ Send Tokens: Anushi ************************************************
async function sendTokens(profile) {
  if (!isLoggedIn || !walletPublicKey) {
      showStatus('Please log in and connect your Solana wallet first!', false, profile._id);
      return;
  }

  const amount = parseFloat(document.getElementById(`tokenAmount-${profile._id}`).value);

  if (isNaN(amount)) {
      showStatus('Please enter a valid amount!', false, profile._id);
      return;
  }

  try {
      // Fetch wallet addresses
      const giverAddress = await fetchWalletAddress(profile._id);
      const receiverAddress = await fetchWalletAddress(profile._id); // Replace with actual receiver ID

      if (!giverAddress || !receiverAddress) {
          showStatus('Failed to fetch wallet addresses.', false, profile._id);
          return;
      }

      // Ensure the connection is established
      if (!solanaConnection) {
          solanaConnection = new solanaWeb3.Connection("https://api.devnet.solana.com", "confirmed");
      }

      // Check balance
      const giverBalance = await solanaConnection.getBalance(new solanaWeb3.PublicKey(giverAddress));
      if (giverBalance < amount * solanaWeb3.LAMPORTS_PER_SOL) {
          showStatus('Insufficient balance.', false, profile._id);
          return;
      }

      // Create a new transaction
      const transaction = new solanaWeb3.Transaction();
      transaction.add(
          solanaWeb3.SystemProgram.transfer({
              fromPubkey: new solanaWeb3.PublicKey(giverAddress),
              toPubkey: new solanaWeb3.PublicKey(receiverAddress),
              lamports: solanaWeb3.LAMPORTS_PER_SOL * amount,
          })
      );

      // Get the recent blockhash
      const { blockhash } = await solanaConnection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new solanaWeb3.PublicKey(giverAddress);

      // Sign and send the transaction
      const signed = await window.solana.signAndSendTransaction(transaction);
      await solanaConnection.confirmTransaction(signed.signature);

      showStatus(`Transaction successful! Signature: ${signed.signature}`, true, profile._id);

      // Update token count on the server
      await updateTokenCount(profile._id, -amount); // Deduct the sent amount
  } catch (error) {
      console.error('Error sending transaction:', error);
      showStatus('Error sending transaction: ' + error.message, false, profile._id);
  }
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
      
      // Update user's token count in the database
      await updateTokenCount(profileId, 1);
    } catch (error) {
      showStatus('Error requesting airdrop: ' + error.message, false, profileId);
    }
  }

  function updateWalletUI() {
    const connectButton = document.getElementById('connectWallet');
    
    if (walletPublicKey) {
      connectButton.textContent = `Connected: ${walletPublicKey.toString().substring(0,6)}...${walletPublicKey.toString().substring(38)}`;
      connectButton.disabled = true;
    } else {
      connectButton.textContent = 'Connect Wallet';
      connectButton.disabled = false;
    }
  }

  // Initial fetch and setup
  checkLoginStatus();
  fetchProfiles();

  // Event listeners
  profileSearch.addEventListener('input', filterProfiles);

  categoryButtons.forEach(button => {
    button.addEventListener('click', function() {
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      filterProfiles();
    });
  });

  // Connect wallet button
  const connectWalletButton = document.getElementById('connectWallet');
  if (connectWalletButton) {
    connectWalletButton.addEventListener('click', connectWallet);
  }

  // Login button
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    loginButton.addEventListener('click', () => {
      window.location.href = '/login'; // Adjust this URL as needed
    });
  }

  // Logout button
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/user/logout', {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          isLoggedIn = false;
          updateUIForLoginStatus();
          showStatus('Logged out successfully', true, 'global');
        } else {
          throw new Error('Logout failed');
        }
      } catch (error) {
        console.error('Error during logout:', error);
        showStatus('Logout failed. Please try again.', false, 'global');
      }
    });
  }

  function filterProfiles() {
    const searchTerm = profileSearch.value.toLowerCase();
    const activeCategory = document.querySelector('.category-btn.active').dataset.category;

    const filteredProfiles = profiles.filter(profile => {
      const matchesSearch = profile.name.toLowerCase().includes(searchTerm) ||
                            profile.skills.some(skill => skill.toLowerCase().includes(searchTerm));
      const matchesCategory = activeCategory === 'all' || profile.tier.toLowerCase() === activeCategory;
      return matchesSearch && matchesCategory;
    });

    renderProfiles(filteredProfiles);
  }

  // Check if wallet is already connected
  if (window.solana && window.solana.isConnected) {
    connectWallet();
  }
});