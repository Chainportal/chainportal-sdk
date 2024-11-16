import Web3 from 'web3';
import { recoverPersonalSignature } from '@metamask/eth-sig-util';

// Renamed and restructured configuration interfaces
interface TokenStandardConfig {
  eventNames: {
    transfer?: string;
    singleTransfer?: string;
    batchTransfer?: string;
  };
  parameterNames: {
    recipient?: string;
    tokenId?: string;
    tokenIds?: string;
  };
  methods: {
    getBalance?: string;
    getBatchBalance?: string;
  };
  blockRange?: {
    start?: number;
    end?: string | number;
  };
}

const TOKEN_STANDARDS = {
  ERC721: {
    eventNames: {
      transfer: 'Transfer'
    },
    parameterNames: {
      recipient: 'to',
      tokenId: 'tokenId'
    },
    methods: {
      getBalance: 'balanceOf'
    },
    blockRange: {
      start: 0,
      end: 'latest'
    }
  },
  ERC1155: {
    eventNames: {
      singleTransfer: 'TransferSingle',
      batchTransfer: 'TransferBatch'
    },
    parameterNames: {
      recipient: 'to',
      tokenId: 'id',
      tokenIds: 'ids'
    },
    methods: {
      getBalance: 'balanceOf',
      getBatchBalance: 'balanceOfBatch'
    },
    blockRange: {
      start: 0,
      end: 'latest'
    }
  }
} as const;

interface ChainGateConfig {
  rpcEndpoint?: string;
  web3Instance?: Web3;
  contractConfigs?: ContractConfig[];
}

interface ContractConfig {
  contractAddress: string;
  contractABI: any;
}

export class ChainGateAuth {
  private web3Client: Web3;
  private contractRegistry: Map<string, any> = new Map();

  constructor(config: ChainGateConfig) {
    if (!config.rpcEndpoint && !config.web3Instance) {
      throw new Error('ChainGateAuth requires either an RPC endpoint or Web3 instance');
    }
    
    this.web3Client = config.web3Instance || new Web3(config.rpcEndpoint!);
    
    if (config.contractConfigs) {
      config.contractConfigs.forEach(({ contractAddress, contractABI }) => {
        this.registerContract(contractAddress, contractABI);
      });
    }
  }

  private registerContract(address: string, abi: any): void {
    if (!address || !abi) {
      throw new Error('Contract registration requires both address and ABI');
    }
    this.contractRegistry.set(address, new this.web3Client.eth.Contract(abi, address));
  }

  async getTokenHoldings(params: {
    walletAddress: string;
    contractAddress: string;
    standard: 'ERC721' | 'ERC1155';
    config?: TokenStandardConfig;
  }): Promise<number[]> {
    const { walletAddress, contractAddress, standard, config } = params;
    const defaultConfig = TOKEN_STANDARDS[standard];
    const mergedConfig = { ...defaultConfig, ...config };

    const contract = this.contractRegistry.get(contractAddress);
    if (!contract) {
      throw new Error(`Contract ${contractAddress} not registered`);
    }

    if (standard === 'ERC721') {
      return this.fetchERC721Holdings(contract, walletAddress, mergedConfig);
    } else {
      return this.fetchERC1155Holdings(contract, walletAddress, mergedConfig);
    }
  }

  private async fetchERC721Holdings(
    contract: any,
    walletAddress: string,
    config: TokenStandardConfig
  ): Promise<number[]> {
    const holdings: number[] = [];
    const transferEvents = await this.getTransferEvents(contract, walletAddress, config);

    for (const event of transferEvents.reverse()) {
      const tokenId = event.returnValues[config.parameterNames.tokenId!];
      if (!tokenId) continue;

      const balance = await contract.methods[config.methods.getBalance!](walletAddress, tokenId).call();
      if (parseInt(balance) > 0) {
        holdings.push(parseInt(tokenId));
      }
    }

    return holdings;
  }

  private async fetchERC1155Holdings(
    contract: any,
    walletAddress: string,
    config: TokenStandardConfig
  ): Promise<number[]> {
    const holdings: number[] = [];
    const filter = { [config.parameterNames.recipient!]: walletAddress };
    const blockRange = { fromBlock: config.blockRange?.start, toBlock: config.blockRange?.end };

    // Handle batch transfers
    const batchEvents = await contract.getPastEvents(config.eventNames.batchTransfer!, {
      filter,
      ...blockRange
    });

    for (const event of batchEvents.reverse()) {
      const ids = event.returnValues[config.parameterNames.tokenIds!];
      if (!ids) continue;

      const balances = await contract.methods[config.methods.getBatchBalance!](walletAddress, ids).call();
      balances.forEach((balance: string, index: number) => {
        if (parseInt(balance) > 0) {
          holdings.push(parseInt(ids[index]));
        }
      });
    }

    // Handle single transfers
    const singleEvents = await contract.getPastEvents(config.eventNames.singleTransfer!, {
      filter,
      ...blockRange
    });

    for (const event of singleEvents.reverse()) {
      const tokenId = event.returnValues[config.parameterNames.tokenId!];
      if (!tokenId) continue;

      const balance = await contract.methods[config.methods.getBalance!](walletAddress, tokenId).call();
      if (parseInt(balance) > 0) {
        holdings.push(parseInt(tokenId));
      }
    }

    return [...new Set(holdings)]; // Remove duplicates
  }

  private async getTransferEvents(contract: any, walletAddress: string, config: TokenStandardConfig) {
    const filter = { [config.parameterNames.recipient!]: walletAddress };
    return contract.getPastEvents(config.eventNames.transfer!, {
      filter,
      fromBlock: config.blockRange?.start,
      toBlock: config.blockRange?.end
    });
  }

  async verifyTokenOwnership(params: {
    walletAddress: string;
    contractAddress: string;
    standard: 'ERC721' | 'ERC1155';
    config?: TokenStandardConfig;
  }): Promise<boolean> {
    const holdings = await this.getTokenHoldings(params);
    return holdings.length > 0;
  }

  async verifySignedOwnership(params: {
    signature: string;
    message: string;
    contractAddress: string;
    standard: 'ERC721' | 'ERC1155';
    config?: TokenStandardConfig;
  }): Promise<boolean> {
    const { signature, message, ...rest } = params;
    
    const recoveredAddress = recoverPersonalSignature({
      data: message,
      signature: signature
    });

    return this.verifyTokenOwnership({
      ...rest,
      walletAddress: recoveredAddress
    });
  }

  async getTokenBalance(params: {
    walletAddress: string;
    contractAddress: string;
    standard: 'ERC721' | 'ERC1155';
  }): Promise<number> {
    const holdings = await this.getTokenHoldings(params);
    return holdings.length;
  }
}