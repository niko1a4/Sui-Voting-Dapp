import { useState, useEffect } from 'react';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import './App.css';
import VotingCard from './components/VotingCard';
import ResultsCard from './components/ResultsCard';

// UPDATE THESE WITH YOUR DEPLOYED CONTRACT VALUES
const PACKAGE_ID = '0x994298cc21abfa191b0c90b87c9bef756ff69740726999f49d8e98d76cc092db';
const POLL_ID = '0x35a323cf92fa13bb220ba03171da218861b1dc632badbd9cea8952df132d5471';

interface PollData {
  question: string;
  options: string[];
  voteCounts: number[];
}

function App() {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
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
          console.log('Current account address:', voterAddress);
          const voted = await checkIfVoted(fields.voters.fields.id.id, voterAddress);
          console.log('Has voted:', voted);
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
      console.log('Vote check full result:', field);
      console.log('field.data:', field.data);
      console.log('field.error:', field.error);
      if (field.error) {
        return false;
      }
      return field.data !== null;
    } catch {
      console.log('Vote check error (user has not voted):', error);
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

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async () => {
            console.log('Vote successful');
            setHasVoted(true);
            await fetchPollData();
            setVotingInProgress(false);
          },
          onError: (err) => {
            console.error('Vote failed:', err);
            setError(err.message || 'Failed to submit vote');
            setVotingInProgress(false);
          }
        }
      );
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
      setVotingInProgress(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🗳️ Move Voting DApp</h1>
        <p className="subtitle">Decentralized voting on Sui blockchain</p>
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
        <p>Built with Move on Sui</p>
      </footer>
    </div>
  );
}

export default App;