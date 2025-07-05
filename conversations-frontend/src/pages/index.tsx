import { Flex, Heading, Link } from "@chakra-ui/react";

export default function Home() {
  return (
    <Flex flexDirection="column" gap={4}>
      <Heading>Home</Heading>
      <Link href="/counter">Counter</Link>
      <Link href="/things">Things</Link>
      <Link href="/conversation">Conversation</Link>
    </Flex>
  );
}
