import React, { useState, useEffect } from 'react';
import { Users, Package, TrendingUp, Activity } from 'lucide-react';
import axios from 'axios';

const StatsCards = () => {
  const [stats, setStats] = useState({
    asins: { totalAsins: 0, totalSellers: 0 },
    sales: { total: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tracker/stats', {
        headers: {
          'x-user-id': localStorage.getItem('userId')
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Total Sellers',
      value: stats.asins.totalSellers,
      icon: Users,
      color: 'blue',
      description: 'Tracked Amazon sellers'
    },
    {
      title: 'Total ASINs',
      value: stats.asins.totalAsins,
      icon: Package,
      color: 'green',
      description: 'Products being monitored'
    },
    {
      title: 'Total Sales',
      value: stats.sales.total,
      icon: TrendingUp,
      color: 'purple',
      description: 'Estimated sales detected'
    },
    {
      title: 'Tracking Status',
      value: 'Active',
      icon: Activity,
      color: 'orange',
      description: 'Real-time monitoring'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-500',
        text: 'text-blue-600',
        light: 'bg-blue-100',
        dark: 'bg-blue-900'
      },
      green: {
        bg: 'bg-green-500',
        text: 'text-green-600',
        light: 'bg-green-100',
        dark: 'bg-green-900'
      },
      purple: {
        bg: 'bg-purple-500',
        text: 'text-purple-600',
        light: 'bg-purple-100',
        dark: 'bg-purple-900'
      },
      orange: {
        bg: 'bg-orange-500',
        text: 'text-orange-600',
        light: 'bg-orange-100',
        dark: 'bg-orange-900'
      }
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const colors = getColorClasses(card.color);
        
        return (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${colors.light} dark:${colors.dark}`}>
                <Icon className={`h-6 w-6 ${colors.text} dark:text-white`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards; 