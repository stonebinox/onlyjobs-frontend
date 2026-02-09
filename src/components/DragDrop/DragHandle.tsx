import React, { forwardRef } from "react";
import { Icon, IconProps } from "@chakra-ui/react";
import { FaGripVertical } from "react-icons/fa";

interface DragHandleProps extends Omit<IconProps, 'as'> {
  listeners?: Record<string, Function>;
  attributes?: Record<string, any>;
}

export const DragHandle = forwardRef<SVGSVGElement, DragHandleProps>(
  ({ listeners, attributes, ...props }, ref) => {
    return (
      <Icon
        as={FaGripVertical}
        ref={ref}
        color="gray.400"
        cursor="grab"
        _hover={{ color: "gray.600" }}
        _active={{ cursor: "grabbing" }}
        {...listeners}
        {...attributes}
        {...props}
      />
    );
  }
);

DragHandle.displayName = "DragHandle";
