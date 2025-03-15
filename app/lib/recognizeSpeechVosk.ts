// app/lib/recognizeSpeechVosk.ts
const MODEL_URL = "/vosk-model-small-en-us-0.15"; // Ensure this folder is in your public folder

export const recognizeSpeechVosk = async (audioBlob: Blob): Promise<string> => {
  try {
    // Dynamically import vosk-browser on the client.
    const VoskModule = await import("vosk-browser");
    const Vosk: any = VoskModule.default;
    if (!Vosk) {
      throw new Error("Failed to import Vosk module");
    }
    
    // Create and initialize the model.
    // (In some versions, the model loads synchronously when instantiated.)
    const model = new Vosk.Model(MODEL_URL);
    
    // Create a recognizer with a sample rate of 16000 Hz.
    const recognizer = model.registerRecognizer({ sampleRate: 16000 });
    
    // Convert the audio blob to an ArrayBuffer.
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    // Recognize the audio.
    const result = recognizer.recognize(arrayBuffer);
    
    // Free the recognizer (if supported).
    if (typeof recognizer.free === "function") {
      recognizer.free();
    }
    
    return result.text || "";
  } catch (error) {
    console.error("Error with Vosk recognition:", error);
    throw error;
  }
};
