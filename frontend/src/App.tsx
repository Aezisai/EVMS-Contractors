import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, updatePassword } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { DashboardSummary } from './DashboardSummary';
import { SCurveChart } from './SCurveChart';
import { IPMRReport } from './IPMRReport';
import { Tutorial } from './Tutorial';
import './style.css';

// Initialize Identity Platform (Firebase SDK wrapper)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // States for forced password change
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Tutorial State
  const [runTutorial, setRunTutorial] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if this is the first login on this device
        const hasCompletedFirstLogin = localStorage.getItem(`has_completed_first_login_${currentUser.uid}`);
        if (!hasCompletedFirstLogin) {
          setNeedsPasswordChange(true);
        } else {
          setNeedsPasswordChange(false);
        }
      } else {
        setNeedsPasswordChange(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Login failed", error);
      alert(`Login failed: ${error.message}`);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      alert("Please enter your email address first, then click 'Forgot Password?'.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent! Please check your inbox.");
    } catch (error: any) {
      console.error("Password reset failed", error);
      alert(`Failed to send reset email: ${error.message}`);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }
    
    try {
      await updatePassword(user, newPassword);
      // Mark first login as complete
      localStorage.setItem(`has_completed_first_login_${user.uid}`, 'true');
      setNeedsPasswordChange(false);
      alert("Password updated successfully!");
    } catch (error: any) {
      console.error("Failed to update password", error);
      alert(`Failed to update password: ${error.message}. You may need to log out and log back in to verify your credentials.`);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  // Example API call to the API Gateway
  const fetchProtectedData = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      // The URL here would be the API Gateway endpoint deployed by Terraform
      const response = await fetch('https://evms-gateway-xxx.uc.gateway.dev/api/v1/engine/calculate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        alert("API Call Successful! Verified JWT at Gateway.");
      } else {
        alert(`API Call Failed: ${response.status}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) {
    return (
      <div className="glass-card" style={{ maxWidth: '400px', margin: '100px auto' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--primary-color)' }}>EVMS Secure Portal</h2>
        <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>CUI / DOD IL4 Boundary. Authorized Personnel Only.</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <input
            type="email"
            className="form-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="form-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">
            Secure Login
          </button>
          
          <button 
            type="button" 
            onClick={handleResetPassword}
            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem', padding: '5px' }}
          >
            Forgot Password?
          </button>

          <hr style={{ margin: '1rem 0', width: '100%', borderTop: '1px solid #cbd5e1' }} />

          <button
            type="button"
            className="btn"
            style={{ backgroundColor: 'var(--success-color)', color: 'white' }}
            onClick={() => {
              setUser({ email: 'demo_admin@evms.local', uid: 'demo-123', getIdToken: async () => 'mock-jwt-token' } as any);
              setNeedsPasswordChange(true); // Mocking a first-time login
            }}
          >
            Bypass Login (Dev Mode)
          </button>
        </form>
      </div>
    );
  }

  if (needsPasswordChange) {
    return (
      <div className="glass-card" style={{ maxWidth: '400px', margin: '100px auto' }}>
        <h2>Action Required</h2>
        <p style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>You must set a new secure password before accessing the EVMS Dashboard.</p>
        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <input
            type="password"
            className="form-input"
            placeholder="New Password (min 8 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="form-input"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-danger">
            Update Password & Continue
          </button>
          <button type="button" onClick={handleLogout} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            Cancel & Logout
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>EVMS Executive Dashboard</h1>
          <p style={{ color: 'var(--danger-color)', fontWeight: '600', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            <span className="badge badge-danger">CUI</span> CONTROLLED UNCLASSIFIED INFORMATION
          </p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Logged in as: <strong>{user.email}</strong></span>
          <button onClick={() => setRunTutorial(true)} className="btn" style={{ backgroundColor: '#10b981', color: '#fff' }}>Help / Tutorial</button>
          <button onClick={fetchProtectedData} className="btn" style={{ backgroundColor: 'var(--warning-color)', color: '#fff' }}>Test API Gateway</button>
          <button onClick={handleLogout} className="btn" style={{ backgroundColor: '#cbd5e1', color: '#333' }}>Logout</button>
        </div>
      </header>
      
      <main>
        <Tutorial run={runTutorial} onFinish={() => setRunTutorial(false)} />
        <DashboardSummary />
        
        <div className="dashboard-grid">
          <SCurveChart />
          <IPMRReport />
        </div>
      </main>
    </div>
  )
}

export default App;
