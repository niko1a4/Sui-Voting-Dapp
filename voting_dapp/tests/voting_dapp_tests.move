#[test_only]
module voting_dapp::voting_dapp_tests {
    use voting_dapp::voting_dapp::{Self, Poll, AdminCap};
    use std::string;
    use sui::test_scenario::{Self as ts, Scenario};

    // Test addresses
    const ADMIN: address = @0xAD;
    const VOTER1: address = @0xB1;
    const VOTER2: address = @0xB2;
    const VOTER3: address = @0xB3;

    // Helper to setup test
    fun setup_test(): Scenario {
        let mut scenario = ts::begin(ADMIN);
        {
            voting_dapp::init_for_testing(scenario.ctx());
        };
        scenario
    }

    // Helper to create a test poll
    fun create_test_poll(scenario: &mut Scenario) {
        scenario.next_tx(ADMIN);
        {
            let admin_cap = scenario.take_from_sender<AdminCap>();
            let question = string::utf8(b"Best debugging method?");
            let mut options = vector::empty<string::String>();
            options.push_back(string::utf8(b"Print statements"));
            options.push_back(string::utf8(b"Stare at code"));
            options.push_back(string::utf8(b"Ask Claude"));

            voting_dapp::create_poll(&admin_cap, question, options, scenario.ctx());
            ts::return_to_sender(scenario, admin_cap);
        };
    }

    #[test]
    fun test_create_poll_success() {
        let mut scenario = setup_test();
        
        scenario.next_tx(ADMIN);
        {
            let admin_cap = scenario.take_from_sender<AdminCap>();
            let question = string::utf8(b"Which pizza topping?");
            let mut options = vector::empty<string::String>();
            options.push_back(string::utf8(b"Pineapple"));
            options.push_back(string::utf8(b"Pepperoni"));

            voting_dapp::create_poll(&admin_cap, question, options, scenario.ctx());
            ts::return_to_sender(&scenario, admin_cap);
        };

        scenario.next_tx(ADMIN);
        {
            let poll = scenario.take_shared<Poll>();
            assert!(voting_dapp::get_question(&poll) == string::utf8(b"Which pizza topping?"));
            assert!(voting_dapp::get_options(&poll).length() == 2);
            assert!(voting_dapp::get_total_votes(&poll) == 0);
            ts::return_shared(poll);
        };

        scenario.end();
    }

    #[test]
    fun test_vote_success() {
        let mut scenario = setup_test();
        create_test_poll(&mut scenario);

        scenario.next_tx(VOTER1);
        {
            let mut poll = scenario.take_shared<Poll>();
            voting_dapp::vote(&mut poll, 2, scenario.ctx());
            ts::return_shared(poll);
        };

        scenario.next_tx(VOTER1);
        {
            let poll = scenario.take_shared<Poll>();
            assert!(voting_dapp::has_voted(&poll, VOTER1));
            assert!(voting_dapp::get_voter_choice(&poll, VOTER1) == 2);
            assert!(voting_dapp::get_total_votes(&poll) == 1);
            
            let vote_counts = voting_dapp::get_vote_counts(&poll);
            assert!(vote_counts[0] == 0);
            assert!(vote_counts[1] == 0);
            assert!(vote_counts[2] == 1);
            ts::return_shared(poll);
        };

        scenario.end();
    }

    #[test]
    fun test_multiple_voters() {
        let mut scenario = setup_test();
        create_test_poll(&mut scenario);

        // VOTER1 votes for option 0
        scenario.next_tx(VOTER1);
        {
            let mut poll = scenario.take_shared<Poll>();
            voting_dapp::vote(&mut poll, 0, scenario.ctx());
            ts::return_shared(poll);
        };

        // VOTER2 votes for option 1
        scenario.next_tx(VOTER2);
        {
            let mut poll = scenario.take_shared<Poll>();
            voting_dapp::vote(&mut poll, 1, scenario.ctx());
            ts::return_shared(poll);
        };

        // VOTER3 votes for option 0
        scenario.next_tx(VOTER3);
        {
            let mut poll = scenario.take_shared<Poll>();
            voting_dapp::vote(&mut poll, 0, scenario.ctx());
            ts::return_shared(poll);
        };

        // Verify results
        scenario.next_tx(VOTER1);
        {
            let poll = scenario.take_shared<Poll>();
            let vote_counts = voting_dapp::get_vote_counts(&poll);
            assert!(vote_counts[0] == 2);
            assert!(vote_counts[1] == 1);
            assert!(vote_counts[2] == 0);
            assert!(voting_dapp::get_total_votes(&poll) == 3);
            ts::return_shared(poll);
        };

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = 1)] // EAlreadyVoted
    fun test_double_vote_fails() {
        let mut scenario = setup_test();
        create_test_poll(&mut scenario);

        // First vote
        scenario.next_tx(VOTER1);
        {
            let mut poll = scenario.take_shared<Poll>();
            voting_dapp::vote(&mut poll, 0, scenario.ctx());
            ts::return_shared(poll);
        };

        // Second vote should fail
        scenario.next_tx(VOTER1);
        {
            let mut poll = scenario.take_shared<Poll>();
            voting_dapp::vote(&mut poll, 1, scenario.ctx());
            ts::return_shared(poll);
        };

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = 0)] // EInvalidOption
    fun test_invalid_option_fails() {
        let mut scenario = setup_test();
        create_test_poll(&mut scenario);

        scenario.next_tx(VOTER1);
        {
            let mut poll = scenario.take_shared<Poll>();
            voting_dapp::vote(&mut poll, 99, scenario.ctx());
            ts::return_shared(poll);
        };

        scenario.end();
    }

    #[test]
    fun test_has_voted_before_voting() {
        let mut scenario = setup_test();
        create_test_poll(&mut scenario);

        scenario.next_tx(VOTER1);
        {
            let poll = scenario.take_shared<Poll>();
            assert!(!voting_dapp::has_voted(&poll, VOTER1));
            ts::return_shared(poll);
        };

        scenario.end();
    }

    #[test]
    fun test_get_options() {
        let mut scenario = setup_test();
        create_test_poll(&mut scenario);

        scenario.next_tx(VOTER1);
        {
            let poll = scenario.take_shared<Poll>();
            let options = voting_dapp::get_options(&poll);
            assert!(options.length() == 3);
            assert!(options[0] == string::utf8(b"Print statements"));
            assert!(options[1] == string::utf8(b"Stare at code"));
            assert!(options[2] == string::utf8(b"Ask Claude"));
            ts::return_shared(poll);
        };

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = 0)] // EInvalidOption
    fun test_create_poll_with_one_option_fails() {
        let mut scenario = setup_test();
        
        scenario.next_tx(ADMIN);
        {
            let admin_cap = scenario.take_from_sender<AdminCap>();
            let question = string::utf8(b"Invalid poll?");
            let mut options = vector::empty<string::String>();
            options.push_back(string::utf8(b"Only one"));

            voting_dapp::create_poll(&admin_cap, question, options, scenario.ctx());
            ts::return_to_sender(&scenario, admin_cap);
        };

        scenario.end();
    }

    #[test]
    fun test_vote_counts_initialization() {
        let mut scenario = setup_test();
        create_test_poll(&mut scenario);

        scenario.next_tx(VOTER1);
        {
            let poll = scenario.take_shared<Poll>();
            let vote_counts = voting_dapp::get_vote_counts(&poll);
            assert!(vote_counts.length() == 3);
            assert!(vote_counts[0] == 0);
            assert!(vote_counts[1] == 0);
            assert!(vote_counts[2] == 0);
            ts::return_shared(poll);
        };

        scenario.end();
    }
}