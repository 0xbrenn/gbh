import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { PrivyProvider } from '@privy-io/react-auth'

// Suppress Privy's internal key warning
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Each child in a list should have a unique "key" prop')) {
    return;
  }
  originalError(...args);
};

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID

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
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <PrivyProvider
    appId={PRIVY_APP_ID}
    config={{
      // Appearance
      appearance: {
        theme: 'dark',
        accentColor: '#C15483',
      },
      // WALLET ONLY - No email or social logins
      loginMethods: ['wallet'],
      
      // OPN Chain configuration
      defaultChain: opnChain,
      supportedChains: [opnChain],
      
      // Wallet options
      walletList: ['metamask', 'wallet_connect', 'rainbow'],
    }}
  >
    <App />
  </PrivyProvider>,
)