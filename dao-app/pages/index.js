import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { CRYPTOMINION_NFT_CONTRACT_ADDRESS,CRYPTOMINION_NFT_ABI,CRYPTOMINION_DAO_ABI,CRYPTOMINION_DAO_CONTRACT_ADDRESS } from '../constants';
import {Contract,providers} from "ethers";
import { formatEther } from "ethers/lib/utils";
import Web3Modal from "web3modal";
import styles from '../styles/Home.module.css';

export default function Home() {
  const [nftBalance,setNftBalance] = useState(0);
  const [treasuryBalance,setTreasuryBalance] = useState("0");
  const [noOfProposals,setNoOfProposals] = useState("0");
  const [selectedTab,setSelectedTab] = useState("");
  const [walletConnected,setWalletConnected] = useState(false);
  const [loading,setLoading] = useState(false);
  const [fakeTokenId,setFakeTokenId] = useState("");
  const [proposals,setProposals] = useState([]);
  const web3ModalRef = useRef();
  //console.log(typeof(noOfProposals));
  //console.log(CRYPTOMINION_DAO_ABI);
  //console.log(CRYPTOMINION_NFT_ABI);
  //console.log(CRYPTOMINION_DAO_CONTRACT_ADDRESS);
  //console.log(CRYPTOMINION_NFT_CONTRACT_ADDRESS);

  const getProviderorSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const {chainId} = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Please switch to the Goerli network!");
      throw new Error("Please switch to the Goerli network");
    }
    if(needSigner){
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const connectWallet = async () => {
    try{
      await getProviderorSigner();
      setWalletConnected(true);
    }catch(err){
      console.error(err);
    }
  };

  const getDAOTreasuryBalance = async () => {
    try{
      const provider = await getProviderorSigner();
      const balance = await provider.getBalance(CRYPTOMINION_DAO_CONTRACT_ADDRESS);
      setTreasuryBalance(balance.toString());
    }catch(err){
      console.error(err);
    }
  };

  const getUserNFTBalance = async () => {
    try{
      const signer = await getProviderorSigner(true);
      const nftContract = new Contract(CRYPTOMINION_NFT_CONTRACT_ADDRESS,CRYPTOMINION_NFT_ABI,signer);
      const balance = await nftContract.balanceOf(signer.getAddress());
      //console.log(balance);
      setNftBalance(parseInt(balance.toString()));
    }catch(error){
      console.error(error);
    }
  };

  const createProposal = async () =>{
    try{
      const signer = await getProviderorSigner(true);
      const daoContract = new Contract(CRYPTOMINION_DAO_CONTRACT_ADDRESS,CRYPTOMINION_DAO_ABI,signer);
      const tx = await daoContract.createProposal(fakeTokenId);
      setLoading(true);
      await tx.wait();
      await getNoProposalsInDAO();
      setLoading(false);
    }catch(err){
      console.error(err);
      window.alert(err.data.message);
    }
  };

  const getNoProposalsInDAO = async () =>{
    try{
      const provider = await getProviderorSigner();
      const daoContract = new Contract(CRYPTOMINION_DAO_CONTRACT_ADDRESS,CRYPTOMINION_DAO_ABI,provider);
      const daoNumProposals = await daoContract.numProposals();
      setNoOfProposals(daoNumProposals);
    }catch(err){
      console.error(err);
    }
  };

  const fetchProposalById = async (index) => {
    try{
      const provider = await getProviderorSigner();
      const daoContract = new Contract(CRYPTOMINION_DAO_CONTRACT_ADDRESS,CRYPTOMINION_DAO_ABI,provider);
      const proposal = await daoContract.proposals(index);
      //console.log(proposal);
      const parsedProposal = {
          proposalId: index,
          nftTokenId: proposal.nftTokenId.toString(),
          deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
          yesVotes: proposal.yesVotes.toString(),
          noVotes: proposal.noVotes.toString(),
          executed: proposal.executed,
        };
      console.log(proposal.yesVotes.toString());
      return parsedProposal;
    }catch(err){
      console.error(err);
    }
  };

  const fetchAllProposals = async () =>{
    try{
      const proposals = [];
      for(let i=0;i<parseInt(noOfProposals.toString());i++){
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }
      setProposals(proposals);
      return proposals;
    }catch(err){
      console.error(err);
    }
  };

  const voteOnProposal = async (proposalId,_vote) => {
    try{
      const signer = await getProviderorSigner(true);
      const daoContract = new Contract(CRYPTOMINION_DAO_CONTRACT_ADDRESS,CRYPTOMINION_DAO_ABI,signer);
      let vote = _vote === "yes"? 0 : 1 ;
      console.log(vote);
      const tx = await daoContract.voteOnProposal(proposalId,vote);
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await fetchAllProposals();
    }catch(err){
      console.error(err);
    }
  };

  const executeProposal = async (proposalId) => {
    try{
      const signer = await getProviderorSigner(true);
      const daoContract = new Contract(CRYPTOMINION_DAO_CONTRACT_ADDRESS,CRYPTOMINION_DAO_ABI,signer);
      const txn = await daoContract.executeProposal(proposalId);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
    }catch(err){
      console.error(err);
      window.alert(error.data.message);
    }
  };

  function renderTabs(){
    if(selectedTab == "Create Proposals"){
      return renderCreateProposalTab();
    }else if(selectedTab == "View Proposals"){
      return renderViewProposalsTab();
    }
  }

  function renderCreateProposalTab(){

      if(loading){
        return(
          <div className={styles.description}>
            Loading.... Waiting for the transaction...
          </div>
        );
      }else if(nftBalance === 0){
        return(
          <div className={styles.description}>
            You do not own any NFT. <br />
            <b>You cannot create or vote on any proposals</b>
          </div>
        );
      }else{
        return(
          <div className={styles.container}>
            <label>Fake NFT Token ID to purchase :</label>
            <input
              placeholder='0'
              type = "number"
              onChange = {(e) => setFakeTokenId(e.target.value)}
            />
            <button className={styles.button2} onClick ={createProposal}>Create</button>
          </div>
        );
      }
  }

  function renderViewProposalsTab() {
    if(loading){
      return(
        <div className={styles.description}>
          Loading...Waiting for the transaction...
        </div>
      );
    }else if(proposals.length == 0){
      return(
        <div className={styles.description}>No proposals have been created</div>
      );
    }else{
      //console.log(proposals);
      return(
        <div>
          {proposals.map((p,index) => (
            <div key={index} className={styles.proposalCard}>
              <p>Proposal ID: {p.proposalId}</p>
              <p>Fake NFT to Purchase: {p.nftTokenId}</p>
              <p>Deadline: {p.deadline.toLocaleString()}</p>
              <p>Yes Votes: {p.yesVotes}</p>
              <p>No Votes: {p.noVotes}</p>
              <p>Executed?: {p.executed.toString()}</p>
              {p.deadline.getTime() > Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button className={styles.button2} onClick = {() => voteOnProposal(p.proposalId,"yes")}>
                    Vote Yes
                  </button>
                  <button className={styles.button2} onClick = {() => voteOnProposal(p.proposalId,"no")}>
                    Vote No
                  </button>
                </div>
              ): p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button className={styles.button2} onClick ={() => executeProposal(p.proposalId)}>
                    Execute Proposal {" "}{p.yesVotes > p.noVotes ? "(Yes)":"(No)"}
                  </button>
                </div>
              ): (<div className={styles.description}> Proposal Executed</div>)}
          </div>
          ))}
        </div>
      );
    }
  }

  useEffect(()=>{
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network:"goerli",
        providerOptions:{},
        disableInjectedProvider:false,
      });
      connectWallet().then(() =>{
        getDAOTreasuryBalance();
        getUserNFTBalance();
        getNoProposalsInDAO();
      });
    }
  }, [walletConnected]);

  useEffect(() => {
    if(selectedTab === "View Proposals"){
      fetchAllProposals();
    }
  },[selectedTab]);

  return (
    <div>
    <Head>
      <title>Crypto Minions DAO</title>
      <meta name="description" content="Generated by create next app" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className={styles.main}>
      <div>
        <div className={styles.title}>
          <h2>Welcome to Crypto Minions!</h2>
        </div>
        <div className ={styles.description}>Welcome to the DAO</div>
        <div className={styles.description}>Your CryptoMinion NFT balance : {nftBalance}</div>
        <div className={styles.description}>Treasury Balance : {formatEther(treasuryBalance)}</div>
        <div className={styles.description}>Total Proposals : {noOfProposals.toString()}</div>
        <div className={styles.flex}>
        <button className = {styles.button} onClick = {()=> setSelectedTab("Create Proposals")}>Create Proposal</button>
        <button className={styles.button} onClick = {() => setSelectedTab("View Proposals")}>View Proposals</button>
        {renderTabs()}
      </div>
      </div>
      
      <div>
        <img className={styles.image} src = './img.png' />
      </div>
    </div>
    <footer className={styles.footer}>
      Made with &#10084; by Crypto Minions
    </footer>
  </div>
  )
}
