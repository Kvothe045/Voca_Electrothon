// lib/minting.ts
import { ethers } from "ethers";
import SimpleDocumentNFT from "../utils/SimpleDocumentNFT.json"; // adjust the path as needed

export async function mintDocument(metadataCid: string) {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask is not available. Please install MetaMask.");
  }

  // Connect to MetaMask and request account access
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();

  // Use a public environment variable for client-side access
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Contract address is not set. Ensure NEXT_PUBLIC_CONTRACT_ADDRESS is defined.");
  }

  console.log("Minting NFT using contract at:", contractAddress);

  // Create the contract instance with the signer
  const contract = new ethers.Contract(contractAddress, SimpleDocumentNFT.abi, signer);

  // Construct the token URI (using the metadata CID)
  const tokenURI = `ipfs://${metadataCid}`;
  console.log("Calling mintDocument with tokenURI:", tokenURI);

  // Call the mintDocument function on the contract
  const tx = await contract.mintDocument(tokenURI);
  console.log("Transaction sent, waiting for confirmation...", tx.hash);
  const receipt = await tx.wait();
  console.log("Transaction confirmed:", receipt.hash);

  // Extract the token ID from the emitted event
  const event = receipt.logs
    .map((log: any) => {
      try {
        return contract.interface.parseLog({ topics: log.topics, data: log.data });
      } catch (e) {
        return null;
      }
    })
    .find((parsedEvent: any) => parsedEvent && parsedEvent.name === "DocumentMinted");

  const tokenId = event?.args?.tokenId;
  console.log("Minted NFT with tokenId:", tokenId ? tokenId.toString() : "not found");

  return {
    transactionHash: receipt.hash,
    tokenId: tokenId ? tokenId.toString() : null,
  };
}
