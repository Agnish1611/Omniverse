// messageHandler.ts
// Define a function that receives the setMessage function
export function updateMessages(setMessage, newMessage) {
    setMessage((prevMessages) => [...prevMessages, newMessage]);
}
