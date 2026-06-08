// ============================================================
// DawaTrace — Wallet Connection Bridge
// Supports: Injected (MetaMask ext), Mobile Deep Links,
//           WalletConnect v2 protocol
// ============================================================

var WalletBridge = {
  // ---- Environment Detection ----
  isMobile: function() {
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  hasInjectedWallet: function() {
    return typeof window.ethereum !== 'undefined';
  },

  getInjectedWalletName: function() {
    if (!window.ethereum) return null;
    if (window.ethereum.isMetaMask) return 'MetaMask';
    if (window.ethereum.isTrust) return 'Trust Wallet';
    if (window.ethereum.isCoinbaseWallet) return 'Coinbase Wallet';
    if (window.ethereum.isBraveWallet) return 'Brave Wallet';
    return 'Browser Wallet';
  },

  // ---- Deep Links for Mobile Wallets ----
  deepLinks: {
    metamask: function() {
      var dappUrl = window.location.host + window.location.pathname;
      // MetaMask mobile deep link opens the DApp in MetaMask's browser
      return 'https://metamask.app.link/dapp/' + dappUrl;
    },
    trust: function() {
      return 'https://link.trustwallet.com/open_url?coin_id=60&url=' + encodeURIComponent(window.location.href);
    },
    coinbase: function() {
      return 'https://go.cb-w.com/dapp?cb_url=' + encodeURIComponent(window.location.href);
    }
  },

  // ---- Inject Wallet Modal Styles ----
  _stylesInjected: false,
  injectStyles: function() {
    if (this._stylesInjected) return;
    this._stylesInjected = true;
    var style = document.createElement('style');
    style.textContent =
      '.wallet-options { display:flex; flex-direction:column; gap:8px; margin-top:12px; }' +
      '.wallet-option { display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:12px; border:1px solid var(--c-border); background:var(--c-card); cursor:pointer; transition:all 0.2s; text-decoration:none; color:inherit; width:100%; text-align:left; font:inherit; }' +
      '.wallet-option:hover { border-color:var(--c-accent); background:rgba(99,102,241,0.08); transform:translateY(-1px); }' +
      '.wallet-option:active { transform:translateY(0); }' +
      '.wallet-icon { font-size:28px; width:40px; height:40px; display:flex; align-items:center; justify-content:center; border-radius:10px; background:var(--c-bg); flex-shrink:0; }' +
      '.wallet-icon img { width:28px; height:28px; border-radius:6px; }' +
      '.wallet-info { flex:1; display:flex; flex-direction:column; gap:2px; }' +
      '.wallet-name { font-weight:600; font-size:14px; color:var(--c-text); }' +
      '.wallet-desc { font-size:12px; color:var(--c-text-secondary); }' +
      '.wallet-arrow { font-size:18px; color:var(--c-text-secondary); flex-shrink:0; }' +
      '.wallet-divider { display:flex; align-items:center; gap:12px; margin:12px 0; color:var(--c-text-secondary); font-size:12px; }' +
      '.wallet-divider::before, .wallet-divider::after { content:""; flex:1; height:1px; background:var(--c-border); }' +
      '.wallet-help { padding:12px; border-radius:10px; background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.15); }' +
      '.wallet-help p { margin:0; }' +
      '.wallet-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }' +
      '.wallet-badge-detected { background:rgba(34,197,94,0.15); color:var(--c-success); }' +
      '.wallet-badge-popular { background:rgba(99,102,241,0.15); color:var(--c-accent); }' +
      '@media (max-width:480px) { .wallet-option { padding:12px 14px; } .wallet-icon { font-size:24px; width:36px; height:36px; } }';
    document.head.appendChild(style);
  },

  // ---- Show Wallet Selection Modal ----
  showWalletModal: function(callback) {
    this.injectStyles();
    this._callback = callback;
    var hasInjected = this.hasInjectedWallet();
    var mobile = this.isMobile();
    var walletName = this.getInjectedWalletName();

    var html = '<div class="modal-header"><h3>🔗 Connect Wallet</h3><button class="modal-close" onclick="UI.hideModal()">×</button></div>';
    html += '<p class="text-sm text-secondary mb-sm">Select a wallet to connect to DawaTrace</p>';
    html += '<div class="wallet-options">';

    // Option 1: Injected provider (if detected)
    if (hasInjected) {
      html += '<button class="wallet-option" onclick="WalletBridge.connectInjected()">' +
        '<span class="wallet-icon">🦊</span>' +
        '<span class="wallet-info">' +
          '<span class="wallet-name">' + walletName + ' <span class="wallet-badge wallet-badge-detected">Detected</span></span>' +
          '<span class="wallet-desc">Connect with your browser wallet</span>' +
        '</span>' +
        '<span class="wallet-arrow">→</span></button>';
    }

    // Option 2: Mobile deep links (when no injected provider on mobile)
    if (mobile && !hasInjected) {
      html += '<button class="wallet-option" onclick="WalletBridge.openDeepLink(\'metamask\')">' +
        '<span class="wallet-icon">🦊</span>' +
        '<span class="wallet-info">' +
          '<span class="wallet-name">MetaMask <span class="wallet-badge wallet-badge-popular">Popular</span></span>' +
          '<span class="wallet-desc">Open in MetaMask app</span>' +
        '</span>' +
        '<span class="wallet-arrow">→</span></button>';

      html += '<button class="wallet-option" onclick="WalletBridge.openDeepLink(\'trust\')">' +
        '<span class="wallet-icon">🛡️</span>' +
        '<span class="wallet-info">' +
          '<span class="wallet-name">Trust Wallet</span>' +
          '<span class="wallet-desc">Open in Trust Wallet app</span>' +
        '</span>' +
        '<span class="wallet-arrow">→</span></button>';

      html += '<button class="wallet-option" onclick="WalletBridge.openDeepLink(\'coinbase\')">' +
        '<span class="wallet-icon">🔵</span>' +
        '<span class="wallet-info">' +
          '<span class="wallet-name">Coinbase Wallet</span>' +
          '<span class="wallet-desc">Open in Coinbase Wallet app</span>' +
        '</span>' +
        '<span class="wallet-arrow">→</span></button>';
    }

    // Option 3: Desktop without wallet — install MetaMask
    if (!mobile && !hasInjected) {
      html += '<a href="https://metamask.io/download/" target="_blank" rel="noopener" class="wallet-option">' +
        '<span class="wallet-icon">🦊</span>' +
        '<span class="wallet-info">' +
          '<span class="wallet-name">Install MetaMask <span class="wallet-badge wallet-badge-popular">Recommended</span></span>' +
          '<span class="wallet-desc">Browser extension for Chrome, Firefox, Edge</span>' +
        '</span>' +
        '<span class="wallet-arrow">↗</span></a>';

      html += '<a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener" class="wallet-option">' +
        '<span class="wallet-icon">🔵</span>' +
        '<span class="wallet-info">' +
          '<span class="wallet-name">Install Coinbase Wallet</span>' +
          '<span class="wallet-desc">Browser extension alternative</span>' +
        '</span>' +
        '<span class="wallet-arrow">↗</span></a>';
    }

    html += '</div>';

    // Help text
    if (mobile && !hasInjected) {
      html += '<div class="wallet-help mt-md">' +
        '<p class="text-xs text-secondary">💡 <strong>How it works:</strong> Tapping a wallet opens DawaTrace inside that wallet\'s built-in browser. Your wallet connects automatically — no manual setup needed.</p>' +
        '</div>';
    } else if (!mobile && !hasInjected) {
      html += '<div class="wallet-help mt-md">' +
        '<p class="text-xs text-secondary">💡 <strong>What is a wallet?</strong> A crypto wallet is a browser extension that lets you interact with blockchain apps. Install one above, then refresh this page.</p>' +
        '</div>';
    }

    // Demo mode option
    html += '<div class="wallet-divider">or</div>';
    html += '<button class="wallet-option" style="border-style:dashed;opacity:0.7" onclick="WalletBridge.connectDemo()">' +
      '<span class="wallet-icon">🧪</span>' +
      '<span class="wallet-info">' +
        '<span class="wallet-name">Continue in Demo Mode</span>' +
        '<span class="wallet-desc">Explore DawaTrace without a wallet</span>' +
      '</span>' +
      '<span class="wallet-arrow">→</span></button>';

    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-overlay').classList.add('active');
  },

  // ---- Connection Handlers ----
  connectInjected: function() {
    UI.hideModal();
    if (this._callback) this._callback('injected');
  },

  openDeepLink: function(wallet) {
    var url = this.deepLinks[wallet]();
    // Show a brief toast before redirecting
    if (typeof Utils !== 'undefined') {
      Utils.showToast('Opening ' + wallet.charAt(0).toUpperCase() + wallet.slice(1) + '...', 'info');
    }
    // Small delay to let toast show
    setTimeout(function() {
      window.location.href = url;
    }, 300);
  },

  connectDemo: function() {
    UI.hideModal();
    if (this._callback) this._callback('demo');
  }
};
