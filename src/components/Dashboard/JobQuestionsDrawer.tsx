import { JobResult } from "@/types/JobResult";
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
} from "@chakra-ui/react";

import { GenerateAnswer } from "./GenerateAnswer";

interface JobQuestionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  jobResult: JobResult | null;
}

export const JobQuestionsDrawer = ({
  isOpen,
  onClose,
  jobResult,
}: JobQuestionsDrawerProps) => {
  return (
    <Drawer placement="right" size="xl" isOpen={isOpen} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          {jobResult?.job?.title} at {jobResult?.job?.company}
        </DrawerHeader>
        <DrawerBody>
          <GenerateAnswer jobResultId={jobResult?._id || ""} />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
