import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";
import { User, Role } from "../../../types";
import { Save, X, UserPlus } from "lucide-react";
import { userService } from "../../../services/apiService";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: Omit<User, "userId">) => void;
  onCancel: () => void;
  user?: User | null;
  roles: Role[];
  isSubmitting?: boolean;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onCancel,
  user,
  roles,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    changepondEmpId: "",
    role: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [isUsernameChecking, setIsUsernameChecking] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        userName: user.userName || "",
        email: user.email || "",
        changepondEmpId: user.changepondEmpId?.toString() || "",
        role: user.role || "",
        password: "",
        confirmPassword: "",
        phoneNumber: user.phoneNumber || "",
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        userName: "",
        email: "",
        changepondEmpId: "",
        role: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
      });
    }
    setErrors({});
    setIsEmailChecking(false);
    setIsUsernameChecking(false);
  }, [user, isOpen]);

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let newValue = value;

    // Handle numeric-only fields and prevent negative signs
    if (name === "changepondEmpId" || name === "phoneNumber") {
      newValue = value.replace(/\D/g, ""); // Keep only digits
      if (newValue.length > 10 && name === "phoneNumber") {
        newValue = newValue.slice(0, 10);
      }
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    const newErrors = { ...errors };
    if (newErrors[name]) {
      delete newErrors[name];
    }

    // Real-time validation for phone number
    if (name === "phoneNumber") {
      if (newValue.length === 0) {
        newErrors.phoneNumber = "Phone number is required";
      } else if (newValue.length < 10) {
        newErrors.phoneNumber = "Phone number must be exactly 10 digits long";
      } else {
        delete newErrors.phoneNumber; // Clear error if valid
      }
    }

    // Asynchronous validation for email
    if (!user && name === "email" && newValue.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(newValue)) {
        setIsEmailChecking(true);
        try {
          const { data: allUsers } = await userService.getAll();
          const isDuplicate = allUsers.some(
            (u: User) => u.email.toLowerCase() === newValue.toLowerCase()
          );
          if (isDuplicate) {
            newErrors.email = "This email is already in use. Please use another.";
          }
        } catch (err) {
          console.error("Failed to fetch users for email validation:", err);
        } finally {
          setIsEmailChecking(false);
        }
      } else {
        newErrors.email = "Please enter a valid email address";
      }
    }

    // Asynchronous validation for username
    if (name === "userName" && newValue.trim()) {
      if (user && user.userName.toLowerCase() === newValue.toLowerCase()) {
        delete newErrors.userName;
      } else {
        setIsUsernameChecking(true);
        try {
          const { data: allUsers } = await userService.getAll();
          const isDuplicate = allUsers.some(
            (u: User) => u.userName.toLowerCase() === newValue.toLowerCase()
          );
          if (isDuplicate) {
            newErrors.userName = "This username is already taken. Please choose another.";
          }
        } catch (err) {
          console.error("Failed to fetch users for username validation:", err);
        } finally {
          setIsUsernameChecking(false);
        }
      }
    }

    setErrors(newErrors);
  };

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.userName.trim()) {
      newErrors.userName = "Username is required";
    } else if (
      !user ||
      user.userName.toLowerCase() !== formData.userName.toLowerCase()
    ) {
      try {
        const { data: allUsers } = await userService.getAll();
        const isDuplicate = allUsers.some(
          (u: User) =>
            u.userName.toLowerCase() === formData.userName.toLowerCase()
        );
        if (isDuplicate) {
          newErrors.userName =
            "This username is already taken. Please choose another.";
        }
      } catch (err) {
        console.error("Failed to fetch users for validation:", err);
      }
    }
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.changepondEmpId)
      newErrors.changepondEmpId = "Employee ID is required";
    if (!formData.role) newErrors.role = "Role is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (!user) {
      try {
        const { data: allUsers } = await userService.getAll();
        const isDuplicate = allUsers.some(
          (u: User) => u.email.toLowerCase() === formData.email.toLowerCase()
        );
        if (isDuplicate) {
          newErrors.email = "This email is already in use. Please use another.";
        }
      } catch (err) {
        console.error("Failed to fetch users for validation:", err);
      }
    }

    if (formData.changepondEmpId && isNaN(Number(formData.changepondEmpId))) {
      newErrors.changepondEmpId = "Employee ID must be a number";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (formData.phoneNumber.length !== 10) {
      newErrors.phoneNumber = "Phone number must be exactly 10 digits";
    }

    if (!user) {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      } else if (!passwordRegex.test(formData.password)) {
        newErrors.password =
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateForm())) {
      return;
    }

    const submitData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      userName: formData.userName.trim(),
      email: formData.email.trim(),
      changepondEmpId: parseInt(formData.changepondEmpId) || 0,
      role: formData.role,
      phoneNumber: formData.phoneNumber || undefined,
      ...(formData.password && { password: formData.password }),
    };

    onSubmit(submitData);
  };

  const roleOptions = [
    { value: "", label: "Select a role" },
    ...roles.map((role) => ({
      value: role.name,
      label: role.name,
    })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="" size="md">
      <div className="space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user ? "Edit User" : "Add New User"}
            </h2>
            <p className="text-sm text-gray-500">
              {user
                ? "Update user information and role assignment"
                : "Create a new user account with role assignment"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="firstName"
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                required
                disabled={isSubmitting}
                placeholder="Enter first name"
              />

              <Input
                id="lastName"
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                required
                disabled={isSubmitting}
                placeholder="Enter last name"
              />

              <Input
                id="changepondEmpId"
                name="changepondEmpId"
                label="Changepond Employee ID"
                value={formData.changepondEmpId}
                onChange={handleChange}
                error={errors.changepondEmpId}
                required
                disabled={isSubmitting}
                placeholder="Enter employee ID (numbers only)"
                className="md:col-span-2"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Account Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <Input
                id="userName"
                name="userName"
                label="Username"
                value={formData.userName}
                onChange={handleChange}
                error={
                  isUsernameChecking ? "Checking for duplicates..." : errors.userName
                }
                required
                disabled={isSubmitting}
                placeholder="Enter username"
              />

              <Input
                id="email"
                name="email"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={handleChange}
                error={
                  isEmailChecking ? "Checking for duplicates..." : errors.email
                }
                required
                disabled={isSubmitting}
                placeholder="Enter email address"
              />

              <Input
                id="phoneNumber"
                name="phoneNumber"
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={errors.phoneNumber}
                required
                disabled={isSubmitting}
                placeholder="Enter phone number (10 digits)"
              />

              <Select
                id="role"
                name="role"
                label="Role"
                value={formData.role}
                onChange={handleChange}
                options={roleOptions}
                error={errors.role}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {!user && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Security
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  required
                  disabled={isSubmitting}
                  placeholder="Enter password"
                />

                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  required
                  disabled={isSubmitting}
                  placeholder="Confirm password"
                />
              </div>
            </div>
          )}

          {user && user.role && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Current User Role
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      This user currently has the role:{" "}
                      <strong>{user.role}</strong>
                    </p>
                    <p className="mt-1">
                      You can change the role using the dropdown above.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-800">
                  User Account Guidelines
                </h3>
                <div className="mt-2 text-sm text-gray-600">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Employee ID must be unique and contain only numbers</li>
                    <li>Username should be unique across the system</li>
                    <li>Email will be used for login and notifications</li>
                    <li>
                      Phone number must be 10 digits long and contain only numbers.
                    </li>
                    <li>
                      Each user has one primary role that determines permissions
                    </li>
                    {!user && (
                      <li>
                        Password must be at least 6 characters long and include
                        one uppercase, one lowercase, one number, and one
                        special character.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              icon={<X className="h-4 w-4" />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || isEmailChecking || isUsernameChecking}
              icon={<Save className="h-4 w-4" />}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{user ? "Updating..." : "Creating..."}</span>
                </div>
              ) : (
                <span>{user ? "Update User" : "Create User"}</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default UserModal;