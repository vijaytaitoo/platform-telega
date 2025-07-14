import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function Orders() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Заказы</h1>
        <p className="text-muted-foreground mt-2">
          Управление заказами клиентов
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Заказы</CardTitle>
          <CardDescription>Страница в разработке</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Здесь будет список заказов и возможность их обработки.</p>
        </CardContent>
      </Card>
    </div>
  );
}

