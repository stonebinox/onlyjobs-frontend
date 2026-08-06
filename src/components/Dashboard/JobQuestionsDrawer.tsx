import { JobResult } from "@/types/JobResult";
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  VStack,
  useBreakpointValue,
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
  const drawerSize = useBreakpointValue({ base: "full", md: "xl" }) as "full" | "xl";
  return (
    <Drawer placement="right" size={drawerSize} isOpen={isOpen} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader pr={12}>
          {jobResult?.job?.title} at {jobResult?.job?.company}
        </DrawerHeader>
        <DrawerBody>
          <VStack align="stretch" spacing={6} pt={6}>
            <ApplicationStatusBanner
              jobResult={jobResult}
              onStatusUpdate={onStatusUpdate}
              onClose={onClose}
            />
            {jobResult?._id && <GenerateAnswer jobResultId={jobResult._id} />}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
