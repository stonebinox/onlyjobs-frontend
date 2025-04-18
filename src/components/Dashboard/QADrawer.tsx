import theme from "@/theme/theme";
import {
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Text,
} from "@chakra-ui/react";

interface QADrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QADrawer = ({ isOpen, onClose }: QADrawerProps) => {
  return (
    <Drawer placement="right" size="lg" isOpen={isOpen} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Let&apos;s improve your profile</DrawerHeader>
        <DrawerBody>
          <Text fontSize="md" mb={4}>
            This section focuses on improving your profile and matching rate
            based on your past experiences and work culture preferences. The
            goal is to understand you as a professional and filter out the ones
            that are not a good fit for you.
          </Text>
          <Text fontSize="md" mb={4}>
            <strong>Note:</strong> This section is primarily driven with an AI
            model to ease you into the process. It also ensures that you cover a
            lot of ground efficiently.
          </Text>
          <Text fontSize="sm" mb={4} color={theme.colors.brand[500]}>
            You can revisit this section whenever you want to update your
            answers.
          </Text>
          <Divider />
          <Button size="lg" colorScheme="blue" mt={4} mb={4} width="100%">
            Start conversation
          </Button>
        </DrawerBody>
        <DrawerFooter>
          <Button size="sm" variant="outline">
            Skip
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
