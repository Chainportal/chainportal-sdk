# Example usage

```javascript
import React from 'react';
import { WalletConnectButton } from 'chain-portal';

function App() {
  const handleConnect = async (provider: string, account: string) => {
    console.log(`Connected to ${provider} with account ${account}`);
  };

  const handleError = (error: Error) => {
    console.error('Connection error:', error.message);
  };

  return (
    <WalletConnectButton
      onConnect={handleConnect}
      onError={handleError}
      theme="light"
    />
  );
}
```