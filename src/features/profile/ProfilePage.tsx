import React, { useState } from 'react';
import AppLayout from '../../components/layouts/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Camera, Save } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: 'John Doe',
    designation: 'Senior Engineer',
    email: 'john.doe@changepond.com',
    phoneNumber: '+1 (555) 123-4567',
    department: 'Engineering',
    photoUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
    lastLogin: '2024-02-20T08:30:00Z'
  });

  const departmentOptions = [
    { value: 'Engineering', label: 'Engineering' },
    { value: 'QC', label: 'Quality Control' },
    { value: 'Management', label: 'Management' },
  ];

  const designationOptions = [
    { value: 'Junior Engineer', label: 'Junior Engineer' },
    { value: 'Senior Engineer', label: 'Senior Engineer' },
    { value: 'Lead Engineer', label: 'Lead Engineer' },
    { value: 'Project Manager', label: 'Project Manager' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle photo upload
      console.log('Photo uploaded:', file);
    }
  };

  const handleSave = () => {
    console.log('Saving profile:', profileData);
    setIsEditing(false);
  };

  return (
    <AppLayout title="Profile">
      <div className="max-w-3xl mx-auto">
        <Card>
          <div className="space-y-6">
            {/* Profile Photo */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <img
                  src={profileData.photoUrl}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover"
                />
                {isEditing && (
                  <label
                    htmlFor="photo-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer"
                  >
                    <Camera className="h-4 w-4 text-white" />
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profileData.fullName}</h2>
                <p className="text-sm text-gray-500">{profileData.designation}</p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 gap-6 mt-6">
              <Input
                id="fullName"
                name="fullName"
                label="Full Name"
                value={profileData.fullName}
                onChange={handleInputChange}
                disabled={!isEditing}
              />

              <Select
                id="designation"
                name="designation"
                label="Designation"
                value={profileData.designation}
                onChange={handleInputChange}
                options={designationOptions}
                disabled={!isEditing}
              />

              <Input
                id="email"
                name="email"
                label="Email Address"
                value={profileData.email}
                onChange={handleInputChange}
                disabled={true}
              />

              <Input
                id="phoneNumber"
                name="phoneNumber"
                label="Phone Number"
                value={profileData.phoneNumber}
                onChange={handleInputChange}
                disabled={!isEditing}
              />

              <Select
                id="department"
                name="department"
                label="Department"
                value={profileData.department}
                onChange={handleInputChange}
                options={departmentOptions}
                disabled={!isEditing}
              />
            </div>

            {/* Last Login */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last login: {new Date(profileData.lastLogin).toLocaleString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    icon={<Save className="h-4 w-4" />}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button variant="primary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;