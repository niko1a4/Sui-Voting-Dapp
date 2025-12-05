import { useState, useEffect } from 'react';
import { ConnectButton, useCurrentAccount, useSignTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import './App.css';
import VotingCard from './components/VotingCard';
import ResultsCard from './components/ResultsCard';

const PACKAGE_ID = '0x994298cc21abfa191b0c90b87c9bef756ff69740726999f49d8e98d76cc092db';
const POLL_ID = '0x35a323cf92fa13bb220ba03171da218861b1dc632badbd9cea8952df132d5471';
const BACKEND_URL = 'http://localhost:3001';

interface PollData {
  question: string;
  options: string[];
  voteCounts: number[];
}

function App() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const suiClient = useSuiClient();

  const [pollData, setPollData] = useState<PollData | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [votingInProgress, setVotingInProgress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const fetchPollData = async () => {
    try {
      const object = await suiClient.getObject({
        id: POLL_ID,
        options: { showContent: true }
      });

      if (object.data && object.data.content && 'fields' in object.data.content) {
        const fields = object.data.content.fields as any;
        setPollData({
          question: fields.question,
          options: fields.options,
          voteCounts: fields.vote_counts.map((count: string) => parseInt(count))
        });

        if (currentAccount) {
          const voterAddress = currentAccount.address;
          const voted = await checkIfVoted(fields.voters.fields.id.id, voterAddress);
          setHasVoted(voted);
        }
      }
    } catch (err) {
      console.error('Error fetching poll data:', err);
      setError('Failed to fetch poll data');
    }
  };

  const checkIfVoted = async (tableId: string, address: string): Promise<boolean> => {
    try {
      const dynamicFieldName = {
        type: 'address',
        value: address
      };

      const field = await suiClient.getDynamicFieldObject({
        parentId: tableId,
        name: dynamicFieldName
      });

      if (field.error) {
        return false;
      }
      return field.data !== null;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    fetchPollData();
    const interval = setInterval(fetchPollData, 5000);
    return () => clearInterval(interval);
  }, [currentAccount]);

  const handleVote = async (optionIndex: number) => {
    if (!currentAccount) {
      setError('Please connect your wallet first');
      return;
    }

    setVotingInProgress(true);
    setError(null);
    setSelectedOption(optionIndex);

    try {

      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::voting_dapp::vote`,
        arguments: [
          tx.object(POLL_ID),
          tx.pure.u64(optionIndex)
        ],
      });


      const transactionKindBytes = await tx.build({
        client: suiClient,
        onlyTransactionKind: true,
      });


      const transactionKindBytesBase64 = btoa(
        String.fromCharCode(...new Uint8Array(transactionKindBytes))
      );


      const sponsorResponse = await fetch(`${BACKEND_URL}/sponsor/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionKindBytes: transactionKindBytesBase64,
          sender: currentAccount.address,
        }),
      });

      if (!sponsorResponse.ok) {
        throw new Error('Failed to sponsor transaction');
      }

      const { bytes: sponsoredBytes, digest } = await sponsorResponse.json();
      const bytesArray = Uint8Array.from(atob(sponsoredBytes), c => c.charCodeAt(0));


      const { signature } = await signTransaction({
        transaction: Transaction.from(bytesArray),
      });

      if (!signature) {
        throw new Error('Failed to sign transaction');
      }

      const executeResponse = await fetch(`${BACKEND_URL}/sponsor/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          digest,
          signature,
        }),
      });

      if (!executeResponse.ok) {
        throw new Error('Failed to execute transaction');
      }

      const result = await executeResponse.json();
      console.log('Transaction executed:', result);

      setHasVoted(true);
      await fetchPollData();
      setVotingInProgress(false);

    } catch (err) {
      console.error('Error voting:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
      setVotingInProgress(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🗳️ Move Voting DApp</h1>
        <p className="subtitle">Decentralized voting on Sui blockchain (Gas Sponsored by Enoki)</p>
        <div className="connect-button-container">
          <ConnectButton />
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {!currentAccount ? (
          <div className="welcome-card">
            <h2>Welcome! 👋</h2>
            <p>Connect your wallet to participate in the vote</p>
            <div className="info-box">
              <p>✨ One vote per wallet</p>
              <p>🔒 All votes are recorded on-chain</p>
              <p>📊 Results update in real-time</p>
              <p>⚡ Gas fees sponsored - vote for free!</p>
            </div>
          </div>
        ) : (
          <div className="voting-container">
            {pollData && (
              <>
                <VotingCard
                  question={pollData.question}
                  options={pollData.options}
                  hasVoted={hasVoted}
                  votingInProgress={votingInProgress}
                  selectedOption={selectedOption}
                  onVote={handleVote}
                />

                <ResultsCard
                  options={pollData.options}
                  voteCounts={pollData.voteCounts}
                  hasVoted={hasVoted}
                />
              </>
            )}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Built with Move on Sui | Gas Sponsored by Enoki</p>
      </footer>
    </div>
  );
}

export default App;