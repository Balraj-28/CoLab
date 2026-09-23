import React, { useState } from "react";
import "./login.css";
import axios from 'axios';
import NetworkBackground from "./NetworkBackground";
import { useNavigate } from "react-router-dom";

function Login() {
    const Navigate = useNavigate();
    const [isRegistering, setIsRegistering] = useState(false);
    const [userName , SetUserName] = useState("");
    const [email , SetEmail] = useState("");
    const [password , SetPassword] = useState("");
    const toggleMode = (e) => {
        e.preventDefault();
        setIsRegistering((prev) => !prev);
        SetEmail("");
        SetUserName("");
        SetPassword("");
    };


    async function HandleSubmit(e){
        e.preventDefault();
        if(isRegistering){
            try{
            
            const res = await axios.post("http://localhost:4000/register" , {"username" : userName , "email":email , "password":password})
            if(res.data.success){
                alert("user created");
                SetEmail("");
            SetUserName("");
            SetPassword("");
            }
            else{
                alert(res.data.message);
            }}
            catch(err){
                alert(err.response.data.message);
            }
        }
        else{
            try{
            const res = await axios.post("http://localhost:4000/login" , {"username" : userName , "password" : password});
            if(res.data.success){
                const token = res.data.token;
                localStorage.setItem("token" , token);
                 Navigate("/home");
            }
            else{
                alert(res.data.message);
            }}
            catch(err){
                alert(err.response.data.message);
            }
        }
    }

    return (
        <div className="login-page">
            <NetworkBackground />
            <div className="vignette"></div>

            <div id="app">
                <div className="login-container">
                    <div className="login-logo">
                        C<span>o</span>L<span>a</span>b
                    </div>

                    <p className="login-sub">
                        {isRegistering ? "create your account" : "sign in to your account"}
                    </p>

                    <form id="loginForm" autoComplete="off" onSubmit={(e)=>HandleSubmit(e)}>
                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                placeholder="Enter your username"
                                value={userName}
                                onChange={(e)=>{SetUserName(e.target.value)}}
                                required
                            />
                        </div>

                        {isRegistering && (
                            <div className="input-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e)=>{SetEmail(e.target.value)}}
                                    required
                                />
                            </div>
                        )}

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e)=>{SetPassword(e.target.value)}}
                                required
                            />
                        </div>

                        <div className="login-options">
                            <label className="checkbox-label">
                                <input type="checkbox" required={isRegistering} />
                                <span className="checkmark"></span>
                                {isRegistering ? (
                                    <span>
                                        I agree to the{" "}
                                        <a href="#" className="forgot-link" style={{ display: "inline" }}>
                                            Terms of Service
                                        </a>
                                    </span>
                                ) : (
                                    "Remember me"
                                )}
                            </label>

                            {!isRegistering && (
                                <a href="#" className="forgot-link">
                                    Forgot password?
                                </a>
                            )}
                        </div>

                        <button type="submit" className="btn-login">
                            {isRegistering ? "Create account" : "Sign in"}
                        </button>

                        <p className="signup-link">
                            {isRegistering ? (
                                <>
                                    Already have an account?{" "}
                                    <a href="#" onClick={toggleMode}>Sign in</a>
                                </>
                            ) : (
                                <>
                                    Don't have an account?{" "}
                                    <a href="#" onClick={toggleMode}>Sign up</a>
                                </>
                            )}
                        </p>
                    </form>
                </div>

                <footer className="login-footer">
                    <span>BALRAJ · 2026</span>
                </footer>
            </div>
        </div>
    );
}

export default Login;