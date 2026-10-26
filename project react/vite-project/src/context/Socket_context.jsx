import {createContext , useEffect, useState} from 'react'
import {io} from 'socket.io-client'
export const socketContext = createContext();

const ContextMaker = ( {children} )=>{
    const [socket , setSocket] = useState('');
    const contextValues = {socket};

    useEffect(()=>{
   
    const temp = io('/', {
        withCredentials: true
    })
    setSocket(temp);
    
    return (()=>{temp.disconnect()})

 } , [])
    return(
        <socketContext.Provider value={contextValues}>
                {children}
        </socketContext.Provider>
    )

   
}

export default ContextMaker;
