
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from '../routes/AppRoutes';
import '../styles/globals.css';
import '../styles/login.css';
import '../styles/dashboard.css';
import '../styles/management.css';


function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App
