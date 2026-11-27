import AppRoutes from './routes/AppRoutes'
import AuthProvider from './auth/AuthProvider'
export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}
