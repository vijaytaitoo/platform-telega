import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Store, Plus } from 'lucide-react';

export default function Stores() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Магазины</h1>
          <p className="text-muted-foreground mt-2">
            Управление вашими Telegram магазинами
          </p>
        </div>
        <Button className="bg-gradient-to-r from-purple-500 to-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Создать магазин
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Мой магазин</CardTitle>
                <CardDescription>@my_shop_bot</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Товары:</span>
                <span className="font-medium">89</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Заказы:</span>
                <span className="font-medium">156</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Выручка:</span>
                <span className="font-medium">2,450,000 сум</span>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              Управлять
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

