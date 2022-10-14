//SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";

interface IFakeNFTMarketplace {
        function getPrice() external view returns(uint256);

        function avialable(uint256 _tokenId) external view returns(bool);

        function purchase(uint256 _tokenId) external payable;
    }

interface ICryptoMinionNFTs {
        function balanceOf(address owner) external view returns(uint256);
        function tokenOfOwnerByIndex(address owner, uint256 index) external view returns(uint256); 
    }


contract CryptoMinionDAO is Ownable {

    struct Proposal{
        uint256 nftTokenId;
        uint256 deadline;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        mapping(uint256 => bool) voters;
    }

    constructor(address _nftMarketplace, address _cryptoMinionNFT) payable{
        nftMarketplace = IFakeNFTMarketplace(_nftMarketplace);
        cryptoMinionNFT = ICryptoMinionNFTs(_cryptoMinionNFT);
    }
    
    

    mapping(uint256 => Proposal) public proposals;
    uint256 public numProposals;
    IFakeNFTMarketplace nftMarketplace;
    ICryptoMinionNFTs cryptoMinionNFT;

    
    modifier nftHoldersOnly() {
        require(cryptoMinionNFT.balanceOf(msg.sender) > 0, "Not a DAO Member");
        _;
    }
    modifier onlyActiveProposals(uint256 proposalIndex){
        require(proposals[proposalIndex].deadline > block.timestamp,"Deadline Exceeded");
        _;
    }
    modifier inactiveProposalsOnly(uint256 proposalIndex) {
        require(proposals[proposalIndex].deadline < block.timestamp,"Deadline for voting not over");
        require(proposals[proposalIndex].executed == false,"Proposal executed");
        _;
    }
    enum Vote{
        Yes,No
    }
    function createProposal(uint256 _nftTokenId) external returns(uint256){
        require(nftMarketplace.avialable(_nftTokenId),"NFT not avialable for sale");
        Proposal  storage proposal =  proposals[numProposals];
        proposal.nftTokenId = _nftTokenId;
        proposal.deadline = block.timestamp + 5 minutes;
        numProposals++;
        return(numProposals - 1);
    }
    function voteOnProposal(uint256 proposalIndex,Vote vote) external nftHoldersOnly onlyActiveProposals(proposalIndex){
        Proposal storage proposal = proposals[proposalIndex];
        uint256 voterNFTBalance = cryptoMinionNFT.balanceOf(msg.sender);
        uint256 numVotes = 0;
        for(uint256 i =0;i<voterNFTBalance;i++){
            uint256 tokenId = cryptoMinionNFT.tokenOfOwnerByIndex(msg.sender,i);
            if(proposal.voters[tokenId]==false){
                numVotes++;
                proposal.voters[tokenId] = true;
            }
        }
        if(vote == Vote.Yes){
            proposal.yesVotes+=numVotes;
        }
        else{
            proposal.noVotes+=numVotes;
        }

    }

    function executeProposal(uint256 proposalIndex) external nftHoldersOnly inactiveProposalsOnly(proposalIndex){
        Proposal storage proposal = proposals[proposalIndex];
        if(proposal.yesVotes > proposal.noVotes){
            uint256 price = nftMarketplace.getPrice();
            require(address(this).balance > price,"Price of NFT is 0.1 ether");
            nftMarketplace.purchase{value: price}(proposal.nftTokenId);
        }
        proposal.executed = true;
    }

    function withdrawEther() external onlyOwner{
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}
    
    fallback() external payable {}
}