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

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitch?: () => void;
}

export function LoginForm({ onSuccess, onSwitch }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toaster.create({
        description: "Please fill in all fields",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      toaster.create({
        description: "Logged in successfully!",
        type: "success",
      });
      onSuccess?.();
    } catch (error) {
      toaster.create({
        description: error instanceof Error ? error.message : "Login failed",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8}>
      <VStack gap={6} alignItems="left">
        <Heading size="lg">Login</Heading>

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
                required
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

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              w="full"
              loading={isLoading}
              loadingText="Logging in..."
            >
              Login
            </Button>
          </VStack>
        </Box>

        <Text>
          Don't have an account?{" "}
          <Button variant="ghost" colorScheme="blue" onClick={onSwitch}>
            Register here
          </Button>
        </Text>
      </VStack>
    </Box>
  );
}
