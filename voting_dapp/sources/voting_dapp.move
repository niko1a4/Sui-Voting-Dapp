module voting_dapp::voting_dapp;
// === Imports ===
use std::string::String;
use sui::table::{Self, Table};
use sui::event;
// === Errors ===
const EInvalidOption: u64 = 0;
const EAlreadyVoted: u64 = 1;
// === Structs ===
public struct Poll has key, store{
    id: UID,
    question: String,
    options: vector<String>,
    vote_counts: vector <u64>,
    voters: Table<address, u64>,
    creator: address,
}
public struct AdminCap has key{
    id: UID,
}
// === Events ===
public  struct PollCreated has copy, drop{
    poll_id: ID,
    question: String,
    creator: address,
}

public struct VoteCast has copy, drop{
    poll_id: ID,
    voter: address,
    option_index: u64,
}
// === Init Function ===
fun init ( ctx: &mut TxContext){
    transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
}

// === Public Functions ===
public fun create_poll(_admin: &AdminCap, question: String, options: vector<String>, ctx: &mut TxContext){
     assert!(options.length() >= 2, EInvalidOption);
        
        let poll_id = object::new(ctx);
        let poll_id_copy = poll_id.to_inner();
        
        let mut vote_counts = vector::empty<u64>();
        let mut i = 0;
        while (i < options.length()) {
            vote_counts.push_back(0);
            i = i + 1;
        };

        let poll = Poll {
            id: poll_id,
            question,
            options,
            vote_counts,
            voters: table::new(ctx),
            creator: ctx.sender(),
        };

        event::emit(PollCreated {
            poll_id: poll_id_copy,
            question: poll.question,
            creator: poll.creator,
        });

        transfer::share_object(poll);
}

 public fun vote(
        poll: &mut Poll,
        option_index: u64,
        ctx: &mut TxContext
    ) {
        let voter = ctx.sender();
        assert!(!poll.voters.contains(voter), EAlreadyVoted);
        assert!(option_index < poll.options.length(), EInvalidOption);
        poll.voters.add(voter, option_index);
        
        let current_count = poll.vote_counts[option_index];
        *&mut poll.vote_counts[option_index] = current_count + 1;

        event::emit(VoteCast {
            poll_id: object::id(poll),
            voter,
            option_index,
        });
    }

// === View Functions ===
public fun get_question(poll: &Poll): String {
        poll.question
    }
public fun get_options(poll: &Poll): vector<String> {
        poll.options
    }
public fun get_vote_counts(poll: &Poll): vector<u64> {
        poll.vote_counts
    }
public fun has_voted(poll: &Poll, voter: address): bool {
        poll.voters.contains(voter)
    }
public fun get_voter_choice(poll: &Poll, voter: address): u64 {
        *poll.voters.borrow(voter)
    }
public fun get_total_votes(poll: &Poll): u64 {
        let mut total = 0;
        let mut i = 0;
        while (i < poll.vote_counts.length()) {
            total = total + poll.vote_counts[i];
            i = i + 1;
        };
        total
    }

// === Test Functions ===
 #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }


