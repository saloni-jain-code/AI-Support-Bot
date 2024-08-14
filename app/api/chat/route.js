import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API
import Groq from "groq-sdk";
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from "@langchain/pinecone";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `You are the Taylor Swift Expert Chatbot. Your job is to answer questions about Taylor Swift's albums and songs.
Given the user's question and relevant content from the knowledge base of articles, answer the question accurately.`;

async function get_context(userQuestion, docSearch){
  console.log("TYPE OF USER QUESTION: " + typeof userQuestion);
  console.log("USER QUESTION: " + userQuestion);
  let relevant_docs;
  try {
    relevant_docs = await docSearch.similaritySearch(userQuestion, 3);
  } catch (error) {
    console.error("Error searching for similar documents", error);
    return "Error searching for similar documents";
  }
  // relevant_docs = relevant_docs.slice(0, 3);  
  let doc_content = [];
  for (let doc of relevant_docs){
    doc_content.push(doc.page_content);
  } 
  const relevant_excerpts = doc_content.join('\n\n------------------------------------------------------\n\n');
  return relevant_excerpts;
}


// POST function to handle incoming requests
export async function POST(req) {
  const data = await req.json();
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
  });
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const model = 'llama3-8b-8192';
  const embedding_function = new HuggingFaceTransformersEmbeddings({
    model: "Xenova/all-MiniLM-L6-v2",
  });
  const pineconeIndex = pc.Index(process.env.PINECONE_INDEX_NAME);
  const dbConfig = {
    pineconeIndex: pineconeIndex,
  };
  // const docSearch = await PineconeStore.fromExistingIndex(embedding_function, dbConfig)
  let docSearch;
  try {
    docSearch = await PineconeStore.fromExistingIndex(embedding_function, dbConfig);
    console.log("PineconeStore created successfully");
  } catch (error) {
    console.error("Error creating PineconeStore", error);
    return new NextResponse("Error creating PineconeStore", { status: 500 });
  }
  // PineconeStore.fromExistingIndex(embedding_function, dbConfig).then((docSearch) => {
  //   console.log("PineconeStore created successfully", docSearch);
  //   console.log('Doc Search:', JSON.stringify(docSearch, null, 2));
  //   docSearch = docSearch;
  // })
  // .catch((error) => {
  //   console.error("Error creating PineconeStore", error);
  // });
  
  // Debugging statements
  // console.log('Embedding Function:', JSON.stringify(embedding_function, null, 2));
  // console.log('Pinecone Index:', JSON.stringify(pineconeIndex, null, 2));
  // console.log('Doc Search:', JSON.stringify(docSearch, null, 2));

  // PineconeStore(index_name=pinecone_index_name, embedding=embedding_function);
  const userQuery = data[data.length - 1].content;
  const relevant_context = await get_context(userQuery, docSearch);

  const completion = await groq.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data.slice(0,-1), {role:'user', content:userQuery + relevant_context}],
    model: model,
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