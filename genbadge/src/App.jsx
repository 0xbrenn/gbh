import React, { useState, useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import logoImage from './assets/favicon.jpeg';
import badgeImage from './assets/badge.png';

// OPN Chain configuration
const opnChain = {
  id: 984,
  name: 'OPN Testnet',
  network: 'opn-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'OPN',
    symbol: 'OPN',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.iopn.tech'],
    },
    public: {
      http: ['https://testnet-rpc.iopn.tech'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'OPN Testnet Explorer', 
      url: 'https://testnet.iopn.tech'
    },
  },
  testnet: true,
};


const currentChain = opnChain;

const ENV = {
  PRIVY_APP_ID: import.meta?.env?.VITE_PRIVY_APP_ID || 'YOUR_PRIVY_APP_ID',
  VIDEO_URL: import.meta?.env?.VITE_VIDEO_URL || '/assets/video.mp4',
  CONTRACT_ADDRESS: import.meta?.env?.VITE_CONTRACT_ADDRESS || '0xBc5C49AbC5282994Bd2c641438391D5E2e730c25', 
  RPC_URL: 'https://testnet-rpc.iopn.tech',
};

const Genesis_n_Badge_ABI = [
  {
    "inputs": [],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimOpen",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const CONTRACT_ERRORS = {
  'AlreadyClaimed': 'You have already claimed your Genesis n-Badge',
  'ClaimClosed': 'Claiming is not open yet. Please check back later',
  'Soulbound': 'This badge is soulbound and cannot be transferred',
};

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="blue-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4105b6" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#7B328D" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4105b6" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="blue-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7B328D" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#4105b6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#C15483" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {[...Array(5)].map((_, i) => (
          <g key={i}>
            <path
              d={`M ${100 - i * 8} ${20 + i * 5} 
                  C ${80 - i * 6} ${40 + i * 3}, ${60 - i * 4} ${30 - i * 2}, ${40 - i * 2} ${50 + i * 4}
                  S ${20 + i * 3} ${60 - i * 3}, ${-10 + i * 5} ${40 + i * 5}`}
              stroke="#4105b6"
              strokeWidth="0.1"
              fill="none"
              opacity="0.2"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0,0; ${-30 + i * 6},${20 - i * 4}; ${20 - i * 5},${-30 + i * 6}; ${30 - i * 4},${10 + i * 3}; 0,0`}
                dur={`${35 + i * 4}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="d"
                values={`
                  M ${100 - i * 8} ${20 + i * 5} C ${80 - i * 6} ${40 + i * 3}, ${60 - i * 4} ${30 - i * 2}, ${40 - i * 2} ${50 + i * 4} S ${20 + i * 3} ${60 - i * 3}, ${-10 + i * 5} ${40 + i * 5};
                  M ${100 - i * 8} ${30 + i * 5} C ${85 - i * 6} ${20 + i * 3}, ${65 - i * 4} ${40 - i * 2}, ${45 - i * 2} ${30 + i * 4} S ${25 + i * 3} ${50 - i * 3}, ${-10 + i * 5} ${35 + i * 5};
                  M ${100 - i * 8} ${25 + i * 5} C ${75 - i * 6} ${50 + i * 3}, ${55 - i * 4} ${25 - i * 2}, ${35 - i * 2} ${55 + i * 4} S ${15 + i * 3} ${65 - i * 3}, ${-10 + i * 5} ${45 + i * 5};
                  M ${100 - i * 8} ${20 + i * 5} C ${80 - i * 6} ${40 + i * 3}, ${60 - i * 4} ${30 - i * 2}, ${40 - i * 2} ${50 + i * 4} S ${20 + i * 3} ${60 - i * 3}, ${-10 + i * 5} ${40 + i * 5}
                `}
                dur={`${28 + i * 2}s`}
                repeatCount="indefinite"
              />
            </path>
          </g>
        ))}
      </svg>
    </div>
  );
};

const ConnectPage = ({ onNavigate }) => {
  const { ready, authenticated, login, logout } = usePrivy();
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasClickedConnect, setHasClickedConnect] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Force logout on mount - wait for it to complete
  useEffect(() => {
    const forceLogout = async () => {
      if (authenticated && !hasClickedConnect) {
        setIsLoggingOut(true);
        try {
          await logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          setIsLoggingOut(false);
        }
      }
    };
    forceLogout();
  }, [authenticated, hasClickedConnect, logout]);

  // Only navigate after user explicitly clicks connect AND is authenticated
  useEffect(() => {
    if (authenticated && hasClickedConnect && !isConnecting && !isLoggingOut) {
      onNavigate('video');
    }
  }, [authenticated, hasClickedConnect, isConnecting, isLoggingOut, onNavigate]);

  const handleConnect = async () => {
    if (!ready || isConnecting || isLoggingOut) return;
    
    // If somehow still authenticated, logout first
    if (authenticated) {
      setIsLoggingOut(true);
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
      }
      setIsLoggingOut(false);
      // Wait a moment for logout to fully complete
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsConnecting(true);
    setHasClickedConnect(true);
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
      setHasClickedConnect(false);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <AnimatedBackground />
      
      <div className="flex flex-col items-center text-center max-w-5xl mx-auto relative z-10">
        {/* Logo */}
        <div className="mb-12 sm:mb-14 md:mb-16">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-30" />
            <img 
              src={logoImage} 
              alt="Genesis n-Badge" 
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full object-cover relative z-10 border-2 border-purple-500/20"
              style={{ filter: 'brightness(1.1) contrast(1.1)' }}
            />
          </div>
        </div>

        {/* Genesis n-Badge Text */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-8xl xl:text-8xl font-extralight text-white leading-[0.85]"
              style={{ textShadow: '0 0 40px rgba(193,84,131,0.5)' }}>
            Genesis
          </h1>
          <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-7xl xl:text-7xl font-extralight text-white leading-[0.85]"
              style={{ textShadow: '0 0 40px rgba(193,84,131,0.5)' }}>
            n-Badge
          </h1>
        </div>
        
        {/* The Definitive OPN Chain Badge */}
        <div className="space-y-1 mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-extralight leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400"
                  style={{ textShadow: '0 0 60px rgba(193,84,131,0.5)' }}>
              The Definitive
            </span>
          </h2>
          <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-extralight leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400"
                  style={{ textShadow: '0 0 60px rgba(123,50,141,0.5)' }}>
              OPN Chain Badge
            </span>
          </h2>
        </div>

        {/* Exclusive Access | Limited Edition */}
        <p className="text-gray-400 text-xs sm:text-sm md:text-base tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-12 sm:mb-14 md:mb-16">
          Exclusive Access | Limited Edition
        </p>
        
        {/* Connect Wallet Button */}
        <div className="flex justify-center">
          <button
            onClick={handleConnect}
            disabled={!ready || isConnecting}
            className="px-10 sm:px-12 md:px-16 py-3 sm:py-4 text-base bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!ready ? 'Loading...' : isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    </div>
  );
};

const VideoPage = ({ onNavigate }) => {
  const videoRef = useRef(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { authenticated, logout } = usePrivy();

  useEffect(() => {
    if (!authenticated) {
      onNavigate('connect');
    }
  }, [authenticated, onNavigate]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log('Auto-play was prevented');
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, []);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    setIsPlaying(false);
  };

  const handleContinue = () => {
    onNavigate('claim');
  };

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setVideoEnded(false);
      setIsPlaying(true);
    }
  };

  const handleDisconnect = () => {
    logout();
    onNavigate('connect');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain sm:object-cover"
        src={ENV.VIDEO_URL}
        onEnded={handleVideoEnd}
        playsInline
        controls={true}
      />
      
      {videoEnded && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-between backdrop-blur-sm p-4">
          <AnimatedBackground />
          
          <div className="w-full" />
          
          <div className="text-center space-y-3 sm:space-y-4 md:space-y-6 relative z-10 max-w-2xl px-4 sm:px-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extralight text-white">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                    style={{ textShadow: '0 0 40px rgba(193,84,131,0.4)' }}>
                You're ready to claim the Genesis n-Badge
              </span>
            </h1>

            <div className="text-gray-300 space-y-2 px-2 sm:px-4">
              <p className="text-xs sm:text-sm md:text-base leading-relaxed" style={{ color: '#f8fdf1' }}>
                This soulbound NFT represents your status as an original user of the OPN Chain testnet. 
                It's non-transferable and permanently linked to your wallet, serving as proof of your 
                early support and participation in the IOPn ecosystem.
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={handleReplay}
                className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm border border-purple-800/50 text-white font-medium rounded-full hover:border-purple-600/50 hover:bg-purple-900/20 transition-all"
              >
                Watch Again
              </button>
              <button
                onClick={handleContinue}
                className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-full hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                Continue
              </button>
              
              {/* MOBILE ONLY - Links */}
              <div className="flex items-center justify-center gap-2 mt-1 sm:hidden">
                <a 
                  href="https://chain.iopn.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative px-3 py-1.5 text-[10px] overflow-hidden rounded-full transition-all duration-300 flex-1 max-w-[145px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                  <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap block text-center">
                    Visit OPN Chain →
                  </span>
                </a>
                
                <a 
                  href="https://faucet.iopn.tech/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative px-3 py-1.5 text-[10px] overflow-hidden rounded-full transition-all duration-300 flex-1 max-w-[145px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                  <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap block text-center">
                    Get Test Tokens →
                  </span>
                </a>
              </div>
            </div>
          </div>
          
          <footer className="w-full relative z-10">
            <div className="relative">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-600/50 to-transparent" />
              
              <div className="pt-4 pb-3 px-4 sm:px-6 md:px-8">
                {/* MOBILE */}
                <div className="sm:hidden">
                  <div className="space-y-2">
                    <div className="text-center">
                      <p className="text-purple-300/40 text-[9px] font-medium tracking-[0.2em] uppercase">
                        Powered by
                      </p>
                      <p className="text-purple-300/60 text-xs font-light tracking-wider"
                         style={{ textShadow: '0 0 20px rgba(123,50,141,0.3)' }}>
                        OPN Chain
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <button
                        onClick={handleDisconnect}
                        className="px-4 py-1.5 text-[10px] text-gray-500 hover:text-purple-400 transition-colors font-medium"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Desktop */}
                <div className="hidden sm:flex items-center justify-between max-w-7xl mx-auto">
                  <div className="flex-1">
                    <div className="text-left">
                      <p className="text-purple-300/40 text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase">
                        Powered by
                      </p>
                      <p className="text-purple-300/60 text-sm sm:text-base font-light tracking-wider"
                         style={{ textShadow: '0 0 20px rgba(123,50,141,0.3)' }}>
                        OPN Chain
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3 sm:gap-4 flex-1">
                    <a 
                      href="https://chain.iopn.io/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group relative px-4 sm:px-5 py-2 text-xs sm:text-sm overflow-hidden rounded-full transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                      <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap">
                        Visit OPN Chain →
                      </span>
                    </a>
                    
                    <div className="w-px h-4 bg-purple-800/30" />
                    
                    <a 
                      href="https://faucet.iopn.tech/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group relative px-4 sm:px-5 py-2 text-xs sm:text-sm overflow-hidden rounded-full transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                      <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap">
                        Get Test Tokens →
                      </span>
                    </a>
                  </div>
                  
                  <div className="flex-1 flex justify-end">
                    <button
                      onClick={handleDisconnect}
                      className="px-4 sm:px-5 py-2 text-xs sm:text-sm text-gray-500 hover:text-purple-400 transition-colors font-medium"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};

const ClaimPage = ({ onNavigate }) => {
  const { authenticated, logout } = usePrivy();
  const { wallets } = useWallets();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [showLearnMore, setShowLearnMore] = useState(false);

  const LearnMoreModal = () => {
    if (!showLearnMore) return null;
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-purple-950/90 to-black border border-purple-500/30 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
          <div className="p-4 sm:p-6 md:p-8">
            <button
              onClick={() => setShowLearnMore(false)}
              className="float-right text-gray-400 hover:text-white transition-colors p-1"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-2xl sm:text-3xl font-extralight text-white mb-4 sm:mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                About OPN Chain
              </span>
            </h2>
            
            <div className="space-y-4 sm:space-y-6 text-gray-300 text-sm sm:text-base">
              <div>
                <h3 className="text-lg sm:text-xl text-purple-400 mb-2">What is OPN Chain?</h3>
                <p className="leading-relaxed">
                  OPN Chain is the infrastructure layer of the IOPn ecosystem. It's a sovereign Layer 1 blockchain 
                  built using Cosmos SDK and fully EVM-compatible, providing scalability, upgradeability, and full 
                  composability for decentralized applications.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg sm:text-xl text-purple-400 mb-2">Why OPN Chain Exists</h3>
                <ul className="space-y-2 ml-2 sm:ml-4">
                  <li className="flex items-start">
                    <span className="text-pink-400 mr-2">•</span>
                    <span>Give OPN Chain users full control over its infrastructure without reliance on Ethereum gas fees or upgrade cycles</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-400 mr-2">•</span>
                    <span>Empowers the IOPn ecosystem with sovereign infrastructure, enabling true decentralization and user ownership</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-400 mr-2">•</span>
                    <span>Support future expansion into DeFi, DePin, and enterprise apps without scaling concerns</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-400 mr-2">•</span>
                    <span>Power true sovereignty for every project built on OPN Chain</span>
                  </li>
                </ul>
              </div>
              
              <div className="pt-3 sm:pt-4 border-t border-purple-800/30">
                <p className="text-xs sm:text-sm text-gray-400">
                  The foundation on which decentralized apps, smart contracts, infrastructure, token mechanics, 
                  and inter-chain value movement are built.
                </p>
              </div>
            </div>
            
            <div className="mt-6 sm:mt-8 flex justify-center">
              <button
                onClick={() => setShowLearnMore(false)}
                className="px-6 sm:px-8 md:px-10 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-full hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!authenticated) {
      onNavigate('connect');
    }
  }, [authenticated, onNavigate]);

  useEffect(() => {
    const checkClaimStatus = async () => {
      if (wallets.length === 0) return;
      
      setCheckingStatus(true);
      setError(null);
      
      try {
        const address = wallets[0]?.address;
        if (!address) return;

        const publicClient = createPublicClient({
          chain: currentChain,
          transport: http(),
        });

        const isClaimOpen = await publicClient.readContract({
          address: ENV.CONTRACT_ADDRESS,
          abi: Genesis_n_Badge_ABI,
          functionName: 'claimOpen',
        });
        setClaimOpen(isClaimOpen);

        const balance = await publicClient.readContract({
          address: ENV.CONTRACT_ADDRESS,
          abi: Genesis_n_Badge_ABI,
          functionName: 'balanceOf',
          args: [address],
        });
        
        setHasClaimed(balance > 0n);
      } catch (err) {
        console.error('Error checking claim status:', err);
        setError('Failed to check claim status. Please try refreshing the page.');
      } finally {
        setCheckingStatus(false);
      }
    };
    
    if (wallets.length > 0) {
      checkClaimStatus();
    }
  }, [wallets]);

  const handleClaim = async () => {
    if (claiming) return;
    
    setClaiming(true);
    setError(null);
    
    try {
      const wallet = wallets[0];
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      const provider = await wallet.getEthereumProvider();
      await wallet.switchChain(currentChain.id);
      
      const walletClient = createWalletClient({
        account: wallet.address,
        chain: currentChain,
        transport: custom(provider),
      });

      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(),
      });

      const hash = await walletClient.writeContract({
        address: ENV.CONTRACT_ADDRESS,
        abi: Genesis_n_Badge_ABI,
        functionName: 'claim',
      });

      setTxHash(hash);

      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
          timeout: 120_000,
          pollingInterval: 2_000,
        });

        if (receipt.status === 'success') {
          setClaimed(true);
          setHasClaimed(true);
        } else if (receipt.status === 'reverted') {
          throw new Error('Transaction reverted');
        }
      } catch (receiptError) {
        console.warn('Receipt lookup timed out, checking balance...');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
          const balance = await publicClient.readContract({
            address: ENV.CONTRACT_ADDRESS,
            abi: Genesis_n_Badge_ABI,
            functionName: 'balanceOf',
            args: [wallet.address],
          });
          
          if (balance > 0n) {
            setClaimed(true);
            setHasClaimed(true);
            return;
          }
        } catch (balanceError) {
          console.error('Balance check failed:', balanceError);
        }
        
        setError(`Transaction may still be processing. Check here: ${currentChain.blockExplorers.default.url}/tx/${hash}`);
        setTxHash(hash);
      }
    } catch (err) {
      console.error('Error claiming badge:', err);
      
      if (err.message?.includes('rejected') || err.message?.includes('denied')) {
        setError('Transaction cancelled by user');
      } else if (err.message?.includes('AlreadyClaimed') || err.message?.includes('already claimed')) {
        setError('You have already claimed your Genesis n-Badge');
        setHasClaimed(true);
      } else {
        setError('Failed to claim badge. Please try again.');
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleDisconnect = () => {
    logout();
    onNavigate('connect');
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-500 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-gray-400 text-sm sm:text-base">Checking blockchain status...</p>
        </div>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-between p-4 sm:p-6 md:p-8">
        <AnimatedBackground />
        
        <div className="text-center max-w-2xl mx-auto relative z-10 px-4 flex-1 flex flex-col items-center justify-center">
          <div className="mb-4 sm:mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-30" />
              <img 
                src={logoImage} 
                alt="OPN Chain" 
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full object-cover relative z-10 border-2 border-purple-500/20"
                style={{ filter: 'brightness(1.1) contrast(1.1)' }}
              />
            </div>
          </div>
          
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-purple-500/10 border border-purple-500/30">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extralight text-white mb-3 sm:mb-4"
              style={{ textShadow: '0 0 40px rgba(123,50,141,0.4)' }}>
            Success
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mb-6 sm:mb-8">
            Your Genesis n-Badge has been minted to your wallet
          </p>
          
          <div className="space-y-2 sm:space-y-3">
            {txHash && (
              <a href={`${currentChain.blockExplorers.default.url}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 sm:px-8 py-2.5 sm:py-3 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-full hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                View Transaction
              </a>
            )}
            
            <div className="flex items-center justify-center gap-2 sm:hidden">
              <a 
                href="https://chain.iopn.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative px-3 py-1.5 text-[10px] overflow-hidden rounded-full transition-all duration-300 flex-1 max-w-[145px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap block text-center">
                  Visit OPN Chain →
                </span>
              </a>
              
              <a 
                href="https://faucet.iopn.tech/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative px-3 py-1.5 text-[10px] overflow-hidden rounded-full transition-all duration-300 flex-1 max-w-[145px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap block text-center">
                  Get Test Tokens →
                </span>
              </a>
            </div>
            
            {wallets.length > 0 && (
              <p className="text-purple-400/50 text-xs">
                {wallets[0]?.address?.slice(0, 6)}...{wallets[0]?.address?.slice(-4)}
              </p>
            )}
          </div>
        </div>
        
        <footer className="w-full relative z-10 mt-auto">
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-600/50 to-transparent" />
            
            <div className="pt-4 pb-3 px-4 sm:px-6 md:px-8">
              <div className="sm:hidden">
                <div className="space-y-2">
                  <div className="text-center">
                    <p className="text-purple-300/60 text-xs font-light tracking-wider"
                       style={{ textShadow: '0 0 20px rgba(123,50,141,0.3)' }}>
                      Built on OPN Chain
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={handleDisconnect}
                      className="px-4 py-1.5 text-[10px] text-gray-500 hover:text-purple-400 transition-colors font-medium"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="hidden sm:flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex-1">
                  <div className="text-left">
                    <p className="text-purple-300/40 text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase">
                      Powered by
                    </p>
                    <p className="text-purple-300/60 text-sm sm:text-base font-light tracking-wider"
                       style={{ textShadow: '0 0 20px rgba(123,50,141,0.3)' }}>
                      OPN Chain
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-3 sm:gap-4 flex-1">
                  <a 
                    href="https://chain.iopn.io/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative px-4 sm:px-5 py-2 text-xs sm:text-sm overflow-hidden rounded-full transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                    <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap">
                      Visit OPN Chain →
                    </span>
                  </a>
                  
                  <div className="w-px h-4 bg-purple-800/30" />
                  
                  <a 
                    href="https://faucet.iopn.tech/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative px-4 sm:px-5 py-2 text-xs sm:text-sm overflow-hidden rounded-full transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                    <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap">
                      Get Test Tokens →
                    </span>
                  </a>
                </div>
                
                <div className="flex-1 flex justify-end">
                  <button
                    onClick={handleDisconnect}
                    className="px-4 sm:px-5 py-2 text-xs sm:text-sm text-gray-500 hover:text-purple-400 transition-colors font-medium"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div> 
    );
  }

  return (
    <>
      <LearnMoreModal />
      
      <div className="min-h-screen relative flex flex-col p-4 sm:p-6 md:p-8">
        <AnimatedBackground />

        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-8">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extralight text-white mb-4 sm:mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400"
                    style={{ textShadow: '0 0 40px rgba(193,84,131,0.4)' }}>
                Claim Your Badge
              </span>
            </h2>
            
            <div className="mb-4 sm:mb-6">
              <div className="relative inline-block">
                {/* Just a subtle glow around the badge */}
                <div className="absolute -inset-8 bg-gradient-to-br from-blue-500/5 via-blue-600/3 to-purple-600/5 rounded-full blur-[60px]"></div>
                
                {/* No background - badge floats freely */}
                <div className="relative w-48 h-60 sm:w-56 sm:h-72 md:w-64 md:h-80">
                  <img 
                    src={badgeImage} 
                    alt="Genesis n-Badge" 
                    className="w-full h-full object-contain relative z-10"
                  />
                </div>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 px-4 py-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-xs sm:text-sm">{error}</p>
              </div>
            )}
            
            {hasClaimed ? (
              <div className="text-gray-400 space-y-3">
                <p className="text-sm">Badge already claimed ✓</p>
                <button
                  onClick={() => setShowLearnMore(true)}
                  className="px-8 py-2.5 text-sm border border-purple-800/50 text-purple-400 rounded-full hover:border-purple-600/50 hover:bg-purple-900/20 transition-all"
                >
                  Learn More
                </button>
                
                <div className="flex items-center justify-center gap-2 mt-2 sm:hidden">
                  <a 
                    href="https://chain.iopn.io/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative px-3 py-1.5 text-[10px] overflow-hidden rounded-full transition-all duration-300 flex-1 max-w-[145px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                    <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap block text-center">
                      Visit OPN Chain →
                    </span>
                  </a>
                  
                  <a 
                    href="https://faucet.iopn.tech/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative px-3 py-1.5 text-[10px] overflow-hidden rounded-full transition-all duration-300 flex-1 max-w-[145px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                    <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap block text-center">
                      Get Test Tokens →
                    </span>
                  </a>
                </div>
              </div>
            ) : !claimOpen ? (
              <div className="text-gray-400 space-y-3">
                <p className="text-sm">Claiming not open yet</p>
                <p className="text-xs text-purple-400/60">Check back soon!</p>
                <button
                  onClick={() => setShowLearnMore(true)}
                  className="px-8 py-2.5 text-sm border border-purple-800/50 text-purple-400 rounded-full hover:border-purple-600/50 hover:bg-purple-900/20 transition-all"
                >
                  Learn More
                </button>
                
                <div className="flex items-center justify-center gap-2 mt-2 sm:hidden">
                  <a 
                    href="https://chain.iopn.io/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative px-3 py-1.5 text-[10px] overflow-hidden rounded-full transition-all duration-300 flex-1 max-w-[145px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                    <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap block text-center">
                      Visit OPN Chain →
                    </span>
                  </a>
                  
                  <a 
                    href="https://faucet.iopn.tech/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative px-3 py-1.5 text-[10px] overflow-hidden rounded-full transition-all duration-300 flex-1 max-w-[145px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                    <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap block text-center">
                      Get Test Tokens →
                    </span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 items-center">
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="px-10 sm:px-12 py-2.5 sm:py-3 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-full hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {claiming ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {txHash ? 'Confirming...' : 'Claiming...'}
                    </span>
                  ) : (
                    'Claim Badge'
                  )}
                </button>
                
                <button
                  onClick={() => setShowLearnMore(true)}
                  className="px-8 py-2 text-xs border border-purple-800/50 text-purple-400 rounded-full hover:border-purple-600/50 hover:bg-purple-900/20 transition-all"
                >
                  Learn More
                </button>
                
                <div className="flex items-center justify-center gap-2 mt-1 sm:hidden">
                  <a 
                    href="https://chain.iopn.io/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative px-3 py-1.5 text-[10px] overflow-hidden rounded-full transition-all duration-300 flex-1 max-w-[145px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                    <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap block text-center">
                      Visit OPN Chain →
                    </span>
                  </a>
                  
                  <a 
                    href="https://faucet.iopn.tech/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative px-3 py-1.5 text-[10px] overflow-hidden rounded-full transition-all duration-300 flex-1 max-w-[145px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                    <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap block text-center">
                      Get Test Tokens →
                    </span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="w-full relative z-10">
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-600/50 to-transparent" />
            
            <div className="pt-4 pb-3 px-4 sm:px-6 md:px-8">
              <div className="sm:hidden">
                <div className="space-y-2">
                  <div className="text-center">
                    <p className="text-purple-300/40 text-[9px] font-medium tracking-[0.2em] uppercase">
                      Powered by
                    </p>
                    <p className="text-purple-300/60 text-xs font-light tracking-wider"
                       style={{ textShadow: '0 0 20px rgba(123,50,141,0.3)' }}>
                      OPN Chain
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={handleDisconnect}
                      className="px-4 py-1.5 text-[10px] text-gray-500 hover:text-purple-400 transition-colors font-medium"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="hidden sm:flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex-1">
                  <div className="text-left">
                    <p className="text-purple-300/40 text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase">
                      Powered by
                    </p>
                    <p className="text-purple-300/60 text-sm sm:text-base font-light tracking-wider"
                       style={{ textShadow: '0 0 20px rgba(123,50,141,0.3)' }}>
                      OPN Chain
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-3 sm:gap-4 flex-1">
                  <a 
                    href="https://chain.iopn.io/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative px-4 sm:px-5 py-2 text-xs sm:text-sm overflow-hidden rounded-full transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                    <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap">
                      Visit OPN Chain →
                    </span>
                  </a>
                  
                  <div className="w-px h-4 bg-purple-800/30" />
                  
                  <a 
                    href="https://faucet.iopn.tech/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative px-4 sm:px-5 py-2 text-xs sm:text-sm overflow-hidden rounded-full transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-800/20 group-hover:from-purple-800/30 group-hover:to-purple-700/30 transition-all duration-300" />
                    <span className="relative text-purple-300/80 group-hover:text-purple-200 font-medium whitespace-nowrap">
                      Get Test Tokens →
                    </span>
                  </a>
                </div>
                
                <div className="flex-1 flex justify-end">
                  <button
                    onClick={handleDisconnect}
                    className="px-4 sm:px-5 py-2 text-xs sm:text-sm text-gray-500 hover:text-purple-400 transition-colors font-medium"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('connect');

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.location.hash = page === 'connect' ? '' : page;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'video' || hash === 'claim') {
        setCurrentPage(hash);
      } else {
        setCurrentPage('connect');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-black" style={{ zIndex: -1 }}></div>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        html {
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          width: 100vw;
          overflow-x: hidden;
        }
        
        #root {
          min-height: 100vh;
        }
        
        body {
          touch-action: pan-y;
        }
        
        input, select, textarea {
          font-size: 16px !important;
        }
        
        @media (max-width: 768px) {
          [data-privy-dialog], 
          .privy-dialog,
          div[role="dialog"] {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 20px !important;
          }
          
          [data-privy-dialog] > div,
          .privy-dialog > div,
          div[role="dialog"] > div {
            margin: auto !important;
            position: relative !important;
            top: auto !important;
            left: auto !important;
            transform: none !important;
            max-width: 90vw !important;
            max-height: 80vh !important;
          }
        }
      `}</style>
      
      {currentPage === 'connect' && <ConnectPage onNavigate={handleNavigate} />}
      {currentPage === 'video' && <VideoPage onNavigate={handleNavigate} />}
      {currentPage === 'claim' && <ClaimPage onNavigate={handleNavigate} />}
    </div>
  );
}