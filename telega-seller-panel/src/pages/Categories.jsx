import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function Categories() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Категории</h1>
        <p className="text-muted-foreground mt-2">
          Управление категориями товаров
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Категории</CardTitle>
          <CardDescription>Страница в разработке</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Здесь будет список категорий и возможность их редактирования.</p>
        </CardContent>
      </Card>
    </div>
  );
}

