import { AutomatorVaultInfo } from '../base-type';

function creatorAutomatorFactories(params: {
  chainId: number;
  wallet: string;
}) {
  if (![421614, 42161, 11155111].includes(params.chainId)) return [];
  return [
    {
      chainId: params.chainId,
      chainName: 'Test chain',
      clientDepositCcy: 'USDT',
      vaultDepositCcy: 'USDC',
      factoryAddress: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
      vaultDepositCcyAddress: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
      clientDepositCcyAddress: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    },
  ];
}
function automatorList(params: { chainId: number }) {
  if (![421614, 42161, 11155111].includes(params.chainId)) return [];
  return [
    {
      chainId: params.chainId,
      automatorName: 'Pilot',
      automatorDescription: 'usdt bull',
      automatorVault: '0x4c241483b4a85e44c59bcecfe17a4e7d0a073cdb',
      participantNum: 163,
      amount: '749253.768460114841584995004',
      aumInVaultDepositCcy: '749253.768460114841584995004',
      aumInClientDepositCcy: '749253.768460114841584995004',
      aumByVaultDepositCcy: '749253.768460114841584995004',
      aumByClientDepositCcy: '749253.768460114841584995004',
      creatorAmount: '0',
      creatorAumInVaultDepositCcy: '0',
      creatorAumInClientDepositCcy: '0',
      creatorAumByVaultDepositCcy: '0',
      creatorAumByClientDepositCcy: '0',
      nav: '0.9958851936491708',
      dateTime: '1736495956',
      yieldPercentage: '-28.36',
      creator: '0xc59023d3fdd79fcee662d1f06eba0b1bfd49b8f3',
      createTime: '1730269711',
      feeRate: '0',
      totalTradingPnlByClientDepositCcy: '-3426.958621885158415004996',
      totalInterestPnlByClientDepositCcy: '0',
      totalPnlByClientDepositCcy: '-3426.958621885158415004996',
      totalRchPnlByClientDepositCcy: '4319.1536467123489674137285674',
      totalRchAmount: '10805.205265646',
      totalPnlWithRchByClientDepositCcy: '892.1950248271905524087325674',
      pnlPercentage: '0.1',
      vaultDepositCcy: 'USDT',
      clientDepositCcy: 'USDT',
      sharesToken: 'atUSDT',
      profits: '0',
      vaultInfo: {
        chainId: params.chainId,
        automatorName: 'Pilot',
        automatorDescription: 'usdt bull',
        automatorVault: '0x4c241483b4a85e44c59bcecfe17a4e7d0a073cdb',
        participantNum: 163,
        amount: '749253.768460114841584995004',
        aumInVaultDepositCcy: '749253.768460114841584995004',
        aumInClientDepositCcy: '749253.768460114841584995004',
        aumByVaultDepositCcy: '749253.768460114841584995004',
        aumByClientDepositCcy: '749253.768460114841584995004',
        creatorAmount: '0',
        creatorAumInVaultDepositCcy: '0',
        creatorAumInClientDepositCcy: '0',
        creatorAumByVaultDepositCcy: '0',
        creatorAumByClientDepositCcy: '0',
        nav: '0.9958851936491708',
        dateTime: '1736495956',
        yieldPercentage: '-28.36',
        creator: '0xCc19E60c86C396929E76a6a488848C9596de22bd',
        createTime: 1732435200000,
        feeRate: '0',
        totalTradingPnlByClientDepositCcy: '-3426.958621885158415004996',
        totalInterestPnlByClientDepositCcy: '0',
        totalPnlByClientDepositCcy: '-3426.958621885158415004996',
        totalRchPnlByClientDepositCcy: '4319.1536467123489674137285674',
        totalRchAmount: '10805.205265646',
        totalPnlWithRchByClientDepositCcy: '892.1950248271905524087325674',
        pnlPercentage: '0.1',
        vaultDepositCcy: 'USDT',
        clientDepositCcy: 'USDT',
        sharesToken: 'atUSDT',
        profits: '0',
        vault: '0x4c241483b4a85e44c59bcecfe17a4e7d0a073cdb',
        depositCcy: 'USDT',
        positionCcy: 'atUSDT',
        redeemWaitPeriod: null,
        claimPeriod: 259200000,
        name: 'Pilot',
        depositMinAmount: 100,
        depositTickAmount: 1,
        anchorPricesDecimal: 100000000,
        collateralDecimal: 1000000,
        abis: [
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'spender',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
              },
            ],
            name: 'Approval',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'account',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'shares',
                type: 'uint256',
              },
            ],
            name: 'Deposited',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: false,
                internalType: 'address',
                name: 'account',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
              },
            ],
            name: 'FeeCollected',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: false,
                internalType: 'uint8',
                name: 'version',
                type: 'uint8',
              },
            ],
            name: 'Initialized',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: false,
                internalType: 'address[]',
                name: 'makers',
                type: 'address[]',
              },
            ],
            name: 'MakersDisabled',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: false,
                internalType: 'address[]',
                name: 'makers',
                type: 'address[]',
              },
            ],
            name: 'MakersEnabled',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'previousOwner',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
              },
            ],
            name: 'OwnershipTransferred',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                components: [
                  { internalType: 'address', name: 'vault', type: 'address' },
                  {
                    components: [
                      {
                        internalType: 'uint256',
                        name: 'expiry',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256[2]',
                        name: 'anchorPrices',
                        type: 'uint256[2]',
                      },
                      {
                        internalType: 'uint256',
                        name: 'collateralAtRiskPercentage',
                        type: 'uint256',
                      },
                    ],
                    internalType: 'struct Product[]',
                    name: 'products',
                    type: 'tuple[]',
                  },
                ],
                indexed: false,
                internalType: 'struct Automator.ProductBurn[]',
                name: 'products',
                type: 'tuple[]',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'totalCollateral',
                type: 'uint256',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'fee',
                type: 'uint256',
              },
            ],
            name: 'ProductsBurned',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                components: [
                  { internalType: 'address', name: 'vault', type: 'address' },
                  {
                    internalType: 'uint256',
                    name: 'totalCollateral',
                    type: 'uint256',
                  },
                  {
                    components: [
                      {
                        internalType: 'uint256',
                        name: 'expiry',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256[2]',
                        name: 'anchorPrices',
                        type: 'uint256[2]',
                      },
                      {
                        internalType: 'uint256',
                        name: 'collateralAtRisk',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'makerCollateral',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'deadline',
                        type: 'uint256',
                      },
                      {
                        internalType: 'address',
                        name: 'maker',
                        type: 'address',
                      },
                      {
                        internalType: 'bytes',
                        name: 'makerSignature',
                        type: 'bytes',
                      },
                    ],
                    internalType: 'struct MintParams',
                    name: 'mintParams',
                    type: 'tuple',
                  },
                ],
                indexed: false,
                internalType: 'struct Automator.ProductMint[]',
                name: 'products',
                type: 'tuple[]',
              },
            ],
            name: 'ProductsMinted',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'account',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'shares',
                type: 'uint256',
              },
            ],
            name: 'RedemptionsClaimed',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: false,
                internalType: 'address',
                name: 'referral',
                type: 'address',
              },
            ],
            name: 'ReferralUpdated',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'from',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'to',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
              },
            ],
            name: 'Transfer',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: false,
                internalType: 'address[]',
                name: 'vaults',
                type: 'address[]',
              },
            ],
            name: 'VaultsDisabled',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: false,
                internalType: 'address[]',
                name: 'vaults',
                type: 'address[]',
              },
            ],
            name: 'VaultsEnabled',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'account',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'shares',
                type: 'uint256',
              },
            ],
            name: 'Withdrawn',
            type: 'event',
          },
          {
            inputs: [],
            name: 'MINIMUM_SHARES',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: 'owner', type: 'address' },
              { internalType: 'address', name: 'spender', type: 'address' },
            ],
            name: 'allowance',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: 'spender', type: 'address' },
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'approve',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: 'account', type: 'address' },
            ],
            name: 'balanceOf',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                components: [
                  { internalType: 'address', name: 'vault', type: 'address' },
                  {
                    components: [
                      {
                        internalType: 'uint256',
                        name: 'expiry',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256[2]',
                        name: 'anchorPrices',
                        type: 'uint256[2]',
                      },
                      {
                        internalType: 'uint256',
                        name: 'collateralAtRiskPercentage',
                        type: 'uint256',
                      },
                    ],
                    internalType: 'struct Product[]',
                    name: 'products',
                    type: 'tuple[]',
                  },
                ],
                internalType: 'struct Automator.ProductBurn[]',
                name: 'products',
                type: 'tuple[]',
              },
            ],
            name: 'burnProducts',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [],
            name: 'claimRedemptions',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [],
            name: 'collateral',
            outputs: [
              { internalType: 'contract IERC20', name: '', type: 'address' },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'decimals',
            outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: 'spender', type: 'address' },
              {
                internalType: 'uint256',
                name: 'subtractedValue',
                type: 'uint256',
              },
            ],
            name: 'decreaseAllowance',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'deposit',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address[]', name: 'makers_', type: 'address[]' },
            ],
            name: 'disableMakers',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address[]', name: 'vaults_', type: 'address[]' },
            ],
            name: 'disableVaults',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address[]', name: 'makers_', type: 'address[]' },
            ],
            name: 'enableMakers',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address[]', name: 'vaults_', type: 'address[]' },
            ],
            name: 'enableVaults',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [],
            name: 'feeCollector',
            outputs: [{ internalType: 'address', name: '', type: 'address' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'getPricePerShare',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'getRedemption',
            outputs: [
              { internalType: 'uint256', name: '', type: 'uint256' },
              { internalType: 'uint256', name: '', type: 'uint256' },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'getUnredeemedCollateral',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'harvest',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: 'spender', type: 'address' },
              { internalType: 'uint256', name: 'addedValue', type: 'uint256' },
            ],
            name: 'increaseAllowance',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: 'collateral_', type: 'address' },
              { internalType: 'address', name: 'referral_', type: 'address' },
              {
                internalType: 'address',
                name: 'feeCollector_',
                type: 'address',
              },
            ],
            name: 'initialize',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [{ internalType: 'address', name: '', type: 'address' }],
            name: 'makers',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                components: [
                  { internalType: 'address', name: 'vault', type: 'address' },
                  {
                    internalType: 'uint256',
                    name: 'totalCollateral',
                    type: 'uint256',
                  },
                  {
                    components: [
                      {
                        internalType: 'uint256',
                        name: 'expiry',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256[2]',
                        name: 'anchorPrices',
                        type: 'uint256[2]',
                      },
                      {
                        internalType: 'uint256',
                        name: 'collateralAtRisk',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'makerCollateral',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'deadline',
                        type: 'uint256',
                      },
                      {
                        internalType: 'address',
                        name: 'maker',
                        type: 'address',
                      },
                      {
                        internalType: 'bytes',
                        name: 'makerSignature',
                        type: 'bytes',
                      },
                    ],
                    internalType: 'struct MintParams',
                    name: 'mintParams',
                    type: 'tuple',
                  },
                ],
                internalType: 'struct Automator.ProductMint[]',
                name: 'products',
                type: 'tuple[]',
              },
              { internalType: 'bytes', name: 'signature', type: 'bytes' },
            ],
            name: 'mintProducts',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [],
            name: 'name',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: '', type: 'address' },
              { internalType: 'address', name: '', type: 'address' },
              { internalType: 'uint256[]', name: '', type: 'uint256[]' },
              { internalType: 'uint256[]', name: '', type: 'uint256[]' },
              { internalType: 'bytes', name: '', type: 'bytes' },
            ],
            name: 'onERC1155BatchReceived',
            outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: '', type: 'address' },
              { internalType: 'address', name: '', type: 'address' },
              { internalType: 'uint256', name: '', type: 'uint256' },
              { internalType: 'uint256', name: '', type: 'uint256' },
              { internalType: 'bytes', name: '', type: 'bytes' },
            ],
            name: 'onERC1155Received',
            outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [],
            name: 'owner',
            outputs: [{ internalType: 'address', name: '', type: 'address' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'referral',
            outputs: [{ internalType: 'address', name: '', type: 'address' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'renounceOwnership',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' },
            ],
            name: 'supportsInterface',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'symbol',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'totalCollateral',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'totalFee',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'totalPendingRedemptions',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'totalSupply',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: 'to', type: 'address' },
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'transfer',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: 'from', type: 'address' },
              { internalType: 'address', name: 'to', type: 'address' },
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'transferFrom',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: 'newOwner', type: 'address' },
            ],
            name: 'transferOwnership',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'address', name: 'referral_', type: 'address' },
            ],
            name: 'updateReferral',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [{ internalType: 'address', name: '', type: 'address' }],
            name: 'vaults',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              { internalType: 'uint256', name: 'shares', type: 'uint256' },
            ],
            name: 'withdraw',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        creatorFeeRate: 0,
        desc: 'usdt bull',
      },
    },
  ];
}
function creatorAutomatorList(params: { chainId: number; wallet: string }) {
  if (![421614, 42161, 11155111].includes(params.chainId)) return [];
  return [
    {
      chainId: params.chainId,
      automatorName: 'Pilot',
      automatorDescription: 'usdt bull',
      automatorVault: '0x4c241483b4a85e44c59bcecfe17a4e7d0a073cdb',
      participantNum: 161,
      amount: '739028.7273727934330190476193',
      aumInVaultDepositCcy: '739028.7273727934330190476193',
      aumInClientDepositCcy: '739028.7273727934330190476193',
      aumByVaultDepositCcy: '739028.7273727934330190476193',
      aumByClientDepositCcy: '739028.7273727934330190476193',
      creatorAmount: '0',
      creatorAumInVaultDepositCcy: '0',
      creatorAumInClientDepositCcy: '0',
      creatorAumByVaultDepositCcy: '0',
      creatorAumByClientDepositCcy: '0',
      nav: '1.0052065608808387',
      dateTime: '1736162651',
      yieldPercentage: '28.28',
      creator: '0xc59023d3fdd79fcee662d1f06eba0b1bfd49b8f3',
      createTime: '1730269711',
      feeRate: '0',
      totalTradingPnlByClientDepositCcy: '3584.8269417934330190476193',
      totalInterestPnlByClientDepositCcy: '0',
      totalPnlByClientDepositCcy: '3584.8269417934330190476193',
      totalRchPnlByClientDepositCcy: '4243.1769613336871976',
      totalRchAmount: '9816.7832955848',
      totalPnlWithRchByClientDepositCcy: '7828.0039031271202166476193',
      pnlPercentage: '0.9',
      vaultDepositCcy: 'USDT',
      clientDepositCcy: 'USDT',
      sharesToken: 'atUSDT',
      profits: '0',
      vaultInfo: {
        chainId: params.chainId,
        automatorName: 'Pilot',
        automatorDescription: 'usdt bull',
        automatorVault: '0x4c241483b4a85e44c59bcecfe17a4e7d0a073cdb',
        participantNum: 161,
        amount: '739028.7273727934330190476193',
        aumInVaultDepositCcy: '739028.7273727934330190476193',
        aumInClientDepositCcy: '739028.7273727934330190476193',
        aumByVaultDepositCcy: '739028.7273727934330190476193',
        aumByClientDepositCcy: '739028.7273727934330190476193',
        creatorAmount: '0',
        creatorAumInVaultDepositCcy: '0',
        creatorAumInClientDepositCcy: '0',
        creatorAumByVaultDepositCcy: '0',
        creatorAumByClientDepositCcy: '0',
        nav: '1.0052065608808387',
        dateTime: '1736162651',
        yieldPercentage: '28.28',
        creator: '0xCc19E60c86C396929E76a6a488848C9596de22bd',
        createTime: 1732435200000,
        feeRate: '0',
        totalTradingPnlByClientDepositCcy: '3584.8269417934330190476193',
        totalInterestPnlByClientDepositCcy: '0',
        totalPnlByClientDepositCcy: '3584.8269417934330190476193',
        totalRchPnlByClientDepositCcy: '4243.1769613336871976',
        totalRchAmount: '9816.7832955848',
        totalPnlWithRchByClientDepositCcy: '7828.0039031271202166476193',
        pnlPercentage: '0.9',
        vaultDepositCcy: 'USDT',
        clientDepositCcy: 'USDT',
        sharesToken: 'atUSDT',
        profits: '0',
        vault: '0x4C241483B4a85e44C59bcEcFe17A4E7d0A073CDB',
        name: 'USDT',
        desc: 'usdt bull',
        creatorFeeRate: 0,
        depositCcy: 'USDT',
        positionCcy: 'atUSDT',
        redeemWaitPeriod: 604800000,
        claimPeriod: 259200000,
        interestType: 'Aave',
        abis: [
          {
            inputs: [
              {
                internalType: 'address',
                name: 'pool_',
                type: 'address',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'constructor',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'spender',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
              },
            ],
            name: 'Approval',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'account',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'yieldShares',
                type: 'uint256',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'shares',
                type: 'uint256',
              },
            ],
            name: 'Deposited',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: false,
                internalType: 'address',
                name: 'account',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'feeAmount',
                type: 'uint256',
              },
              {
                indexed: false,
                internalType: 'int256',
                name: 'fee',
                type: 'int256',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'protocolFeeAmount',
                type: 'uint256',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'protocolFee',
                type: 'uint256',
              },
            ],
            name: 'FeeCollected',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'previousOwner',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
              },
            ],
            name: 'OwnershipTransferred',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                components: [
                  {
                    internalType: 'address',
                    name: 'vault',
                    type: 'address',
                  },
                  {
                    components: [
                      {
                        internalType: 'uint256',
                        name: 'expiry',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256[2]',
                        name: 'anchorPrices',
                        type: 'uint256[2]',
                      },
                    ],
                    internalType: 'struct Product[]',
                    name: 'products',
                    type: 'tuple[]',
                  },
                ],
                indexed: false,
                internalType: 'struct AAVEAutomatorBase.ProductBurn[]',
                name: 'products',
                type: 'tuple[]',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'accCollateralPerShare',
                type: 'uint256',
              },
              {
                indexed: false,
                internalType: 'int256',
                name: 'fee',
                type: 'int256',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'protocolFee',
                type: 'uint256',
              },
            ],
            name: 'ProductsBurned',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                components: [
                  {
                    internalType: 'address',
                    name: 'vault',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'totalCollateral',
                    type: 'uint256',
                  },
                  {
                    components: [
                      {
                        internalType: 'uint256',
                        name: 'expiry',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256[2]',
                        name: 'anchorPrices',
                        type: 'uint256[2]',
                      },
                      {
                        internalType: 'uint256',
                        name: 'makerCollateral',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'deadline',
                        type: 'uint256',
                      },
                      {
                        internalType: 'address',
                        name: 'maker',
                        type: 'address',
                      },
                      {
                        internalType: 'bytes',
                        name: 'makerSignature',
                        type: 'bytes',
                      },
                    ],
                    internalType: 'struct MintParams',
                    name: 'mintParams',
                    type: 'tuple',
                  },
                ],
                indexed: false,
                internalType: 'struct AAVEAutomatorBase.ProductMint[]',
                name: 'products',
                type: 'tuple[]',
              },
            ],
            name: 'ProductsMinted',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'account',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'yieldShares',
                type: 'uint256',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'shares',
                type: 'uint256',
              },
            ],
            name: 'RedemptionsClaimed',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'from',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'to',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
              },
            ],
            name: 'Transfer',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'account',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'shares',
                type: 'uint256',
              },
            ],
            name: 'Withdrawn',
            type: 'event',
          },
          {
            inputs: [],
            name: 'MINIMUM_SHARES',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'aToken',
            outputs: [
              {
                internalType: 'contract IAToken',
                name: '',
                type: 'address',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'owner',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'spender',
                type: 'address',
              },
            ],
            name: 'allowance',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'spender',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
              },
            ],
            name: 'approve',
            outputs: [
              {
                internalType: 'bool',
                name: '',
                type: 'bool',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'account',
                type: 'address',
              },
            ],
            name: 'balanceOf',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                components: [
                  {
                    internalType: 'address',
                    name: 'vault',
                    type: 'address',
                  },
                  {
                    components: [
                      {
                        internalType: 'uint256',
                        name: 'expiry',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256[2]',
                        name: 'anchorPrices',
                        type: 'uint256[2]',
                      },
                    ],
                    internalType: 'struct Product[]',
                    name: 'products',
                    type: 'tuple[]',
                  },
                ],
                internalType: 'struct AAVEAutomatorBase.ProductBurn[]',
                name: 'products',
                type: 'tuple[]',
              },
            ],
            name: 'burnProducts',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [],
            name: 'claimRedemptions',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [],
            name: 'collateral',
            outputs: [
              {
                internalType: 'contract IERC20',
                name: '',
                type: 'address',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'decimals',
            outputs: [
              {
                internalType: 'uint8',
                name: '',
                type: 'uint8',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'spender',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'subtractedValue',
                type: 'uint256',
              },
            ],
            name: 'decreaseAllowance',
            outputs: [
              {
                internalType: 'bool',
                name: '',
                type: 'bool',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
              },
            ],
            name: 'deposit',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [],
            name: 'factory',
            outputs: [
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'feeRate',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'getPricePerShare',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'getRedemption',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'getUnredeemedCollateral',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'harvest',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'spender',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'addedValue',
                type: 'uint256',
              },
            ],
            name: 'increaseAllowance',
            outputs: [
              {
                internalType: 'bool',
                name: '',
                type: 'bool',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'owner_',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'collateral_',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'feeRate_',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'maxPeriod_',
                type: 'uint256',
              },
            ],
            name: 'initialize',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [],
            name: 'maxPeriod',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                components: [
                  {
                    internalType: 'address',
                    name: 'vault',
                    type: 'address',
                  },
                  {
                    internalType: 'uint256',
                    name: 'totalCollateral',
                    type: 'uint256',
                  },
                  {
                    components: [
                      {
                        internalType: 'uint256',
                        name: 'expiry',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256[2]',
                        name: 'anchorPrices',
                        type: 'uint256[2]',
                      },
                      {
                        internalType: 'uint256',
                        name: 'makerCollateral',
                        type: 'uint256',
                      },
                      {
                        internalType: 'uint256',
                        name: 'deadline',
                        type: 'uint256',
                      },
                      {
                        internalType: 'address',
                        name: 'maker',
                        type: 'address',
                      },
                      {
                        internalType: 'bytes',
                        name: 'makerSignature',
                        type: 'bytes',
                      },
                    ],
                    internalType: 'struct MintParams',
                    name: 'mintParams',
                    type: 'tuple',
                  },
                ],
                internalType: 'struct AAVEAutomatorBase.ProductMint[]',
                name: 'products',
                type: 'tuple[]',
              },
              {
                internalType: 'bytes',
                name: 'signature',
                type: 'bytes',
              },
            ],
            name: 'mintProducts',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [],
            name: 'name',
            outputs: [
              {
                internalType: 'string',
                name: '',
                type: 'string',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
              {
                internalType: 'uint256[]',
                name: '',
                type: 'uint256[]',
              },
              {
                internalType: 'uint256[]',
                name: '',
                type: 'uint256[]',
              },
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
            ],
            name: 'onERC1155BatchReceived',
            outputs: [
              {
                internalType: 'bytes4',
                name: '',
                type: 'bytes4',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
              {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
              },
            ],
            name: 'onERC1155Received',
            outputs: [
              {
                internalType: 'bytes4',
                name: '',
                type: 'bytes4',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [],
            name: 'owner',
            outputs: [
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'pool',
            outputs: [
              {
                internalType: 'contract IPool',
                name: '',
                type: 'address',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'bytes4',
                name: 'interfaceId',
                type: 'bytes4',
              },
            ],
            name: 'supportsInterface',
            outputs: [
              {
                internalType: 'bool',
                name: '',
                type: 'bool',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'symbol',
            outputs: [
              {
                internalType: 'string',
                name: '',
                type: 'string',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'totalCollateral',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'totalFee',
            outputs: [
              {
                internalType: 'int256',
                name: '',
                type: 'int256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'totalPendingRedemptions',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'totalPositions',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'totalProtocolFee',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'totalSupply',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'to',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
              },
            ],
            name: 'transfer',
            outputs: [
              {
                internalType: 'bool',
                name: '',
                type: 'bool',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'from',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'to',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
              },
            ],
            name: 'transferFrom',
            outputs: [
              {
                internalType: 'bool',
                name: '',
                type: 'bool',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
              },
            ],
            name: 'transferOwnership',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'uint256',
                name: 'shares',
                type: 'uint256',
              },
            ],
            name: 'withdraw',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        collateralDecimal: 1000000,
        anchorPricesDecimal: 100000000,
        depositMinAmount: 100,
        depositTickAmount: 1,
      },
    },
  ];
}

function automatorFollowers(params: AutomatorVaultInfo) {
  return {
    offset: 0,
    limit: 20,
    total: 1,
    list: [
      {
        wallet: '0xe1F64E17223F6D8D0F62d9d42dB694eb2dF90e40',
        amountByVaultDepositCcy: '1000',
        amountByClientDepositCcy: '1000',
        share: '1001',
        totalInterestPnlByClientDepositCcy: '10',
        totalPnlByClientDepositCcy: '10',
        totalRchPnlByClientDepositCcy: '10',
        totalRchAmount: '3.4',
        followDay: '23',
        pnlPercentage: '0.1',
      },
    ],
  };
}

if (!window.mockData) window.mockData = {};

window.mockData.creatorAutomatorList = creatorAutomatorList;
window.mockData.automatorFollowers = automatorFollowers;
window.mockData.creatorAutomatorFactories = creatorAutomatorFactories;
window.mockData.automatorList = automatorList;
