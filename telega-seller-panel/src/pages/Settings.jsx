import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Настройки</h1>
        <p className="text-muted-foreground mt-2">
          Настройки аккаунта и магазинов
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Настройки</CardTitle>
          <CardDescription>Страница в разработке</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Здесь будут настройки профиля, уведомлений и интеграций.</p>
        </CardContent>
      </Card>
    </div>
  );
}

