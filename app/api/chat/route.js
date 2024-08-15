import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API
import Groq from "groq-sdk";
import { Pinecone } from '@pinecone-database/pinecone';
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `You are the Taylor Swift Expert Chatbot. Your job is to answer questions about Taylor Swift's albums and songs.
Given the user's question and relevant content from the knowledge base of articles, answer the question accurately.
Ignore any errors`;

async function getContext(queryEmbedding, pineconeIndex){
  let queryResponse;
  try {
    queryResponse = await pineconeIndex.query({
        topK: 5,
        vector: queryEmbedding,
        includeMetadata: true,
        includeValues: true,
      });
  } catch (error) {
    console.error("Error searching for similar documents", error);
    return "Error searching for similar documents";
  }
  // console.log(`Found this query response: ${JSON.stringify(queryResponse, null, 2)}`);

  const concatenatedPageContent = queryResponse.matches.map((match) => match.metadata.text).join("\n\n");
  console.log(`Concatenated Page Content: ${concatenatedPageContent}`);
  return concatenatedPageContent;
}


// POST function to handle incoming requests
export async function POST(req) {
  let data;
  try {
    data = await req.json();
  } catch (error) {
    console.error("Error parsing request data", error);
    return new NextResponse("Error parsing request data", { status: 400 });
  }
  
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
  });

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const model = 'llama3-8b-8192';
  
  console.log(`Checking "${process.env.PINECONE_INDEX_NAME}"...`);
// 2. Get list of existing indexes
  const existingIndexes = await pc.listIndexes();
  // print json of existing indexes
  console.log('Existing Indexes:', JSON.stringify(existingIndexes, null, 2));
  const pineconeIndex = pc.Index(process.env.PINECONE_INDEX_NAME);

  const userQuery = data[data.length - 1].content;
  const embeddingFunction = new HuggingFaceTransformersEmbeddings({
    model: "Xenova/all-MiniLM-L6-v2",
  });
  let embeddedUserQuery;
  try {
    embeddedUserQuery = await embeddingFunction.embedQuery(userQuery);
  } catch (error) {
    console.error("Error embedding user query", error);
    return new NextResponse("Error embedding user query", { status: 500 });
  }
  // console.log("Embedded User Query: " + embeddedUserQuery);
  let relevantContext;
  try {
    relevantContext = await getContext(embeddedUserQuery, pineconeIndex);
  } catch (error) {
    console.error("Error getting context docs", error);
    return new NextResponse("Error getting context docs", { status: 500 });
  }
  console.log("Relevant Context: " + relevantContext);
  let completion;
  const userContent = "The user's question is: " + userQuery + "\n\n Relevant Context: " + relevantContext;
  try {
    completion = await groq.chat.completions.create({
      messages: [{role: 'system', content: systemPrompt}, ...data.slice(0,-1), {role:'user', content:userContent}],
      model: model,
      stream: true,
    });
  } catch(error) {
    console.error("Error creating completion", error);
    return new NextResponse("Error creating completion", { status: 500 });
  }
  
  
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