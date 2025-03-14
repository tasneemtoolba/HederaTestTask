// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 ;

contract Whitelist {

    // event emitted whenever a new account got whiteliste
    event WhiteListAccount(address accountId);

    // the contract's owner, set in the constructor
    address private owner;
    string public message;
    // the currently whitelisted accountId 
    address private whitelisted_accountId;
    constructor(string memory message_) {
    // set the owner of the contract for `whitelist`-ing to work
    owner = msg.sender;
    message = message_;
    }
    function whitelist(address accountId) public {
    // only allow the owner to update whitelisted accountId
    require(msg.sender == owner, "Address not owner");
    // set the new whitelisted account and emit the appropriate event
    whitelisted_accountId = accountId;
    emit WhiteListAccount(accountId);
    }
}