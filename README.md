# Sui Voting DApp

A decentralized voting application built on the Sui blockchain using Move smart contracts, a React TypeScript frontend, and Nestjs backend.

# App display
![](images/Screenshot%202025-12-01%20181914.png)
Welcome to voting!

![](images/Screenshot%202025-12-01%20181932.png)
Connect your Slush wallet

![](images/Screenshot%202025-12-01%20182011.png) <br>
Pick the voting option and cast your vote

![](images/Screenshot%202025-12-01%20182108.png)
Congrats! You have voted on the poll.
## Features

- On-chain voting with one vote per wallet address
- Real-time results display
- Admin-controlled poll creation
- Transparent vote counting


## Prerequisites

- Sui CLI installed and configured
- Node.js v16 or higher
- Sui Wallet browser extension
- Testnet SUI tokens

## Smart Contract Deployment

### Build and Test
```bash
cd  file_name
sui move build
sui move test
```

### Deploy to Testnet
```bash
sui client publish 
```

Save the PACKAGE_ID and ADMIN_CAP_ID from the output.

### Create a Poll
```bash
sui client call \
  --package  \
  --module voting_dapp \
  --function create_poll \
  --args  \
         "Your question here" \
         "[\"Option 1\",\"Option 2\",\"Option 3\"]" \
  --gas-budget 10000000
```

Save the POLL_ID from the created shared object.

## Frontend Setup

### Install Dependencies
```bash
cd voting-frontend
npm install
```

### Configure

Update `src/App.tsx` with your deployed contract details:
```typescript
const PACKAGE_ID = 'your_package_id';
const POLL_ID = 'your_poll_id';
```

Ensure `src/main.tsx` uses testnet:
```typescript
const networks = {
  testnet: { url: getFullnodeUrl('testnet') },
};
```

### Run Development Server
```bash
npm run dev
```

Visit http://localhost:5173

## Smart Contract Functions

### Admin Functions

**create_poll**
- Requires AdminCap
- Creates a new voting poll
- Parameters: question (String), options (vector<String>)

### User Functions

**vote**
- Cast a vote for an option
- Parameters: poll (Poll object), option_index (u64)
- Enforces one vote per address

### View Functions

- get_question: Returns poll question
- get_options: Returns all voting options
- get_vote_counts: Returns vote counts per option
- has_voted: Check if address has voted
- get_voter_choice: Get the option a voter selected
- get_total_votes: Get total number of votes cast

## Testing

Run the smart contract test suite:
```bash
cd file_name
sui move test
```

The test suite includes:
- Poll creation validation
- Voting functionality
- Double vote prevention
- Invalid option handling
- Vote counting accuracy

## Development

### Smart Contract

Key features:

- Uses Sui Table for voter tracking
- Emits events for poll creation and votes
- Implements strict access control with AdminCap
- Prevents double voting at the contract level

### Backend

- Uses Nestjs 
- Has sponsor module with controller and service
- Loads Enoki private API key designed for backends

### Frontend

Built with React and TypeScript using Vite. Key components:

- VotingCard: Displays poll question and voting options
- ResultsCard: Shows live voting results with progress bars
- Uses @mysten/dapp-kit for wallet integration
- Polls blockchain every 5 seconds for updates

## License

MIT