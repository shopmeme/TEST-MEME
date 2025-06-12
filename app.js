// Solana web3.js is loaded globally via CDN
const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = window.solanaWeb3;

// Meme coins available on Solana
const memeCoins = [
    { 
        name: 'Bonk', 
        image: 'bonk.png', 
        address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        decimals: 5,
        symbol: 'BONK'
    },
    { 
        name: 'Samoyedcoin', 
        image: 'samoyedcoin.png', 
        address: '7xKXtg2CWsqd9QoHMpBu9x5RPiXvVKP7UX8dX8BhU3io',
        decimals: 9,
        symbol: 'SAMO'
    },
    { 
        name: 'Dogwifhat', 
        image: 'dogwifhat.png', 
        address: 'EKpQGSJ8v6oF9fsYYDbW5e1v4Lp6RBuqN2zUoC7SVpL2',
        decimals: 8,
        symbol: 'WIF'
    }
];

// Change this to your receiving Solana wallet address:
const recipientAddress = 'YOUR_SOL_RECEIVER_ADDRESS';

// Solana connection (mainnet)
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

let selectedCoin = null;
let wallet = null;

// Connect Phantom wallet
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
        displayMemeCoins();
    } catch (error) {
        document.getElementById('status').textContent = 'Solana connection failed. Check console.';
        console.error('Solana connection failed:', error);
    }

    wallet.on('disconnect', () => {
        document.getElementById('status').textContent = 'Disconnected';
        resetApp();
    });
};

// Add token to Phantom wallet (if supported)
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
            method: 'wallet_watchAsset',
            params: {
                type: 'spl-token',
                options: {
                    address: selectedCoin.address,
                    symbol: selectedCoin.symbol,
                    decimals: selectedCoin.decimals,
                    image: window.location.origin + '/' + selectedCoin.image
                }
            }
        });
        document.getElementById("paymentStatus").textContent = `${selectedCoin.name} added to your wallet!`;
    } catch (error) {
        document.getElementById("paymentStatus").textContent = `Could not add ${selectedCoin.name}. Try manually in Phantom.`;
    }
};

// Display meme coins for selection
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
        coinDiv.addEventListener("click", function() { selectCoin(coin, coinDiv); });
        coinOptionsDiv.appendChild(coinDiv);
    });
};

// Handle coin selection
const selectCoin = (coin, element) => {
    document.querySelectorAll(".coin-option").forEach(option => option.classList.remove("selected"));
    element.classList.add("selected");
    document.getElementById("coinSelection").classList.add("hidden");
    document.getElementById("paymentSection").classList.remove("hidden");
    document.getElementById("selectedCoin").textContent = coin.name;
    selectedCoin = coin;
};

// Pay with SOL
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
    if (!recipientAddress || recipientAddress === 'YOUR_SOL_RECEIVER_ADDRESS') {
        document.getElementById("paymentStatus").textContent = "Missing recipient address. Please set your Solana address in the code.";
        return;
    }

    try {
        const fromPublicKey = wallet.publicKey;
        const toPublicKey = new PublicKey(recipientAddress);
        const lamports = amount * LAMPORTS_PER_SOL;

        const { blockhash } = await connection.getLatestBlockhash();
        const transaction = new Transaction({
            recentBlockhash: blockhash,
            feePayer: fromPublicKey
        }).add(
            SystemProgram.transfer({
                fromPubkey: fromPublicKey,
                toPubkey: toPublicKey,
                lamports: lamports
            })
        );

        const signed = await wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(signature);

        document.getElementById("paymentStatus").textContent = `Success: Transferred ${amount} SOL! (Tx: ${signature})`;
        document.getElementById("resetButton").classList.remove("hidden");
    } catch (error) {
        document.getElementById("paymentStatus").textContent = `Payment failed: ${error.message}`;
    }
};

// Reset app to initial state
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

// Embed YouTube video
const youtubeLink = 'https://www.youtube.com/watch?v=OH4oOYIULlE';
const videoId = youtubeLink.split('v=')[1]?.split('&')[0];
const videoContainer = document.getElementById("video-container");
if (videoContainer) {
    videoContainer.innerHTML = `
      <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" 
      frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen></iframe>
    `;
}

// Ensure DOM is loaded before adding event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("connectSolanaWallet").addEventListener("click", connectSolanaWallet);
    document.getElementById("payButton").addEventListener("click", payNow);
    document.getElementById("resetButton").addEventListener("click", resetApp);
    document.getElementById("addToWallet").addEventListener("click", addToken);
});
