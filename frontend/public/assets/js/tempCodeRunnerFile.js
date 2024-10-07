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
          <button class="btn btn-send-nft" data-userid="${profile._id}">Send NFT via PHOSPHOR</button>
          <button class="btn btn-send-nft" data-userid="${profile._id}">Send NFT via MetaMask</button>
        </div>
      `;
  
      // Add event listeners to the buttons
      card.querySelector('.btn-message').addEventListener('click', () => openChatWindow(profile._id));
      card.querySelector('.btn-send-nft').addEventListener('click', () => handleSendNFT(profile));
  
      // Initialize NFT count
      initializeNFTCount(profile._id);
  
      return card;
    }
  
    function renderProfiles(profilesToRender) {
      profilesContainer.innerHTML = '';
      profilesToRender.forEach(profile => {
        profilesContainer.appendChild(createProfileCard(profile));
      });
    }
  
    function filterProfiles() {
      const searchTerm = profileSearch.value.toLowerCase();
      const activeCategory = document.querySelector('.category-btn.active').dataset.category;
      
      const filteredProfiles = profiles.filter(profile => {
        const matchesSearch = profile.name.toLowerCase().includes(searchTerm) || 
                              profile.skills.some(skill => skill.toLowerCase().includes(searchTerm));
        const matchesCategory = activeCategory === 'all' || profile.skills.some(skill => skill.toLowerCase().replace(/\s+/g, '-') === activeCategory);
        return matchesSearch && matchesCategory;
      });
  
      renderProfiles(filteredProfiles);
    }
  
    function openChatWindow(mentorId) {
      const chatWindow = window.open(`/chat?mentor=${mentorId}`, 'ChatWindow', 'width=400,height=600');
      if (chatWindow) {
        chatWindow.focus();
      } else {
        alert('Please allow popups for this website to use the chat feature.');
      }
    }
  
    function handleSendNFT(profile) {
      // Increase the NFT count
      let currentCount = parseInt(localStorage.getItem(`nftCount-${profile._id}`), 10) || 0;
      localStorage.setItem(`nftCount-${profile._id}`, currentCount + 1);
      
      // Update the displayed count
      updateNFTCountDisplay(profile._id);
  
      // Open the Phosphor website
      window.open('https://phosphor.xyz/', '_blank');
    }
  
    function initializeNFTCount(profileId) {
      if (localStorage.getItem(`nftCount-${profileId}`) === null) {
        localStorage.setItem(`nftCount-${profileId}`, 0);
      }
      updateNFTCountDisplay(profileId);
    }
  
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
