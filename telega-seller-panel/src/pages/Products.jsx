import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function Products() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Товары</h1>
        <p className="text-muted-foreground mt-2">
          Управление товарами в ваших магазинах
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Товары</CardTitle>
          <CardDescription>Страница в разработке</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Здесь будет список товаров и возможность их редактирования.</p>
        </CardContent>
      </Card>
    </div>
  );
}

