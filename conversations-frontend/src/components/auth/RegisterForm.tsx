"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  Text,
  IconButton,
} from "@chakra-ui/react";
import { useAuth } from "@/lib/AuthContext";
import { toaster } from "@/components/ui/toaster";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitch?: () => void;
}

export function RegisterForm({ onSuccess, onSwitch }: RegisterFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const validateForm = () => {
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      toaster.create({
        description: "Please fill in all fields",
        type: "error",
      });
      return false;
    }

    if (username.length < 3) {
      toaster.create({
        description: "Username must be at least 3 characters long",
        type: "error",
      });
      return false;
    }

    if (password.length < 6) {
      toaster.create({
        description: "Password must be at least 6 characters long",
        type: "error",
      });
      return false;
    }

    if (password !== confirmPassword) {
      toaster.create({
        description: "Passwords do not match",
        type: "error",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await register(username, password);
      toaster.create({
        description: "Account created successfully!",
        type: "success",
      });
      onSuccess?.();
    } catch (error) {
      toaster.create({
        description:
          error instanceof Error ? error.message : "Registration failed",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8}>
      <VStack gap={6} alignItems="left">
        <Heading size="lg">Register</Heading>

        <Box as="form" onSubmit={handleSubmit} w="full">
          <VStack gap={4} alignItems="left">
            <Box>
              <Text mb={2} fontWeight="medium">
                Username
              </Text>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">
                Password
              </Text>
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <IconButton
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                variant="ghost"
                size="sm"
              >
                {showPassword ? "Hide" : "Show"}
              </IconButton>
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">
                Confirm Password
              </Text>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
              <IconButton
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                variant="ghost"
                size="sm"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </IconButton>
            </Box>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              w="full"
              loading={isLoading}
              loadingText="Creating account..."
            >
              Register
            </Button>
          </VStack>
        </Box>

        <Text>
          Already have an account?{" "}
          <Button variant="ghost" colorScheme="blue" onClick={onSwitch}>
            Login here
          </Button>
        </Text>
      </VStack>
    </Box>
  );
}
