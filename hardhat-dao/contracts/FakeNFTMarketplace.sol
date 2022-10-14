//SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;
contract FakeNFTMarketplace {
     mapping (uint256=>address) public token;
     uint256 nft_price = 0.1 ether;

     function purchase(uint256 _tokenId) external payable {
        require(msg.value == nft_price,"Price of the NFT is 0.1 ether");
        token[_tokenId] = msg.sender;
     }
     function getPrice() external view returns(uint256){
        return(nft_price);
     }

     function avialable(uint256 _tokenId) external view returns(bool){
        if(token[_tokenId] == address(0)){
            return true;
        }
        else{
            return false;
        }
     }
}