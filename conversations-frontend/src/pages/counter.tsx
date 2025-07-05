import { useEffect, useState } from "react";
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  NumberInput,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { client } from "@/lib/client";

function CounterApp() {
  const [counter, setCounter] = useState<number>(0);
  const [incrementAmount, setIncrementAmount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch current counter value
  const fetchCounter = async () => {
    try {
      const res = await client.counter.fetch.$get();
      const data = await res.json();
      setCounter(data.counter);
    } catch (error) {
      toaster.create({
        description: "Failed to fetch counter",
        type: "error",
      });
    }
  };

  // Increment counter
  const handleIncrement = async () => {
    try {
      setIsLoading(true);
      const res = await client.counter.increment.$post({
        json: { amount: incrementAmount },
      });
      const data = await res.json();
      setCounter(data.counter);
      toaster.create({
        description: `Counter incremented by ${incrementAmount}`,
        type: "success",
      });
    } catch (error) {
      toaster.create({
        description: "Failed to increment counter",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCounter();
  }, []);

  return (
    <Box maxW="md" mx="auto" mt={10} p={5}>
      <VStack gap={6} align="stretch">
        <Heading textAlign="center" size="lg">
          Counter App
        </Heading>

        {/* Current Counter Display */}
        <Card.Root>
          <Card.Header>
            <Text fontSize="lg" fontWeight="bold">
              Current Counter Value
            </Text>
          </Card.Header>
          <Card.Body>
            <Text
              fontSize="4xl"
              textAlign="center"
              fontWeight="bold"
              color="blue.500"
            >
              {counter}
            </Text>
            <Button onClick={fetchCounter} size="sm" mt={2} width="full">
              Refresh Counter
            </Button>
          </Card.Body>
        </Card.Root>

        {/* Increment Controls */}
        <Card.Root>
          <Card.Header>
            <Text fontSize="lg" fontWeight="bold">
              Increment Counter
            </Text>
          </Card.Header>
          <Card.Body>
            <VStack gap={3}>
              <HStack width="full">
                <Text>Amount:</Text>
                <NumberInput.Root
                  value={incrementAmount.toString()}
                  onValueChange={(details) => {
                    const value = details.value;
                    setIncrementAmount(Number(value) || 1);
                  }}
                  min={1}
                  max={100}
                  width="full"
                >
                  <NumberInput.Control />
                  <NumberInput.Input />
                </NumberInput.Root>
              </HStack>
              <Button
                onClick={handleIncrement}
                colorScheme="blue"
                width="full"
                loading={isLoading}
                loadingText="Incrementing..."
              >
                Increment by {incrementAmount}
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Box>
  );
}

export default CounterApp;
