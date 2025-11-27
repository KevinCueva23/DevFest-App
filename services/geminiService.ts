import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { Message, TrainingExample, TrainingDocument } from "../types";

// Initialize Gemini Client
const getClient = () => {
  // Always create a new instance to pick up the latest injected key
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Handles Multimodal (Text + Image) Generation using Gemini 2.5 Flash
 */
export const generateVisionContent = async (
  prompt: string,
  base64Image: string | null,
  mimeType: string = 'image/jpeg'
): Promise<string> => {
  try {
    const ai = getClient();
    const parts: Part[] = [];
    
    if (base64Image) {
      parts.push({
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      });
    }
    
    parts.push({ text: prompt });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    });

    return response.text || "No se pudo generar una respuesta.";
  } catch (error) {
    console.error("Vision Error:", error);
    throw error;
  }
};

/**
 * Handles Complex Reasoning using Gemini 3 Pro with Thinking Config
 */
export const generateReasoningContent = async (prompt: string): Promise<string> => {
  try {
    const ai = getClient();
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2048 }, // Enable thinking
      }
    });

    return response.text || "No se pudo generar el razonamiento.";
  } catch (error) {
    console.error("Reasoning Error:", error);
    throw error;
  }
};

/**
 * Handles Chat with Training Data (Examples) and Knowledge Base (PDFs)
 */
export const chatWithTrainedModel = async (
  currentMessage: string,
  history: Message[],
  examples: TrainingExample[],
  documents: TrainingDocument[]
): Promise<string> => {
  try {
    const ai = getClient();
    
    // 1. Construct System Instruction (The "Weights" of our neural net)
    let systemInstruction = "Eres un asistente de IA experto y adaptativo. \n";
    
    if (examples.length > 0) {
      systemInstruction += "TU COMPORTAMIENTO DEBE IMITAR EXACTAMENTE LOS SIGUIENTES EJEMPLOS DE ENTRENAMIENTO:\n\n";
      examples.forEach((ex, i) => {
        systemInstruction += `EJEMPLO ${i + 1}:\nUsuario: ${ex.input}\nAsistente: ${ex.output}\n\n`;
      });
      systemInstruction += "Fin de ejemplos. Generaliza este estilo para responder.\n";
    }

    if (documents.length > 0) {
      systemInstruction += "Usa la información contenida en los documentos adjuntos para responder preguntas sobre la empresa/tema.\n";
    }

    // 2. Build the Content Parts
    const parts: Part[] = [];

    // Add Documents (Context Injection)
    // We send the documents in the current turn so the model can "see" them right now.
    // In a production app, we might use caching, but for this demo, we send them inline.
    documents.forEach(doc => {
      parts.push({
        inlineData: {
          data: doc.base64,
          mimeType: doc.mimeType
        }
      });
    });

    // Add History as context string if needed, or rely on the chat structure.
    // To ensure the "In-Context" learning works best with documents in a single turn for this demo:
    // We will append the history as text to the prompt, or use the chat capability.
    // Let's use the chat capability but inject docs in the first message logic.
    // Actually, simpler for this demo: Construct a massive prompt with history.
    
    let fullPrompt = "";
    
    // Append History
    if (history.length > 0) {
        fullPrompt += "--- HISTORIAL DE CONVERSACIÓN ---\n";
        history.forEach(msg => {
            if (msg.role !== 'system') {
                fullPrompt += `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}\n`;
            }
        });
        fullPrompt += "--- FIN HISTORIAL ---\n\n";
    }

    fullPrompt += `Usuario actual: ${currentMessage}`;
    parts.push({ text: fullPrompt });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3 // Keep it focused on the data
      }
    });

    return response.text || "Error en la inferencia.";

  } catch (error) {
    console.error("Training Chat Error:", error);
    throw error;
  }
};

/**
 * Handles In-Context Learning (Few-shot prompting) - Legacy single shot
 * Kept for reference but not used in new chat UI
 */
export const generateTrainedContent = async (
  prompt: string,
  examples: Array<{input: string, output: string}>
): Promise<string> => {
    // Map plain objects to TrainingExample interface by adding an ID
    const formattedExamples: TrainingExample[] = examples.map((ex, i) => ({
      id: `legacy-${i}`,
      input: ex.input,
      output: ex.output
    }));
    return chatWithTrainedModel(prompt, [], formattedExamples, []);
};

/**
 * Handles Video Generation using Veo
 */
export const generateVideoContent = async (prompt: string): Promise<string | null> => {
  try {
    const ai = getClient();
    
    // Start Operation
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!downloadLink) {
        throw new Error("No video URI returned.");
    }
    
    return downloadLink;

  } catch (error) {
    console.error("Video Gen Error:", error);
    throw error;
  }
};

/**
 * Helper to fetch the actual video bytes blob URL from the URI
 */
export const fetchVideoBlob = async (videoUri: string): Promise<string> => {
    // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
    const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    if (!response.ok) throw new Error("Failed to download video bytes");
    const blob = await response.blob();
    return URL.createObjectURL(blob);
}