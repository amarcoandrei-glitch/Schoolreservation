import {
  Package,
  Clock,
  CheckCircle,
  Calendar,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { StatsCard } from '../../components/ui/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export function StudentDashboard() {
  const activeReservations = [
    {
      id: 1,
      equipment: 'MacBook Pro 16" M3',
      category: 'Laptops',
      borrowDate: '2024-06-01',
      returnDate: '2024-06-08',
      status: 'active',
      location: 'Room 204',
    },
    {
      id: 2,
      equipment: 'Canon EOS R5 Camera',
      category: 'Photography',
      borrowDate: '2024-06-03',
      returnDate: '2024-06-10',
      status: 'active',
      location: 'Media Lab',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Reservation Approved',
      equipment: 'MacBook Pro 16" M3',
      time: '2 hours ago',
      icon: CheckCircle,
      color: 'text-[--success]',
    },
    {
      id: 2,
      action: 'Equipment Borrowed',
      equipment: 'Canon EOS R5 Camera',
      time: '1 day ago',
      icon: Package,
      color: 'text-[--primary-blue]',
    },
    {
      id: 3,
      action: 'Return Reminder',
      equipment: 'iPad Pro 12.9"',
      time: '2 days ago',
      icon: AlertCircle,
      color: 'text-[--warning]',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[--foreground] mb-2">Welcome Back, John!</h1>
        <p className="text-[--muted-foreground]">
          Here's an overview of your equipment reservations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Reservations"
          value="2"
          icon={Package}
          color="blue"
          trend={{ value: '+2 this week', isPositive: true }}
        />
        <StatsCard
          title="Pending Approvals"
          value="1"
          icon={Clock}
          color="orange"
          trend={{ value: '1 awaiting approval', isPositive: true }}
        />
        <StatsCard
          title="Completed Returns"
          value="12"
          icon={CheckCircle}
          color="green"
          trend={{ value: '+3 this month', isPositive: true }}
        />
        <StatsCard
          title="Upcoming Returns"
          value="1"
          icon={Calendar}
          color="purple"
          trend={{ value: 'Due in 2 days', isPositive: false }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Reservations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-start gap-4 p-4 bg-[--background] rounded-lg hover:bg-[--secondary] transition-colors"
                  >
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-[--border]">
                      <Package className="w-8 h-8 text-[--primary-blue]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-[--foreground]">
                            {reservation.equipment}
                          </h4>
                          <p className="text-sm text-[--muted-foreground]">
                            {reservation.category}
                          </p>
                        </div>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[--muted-foreground]">
                        <span>Borrowed: {reservation.borrowDate}</span>
                        <span>•</span>
                        <span>Return by: {reservation.returnDate}</span>
                        <span>•</span>
                        <span>{reservation.location}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          Extend Reservation
                        </Button>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Equipment Availability</CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Laptops', available: 8, total: 15 },
                  { name: 'Cameras', available: 3, total: 8 },
                  { name: 'Tablets', available: 12, total: 20 },
                  { name: 'Microphones', available: 6, total: 10 },
                ].map((category) => (
                  <div
                    key={category.name}
                    className="p-4 bg-[--background] rounded-lg border border-[--border]"
                  >
                    <p className="text-sm font-medium text-[--foreground] mb-2">
                      {category.name}
                    </p>
                    <p className="text-2xl font-bold text-[--foreground] mb-1">
                      {category.available}
                    </p>
                    <p className="text-xs text-[--muted-foreground]">
                      of {category.total} available
                    </p>
                    <div className="w-full bg-[--secondary] rounded-full h-1.5 mt-2">
                      <div
                        className="bg-[--primary-blue] h-full rounded-full"
                        style={{
                          width: `${(category.available / category.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full bg-[--secondary] flex items-center justify-center ${activity.color}`}
                    >
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[--foreground]">
                        {activity.action}
                      </p>
                      <p className="text-sm text-[--muted-foreground]">{activity.equipment}</p>
                      <p className="text-xs text-[--muted-foreground] mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="primary" className="w-full justify-start">
                  <Package className="w-4 h-4" />
                  Browse Equipment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4" />
                  View Reservations
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4" />
                  Reservation History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
