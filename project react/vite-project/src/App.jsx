
import { BrowserRouter  , Routes , Route , Navigate} from 'react-router-dom'
import './App.css'
import Login from './components/Login'
import Home from './components/Home'
import ContextMaker from './context/Socket_context'
import Room from './components/Room'
import { useEffect, useState } from 'react'
import axios from 'axios'

function Check({children}){
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    axios.get('/api/users/me')
      .then(() => {
        if (isMounted) setIsAuthenticated(true);
      })
      .catch(() => {
        if (isMounted) setIsAuthenticated(false);
      })
      .finally(() => {
        if (isMounted) setIsChecking(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if(isChecking){
    return null;
  }

  if(!isAuthenticated){
    return <Navigate to={"/login"} replace />
  }
  return children;
}

function App() {

 
  return (
    <BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />

    <Route
      path="/home"
      element={
        <Check>
          <Home />
        </Check>
      }
    />

    <Route
      path="/room/:roomCode"
      element={
        <Check>
          <ContextMaker>
            <Room />
          </ContextMaker>
        </Check>
      }
    />
  </Routes>
</BrowserRouter>
  )
}

export default App
