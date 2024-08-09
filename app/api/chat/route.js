import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API
import Groq from "groq-sdk";


// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `Hello! Welcome to Headstarter AI, your go-to platform for software engineering interview preparation. 
I'm here to assist you with any questions or issues you might have. 
How can I help you today? You can ask me about our services, troubleshooting, or any other inquiries you may have.`;


// POST function to handle incoming requests
export async function POST(req) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const data = await req.json();
  const completion = await groq.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data],
    model: "llama3-8b-8192",
    stream: true,
  });
  
  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}