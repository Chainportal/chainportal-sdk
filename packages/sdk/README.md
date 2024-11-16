# Example usage

```javascript
import { WalletConnectButton } from 'chain-portal';

function App() {
  const handleConnect = async (providerId) => {
    // Handle wallet connection logic
    console.log('Connecting to:', providerId);
  };

  return (
    <WalletConnectButton 
      onConnect={handleConnect}
      theme="dark"
      customProviders={[
        {
          id: 'custom-wallet',
          name: 'Custom Wallet',
          icon: '💼',
          description: 'Connect with Custom Wallet'
        }
      ]}
    />
  );
}
```