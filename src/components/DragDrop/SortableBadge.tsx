import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge, Box, Text } from "@chakra-ui/react";
import { FaGripVertical } from "react-icons/fa";

interface SortableBadgeProps {
  id: string;
  children: React.ReactNode;
  colorScheme?: string;
}

export const SortableBadge: React.FC<SortableBadgeProps> = ({
  id,
  children,
  colorScheme = "blue",
}) => {
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
    <Badge
      ref={setNodeRef}
      style={style}
      mr={2}
      mb={2}
      colorScheme={colorScheme}
      variant="solid"
      borderRadius="full"
      px={3}
      py={1}
      display="inline-flex"
      alignItems="center"
      gap={1}
    >
      <Box
        as="span"
        cursor="grab"
        _active={{ cursor: "grabbing" }}
        {...listeners}
        {...attributes}
        display="inline-flex"
        alignItems="center"
        mr={1}
      >
        <FaGripVertical size={10} style={{ opacity: 0.6 }} />
      </Box>
      {children}
    </Badge>
  );
};
