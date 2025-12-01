interface ResultsCardProps {
    options: string[];
    voteCounts: number[];
    hasVoted: boolean;
}

function ResultsCard({ options, voteCounts, hasVoted }: ResultsCardProps) {
    const totalVotes = voteCounts.reduce((sum, count) => sum + count, 0);

    const getPercentage = (count: number): string => {
        if (totalVotes === 0) return '0.0';
        return ((count / totalVotes) * 100).toFixed(1);
    };

    const getBarColor = (index: number): string => {
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];
        return colors[index % colors.length];
    };

    const getWinningOption = (): number | null => {
        if (totalVotes === 0) return null;
        const maxVotes = Math.max(...voteCounts);
        return voteCounts.indexOf(maxVotes);
    };

    const winningIndex = getWinningOption();

    return (
        <div className="card results-card">
            <div className="results-header">
                <h2 className="card-title">Live Results 📊</h2>
                <div className="total-votes">
                    {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} cast
                </div>
            </div>

            {totalVotes === 0 ? (
                <div className="no-votes-message">
                    <p>No votes yet. Be the first to vote! 🚀</p>
                </div>
            ) : (
                <div className="results-container">
                    {options.map((option, index) => (
                        <div key={index} className="result-item">
                            <div className="result-header">
                                <span className="option-name">
                                    {String.fromCharCode(65 + index)}. {option}
                                    {winningIndex === index && totalVotes > 0 && (
                                        <span className="winner-badge">👑</span>
                                    )}
                                </span>
                                <span className="vote-count">
                                    {voteCounts[index]} ({getPercentage(voteCounts[index])}%)
                                </span>
                            </div>
                            <div className="progress-bar-container">
                                <div
                                    className="progress-bar"
                                    style={{
                                        width: `${getPercentage(voteCounts[index])}%`,
                                        backgroundColor: getBarColor(index)
                                    }}
                                >
                                    {parseFloat(getPercentage(voteCounts[index])) > 10 && (
                                        <span className="progress-text">
                                            {getPercentage(voteCounts[index])}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {hasVoted && (
                <div className="results-footer">
                    <p className="small-text">✨ Results update automatically every 5 seconds</p>
                </div>
            )}
        </div>
    );
}

export default ResultsCard;