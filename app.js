// Solana Web3.js and Wallet Adapter
const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = window.solanaWeb3;
const { WalletAdapterNetwork } = window.solanaWalletAdapterBase;
const { getPhantomWallet } = window.solanaWalletAdapterWallets;
const { useWallet } = window.solanaWalletAdapterReact;

// Define Solana-specific meme coins with names, images, and contract addresses
const allMemeCoins = [
    { 
        name: 'Bonk', 
        image: 'bonk.png', 
        address: new PublicKey('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'), // Solana Bonk token address
        decimals: 5, 
        symbol: 'BONK' 
    },
    { 
        name: 'Samoyedcoin', 
        image: 'samoyedcoin.png', 
        address: new PublicKey('7xKXtg2CWsqd9QoHMpBu9x5RPiXvVKP7UX8dX8BhU3io'), // Solana Samoyedcoin token address
        decimals: 6, 
        symbol: 'SAMO' 
    },
    { 
        name: 'Dogwifhat', 
        image: 'dogwifhat.png', 
        address: new PublicKey('EKpQGSJ8v6oF9fsYYDbW5e1v4Lp6RBuqN2zUoC7SVpL2'), // Solana Dogwifhat token address
        decimals: 6, 
        symbol: 'WIF' 
    }
];

// Filtered meme coins for Solana
let memeCoins = [];
let selectedCoin = null; // Store selected coin for addToken
let wallet = null;

// Initialize Solana connection
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Connect to Solana wallet (Phantom)
const connectSolanaWallet = async () => {
    if (!window.solana || !window.solana.isPhantom) {
        document.getElementById("status").textContent = "Phantom wallet not detected. Please install Phantom.";
        return;
    }

    try {
        wallet = window.solana;
        await wallet.connect();
        const publicKey = wallet.publicKey.toString();
        document.getElementById('status').textContent = `Connected to Solana: ${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`;

        document.getElementById("walletButtons").classList.add("hidden");
        document.getElementById("coinSelection").classList.remove("hidden");
        const introSection = document.getElementById("introSection");
        const backers = document.getElementById("backers");
        if (introSection) introSection.classList.add("hidden");
        if (backers) backers.classList.add("hidden");
        memeCoins = allMemeCoins; // Use all Solana meme coins
        displayMemeCoins();
    } catch (error) {
        console.error('Solana connection failed:', error.message);
        document.getElementById('status').textContent = 'Solana connection failed. Check console.';
    }

    wallet.on('disconnect', () => {
        document.getElementById('status').textContent = 'Disconnected';
        resetApp();
    });
};

// Add token to wallet (Solana-specific)
const addToken = async () => {
    if (!selectedCoin) {
        document.getElementById("paymentStatus").textContent = "No coin selected.";
        return;
    }
    if (!wallet || !wallet.publicKey) {
        document.getElementById("paymentStatus").textContent = "Solana wallet not connected.";
        return;
    }

    try {
        await wallet.request({
            method: 'solana_addToken',
            params: {
                mint: selectedCoin.address.toString(),
                decimals: selectedCoin.decimals,
                symbol: selectedCoin.symbol,
                name: selectedCoin.name,
            },
        });
        document.getElementById("paymentStatus").textContent = `${selectedCoin.name} added to your wallet!`;
    } catch (error) {
        console.error("Error adding token:", error);
        document.getElementById("paymentStatus").textContent = `Error adding ${selectedCoin.name}: ${error.message}`;
    }
};

// Display meme coins in the UI
const displayMemeCoins = () => {
    const coinOptionsDiv = document.getElementById("coinOptions");
    if (!coinOptionsDiv) return;
    coinOptionsDiv.innerHTML = '';
    memeCoins.forEach(coin => {
        const coinDiv = document.createElement("div");
        coinDiv.className = "coin-option";
        coinDiv.innerHTML = `
            <img src="${coin.image}" alt="${coin.name}">
            <p>${coin.name}</p>
        `;
        coinDiv.addEventListener("click", () => selectCoin(coin));
        coinOptionsDiv.appendChild(coinDiv);
    });
};

// Handle coin selection
const selectCoin = (coin) => {
    document.querySelectorAll(".coin-option").forEach(option => option.classList.remove("selected"));
    event.currentTarget.classList.add("selected");
    document.getElementById("coinSelection").classList.add("hidden");
    document.getElementById("paymentSection").classList.remove("hidden");
    document.getElementById("selectedCoin").textContent = coin.name;
    selectedCoin = coin;
};

// Payment logic for Solana (SOL transfer)
const payNow = async () => {
    const amount = parseFloat(document.getElementById("paymentAmount").value);
    if (!amount || amount < 0.1 || amount > 100) {
        document.getElementById("paymentStatus").textContent = "Invalid amount. Must be between 0.1 and 100 SOL.";
        return;
    }

    if (!wallet || !wallet.publicKey) {
        document.getElementById("paymentStatus").textContent = "Solana wallet not connected.";
        return;
    }

    try {
        const fromPublicKey = wallet.publicKey;
        const recipientAddress = new PublicKey('YourSolanaRecipientAddressHere'); // Replace with your Solana wallet address
        const lamports = amount * LAMPORTS_PER_SOL;

        const { blockhash } = await connection.getLatestBlockhash();
        const transaction = new Transaction({
            recentBlockhash: blockhash,
            feePayer: fromPublicKey,
        }).add(
            SystemProgram.transfer({
                fromPubkey: fromPublicKey,
                toPubkey: recipientAddress,
                lamports: lamports,
            })
        );

        const signedTransaction = await wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction(signature);

        document.getElementById("paymentStatus").textContent = `Success: Transferred ${amount} SOL! (Tx: ${signature})`;
        document.getElementById("resetButton").classList.remove("hidden");
    } catch (error) {
        document.getElementById("paymentStatus").textContent = `Payment failed: ${error.message}`;
        console.error("Payment failed:", error);
    }
};

// Reset the app
const resetApp = () => {
    document.getElementById("walletButtons").classList.remove("hidden");
    document.getElementById("coinSelection").classList.add("hidden");
    document.getElementById("paymentSection").classList.add("hidden");
    document.getElementById("status").textContent = "Status: Click to connect your Solana wallet";
    document.getElementById("paymentStatus").textContent = '';
    document.getElementById("resetButton").classList.add("hidden");
    document.getElementById("paymentAmount").value = '';
    const introSection = document.getElementById("introSection");
    const backers = document.getElementById("backers");
    if (introSection) introSection.classList.remove("hidden");
    if (backers) backers.classList.remove("hidden");
};

// Embed YouTube video using the link
const youtubeLink = 'https://www.youtube.com/watch?v=OH4oOYIULlE';
const videoId = youtubeLink.split('v=')[1]?.split('&')[0]; // Extracts video ID
const videoContainer = document.getElementById("video-container");
const iframeCode = `
  <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" 
  frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
  allowfullscreen></iframe>
`;
if (videoContainer) videoContainer.innerHTML = iframeCode;

// Ensure DOM is loaded before adding event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("connectSolanaWallet").addEventListener("click", connectSolanaWallet);
    document.getElementById("payButton").addEventListener("click", payNow);
    document.getElementById("resetButton").addEventListener("click", resetApp);
    document.getElementById("addToWallet").addEventListener("click", addToken);
});
</DOCUMENT>

---

### Changes Made:
1. **Button Visibility**:
   - Removed the `.hidden` class from the `#walletButtons` div in `index.html` to ensure the "Connect Solana Wallet" button is visible by default.
   - The button is now present on page load and functional.

2. **No Auto-Connect**:
   - Reverted to a manual connection approach with the button, as auto-connect was causing issues with visibility. The button triggers the `connectSolanaWallet` function when clicked.

3. **Solana Focus**:
   - Kept the setup exclusive to Solana using the Phantom SDK.

**Next Steps**:
- Save these files as `index.html` and `app.js` in your `meme-coin-shop` folder.
- Ensure you have the Phantom wallet installed (as a browser extension or mobile app).
- Run with Live Server (right-click `index.html` in VS Code and select “Open with Live Server” at `http://127.0.0.1:5500`).
- Check if the "Connect Solana Wallet" button appears and test the connection.

**Confirm**:
- Can you see the "Connect Solana Wallet" button now, and does it work when clicked (showing a connected address)?
- If you still can’t see it or get errors, let me know the exact issue or error message.
