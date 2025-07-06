import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  useDisclosure,
  Dialog,
} from "@chakra-ui/react";
import { Toaster, toaster } from "@/components/ui/toaster";
import { client } from "@/lib/client";

function ThingManager() {
  const [things, setThings] = useState<{ id: number; content: string }[]>([]);
  const [newContent, setNewContent] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { open, onOpen, onClose } = useDisclosure();

  // Fetch all things
  const fetchThings = async () => {
    const res = await client.things.fetch.$get();
    const data = await res.json();
    setThings(data.things);
  };

  useEffect(() => {
    fetchThings();
  }, []);

  // Create
  const handleCreate = async () => {
    if (!newContent.trim()) return;
    await client.things.create.$post({ json: { content: newContent } });
    setNewContent("");
    fetchThings();
    toaster.create({ description: "Thing created", type: "success" });
  };

  // Update
  const handleUpdate = async () => {
    if (editId === null || !editContent.trim()) return;
    await client.things.update.$put({
      json: { id: editId, content: editContent },
    });
    setEditId(null);
    setEditContent("");
    fetchThings();
    toaster.create({ description: "Thing updated", type: "success" });
  };

  // Delete
  const handleDelete = async () => {
    if (deleteId === null) return;
    await client.things.delete.$delete({ json: { id: deleteId } });
    setDeleteId(null);
    onClose();
    fetchThings();
    toaster.create({ description: "Thing deleted", type: "info" });
  };

  return (
    <>
      <Box maxW="md" mx="auto" mt={10} p={5} borderWidth={1} borderRadius="lg">
        <VStack gap={4} align="stretch">
          <Text fontSize="2xl" fontWeight="bold">
            Things CRUD Manager
          </Text>
          <HStack>
            <Input
              placeholder="New thing content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
            <Button colorScheme="blue" onClick={handleCreate}>
              Add
            </Button>
          </HStack>
          <VStack align="stretch" gap={2}>
            {things.map((thing) => (
              <HStack key={thing.id} justify="space-between">
                {editId === thing.id ? (
                  <>
                    <Input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                    <Button
                      colorScheme="green"
                      size="sm"
                      onClick={handleUpdate}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditId(null);
                        setEditContent("");
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Text>{thing.content}</Text>
                    <HStack>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditId(thing.id);
                          setEditContent(thing.content);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        colorScheme="red"
                        size="sm"
                        onClick={() => {
                          setDeleteId(thing.id);
                          onOpen();
                        }}
                      >
                        Delete
                      </Button>
                    </HStack>
                  </>
                )}
              </HStack>
            ))}
          </VStack>
        </VStack>

        {/* Delete Confirmation Dialog */}
        <Dialog.Root
          open={open}
          onOpenChange={(change) => (change ? onOpen() : onClose())}
          placement="center"
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>Delete Thing</Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <Button>Cancel</Button>
              </Dialog.CloseTrigger>
              <Dialog.Body>
                Are you sure you want to delete this thing?
              </Dialog.Body>
              <Dialog.Footer>
                <Button colorScheme="red" onClick={handleDelete}>
                  Delete
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      </Box>
    </>
  );
}

export default ThingManager;
