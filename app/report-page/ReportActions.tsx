import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { createAndUploadMetadata } from "../lib/ipfs";
// import { mintDocument,  } from "../lib/minting";
import { uploadPdfToIPFS } from "../lib/ipts";
import { mintDocument } from "../lib/minting";

export const generatePdfBlob = async (
  report: any,
  reportContainerRef: React.RefObject<HTMLDivElement>
): Promise<{ pdfBlob: Blob; filename: string }> => {
  if (!report || !reportContainerRef.current) {
    throw new Error("No report data or container found");
  }
  toast.info("Capturing current report state...");
  const canvas = await html2canvas(reportContainerRef.current, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, position, imgWidth, imgHeight);
  heightLeft -= 297;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= 297;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `VOCA_Report_${timestamp}.pdf`;
  return { pdfBlob: pdf.output("blob"), filename };
};

export const generatePDF = async (
  report: any,
  reportContainerRef: React.RefObject<HTMLDivElement>
) => {
  const { pdfBlob, filename } = await generatePdfBlob(report, reportContainerRef);

  // Download PDF locally
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = pdfUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(pdfUrl);

  toast.success("PDF generated and downloaded successfully!");
};

export const uploadAndMintNFT = async (
  report: any,
  reportContainerRef: React.RefObject<HTMLDivElement>
): Promise<{ pdfLink: string; txLink: string }> => {
  const { pdfBlob, filename } = await generatePdfBlob(report, reportContainerRef);

  // Upload PDF to IPFS and get CID
  const pdfCid = await uploadPdfToIPFS(pdfBlob, filename);
  toast.success("PDF uploaded to IPFS successfully!");

  // Create metadata and upload to IPFS
  const metadataCid = await createAndUploadMetadata(pdfCid, filename, "Generated PDF Report");
  toast.info("Metadata uploaded to IPFS successfully!");

  // Mint NFT using the metadata CID
  const mintResult = await mintDocument(metadataCid);
  toast.success("NFT minted successfully!");

  // Construct shareable links
  return {
    pdfLink: `https://gateway.pinata.cloud/ipfs/${pdfCid}`,
    txLink: `https://www.oklink.com/amoy/tx/${mintResult.transactionHash}`,
  };
};
