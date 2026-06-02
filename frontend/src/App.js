import './App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LandingPage from './pages/Landing';
import Authentication from './pages/Authentication';
import { AuthProvider } from './contexts/AuthContext';
import { AppThemeProvider } from './contexts/ThemeContext';
import VideoMeetComponent from './pages/VideoMeet';
import HomeComponent from './pages/Home';
import Profile from './pages/Profile';
import History from './pages/History';
import GoogleCallback from './pages/GoogleCallback';
import AIChat from './pages/AIChat';

function App() {
  return (
    <AppThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path='/' element={<LandingPage />} />
            <Route path='/auth' element={<Authentication />} />
            <Route path='/auth/callback' element={<GoogleCallback />} />
            <Route path='/home' element={<HomeComponent />} />
            <Route path='/ai-assistant' element={<AIChat />} />
            <Route path='/history' element={<History />} />
            <Route path='/profile' element={<Profile />} />
            <Route path='/:url' element={<VideoMeetComponent />} />
          </Routes>
        </AuthProvider>
      </Router>
    </AppThemeProvider>
  );
}

export default App;
