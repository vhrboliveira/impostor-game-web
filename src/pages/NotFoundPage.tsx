import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Screen } from '@/shared/ui/Screen'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Screen
      centered
      footer={
        <Button size="lg" fullWidth onClick={() => navigate('/')}>
          Voltar ao início
        </Button>
      }
    >
      <EmptyState icon="mask">
        <h1>Página não encontrada</h1>
        <p>Talvez o impostor tenha levado ela.</p>
      </EmptyState>
    </Screen>
  )
}
