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
import { ApplicationStatusBanner } from "./ApplicationStatusBanner";

interface JobQuestionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  jobResult: JobResult | null;
  onStatusUpdate?: () => void;
}

export const JobQuestionsDrawer = ({
  isOpen,
  onClose,
  jobResult,
  onStatusUpdate,
}: JobQuestionsDrawerProps) => {
  return (
    <Drawer placement="right" size="xl" isOpen={isOpen} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          {jobResult?.job?.title} at {jobResult?.job?.company}
        </DrawerHeader>
        <DrawerBody pt={6}>
          <GenerateAnswer jobResultId={jobResult?._id || ""} />
          <ApplicationStatusBanner
            jobResult={jobResult}
            onStatusUpdate={onStatusUpdate}
            onClose={onClose}
          />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
