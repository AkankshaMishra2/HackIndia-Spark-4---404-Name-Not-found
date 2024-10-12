
document.addEventListener("DOMContentLoaded", function() {
  // Add the ethers.js script
  const ethersScript = document.createElement('script');
  ethersScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js';
  document.head.appendChild(ethersScript);

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
  let connectedAccount = null;



  /*************************************** Fetch profiles from the server and render them.************************************/


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

<<<<<<< HEAD
  // earlier at this place the code of the function createProfileCard was written, but i have moved it to the below so that I can work easily - Anushi
   function openChatWindow(userId) {

     // Open a new window to the realtime chat server, passing the userId as a query parameter
     const chatWindow = window.open(`http://localhost:4000/?userId=${userId}`, 'ChatWindow', 'width=400,height=600');
    
     if (chatWindow) {
         chatWindow.focus();
     } else {
         alert('Please allow popups for this website to use the chat feature.');
     }
}



//----------------------------------------------------------------------------------------------------------------------------------------------------------------
=======
 

  /*******************************************Create a profile card element for the given profile.********************************************************/

  
>>>>>>> e80572bd79f7d7ab8ec1e0844c61d07358172f3e
  function createProfileCard(profile) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.innerHTML = `
      <img src="${profile.image || '/placeholder.svg?height=100&width=100'}" alt="${profile.name}" class="profile-image">
      <h3>${profile.name}</h3>
      <p>${profile.skills.join(', ')}</p>
      <p>${profile.college || 'Not specified'}</p>
      <span class="tier ${profile.tier.toLowerCase()}">${profile.tier}</span>
      <p class="nft-count">NFT Count: <span id="nftCount-${profile._id}">0</span></p>
      <div class="profile-actions">
        <button class="btn btn-message" data-userid="${profile._id}">Message</button>
        <button class="btn btn-send-nft-phosphor" data-userid="${profile._id}">Send NFT via PHOSPHOR</button>
        <button class="btn btn-send-nft-metamask" data-userid="${profile._id}">Send NFT via MetaMask</button>
        <button class="btn btn-send-tokens" data-userid="${profile._id}">Send Tokens</button>
      </div>
      <div class="nft-transfer-form" style="display: none;">
        <div class="input-group">
          <label for="contractAddress-${profile._id}">NFT Contract Address:</label>
          <input type="text" id="contractAddress-${profile._id}" placeholder="0x...">
        </div>
        <div class="input-group">
          <label for="tokenId-${profile._id}">Token ID:</label>
          <input type="text" id="tokenId-${profile._id}" placeholder="Enter token ID">
        </div>
        <button class="btn btn-confirm-nft-transfer" data-userid="${profile._id}">Confirm NFT Transfer</button>
      </div>
      <div class="status" id="status-${profile._id}" style="display: none;"></div>
    `;

    // Add event listeners to the buttons
    card.querySelector('.btn-message').addEventListener('click', () => openChatWindow(profile._id));
    card.querySelector('.btn-send-nft-phosphor').addEventListener('click', () => handleSendNFTViaPhosphor(profile));
    card.querySelector('.btn-send-nft-metamask').addEventListener('click', () => handleSendNFTViaMetaMask(profile));
    card.querySelector('.btn-confirm-nft-transfer').addEventListener('click', () => sendNFT(profile));
    card.querySelector('.btn-send-tokens').addEventListener('click', () => openSendTokenPage(profile._id));

    // Initialize NFT count
    initializeNFTCount(profile._id);

    return card;
  }

  /******************************************************* Render the given profiles in the profiles container.********************************************************/
  
  
  function renderProfiles(profilesToRender) {
    profilesContainer.innerHTML = '';
    profilesToRender.forEach(profile => {
      profilesContainer.appendChild(createProfileCard(profile));
    });
  }

  
  /*************************************************Handle sending NFT via Phospher**********************************************************************/
  
  function handleSendNFTViaPhosphor(profile) {
    // Increase the NFT count
    let currentCount = parseInt(localStorage.getItem(`nftCount-${profile._id}`), 10) || 0;
    localStorage.setItem(`nftCount-${profile._id}`, currentCount + 1);
    
    // Update the displayed count
    updateNFTCountDisplay(profile._id);

    // Open the Phosphor website
    window.open('https://phosphor.xyz/', '_blank');
  }

  /************************************************Handle sending NFT via MetaMask.**************************************************************/
  
  function handleSendNFTViaMetaMask(profile) {
    const card = document.querySelector(`.profile-card[data-userid="${profile._id}"]`);
    const nftTransferForm = card.querySelector('.nft-transfer-form');
    nftTransferForm.style.display = nftTransferForm.style.display === 'none' ? 'block' : 'none';
  }

  /********************************************************** Open the send token page.******************************************************************/
  
  function openSendTokenPage(profileId) {
    window.open('SENDTOKENS.html', '_blank');
  }

  /********************************************************************* Connect the user's wallet using MetaMask.*************************************/


  async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        connectedAccount = accounts[0];
        showStatus(`Connected: ${connectedAccount.substring(0,6)}...${connectedAccount.substring(38)}`, true, 'global');
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', function (accounts) {
          connectedAccount = accounts[0];
          showStatus(`Connected: ${connectedAccount.substring(0,6)}...${connectedAccount.substring(38)}`, true, 'global');
        });

      } catch (error) {
        showStatus('Error connecting wallet: ' + error.message, false, 'global');
      }
    } else {
      showStatus('Please install MetaMask!', false, 'global');
    }
  }

  /**
   * Send an NFT to the specified profile.
   * @param {Object} profile - The profile data.
   */
  async function sendNFT(profile) {
    if (!connectedAccount) {
      showStatus('Please connect your wallet first!', false, profile._id);
      return;
    }

    const contractAddress = document.getElementById(`contractAddress-${profile._id}`).value;
    const tokenId = document.getElementById(`tokenId-${profile._id}`).value;
    const recipientAddress = profile._id; // Assuming profile._id is the recipient's address

    if (!contractAddress || !tokenId) {
      showStatus('Please fill in all fields!', false, profile._id);
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // ERC721 ABI for transfer function
      const abi = [
        "function transferFrom(address from, address to, uint256 tokenId)"
      ];

      const nftContract = new ethers.Contract(contractAddress, abi, signer);

      // Send transaction
      const transaction = await nftContract.transferFrom(
        connectedAccount,
        recipientAddress,
        tokenId
      );

      showStatus('Transaction sent! Waiting for confirmation...', true, profile._id);

      // Wait for transaction confirmation
      const receipt = await transaction.wait();
      showStatus(`NFT transferred successfully! Transaction hash: ${receipt.transactionHash}`, true, profile._id);

      // Increase the NFT count
      let currentCount = parseInt(localStorage.getItem(`nftCount-${profile._id}`), 10) || 0;
      localStorage.setItem(`nftCount-${profile._id}`, currentCount + 1);
      
      // Update the displayed count
      updateNFTCountDisplay(profile._id);

    } catch (error) {
      showStatus('Error sending NFT: ' + error.message, false, profile._id);
    }
  }

  /**
   * Show a status message.
   * @param {string} message - The status message.
   * @param {boolean} isSuccess - Whether the status is a success or error.
   * @param {string} id - The ID of the status element.
   */
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

  /**
   * Create a global status div element.
   * @returns {HTMLElement} - The global status div element.
   */
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

  /**
   * Initialize the NFT count for the specified profile.
   * @param {string} profileId - The ID of the profile.
   */
  function initializeNFTCount(profileId) {
    if (localStorage.getItem(`nftCount-${profileId}`) === null) {
      localStorage.setItem(`nftCount-${profileId}`, 0);
    }
    updateNFTCountDisplay(profileId);
  }

  /**
   * Update the displayed NFT count for the specified profile.
   * @param {string} profileId - The ID of the profile.
   */
  function updateNFTCountDisplay(profileId) {
    const nftCountElement = document.getElementById(`nftCount-${profileId}`);
    if (nftCountElement) {
      nftCountElement.textContent = localStorage.getItem(`nftCount-${profileId}`) || 0;
    }
  }

  // Initial fetch
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
});