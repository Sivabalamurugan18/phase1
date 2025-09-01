import React, { useState } from 'react';
import AppLayout from '../../components/layouts/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import UnderDevelopmentOverlay from '../../components/ui/UnderDevelopmentOverlay';
import { UserCheck, Users, Award, TrendingUp, Plus, Search } from 'lucide-react';

const TalentManagementPage: React.FC = () => {
  const [selectedView, setSelectedView] = useState('overview');

  const teamMembers = [
    {
      id: 1,
      name: 'Alex Thompson',
      role: 'Senior Engineer',
      department: 'Engineering',
      skills: ['AutoCAD', 'Project Management', 'Quality Control'],
      performance: 92,
      projects: 8,
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      role: 'Project Manager',
      department: 'Project Management',
      skills: ['Leadership', 'Planning', 'Risk Management'],
      performance: 88,
      projects: 12,
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150'
    },
    {
      id: 3,
      name: 'Emma Davis',
      role: 'QC Engineer',
      department: 'Quality Control',
      skills: ['Quality Assurance', 'Testing', 'Documentation'],
      performance: 95,
      projects: 6,
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415830.jpeg?auto=compress&cs=tinysrgb&w=150'
    }
  ];

  const departmentStats = {
    engineering: { total: 15, active: 12, utilization: 85 },
    qc: { total: 8, active: 7, utilization: 92 },
    management: { total: 5, active: 5, utilization: 78 }
  };

  return (
    <AppLayout title="Talent Management">
      <div className="relative space-y-6">
        {/* Header Controls */}
        <Card>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled
              >
                <option value="overview">Overview</option>
                <option value="performance">Performance</option>
                <option value="skills">Skills Matrix</option>
                <option value="capacity">Capacity Planning</option>
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" icon={<TrendingUp className="h-4 w-4" />} disabled>
                Analytics
              </Button>
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} disabled>
                Add Member
              </Button>
            </div>
          </div>
        </Card>

        {/* Department Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-center">
              <Users className="mx-auto h-8 w-8 mb-2 text-blue-100" />
              <p className="text-sm font-medium text-blue-100">Engineering</p>
              <p className="mt-2 text-3xl font-semibold">{departmentStats.engineering.active}/{departmentStats.engineering.total}</p>
              <p className="text-sm text-blue-100">{departmentStats.engineering.utilization}% Utilization</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-center">
              <Award className="mx-auto h-8 w-8 mb-2 text-green-100" />
              <p className="text-sm font-medium text-green-100">Quality Control</p>
              <p className="mt-2 text-3xl font-semibold">{departmentStats.qc.active}/{departmentStats.qc.total}</p>
              <p className="text-sm text-green-100">{departmentStats.qc.utilization}% Utilization</p>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="text-center">
              <UserCheck className="mx-auto h-8 w-8 mb-2 text-purple-100" />
              <p className="text-sm font-medium text-purple-100">Management</p>
              <p className="mt-2 text-3xl font-semibold">{departmentStats.management.active}/{departmentStats.management.total}</p>
              <p className="text-sm text-purple-100">{departmentStats.management.utilization}% Utilization</p>
            </div>
          </Card>
        </div>

        {/* Team Members Grid */}
        <Card title="Team Members">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.role}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Department</p>
                    <Badge text={member.department} className="bg-blue-100 text-blue-800" />
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Performance Score</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${member.performance}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{member.performance}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Active Projects</p>
                    <p className="text-lg font-semibold text-gray-900">{member.projects}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Key Skills</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {member.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} text={skill} className="bg-gray-100 text-gray-800" size="sm" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Skills Matrix */}
        <Card title="Skills & Competency Matrix">
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <Award className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Skills Assessment Dashboard</h3>
              <p className="mt-1 text-gray-500">
                Comprehensive skills matrix, competency assessments, training recommendations, and career development paths would be displayed here.
              </p>
              <div className="mt-6">
                <Button variant="outline" icon={<Award className="h-4 w-4" />} disabled>
                  View Skills Matrix
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

export default TalentManagementPage;