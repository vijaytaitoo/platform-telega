import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function Customers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Клиенты</h1>
        <p className="text-muted-foreground mt-2">
          Управление базой клиентов
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Клиенты</CardTitle>
          <CardDescription>Страница в разработке</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Здесь будет список клиентов и их статистика.</p>
        </CardContent>
      </Card>
    </div>
  );
}

