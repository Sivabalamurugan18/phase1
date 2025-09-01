import React, { useState } from 'react';
import AppLayout from '../../components/layouts/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import UnderDevelopmentOverlay from '../../components/ui/UnderDevelopmentOverlay';
import { Clock, Calendar, BarChart3, Plus, Filter } from 'lucide-react';

const TimeManagementPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const timeEntries = [
    {
      id: 1,
      project: 'PRJ-2024-001',
      task: 'Design Review',
      engineer: 'Alex Thompson',
      date: '2024-03-15',
      hours: 6.5,
      status: 'Approved'
    },
    {
      id: 2,
      project: 'PRJ-2024-002',
      task: 'Technical Documentation',
      engineer: 'Sarah Johnson',
      date: '2024-03-15',
      hours: 4.0,
      status: 'Pending'
    },
    {
      id: 3,
      project: 'PRJ-2024-003',
      task: 'Quality Control',
      engineer: 'Emma Davis',
      date: '2024-03-14',
      hours: 8.0,
      status: 'Approved'
    }
  ];

  const weeklyStats = {
    totalHours: 156.5,
    billableHours: 142.0,
    utilization: 91,
    overtime: 12.5
  };

  return (
    <AppLayout title="Time Management">
      <div className="relative space-y-6">
        {/* Header Controls */}
        <Card>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
              <Button variant="outline" icon={<Filter className="h-4 w-4" />} disabled>
                Filter
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" icon={<BarChart3 className="h-4 w-4" />} disabled>
                Reports
              </Button>
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} disabled>
                Log Time
              </Button>
            </div>
          </div>
        </Card>

        {/* Weekly Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-center">
              <Clock className="mx-auto h-8 w-8 mb-2 text-blue-100" />
              <p className="text-sm font-medium text-blue-100">Total Hours</p>
              <p className="mt-2 text-3xl font-semibold">{weeklyStats.totalHours}</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-center">
              <Calendar className="mx-auto h-8 w-8 mb-2 text-green-100" />
              <p className="text-sm font-medium text-green-100">Billable Hours</p>
              <p className="mt-2 text-3xl font-semibold">{weeklyStats.billableHours}</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="text-center">
              <BarChart3 className="mx-auto h-8 w-8 mb-2 text-purple-100" />
              <p className="text-sm font-medium text-purple-100">Utilization</p>
              <p className="mt-2 text-3xl font-semibold">{weeklyStats.utilization}%</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="text-center">
              <Clock className="mx-auto h-8 w-8 mb-2 text-orange-100" />
              <p className="text-sm font-medium text-orange-100">Overtime</p>
              <p className="mt-2 text-3xl font-semibold">{weeklyStats.overtime}h</p>
            </div>
          </Card>
        </div>

        {/* Time Entries Table */}
        <Card title="Recent Time Entries">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engineer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.project}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.task}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.engineer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.hours}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.status === 'Approved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Time Analytics */}
        <Card title="Time Analytics">
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Time Analytics Dashboard</h3>
              <p className="mt-1 text-gray-500">
                Detailed time tracking analytics, productivity metrics, and project time allocation charts would be displayed here.
              </p>
              <div className="mt-6">
                <Button variant="outline" icon={<BarChart3 className="h-4 w-4" />} disabled>
                  View Detailed Analytics
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Under Development Overlay - positioned relative to content area */}
        <UnderDevelopmentOverlay isVisible={true} />
      </div>
    </AppLayout>
  );
};

export default TimeManagementPage;