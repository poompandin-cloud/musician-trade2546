import React, { useState } from 'react';
import './AuthForm.css';

interface AuthFormProps {
  onSignUp?: (email: string, password: string, name: string) => Promise<void>;
  onSignIn?: (email: string, password: string) => Promise<void>;
  onSocialLogin?: (provider: 'google' | 'facebook' | 'github') => Promise<void>;
  loading?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ 
  onSignUp, 
  onSignIn, 
  onSocialLogin, 
  loading = false 
}) => {
  // สร้าง State เพื่อเช็คว่าตอนนี้อยู่หน้า Sign In หรือ Sign Up
  const [isActive, setIsActive] = useState(false);
  
  // Form states
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ name: '', email: '', password: '' });

  // Handle sign in form submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSignIn && signInData.email && signInData.password) {
      await onSignIn(signInData.email, signInData.password);
    }
  };

  // Handle sign up form submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSignUp && signUpData.name && signUpData.email && signUpData.password) {
      await onSignUp(signUpData.email, signUpData.password, signUpData.name);
    }
  };

  // Handle social login click
  const handleSocialClick = (provider: 'google' | 'facebook' | 'github') => {
    if (onSocialLogin) {
      onSocialLogin(provider);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className={`container ${isActive ? 'active' : ''}`} id="container">
        
        {/* ส่วนลงทะเบียน (Sign Up) */}
        <div className="form-container sign-up">
          <form onSubmit={handleSignUpSubmit}>
            <h1 className="text-2xl font-bold mb-2">Create Account</h1>
            <div className="social-icons">
              <button 
                type="button" 
                className="icon" 
                onClick={() => handleSocialClick('google')}
                disabled={loading}
              >
                <i className="fa-brands fa-google"></i>
              </button>
              <button 
                type="button" 
                className="icon" 
                onClick={() => handleSocialClick('facebook')}
                disabled={loading}
              >
                <i className="fa-brands fa-facebook-f"></i>
              </button>
              <button 
                type="button" 
                className="icon" 
                onClick={() => handleSocialClick('github')}
                disabled={loading}
              >
                <i className="fa-brands fa-github"></i>
              </button>
            </div>
            <span className="text-xs mb-2">or use your email for registration</span>
            <input 
              type="text" 
              placeholder="Name" 
              value={signUpData.name}
              onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
              disabled={loading}
              required
            />
            <input 
              type="email" 
              placeholder="Email" 
              value={signUpData.email}
              onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
              disabled={loading}
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={signUpData.password}
              onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
              disabled={loading}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* ส่วนเข้าสู่ระบบ (Sign In) */}
        <div className="form-container sign-in">
          <form onSubmit={handleSignInSubmit}>
            <h1 className="text-2xl font-bold mb-2">Sign In</h1>
            <div className="social-icons">
              <button 
                type="button" 
                className="icon" 
                onClick={() => handleSocialClick('google')}
                disabled={loading}
              >
                <i className="fa-brands fa-google"></i>
              </button>
              <button 
                type="button" 
                className="icon" 
                onClick={() => handleSocialClick('facebook')}
                disabled={loading}
              >
                <i className="fa-brands fa-facebook-f"></i>
              </button>
              <button 
                type="button" 
                className="icon" 
                onClick={() => handleSocialClick('github')}
                disabled={loading}
              >
                <i className="fa-brands fa-github"></i>
              </button>
            </div>
            <span className="text-xs mb-2">or use your email password</span>
            <input 
              type="email" 
              placeholder="Email" 
              value={signInData.email}
              onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
              disabled={loading}
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={signInData.password}
              onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
              disabled={loading}
              required
            />
            <a href="#" className="text-xs my-2">Forgot Your Password?</a>
            <button type="submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* ส่วนแผงควบคุมการเลื่อน (Toggle) */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1 className="text-2xl font-bold">Welcome Back!</h1>
              <p>Enter your personal details to use all site features</p>
              <button 
                type="button"
                className="hidden" 
                onClick={() => setIsActive(false)}
                disabled={loading}
              >
                Sign In
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1 className="text-2xl font-bold">Hello, Friend!</h1>
              <p>Register with your personal details to use all site features</p>
              <button 
                type="button"
                className="hidden" 
                onClick={() => setIsActive(true)}
                disabled={loading}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;