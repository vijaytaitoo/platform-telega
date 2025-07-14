import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Store, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Eye,
  Plus,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock data
const statsData = [
  {
    title: 'Общая выручка',
    value: '2,450,000',
    unit: 'сум',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-green-600'
  },
  {
    title: 'Заказы',
    value: '156',
    unit: 'шт',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingCart,
    color: 'text-blue-600'
  },
  {
    title: 'Товары',
    value: '89',
    unit: 'шт',
    change: '+3.1%',
    trend: 'up',
    icon: Package,
    color: 'text-purple-600'
  },
  {
    title: 'Клиенты',
    value: '234',
    unit: 'чел',
    change: '+15.3%',
    trend: 'up',
    icon: Users,
    color: 'text-orange-600'
  }
];

const revenueData = [
  { name: 'Янв', value: 1200000 },
  { name: 'Фев', value: 1900000 },
  { name: 'Мар', value: 1500000 },
  { name: 'Апр', value: 2100000 },
  { name: 'Май', value: 1800000 },
  { name: 'Июн', value: 2450000 },
];

const ordersData = [
  { name: 'Пн', orders: 12 },
  { name: 'Вт', orders: 19 },
  { name: 'Ср', orders: 15 },
  { name: 'Чт', orders: 25 },
  { name: 'Пт', orders: 22 },
  { name: 'Сб', orders: 30 },
  { name: 'Вс', orders: 18 },
];

const recentOrders = [
  {
    id: '#12345',
    customer: 'Алексей Петров',
    amount: 125000,
    status: 'pending',
    date: '2024-01-15'
  },
  {
    id: '#12346',
    customer: 'Мария Иванова',
    amount: 89000,
    status: 'processing',
    date: '2024-01-15'
  },
  {
    id: '#12347',
    customer: 'Дмитрий Сидоров',
    amount: 156000,
    status: 'delivered',
    date: '2024-01-14'
  },
  {
    id: '#12348',
    customer: 'Анна Козлова',
    amount: 67000,
    status: 'cancelled',
    date: '2024-01-14'
  }
];

const getStatusBadge = (status) => {
  const statusConfig = {
    pending: { label: 'Ожидает', variant: 'secondary' },
    processing: { label: 'В обработке', variant: 'default' },
    delivered: { label: 'Доставлен', variant: 'success' },
    cancelled: { label: 'Отменен', variant: 'destructive' }
  };

  const config = statusConfig[status] || statusConfig.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Главная</h1>
          <p className="text-muted-foreground mt-2">
            Обзор вашего бизнеса и последние обновления
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Отчеты
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Добавить товар
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value.toLocaleString()}
                    </p>
                    <span className="text-sm text-muted-foreground">
                      {stat.unit}
                    </span>
                  </div>
                  <div className="flex items-center mt-2">
                    {stat.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      за неделю
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Выручка</CardTitle>
            <CardDescription>
              Динамика выручки за последние 6 месяцев
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value.toLocaleString()} сум`, 'Выручка']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Заказы</CardTitle>
            <CardDescription>
              Количество заказов за последнюю неделю
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="orders" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Последние заказы</CardTitle>
            <CardDescription>
              Недавние заказы в ваших магазинах
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Все заказы
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.customer}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      {order.amount.toLocaleString()} сум
                    </p>
                    <p className="text-sm text-muted-foreground">{order.date}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

