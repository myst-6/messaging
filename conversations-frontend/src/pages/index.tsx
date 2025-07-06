import { Flex, Heading, Link, VStack, Text, Box } from "@chakra-ui/react";

export default function Home() {
  return (
    <Flex flexDirection="column" gap={6} p={8}>
      <Heading>Messaging App</Heading>

      <VStack gap={4} align="stretch">
        <Box p={4} bg="blue.50" borderRadius="lg">
          <Text fontSize="lg" fontWeight="medium" mb={2}>
            Join any conversation by ID
          </Text>
          <Text fontSize="sm" color="gray.600">
            Enter any conversation ID to join existing conversations or create
            new ones.
          </Text>
        </Box>

        <Link
          href="/conversation"
          fontSize="lg"
          fontWeight="medium"
          color="blue.500"
        >
          → Go to Conversations
        </Link>

        <Text fontSize="sm" color="gray.500">
          Other pages:
        </Text>
        <Link href="/counter">Counter</Link>
        <Link href="/things">Things</Link>
      </VStack>
    </Flex>
  );
}
