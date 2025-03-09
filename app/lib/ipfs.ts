import axios from 'axios';
import { ethers } from 'ethers';
import SimpleDocumentNFT from '../utils/SimpleDocumentNFT.json';

// Pinata API configuration
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// Upload PDF to Pinata
export async function uploadPdfToPinata(pdfData: Blob | Buffer) {
  try {
    console.log("Uploading PDF to Pinata...");
    const formData = new FormData();
    // Append the file. The third parameter (filename) is optional.
    formData.append('file', pdfData, 'document.pdf');
    
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          // Do not manually set Content-Type in browser.
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        }
      }
    );
    
    console.log("PDF uploaded to Pinata. CID:", response.data.IpfsHash);
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload to IPFS');
  }
}

// Create metadata and upload to Pinata
export async function createAndUploadMetadata(pdfCid: string, documentName: string, description: string) {
  try {
    console.log("Creating metadata with PDF CID:", pdfCid);
    const metadata = {
      name: documentName,
      description: description,
      image: `ipfs://${pdfCid}`,
      document: `ipfs://${pdfCid}`,
      properties: {
        timestamp: new Date().toISOString(),
        documentType: 'PDF'
      }
    };
    
    console.log("Uploading metadata to Pinata...");
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        }
      }
    );
    
    console.log("Metadata uploaded to Pinata. CID:", response.data.IpfsHash);
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error creating metadata:', error);
    throw new Error('Failed to create metadata');
  }
}

// Mint the document as an NFT
export async function mintDocumentNFT(metadataCid: string) {
  try {
    console.log("Minting NFT with metadata CID:", metadataCid);
    // Connect to the provider (ensure window.ethereum exists)
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    
    // Create contract instance using the ABI from SimpleDocumentNFT.json
    const contractABI = SimpleDocumentNFT.abi;
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS as string,
      contractABI,
      signer
    );
    
    // Call the mintDocument function
    const tokenURI = `ipfs://${metadataCid}`;
    const tx = await contract.mintDocument(tokenURI);
    const receipt = await tx.wait();
    
    // Get the token ID from the event
    const event = receipt.logs
      .map((log: any) => {
        try {
          return contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
        } catch (e) {
          return null;
        }
      })
      .find((event: any) => event && event.name === 'DocumentMinted');
    
    const tokenId = event?.args?.tokenId;
    
    console.log("NFT minted successfully. Transaction hash:", receipt.hash, "Token ID:", tokenId.toString());
    
    return {
      transactionHash: receipt.hash,
      tokenId: tokenId.toString(),
      shareableUrl: `https://gateway.pinata.cloud/ipfs/${metadataCid}`,
      pdfUrl: `https://gateway.pinata.cloud/ipfs/${metadataCid}`
    };
  } catch (error) {
    console.error('Error minting NFT:', error);
    throw new Error('Failed to mint NFT');
  }
}

// Fetch PDF from endpoint
export async function fetchPdfFromEndpoint() {
  try {
    console.log("Fetching PDF from API endpoint...");
    const response = await fetch('/api/getpdfreport');
    if (!response.ok) {
      throw new Error('Failed to fetch PDF from endpoint');
    }
    console.log("PDF fetched successfully.");
    return await response.blob();
  } catch (error) {
    console.error('Error fetching PDF:', error);
    throw error;
  }
}
