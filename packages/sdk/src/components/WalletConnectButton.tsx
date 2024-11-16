// src/WalletConnectButton.tsx
import React, { useState, useCallback } from 'react';
import { Wallet, CheckCircle } from 'lucide-react';

interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface WalletButtonProps {
  onConnect?: (provider: string, account: string) => Promise<void>;
  onVerify?: (account: string) => Promise<void>;
  onError?: (error: Error) => void;
  customProviders?: WalletProvider[];
  className?: string;
  modalTitle?: string;
  buttonText?: string;
  theme?: 'light' | 'dark';
}

declare global {
  interface Window {
    ethereum?: {
      request: (params: { method: string }) => Promise<string[]>;
      isMetaMask?: boolean;
    };
  }
}

const defaultProviders: WalletProvider[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Connect to your MetaMask Wallet'
  }
];

type ConnectionState = 'disconnected' | 'connected' | 'verified';

export const WalletConnectButton: React.FC<WalletButtonProps> = ({
  onConnect = async () => {},
  onVerify = async () => {},
  onError,
  customProviders,
  className = '',
  modalTitle = 'Connect your wallet',
  buttonText = 'Connect Wallet',
  theme = 'light'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState('');
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);

  const providers = customProviders || defaultProviders;

  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    if (!window.ethereum.isMetaMask) {
      throw new Error('Please install MetaMask');
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      return accounts[0];
    } catch (error) {
      throw new Error('Failed to connect to MetaMask');
    }
  }, []);

  const handleConnect = async (providerId: string) => {
    try {
      setLoading(providerId);
      let account: string | undefined;

      if (providerId === 'metamask') {
        account = await connectMetaMask();
      }

      if (account) {
        await onConnect(providerId, account);
        setConnectedAccount(account);
        setConnectionState('connected');
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      onError?.(error instanceof Error ? error : new Error('Unknown error occurred'));
    } finally {
      setLoading('');
    }
  };

  const handleVerify = async () => {
    if (!connectedAccount) return;

    try {
      setLoading('verify');
      await onVerify(connectedAccount);
      setConnectionState('verified');
    } catch (error) {
      console.error('Failed to verify:', error);
      onError?.(error instanceof Error ? error : new Error('Verification failed'));
    } finally {
      setLoading('');
    }
  };

  const getButtonContent = () => {
    switch (connectionState) {
      case 'connected':
        return (
          <>
            <Wallet className="w-5 h-5" />
            {loading === 'verify' ? 'Verifying...' : 'Verify'}
          </>
        );
      case 'verified':
        return (
          <>
            <CheckCircle className="w-5 h-5" />
            Verified
          </>
        );
      default:
        return (
          <>
            <Wallet className="w-5 h-5" />
            {buttonText}
          </>
        );
    }
  };

  const handleButtonClick = () => {
    if (connectionState === 'connected') {
      handleVerify();
    } else if (connectionState === 'disconnected') {
      setIsOpen(true);
    }
  };

  const baseModalClass = 'fixed inset-0 flex items-center justify-center z-50';
  const overlayClass = 'absolute inset-0 bg-black bg-opacity-50';
  const modalContentClass = `
    relative bg-${theme === 'light' ? 'white' : 'gray-900'}
    rounded-2xl p-6 max-w-md w-full mx-4
    shadow-xl transform transition-all
  `;

  return (
    <>
      <button
        onClick={handleButtonClick}
        disabled={loading !== ''}
        className={`
          inline-flex items-center justify-center gap-2 
          px-4 py-2 rounded-lg font-medium
          transition-all duration-200
          ${connectionState === 'verified'
            ? `${theme === 'light' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-700 hover:bg-green-800'}`
            : theme === 'light'
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-800 hover:bg-gray-700'}
          text-white
          ${loading ? 'opacity-75 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        {getButtonContent()}
      </button>

      {isOpen && (
        <div className={baseModalClass}>
          <div className={overlayClass} onClick={() => setIsOpen(false)} />
          <div className={modalContentClass}>
            <div className="mb-4">
              <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                {modalTitle}
              </h2>
              <p className={`mt-1 text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                Connect with MetaMask to continue
              </p>
            </div>

            <div className="space-y-2">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleConnect(provider.id)}
                  disabled={!!loading}
                  className={`
                    w-full flex items-center p-3 rounded-lg
                    transition-all duration-200
                    ${theme === 'light'
                      ? 'hover:bg-gray-50 border border-gray-200'
                      : 'hover:bg-gray-800 border border-gray-700'}
                    ${loading === provider.id ? 'opacity-75' : ''}
                  `}
                >
                  <span className="text-2xl mr-3">{provider.icon}</span>
                  <div className="flex-1 text-left">
                    <h3 className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                      {provider.name}
                    </h3>
                    {provider.description && (
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {provider.description}
                      </p>
                    )}
                  </div>
                  {loading === provider.id && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className={`
                mt-4 w-full py-2 px-4 rounded-lg text-sm
                transition-all duration-200
                ${theme === 'light'
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'text-gray-400 hover:bg-gray-800'}
              `}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletConnectButton;