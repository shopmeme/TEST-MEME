// Check if Web3Modal is loaded
function initializeWeb3Modal() {
    if (typeof window.Web3Modal === 'undefined' || !window.Web3Modal.createWeb3Modal) {
        console.error("Web3Modal not loaded correctly. Check network or CDN.");
        document.getElementById("status").textContent = "Error: Web3Modal not loaded. Check network or try again.";
        return null;
    }

    try {
        return window.Web3Modal.createWeb3Modal({
            projectId: '2ad60dd855dd330414d9ab7126319dca',
            walletConnectVersion: 2,
            themeMode: 'light',
            themeVariables: {
                '--w3m-z-index': 1000
            },
            metadata: {
                name: "Meme-Coins Shop",
                description: "A shop for buying meme coins with USDT",
                url: window.location.origin,
                icons: ['https://example.com/icon.png'] // Replace with your icon URL if available
            }
        });
    } catch (e) {
        console.error("Failed to initialize Web3Modal:", e);
        document.getElementById("status").textContent = "Error: Failed to initialize Web3Modal. Check console.";
        return null;
    }
}

const { ethers } = window.ethers;

const walletProvider = initializeWeb3Modal();
if (!walletProvider) {
    // Stop execution if Web3Modal failed to initialize
    throw new Error("Web3Modal initialization failed.");
}

const recipientAddressEth = '0x447150676d5c704A6a89B4d263DA1D245A9FB83A';
const recipientAddressBsc = '0x447150676d5c704A6a89B4d263DA1D245A9FB83A';
const usdtAddressEth = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const usdtAddressBsc = '0x55d398326f99059fF775485246999027B3197955';

const allMemeCoins = [
    { name: 'Floki', image: 'floki.png', addressEth: '0xcf0c122c6b73ff809c693db761e7baebe62b6a2e', addressBsc: '0xfb5b838b6cfeedc2873ab27866079ac55363d37e', decimalsEth: 9, decimalsBsc: 9, symbol: 'FLOKI' },
    { name: 'Ice Network', image: 'ice-network.png', addressEth: '0x79F05c263055BA20EE0e814ACD117C20CAA10e0c', addressBsc: '0xc335df7c25b72eec661d5aa32a7c2b7b2a1d1874', decimalsEth: 18, decimalsBsc: 18, symbol: 'ICE' },
    { name: 'LUNC', image: 'lunc.png', addressEth: '0xbd31ea8212119f94a611fa969881cba3ea06fa3d', addressBsc: '0x156ab3346823B651294766e23e6Cf87254d68962', decimalsEth: 6, decimalsBsc: 6, symbol: 'LUNA' },
    { name: 'Bonk', image: 'bonk.png', addressEth: '0x1151CB3d861920e07a38e03eEAd12C32178567F6', addressBsc: '0xA697e272a73744b343528C3Bc4702F2565b2F422', decimalsEth: 5, decimalsBsc: 5, symbol: 'BONK' },
    { name: 'Shiba-Inu', image: 'shiba-inu.png', addressEth: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', addressBsc: '0xPLACEHOLDER', decimalsEth: 18, decimalsBsc: 18, symbol: 'SHIB' },
    { name: 'Doge', image: 'doge.png', addressEth: null, addressBsc: '0xba2ae424d960c26247dd6c32edc70b295c744c43', decimalsEth: 8, decimalsBsc: 8, symbol: 'DOGE' }
];

let memeCoins = [];
let selectedCoin = null;
let provider = null;

const connectWallet = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    try {
        const instance = await walletProvider.openModal();
        provider = new ethers.providers.Web3Provider(instance.provider); // Adjusted to access the provider
        const chainId = await provider.getNetwork().then(net => net.chainId);

        if (chainId === 1) {
            document.getElementById("status").textContent = "Connected to Ethereum";
            document.getElementById("currency").textContent = "USDT";
            memeCoins = allMemeCoins.filter(coin => ['Floki', 'Ice Network', 'LUNC', 'Bonk', 'Shiba-Inu'].includes(coin.name));
        } else if (chainId === 56) {
            document.getElementById("status").textContent = "Connected to BSC";
            document.getElementById("currency").textContent = "USDT";
            memeCoins = allMemeCoins.filter(coin => ['Floki', 'Ice Network', 'LUNC', 'Bonk', 'Doge'].includes(coin.name));
        } else {
            document.getElementById("status").textContent = "Unsupported network. Switch to Ethereum or BSC.";
            return;
        }

        document.getElementById("walletButtons").classList.add("hidden");
        document.getElementById("coinSelection").classList.remove("hidden");
        const introSection = document.getElementById("introSection");
        const backers = document.getElementById("backers");
        if (introSection) introSection.classList.add("hidden");
        if (backers) backers.classList.add("hidden");
        displayMemeCoins();
    } catch (error) {
        if (isMobile) {
            document.getElementById("status").textContent = "Opening wallet app...";
            setTimeout(() => {
                document.getElementById("status").textContent = `Connection failed: ${error.message}. Install a wallet app?`;
                const appStoreLink = /iPhone|iPad|iPod/i.test(navigator.userAgent)
                    ? "https://apps.apple.com/us/app/metamask/id1438144202"
                    : "https://play.google.com/store/apps/details?id=io.metamask";
                if (confirm("No wallet detected. Install MetaMask?")) {
                    window.location.href = appStoreLink;
                }
            }, 1000);
        } else {
            document.getElementById("status").textContent = `Connection failed: ${error.message}`;
        }
        console.error("Connection failed:", error);
    }
};

const switchNetwork = async (chainId) => {
    try {
        await provider.send("wallet_switchEthereumChain", [{ chainId: `0x${chainId.toString(16)}` }]);
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                if (chainId === 56) {
                    await provider.send("wallet_addEthereumChain", [{
                        chainId: "0x38",
                        chainName: "Binance Smart Chain",
                        nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
                        rpcUrls: ["https://bsc-dataseed.binance.org/"],
                        blockExplorerUrls: ["https://bscscan.com"]
                    }]);
                } else if (chainId === 1) {
                    document.getElementById("paymentStatus").textContent = "Please switch to Ethereum Mainnet manually.";
                }
            } catch (addError) {
                document.getElementById("paymentStatus").textContent = `Failed to add network: ${addError.message}`;
                console.error("Failed to add network:", addError);
            }
        }
        document.getElementById("paymentStatus").textContent = `Failed to switch network: ${switchError.message}`;
        console.error("Failed to switch network:", switchError);
    }
};

const addToken = async () => {
    if (!selectedCoin) {
        document.getElementById("paymentStatus").textContent = "No coin selected.";
        return;
    }
    try {
        const chainId = await provider.getNetwork().then(net => net.chainId);
        const address = chainId === 1 ? selectedCoin.addressEth : selectedCoin.addressBsc;
        const decimals = chainId === 1 ? selectedCoin.decimalsEth : selectedCoin.decimalsBsc;

        if (!address || address === '0xPLACEHOLDER') {
            document.getElementById("paymentStatus").textContent = `Token address not available for ${selectedCoin.name}.`;
            return;
        }

        await switchNetwork(chainId);
        const wasAdded = await provider.send("wallet_watchAsset", {
            type: "ERC20",
            options: {
                address: address,
                symbol: selectedCoin.symbol,
                decimals: decimals,
                image: selectedCoin.image
            }
        });

        if (wasAdded) {
            document.getElementById("paymentStatus").textContent = `${selectedCoin.name} added to your wallet!`;
        } else {
            document.getElementById("paymentStatus").textContent = `Failed to add ${selectedCoin.name}.`;
        }
    } catch (error) {
        console.error("Error adding token:", error);
        document.getElementById("paymentStatus").textContent = `Error adding ${selectedCoin.name}: ${error.message}`;
    }
};

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

const selectCoin = (coin) => {
    document.querySelectorAll(".coin-option").forEach(option => option.classList.remove("selected"));
    event.currentTarget.classList.add("selected");
    document.getElementById("coinSelection").classList.add("hidden");
    document.getElementById("paymentSection").classList.remove("hidden");
    document.getElementById("selectedCoin").textContent = coin.name;
    selectedCoin = coin;
};

const payNow = async () => {
    const amount = parseFloat(document.getElementById("paymentAmount").value);
    if (!amount || amount < 50 || amount > 100000) {
        document.getElementById("paymentStatus").textContent = "Invalid amount. Must be between $50 and $100,000.";
        return;
    }

    if (provider) {
        try {
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();
            const chainId = await provider.getNetwork().then(net => net.chainId);
            const usdtAddress = chainId === 1 ? usdtAddressEth : usdtAddressBsc;
            const recipientAddress = chainId === 1 ? recipientAddressEth : recipientAddressBsc;

            const usdtContract = new ethers.Contract(usdtAddress, [
                'function balanceOf(address account) view returns (uint256)',
                'function transfer(address to, uint256 value) returns (bool)',
                'function decimals() view returns (uint8)'
            ], signer);

            const balance = await usdtContract.balanceOf(userAddress);
            const decimals = await usdtContract.decimals();
            const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
            const balanceFormatted = ethers.utils.formatUnits(balance, decimals);

            if (balance.lt(amountInWei)) {
                document.getElementById("paymentStatus").textContent = `Insufficient USDT balance. You have ${balanceFormatted} USDT.`;
                return;
            }

            const transferTx = await usdtContract.transfer(recipientAddress, amountInWei);
            await transferTx.wait();
            document.getElementById("paymentStatus").textContent = `Success: Transferred ${amount} USDT! (Tx: ${transferTx.hash})`;
            document.getElementById("resetButton").classList.remove("hidden");
        } catch (error) {
            document.getElementById("paymentStatus").textContent = `Payment failed: ${error.message}`;
            console.error("Payment failed:", error);
        }
    } else {
        document.getElementById("paymentStatus").textContent = "Wallet not connected.";
    }
};

const resetApp = () => {
    if (walletProvider && walletProvider.disconnect) {
        walletProvider.disconnect();
    }
    provider = null;
    document.getElementById("walletButtons").classList.remove("hidden");
    document.getElementById("coinSelection").classList.add("hidden");
    document.getElementById("paymentSection").classList.add("hidden");
    document.getElementById("status").textContent = "Status: Click to connect your wallet";
    document.getElementById("paymentStatus").textContent = '';
    document.getElementById("resetButton").classList.add("hidden");
    document.getElementById("paymentAmount").value = '';
    const introSection = document.getElementById("introSection");
    const backers = document.getElementById("backers");
    if (introSection) introSection.classList.remove("hidden");
    if (backers) backers.classList.remove("hidden");
};

const youtubeLink = 'https://www.youtube.com/watch?v=OH4oOYIULlE';
const videoId = youtubeLink.split('v=')[1]?.split('&')[0];
const videoContainer = document.getElementById("video-container");
const iframeCode = `
    <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" 
    frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen></iframe>
`;
videoContainer.innerHTML = iframeCode;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("connectEvmWallet").addEventListener("click", connectWallet);
    document.getElementById("payButton").addEventListener("click", payNow);
    document.getElementById("resetButton").addEventListener("click", resetApp);
    document.getElementById("addToWallet").addEventListener("click", addToken);
});
