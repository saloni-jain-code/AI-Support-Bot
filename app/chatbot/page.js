'use client'

import { Box, Button, Stack, TextField, Typography, createTheme, ThemeProvider } from '@mui/material'
import { useState, useRef, useEffect } from 'react'
import {teal} from '@mui/material/colors';
import bg from '/public/background.png';

const theme = createTheme({
 palette: {
   primary: {
     main: '#576347',
     dark: '#2E3B2C',
     light: '#E0E0DD',
   },
   secondary: {
     main: '#93A9A7',
     dark: '#A3B7B6',
     light: '#dd6caa',
   },
 },
 typography: {
   fontFamily: [
     'IM Fell DW Pica',
   ].join(','),
 },
});
// 'IM Fell DW Pica',
//       '-apple-system',
//       'BlinkMacSystemFont',
//       '"Segoe UI"',
//       'Roboto',
//       '"Helvetica Neue"',
//       'Arial',
//       'sans-serif',
//       '"Apple Color Emoji"',
//       '"Segoe UI Emoji"',
//       '"Segoe UI Symbol"'


export default function Home() {
 const [messages, setMessages] = useState([
   {
     role: 'assistant',
     content: "Hi! I'm the Taylor Swift Chatbot. How can I help you today?",
   },
 ])
 const [message, setMessage] = useState('')
 const [isLoading, setIsLoading] = useState(false)
  const sendMessage = async () => {
   if (!message.trim()) return;  // Don't send empty messages
   setIsLoading(true)  // Set loading state to true
   setMessage('')  // Clear the input field
   setMessages((messages) => [
   ...messages,
   { role: 'user', content: message },  // Add the user's message to the chat
   { role: 'assistant', content: '' },  // Add a placeholder for the assistant's response
   ])
  
   try {
   // Send the message to the server
   const response = fetch('/api/chat', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify([...messages, { role: 'user', content: message }]),
   }).then(async (res) => {
     const reader = res.body.getReader()  // Get a reader to read the response body
     const decoder = new TextDecoder()  // Create a decoder to decode the response text


     let result = ''
     // Function to process the text from the response
     return reader.read().then(function processText({ done, value }) {
       if (done) {
         return result
       }
       const text = decoder.decode(value || new Uint8Array(), { stream: true })  // Decode the text
       setMessages((messages) => {
         let lastMessage = messages[messages.length - 1]  // Get the last message (assistant's placeholder)
         let otherMessages = messages.slice(0, messages.length - 1)  // Get all other messages
         return [
           ...otherMessages,
           { ...lastMessage, content: lastMessage.content + text },  // Append the decoded text to the assistant's message
         ]
       })
       return reader.read().then(processText)  // Continue reading the next chunk of the response
     })
   }) } catch (error) {
     console.error('Error:', error)
     setMessages((messages) => [
       ...messages,
       { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
     ])
   }
   setIsLoading(false)  // Set loading state to false
 }


 const handleKeyPress = (event) => {
   if (event.key === 'Enter' && !event.shiftKey) {
     event.preventDefault()
     sendMessage()
   }
 }


 const messagesEndRef = useRef(null)


 const scrollToBottom = () => {
   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
 }


  return (
    <ThemeProvider theme={theme}>
   <Box
     width="100vw"
     height="100vh"
     display="flex"
     flexDirection="column"
     justifyContent="center"
     alignItems="center"
     sx={{
       backgroundImage: `url(/image.png)`,  // Correct usage with url() function
       backgroundRepeat: "no-repeat",
       backgroundSize: "cover",
      
       bgcolor: theme.palette.primary.dark,  // Background color as fallback
     }}
   >
     <Typography
       variant="h2"
       fontWeight={400}
       fontSize={80}
       color='white'
       sx={{textShadow: '0 0 10px rgba(0, 0, 0, 1)'}}
     >
       taylor swift chatbot
     </Typography>
     <Stack
       direction={'column'}
       width="500px"
       height="700px"
       border="1px solid"
       borderColor={theme.palette.primary.dark}
       bgcolor={theme.palette.primary.light}
       p={2}
       borderRadius={10}
       spacing={3}
     >
       <Stack
         direction={'column'}
         spacing={2}
         flexGrow={1}
         overflow="auto"
         maxHeight="100%"
       >
         {messages.map((message, index) => (
           <Box
             key={index}
             display="flex"
             justifyContent={
               message.role === 'assistant' ? 'flex-start' : 'flex-end'
             }
           >
             {message.role === 'assistant' && (
               <Box
                 component="img"
                 src="/tswift.png"
                 alt="Bot"
                 sx={{
                   width: 60,
                   height: 60,
                   borderRadius: '50%',
                   marginRight: 1,
                   border: '1px solid',
                   borderColor:'primary.dark',
                   marginTop: '20px',
                   objectFit: 'cover',  // Ensures the image covers the circle without distortion
                 }}
               />
             )}
             <Box
               bgcolor={
                 message.role === 'assistant'
                   ? 'primary.main'
                   : 'secondary.main'
               }
               color='white'
               borderRadius={16}
               p={3}
               fontFamily={theme.typography.fontFamily}
             >
               {message.content}
             </Box>
           </Box>
         ))}
         <div ref={messagesEndRef} />
       </Stack>
       <Stack direction={'row'} spacing={2}>
         <TextField
           label="Message"
           fullWidth
           value={message}
           onChange={(e) => setMessage(e.target.value)}
           onKeyPress={handleKeyPress}
           disabled={isLoading}
           multiline
           InputProps={{
             style: {
               borderRadius: "10px",
             }
           }}         
         />
         <Button variant="contained" onClick={sendMessage} disabled={isLoading} sx={{borderRadius: 4}}>
         {isLoading ? 'Sending...' : 'Send'}
         </Button>
       </Stack>
     </Stack>
   </Box>
   </ThemeProvider>
 )

}