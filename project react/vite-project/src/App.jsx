
import { BrowserRouter  , Routes , Route , Navigate} from 'react-router-dom'
import './App.css'
import Login from './components/Login'
import Home from './components/Home'
function App() {
  function Check({children}){
    const token = localStorage.getItem("token");
    if(!token){
      return <Navigate to={"/login"} replace />
    }
    else{
      return children;
    }
  }
  return (
    <BrowserRouter>
    <Routes>
     <Route path="/login" element={<Login/> } />
     <Route path='/home' element={<Check> <Home/> </Check>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
