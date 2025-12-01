interface VotingCardProps {
    question: string;
    options: string[];
    hasVoted: boolean;
    votingInProgress: boolean;
    selectedOption: number | null;
    onVote: (index: number) => void;
}

function VotingCard({ question, options, hasVoted, votingInProgress, selectedOption, onVote }: VotingCardProps) {
    return (
        <div className="card voting-card">
            <h2 className="card-title">{question}</h2>

            {hasVoted ? (
                <div className="voted-message">
                    <div className="success-icon">✅</div>
                    <p>Thank you for voting!</p>
                    <p className="small-text">Your vote has been recorded on the blockchain</p>
                </div>
            ) : (
                <div className="options-container">
                    {options.map((option, index) => (
                        <button
                            key={index}
                            className={`option-button ${selectedOption === index && votingInProgress ? 'selected' : ''}`}
                            onClick={() => onVote(index)}
                            disabled={votingInProgress}
                        >
                            <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                            <span className="option-text">{option}</span>
                            {selectedOption === index && votingInProgress && (
                                <span className="loading-spinner">⏳</span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {votingInProgress && (
                <div className="progress-message">
                    <div className="spinner"></div>
                    <p>Submitting your vote to the blockchain...</p>
                </div>
            )}
        </div>
    );
}

export default VotingCard;