import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, HStack } from "@chakra-ui/react";
import { DragHandle } from "./DragHandle";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <Box ref={setNodeRef} style={style}>
      <HStack spacing={2} align="flex-start">
        <DragHandle
          listeners={listeners}
          attributes={attributes}
          mt={1}
          boxSize={4}
        />
        <Box flex={1}>{children}</Box>
      </HStack>
    </Box>
  );
};
