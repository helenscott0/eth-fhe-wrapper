// Contracts config for cETH wrapper on Sepolia
// Replace CONTRACT_ADDRESS and ABI with the generated ABI from deployments/sepolia/CETHWrapper.json

export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

export const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "contract IWETH9", "name": "weth", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "rate", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "confidentialBalanceOf", "outputs": [{ "internalType": "euint64", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }], "name": "wrapEth", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "euint64", "name": "amount", "type": "bytes32" }, { "internalType": "bytes", "name": "inputProof", "type": "bytes" } ], "name": "requestUnwrapToEth", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "euint64", "name": "amount", "type": "bytes32" } ], "name": "requestUnwrapToEth", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

