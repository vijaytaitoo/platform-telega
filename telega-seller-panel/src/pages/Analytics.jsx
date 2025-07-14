import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Аналитика</h1>
        <p className="text-muted-foreground mt-2">
          Подробная аналитика продаж и клиентов
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Аналитика</CardTitle>
          <CardDescription>Страница в разработке</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Здесь будут подробные графики и отчеты.</p>
        </CardContent>
      </Card>
    </div>
  );
}

