import { useAuth } from '@/lib/auth-context'
import Register from './Register'
import Messenger from './Messenger'
import Icon from '@/components/ui/icon'

export default function Index() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
      <Icon name="Loader2" size={32} className="animate-spin text-indigo-400" />
    </div>
  )

  return user ? <Messenger /> : <Register />
}