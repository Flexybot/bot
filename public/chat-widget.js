(function() {
  // Configuration from script tag
  const script = document.currentScript;
  const chatbotId = script.dataset.chatbotId;
  const primaryColor = script.dataset.primaryColor || '#4F46E5';
  const position = script.dataset.position || 'right';
  const darkMode = script.dataset.darkMode === 'true';
  const autoOpen = script.dataset.autoOpen === 'true';
  const welcomeMessage = script.dataset.welcomeMessage || 'Hello! How can I help you today?';
  
  // Base URL for API calls - derive from script src
  const scriptSrc = script.src;
  const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));
  
  // Create iframe element
  function createChatWidget() {
    // Create widget container
    const container = document.createElement('div');
    container.id = 'chatbot-widget-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.zIndex = '9999';
    container.style[position] = '20px';
    
    // Create styles
    const style = document.createElement('style');
    style.textContent = `
      #chatbot-widget-container iframe {
        border: none;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        width: 350px;
        height: 600px;
        max-height: 80vh;
        opacity: 0;
        transform: translateY(20px);
        pointer-events: none;
      }
      
      #chatbot-widget-container.open iframe {
        opacity: 1;
        transform: translateY(0);
        pointer-events: all;
      }
      
      #chatbot-widget-button {
        position: fixed;
        bottom: 20px;
        ${position}: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background-color: ${primaryColor};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10000;
        transition: all 0.3s ease;
      }
      
      #chatbot-widget-button:hover {
        transform: scale(1.05);
      }
      
      #chatbot-widget-icon {
        width: 24px;
        height: 24px;
        fill: white;
      }
    `;
    document.head.appendChild(style);
    
    // Button to toggle chat
    const button = document.createElement('div');
    button.id = 'chatbot-widget-button';
    button.innerHTML = `
      <svg id="chatbot-widget-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path fill="white" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
        <path fill="white" d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
      </svg>
    `;
    
    // Create iframe for chat
    const params = new URLSearchParams();
    params.set('primaryColor', primaryColor);
    params.set('position', position);
    params.set('darkMode', darkMode.toString());
    params.set('autoOpen', 'true'); // Always auto-open in iframe
    params.set('welcomeMessage', welcomeMessage);
    
    const iframe = document.createElement('iframe');
    iframe.src = `${baseUrl}/embed/${chatbotId}?${params.toString()}`;
    
    // Add elements to DOM
    container.appendChild(iframe);
    document.body.appendChild(container);
    document.body.appendChild(button);
    
    // Handle chat toggle
    let isOpen = false;
    
    function toggleChat() {
      isOpen = !isOpen;
      if (isOpen) {
        container.classList.add('open');
        button.innerHTML = `
          <svg id="chatbot-widget-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="white" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
          </svg>
        `;
      } else {
        container.classList.remove('open');
        button.innerHTML = `
          <svg id="chatbot-widget-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="white" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
            <path fill="white" d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
          </svg>
        `;
      }
    }
    
    button.addEventListener('click', toggleChat);
    
    // Auto-open after delay if enabled
    if (autoOpen) {
      setTimeout(() => {
        if (!isOpen) toggleChat();
      }, 3000);
    }
    
    // Add message listener for external control
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'TOGGLE_CHATBOT') {
        toggleChat();
      }
    });
    
    // Expose API
    window.ChatbotWidget = {
      open: () => {
        if (!isOpen) toggleChat();
      },
      close: () => {
        if (isOpen) toggleChat();
      },
      toggle: toggleChat
    };
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createChatWidget);
  } else {
    createChatWidget();
  }
})();