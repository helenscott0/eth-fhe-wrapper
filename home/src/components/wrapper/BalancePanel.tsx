import { useAccount, useReadContract } from 'wagmi';
import { useState } from 'react';
import { useZamaInstance } from '../../hooks/useZamaInstance';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../config/contracts';

export function BalancePanel() {
  const { address } = useAccount();
  const { instance, isLoading } = useZamaInstance();
  const [decrypted, setDecrypted] = useState<string>('');

  const { data: encBalance } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI as any,
    functionName: 'confidentialBalanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000']
  });

  const decrypt = async () => {
    try {
      if (!instance || !address || !encBalance) throw new Error('Not ready');
      const keypair = instance.generateKeypair();

      // one handle to decrypt
      const pairs = [{ handle: encBalance as string, contractAddress: CONTRACT_ADDRESS }];
      const start = Math.floor(Date.now() / 1000).toString();
      const duration = "10";
      const eip712 = instance.createEIP712(keypair.publicKey, [CONTRACT_ADDRESS], start, duration);
      const signature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [address, JSON.stringify({
          domain: eip712.domain,
          types: { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          primaryType: 'UserDecryptRequestVerification',
          message: eip712.message
        })]
      });

      const result = await instance.userDecrypt(
        pairs,
        keypair.privateKey,
        keypair.publicKey,
        (signature as string).replace('0x',''),
        [CONTRACT_ADDRESS],
        address,
        start,
        duration
      );
      setDecrypted(result[encBalance as string] || '0');
    } catch (e:any) {
      alert(e.message || 'Decrypt failed');
    }
  };

  return (
    <div className="card">
      <h2>Your cETH Balance</h2>
      <div className="field">
        <label>Encrypted</label>
        <div className="mono">{(encBalance as string) || '-'}</div>
      </div>
      <button disabled={isLoading || !encBalance} onClick={decrypt}>Decrypt</button>
      {decrypted && (
        <div className="field">
          <label>Decrypted (units)</label>
          <div>{decrypted}</div>
        </div>
      )}
    </div>
  );
}

